const express = require('express');
const path = require('path');
const { getDb, initSchema } = require('./database/schema');
const emailTemplate = require('./email/template');

const app = express();
const PORT = process.env.PORT || 3000;

const db = getDb();
initSchema(db);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Helpers ────────────────────────────────────────────────────────────────

function dateRange(daysBack) {
  const to = new Date('2026-05-01');
  const from = new Date(to);
  from.setDate(from.getDate() - daysBack);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

// ─── API: Summary metrics ────────────────────────────────────────────────────

app.get('/api/summary', (req, res) => {
  const period = parseInt(req.query.period || '30');
  const { from, to } = dateRange(period);
  const prevFrom = (() => {
    const d = new Date(from);
    d.setDate(d.getDate() - period);
    return d.toISOString().slice(0, 10);
  })();

  // Active customers at end of previous period = customers created before `from` and not churned before `from`
  const startActive = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(mrr), 0) as mrr
    FROM customers
    WHERE created_at <= ? AND (churned_at IS NULL OR churned_at > ?)
  `).get(from, from);

  // Churned this period
  const churned = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(mrr), 0) as mrr
    FROM customers
    WHERE churned_at >= ? AND churned_at <= ?
  `).get(from, to);

  // New customers this period
  const newCustomers = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(mrr), 0) as mrr
    FROM customers
    WHERE created_at >= ? AND created_at <= ?
  `).get(from, to);

  // Current active
  const currentActive = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(mrr), 0) as mrr
    FROM customers WHERE status = 'active'
  `).get();

  // At-risk
  const atRisk = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(mrr), 0) as mrr
    FROM customers WHERE status = 'at_risk'
  `).get();

  // Churn rate = churned / start_active
  const churnRate = startActive.count > 0
    ? ((churned.count / startActive.count) * 100).toFixed(1)
    : 0;

  // Revenue churn rate
  const revenueChurnRate = startActive.mrr > 0
    ? ((churned.mrr / startActive.mrr) * 100).toFixed(1)
    : 0;

  // MRR metrics
  const totalMrr = db.prepare(`SELECT COALESCE(SUM(mrr),0) as mrr FROM customers WHERE status='active'`).get().mrr;
  const lostMrr = churned.mrr;
  const newMrr = newCustomers.mrr;
  const netMrr = totalMrr;

  // Stickiness: avg DAU/MAU ratio for active customers over the period
  const dau_mau = db.prepare(`
    WITH daily AS (
      SELECT customer_id, COUNT(DISTINCT session_date) as days_active
      FROM sessions
      WHERE session_date >= ? AND session_date <= ?
        AND customer_id IN (SELECT id FROM customers WHERE status IN ('active','at_risk'))
      GROUP BY customer_id
    )
    SELECT AVG(CAST(days_active AS REAL) / ?) as ratio
    FROM daily
  `).get(from, to, period);

  const stickiness = ((dau_mau.ratio || 0) * 100).toFixed(1);

  res.json({
    period,
    churnRate: parseFloat(churnRate),
    revenueChurnRate: parseFloat(revenueChurnRate),
    stickiness: parseFloat(stickiness),
    activeCustomers: currentActive.count,
    atRiskCustomers: atRisk.count,
    atRiskMrr: atRisk.mrr,
    churnedThisPeriod: churned.count,
    newCustomers: newCustomers.count,
    totalMrr,
    lostMrr,
    newMrr,
    netMrrChange: newMrr - lostMrr,
  });
});

// ─── API: Churn trend (weekly buckets) ──────────────────────────────────────

app.get('/api/churn-trend', (req, res) => {
  const weeks = parseInt(req.query.weeks || '12');
  const buckets = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const to = new Date('2026-05-01');
    to.setDate(to.getDate() - i * 7);
    const from = new Date(to);
    from.setDate(from.getDate() - 6);

    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const startCount = db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE created_at <= ? AND (churned_at IS NULL OR churned_at > ?)
    `).get(fromStr, fromStr).count;

    const churned = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(mrr),0) as mrr
      FROM customers WHERE churned_at >= ? AND churned_at <= ?
    `).get(fromStr, toStr);

    buckets.push({
      week: `W${weeks - i}`,
      label: fromStr,
      churnRate: startCount > 0 ? parseFloat(((churned.count / startCount) * 100).toFixed(2)) : 0,
      churnedCount: churned.count,
      mrrLost: churned.mrr,
    });
  }

  res.json(buckets);
});

// ─── API: Customer list with health scores ───────────────────────────────────

app.get('/api/customers', (req, res) => {
  const { status, sort = 'mrr', order = 'desc' } = req.query;
  const validCols = { mrr: 'c.mrr', name: 'c.name', created_at: 'c.created_at', status: 'c.status' };
  const orderCol = validCols[sort] || 'c.mrr';
  const orderDir = order === 'asc' ? 'ASC' : 'DESC';

  let where = '';
  const params = [];
  if (status && status !== 'all') {
    where = 'WHERE c.status = ?';
    params.push(status);
  }

  const customers = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(DISTINCT session_date) FROM sessions s WHERE s.customer_id = c.id AND s.session_date >= date('2026-05-01', '-30 days')) as days_active_30,
      (SELECT COUNT(DISTINCT session_date) FROM sessions s WHERE s.customer_id = c.id AND s.session_date >= date('2026-05-01', '-90 days')) as days_active_90,
      (SELECT COUNT(*) FROM events e WHERE e.customer_id = c.id AND e.event_date >= date('2026-05-01', '-30 days')) as events_30d
    FROM customers c
    ${where}
    ORDER BY ${orderCol} ${orderDir}
  `).all(...params);

  const enriched = customers.map(c => {
    const stickiness30 = c.days_active_30 / 30;
    const healthScore = c.status === 'churned' ? 0
      : c.status === 'at_risk' ? Math.min(30 + c.events_30d * 2, 50)
      : Math.min(Math.round(40 + stickiness30 * 50 + c.events_30d * 0.5), 99);

    return {
      ...c,
      healthScore,
      stickiness30d: parseFloat((stickiness30 * 100).toFixed(1)),
    };
  });

  res.json(enriched);
});

// ─── API: Stickiness breakdown ───────────────────────────────────────────────

app.get('/api/stickiness', (req, res) => {
  const rows = db.prepare(`
    SELECT
      c.id, c.name, c.plan, c.mrr, c.status,
      COUNT(DISTINCT CASE WHEN s.session_date >= date('2026-05-01', '-7 days')  THEN s.session_date END) as dau7,
      COUNT(DISTINCT CASE WHEN s.session_date >= date('2026-05-01', '-30 days') THEN s.session_date END) as dau30,
      COUNT(DISTINCT CASE WHEN s.session_date >= date('2026-05-01', '-90 days') THEN s.session_date END) as dau90,
      AVG(s.features_used) as avg_features
    FROM customers c
    LEFT JOIN sessions s ON s.customer_id = c.id
    WHERE c.status IN ('active', 'at_risk')
    GROUP BY c.id
    ORDER BY dau30 DESC
  `).all();

  res.json(rows.map(r => ({
    ...r,
    stickiness7d:  parseFloat(((r.dau7  / 7)  * 100).toFixed(1)),
    stickiness30d: parseFloat(((r.dau30 / 30) * 100).toFixed(1)),
    stickiness90d: parseFloat(((r.dau90 / 90) * 100).toFixed(1)),
    avg_features:  parseFloat((r.avg_features || 0).toFixed(1)),
  })));
});

// ─── API: Churn reasons breakdown ────────────────────────────────────────────

app.get('/api/churn-reasons', (req, res) => {
  const rows = db.prepare(`
    SELECT churn_reason, COUNT(*) as count, SUM(mrr) as mrr_lost
    FROM customers
    WHERE status = 'churned' AND churn_reason IS NOT NULL
    GROUP BY churn_reason
    ORDER BY count DESC
  `).all();
  res.json(rows);
});

// ─── API: Revenue timeline ────────────────────────────────────────────────────

app.get('/api/revenue-timeline', (req, res) => {
  const months = 6;
  const result = [];

  for (let m = months - 1; m >= 0; m--) {
    const d = new Date('2026-05-01');
    d.setMonth(d.getMonth() - m);
    const monthStr = d.toISOString().slice(0, 7); // YYYY-MM

    const activeRevenue = db.prepare(`
      SELECT COALESCE(SUM(mrr), 0) as mrr FROM customers
      WHERE created_at <= ? AND (churned_at IS NULL OR churned_at > ?)
    `).get(`${monthStr}-28`, `${monthStr}-01`).mrr;

    const churnedRevenue = db.prepare(`
      SELECT COALESCE(SUM(mrr), 0) as mrr FROM customers
      WHERE churned_at >= ? AND churned_at < ?
    `).get(`${monthStr}-01`, `${monthStr}-31`).mrr;

    result.push({
      month: monthStr,
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      mrr: parseFloat(activeRevenue.toFixed(0)),
      churnedMrr: parseFloat(churnedRevenue.toFixed(0)),
    });
  }

  res.json(result);
});

// ─── Email report endpoint ────────────────────────────────────────────────────

app.get('/api/email-report', (req, res) => {
  const period = parseInt(req.query.period || '30');
  const format = req.query.format || 'html';

  // Gather all data inline
  const { from, to } = dateRange(period);

  const startActive = db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(mrr),0) as mrr FROM customers WHERE created_at <= ? AND (churned_at IS NULL OR churned_at > ?)`).get(from, from);
  const churned = db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(mrr),0) as mrr FROM customers WHERE churned_at >= ? AND churned_at <= ?`).get(from, to);
  const newC = db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(mrr),0) as mrr FROM customers WHERE created_at >= ? AND created_at <= ?`).get(from, to);
  const atRisk = db.prepare(`SELECT COUNT(*) as c, COALESCE(SUM(mrr),0) as mrr FROM customers WHERE status='at_risk'`).get();
  const totalMrr = db.prepare(`SELECT COALESCE(SUM(mrr),0) as mrr FROM customers WHERE status='active'`).get().mrr;

  const churnRate = startActive.c > 0 ? ((churned.c / startActive.c) * 100).toFixed(1) : '0.0';
  const revenueChurnRate = startActive.mrr > 0 ? ((churned.mrr / startActive.mrr) * 100).toFixed(1) : '0.0';

  const dau_mau = db.prepare(`
    WITH d AS (SELECT customer_id, COUNT(DISTINCT session_date) as days FROM sessions WHERE session_date >= ? AND session_date <= ? AND customer_id IN (SELECT id FROM customers WHERE status IN ('active','at_risk')) GROUP BY customer_id)
    SELECT AVG(CAST(days AS REAL)/?) as ratio FROM d
  `).get(from, to, period);
  const stickiness = ((dau_mau.ratio || 0) * 100).toFixed(1);

  const topAtRisk = db.prepare(`
    SELECT name, company, plan, mrr FROM customers WHERE status='at_risk' ORDER BY mrr DESC LIMIT 5
  `).all();

  const recentChurns = db.prepare(`
    SELECT name, company, plan, mrr, churned_at, churn_reason FROM customers WHERE status='churned' AND churned_at >= ? ORDER BY churned_at DESC LIMIT 5
  `).all(from);

  const metrics = {
    period,
    churnRate,
    revenueChurnRate,
    stickiness,
    totalMrr,
    lostMrr: churned.mrr,
    netMrrChange: newC.mrr - churned.mrr,
    activeCustomers: db.prepare(`SELECT COUNT(*) as c FROM customers WHERE status='active'`).get().c,
    atRiskCount: atRisk.c,
    atRiskMrr: atRisk.mrr,
    churnedCount: churned.c,
    newCount: newC.c,
    topAtRisk,
    recentChurns,
    generatedAt: new Date('2026-05-01').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  };

  const html = emailTemplate(metrics);

  if (format === 'json') {
    return res.json(metrics);
  }

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Retention Audit Dashboard running at http://localhost:${PORT}`);
});
