/* ─── State ──────────────────────────────────────────────────────────────── */

let period = 30;
let summaryData = null;

/* ─── Utilities ──────────────────────────────────────────────────────────── */

const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtPct = n => n + '%';

function healthColor(score) {
  if (score >= 75) return '#10b981';
  if (score >= 50) return '#6366f1';
  if (score >= 25) return '#f59e0b';
  return '#ef4444';
}

function stickinessSegment(pct) {
  if (pct >= 60) return { label: 'Power', cls: 'seg-power' };
  if (pct >= 35) return { label: 'Engaged', cls: 'seg-engaged' };
  if (pct >= 15) return { label: 'Casual', cls: 'seg-casual' };
  return { label: 'Dormant', cls: 'seg-dormant' };
}

function barChart(containerId, data, { valueKey, labelKey, colorClass = 'primary', tipFn }) {
  const container = $(containerId);
  if (!container) return;
  const max = Math.max(...data.map(d => d[valueKey]), 0.01);
  container.innerHTML = data.map(d => {
    const h = Math.max((d[valueKey] / max) * 170, 2);
    const tip = tipFn ? tipFn(d) : `${d[labelKey]}: ${d[valueKey]}`;
    return `
      <div class="bar-col">
        <div class="bar ${colorClass}" style="height:${h}px" data-tip="${tip}"></div>
        <div class="bar-label">${d[labelKey]}</div>
      </div>`;
  }).join('');
}

function dualBarChart(containerId, data, { keyA, keyB, labelKey, colorA = 'primary', colorB = 'danger', tipA, tipB }) {
  const container = $(containerId);
  if (!container) return;
  const max = Math.max(...data.map(d => Math.max(d[keyA] || 0, d[keyB] || 0)), 0.01);
  container.innerHTML = data.map(d => {
    const hA = Math.max(((d[keyA] || 0) / max) * 160, 2);
    const hB = Math.max(((d[keyB] || 0) / max) * 160, 2);
    const tA = tipA ? tipA(d) : `${d[labelKey]}: ${d[keyA]}`;
    const tB = tipB ? tipB(d) : `${d[labelKey]}: ${d[keyB]}`;
    return `
      <div class="bar-col" style="flex-direction:row;align-items:flex-end;gap:2px;flex:1">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;justify-content:flex-end">
          <div class="bar ${colorA}" style="height:${hA}px;width:100%" data-tip="${tA}"></div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;justify-content:flex-end">
          <div class="bar ${colorB}" style="height:${hB}px;width:100%" data-tip="${tB}"></div>
        </div>
      </div>
      <div class="bar-label" style="flex:none;width:calc(100% / ${data.length})">${d[labelKey]}</div>`;
  }).join('');
}

/* ─── API calls ──────────────────────────────────────────────────────────── */

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
}

/* ─── View: Overview ─────────────────────────────────────────────────────── */

async function loadOverview() {
  const [summary, trend, reasons, revenue] = await Promise.all([
    fetchJson(`/api/summary?period=${period}`),
    fetchJson('/api/churn-trend?weeks=12'),
    fetchJson('/api/churn-reasons'),
    fetchJson('/api/revenue-timeline'),
  ]);

  summaryData = summary;

  // KPIs
  $('churnRate').textContent = fmtPct(summary.churnRate);
  $('churnSub').textContent = `${summary.churnedThisPeriod} customers lost`;
  $('churnFill').style.width = Math.min(summary.churnRate * 5, 100) + '%';

  $('revChurnRate').textContent = fmtPct(summary.revenueChurnRate);
  $('revChurnSub').textContent = fmt(summary.lostMrr) + ' MRR lost';
  $('revChurnFill').style.width = Math.min(summary.revenueChurnRate * 5, 100) + '%';

  $('stickinessVal').textContent = fmtPct(summary.stickiness);
  $('stickFill').style.width = Math.min(summary.stickiness, 100) + '%';

  $('totalMrr').textContent = fmt(summary.totalMrr);
  const netSign = summary.netMrrChange >= 0 ? '+' : '';
  const netEl = $('mrrChange');
  netEl.textContent = `${netSign}${fmt(summary.netMrrChange)} net this period`;
  netEl.className = 'kpi-sub ' + (summary.netMrrChange >= 0 ? 'positive' : 'negative');

  $('overviewPeriodLabel').textContent = `Last ${period} days`;

  // Churn trend chart
  barChart('churnChart', trend, {
    valueKey: 'churnRate',
    labelKey: 'week',
    colorClass: 'danger',
    tipFn: d => `${d.label}: ${d.churnRate}% churn`,
  });

  // MRR timeline chart
  barChart('mrrChart', revenue, {
    valueKey: 'mrr',
    labelKey: 'label',
    colorClass: 'primary',
    tipFn: d => `${d.label}: ${fmt(d.mrr)} MRR`,
  });

  // At-risk table
  const customers = await fetchJson('/api/customers?status=at_risk&sort=mrr&order=desc');
  $('atRiskBadge').textContent = `${customers.length} accounts · ${fmt(customers.reduce((s, c) => s + c.mrr, 0))} at risk`;
  const atRiskBody = $('atRiskTable').querySelector('tbody');
  atRiskBody.innerHTML = customers.slice(0, 6).map(c => `
    <tr>
      <td><strong>${c.name}</strong><br><span style="color:#94a3b8;font-size:11px">${c.email}</span></td>
      <td><span class="badge badge-${c.plan}">${c.plan}</span></td>
      <td><strong>${fmt(c.mrr)}</strong></td>
      <td>
        <div class="health-wrap">
          <div class="health-track"><div class="health-fill" style="width:${c.healthScore}%;background:${healthColor(c.healthScore)}"></div></div>
          <span class="health-score" style="color:${healthColor(c.healthScore)}">${c.healthScore}</span>
        </div>
      </td>
    </tr>`).join('');

  // Churn reasons
  const maxReason = Math.max(...reasons.map(r => r.count), 1);
  $('churnReasonsList').innerHTML = reasons.map(r => `
    <div class="reason-row">
      <div class="reason-meta">
        <span class="reason-name">${r.churn_reason}</span>
        <span class="reason-count">${r.count} · ${fmt(r.mrr_lost)}</span>
      </div>
      <div class="reason-track">
        <div class="reason-fill" style="width:${(r.count / maxReason) * 100}%"></div>
      </div>
    </div>`).join('');
}

/* ─── View: Customers ────────────────────────────────────────────────────── */

async function loadCustomers(status = 'all') {
  const customers = await fetchJson(`/api/customers?status=${status}&sort=mrr&order=desc`);
  const tbody = $('customerTable').querySelector('tbody');
  tbody.innerHTML = customers.map(c => `
    <tr>
      <td>
        <strong>${c.name}</strong><br>
        <span style="color:#94a3b8;font-size:11px">${c.email}</span>
      </td>
      <td><span class="badge badge-${c.plan}">${c.plan}</span></td>
      <td>${fmt(c.mrr)}</td>
      <td><span class="badge badge-${c.status}">${c.status.replace('_', ' ')}</span></td>
      <td>${c.days_active_30} / 30 days</td>
      <td>${fmtPct(c.stickiness30d)}</td>
      <td>
        <div class="health-wrap">
          <div class="health-track"><div class="health-fill" style="width:${c.healthScore}%;background:${healthColor(c.healthScore)}"></div></div>
          <span class="health-score" style="color:${healthColor(c.healthScore)}">${c.healthScore}</span>
        </div>
      </td>
    </tr>`).join('');
}

/* ─── View: Stickiness ───────────────────────────────────────────────────── */

async function loadStickiness() {
  const data = await fetchJson('/api/stickiness');

  // Bar chart: top 14 by 30d stickiness
  const top = [...data].sort((a, b) => b.stickiness30d - a.stickiness30d).slice(0, 14);
  barChart('stickinessChart', top, {
    valueKey: 'stickiness30d',
    labelKey: 'name',
    colorClass: 'success',
    tipFn: d => `${d.name}: ${d.stickiness30d}% sticky (30d)`,
  });

  // Table
  const tbody = $('stickinessTable').querySelector('tbody');
  tbody.innerHTML = data.map(c => {
    const seg = stickinessSegment(c.stickiness30d);
    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><span class="badge badge-${c.plan}">${c.plan}</span></td>
        <td>${fmt(c.mrr)}</td>
        <td>${fmtPct(c.stickiness7d)}</td>
        <td>${fmtPct(c.stickiness30d)}</td>
        <td>${fmtPct(c.stickiness90d)}</td>
        <td>${c.avg_features} features</td>
        <td><span class="${seg.cls}">${seg.label}</span></td>
      </tr>`;
  }).join('');
}

/* ─── View: Churn Analysis ───────────────────────────────────────────────── */

async function loadChurn() {
  const [trend, customers] = await Promise.all([
    fetchJson('/api/churn-trend?weeks=12'),
    fetchJson('/api/customers?status=churned&sort=mrr&order=desc'),
  ]);

  barChart('churnChartFull', trend, {
    valueKey: 'churnRate',
    labelKey: 'week',
    colorClass: 'danger',
    tipFn: d => `${d.label}: ${d.churnRate}% churn`,
  });

  barChart('mrrLostChart', trend, {
    valueKey: 'mrrLost',
    labelKey: 'week',
    colorClass: 'warning',
    tipFn: d => `${d.label}: ${fmt(d.mrrLost)} lost`,
  });

  const tbody = $('churnedTable').querySelector('tbody');
  tbody.innerHTML = customers.map(c => {
    const created = new Date(c.created_at);
    const churned = new Date(c.churned_at);
    const days = Math.round((churned - created) / (1000 * 60 * 60 * 24));
    const tenure = days > 365 ? `${Math.floor(days/365)}y ${Math.floor((days%365)/30)}m` : `${Math.floor(days/30)}m`;
    return `
      <tr>
        <td><strong>${c.name}</strong><br><span style="color:#94a3b8;font-size:11px">${c.email}</span></td>
        <td><span class="badge badge-${c.plan}">${c.plan}</span></td>
        <td class="danger-text"><strong>${fmt(c.mrr)}</strong></td>
        <td>${c.churned_at || '—'}</td>
        <td>${c.churn_reason || '—'}</td>
        <td>${tenure}</td>
      </tr>`;
  }).join('');
}

/* ─── View: Revenue Loss ─────────────────────────────────────────────────── */

async function loadRevenue() {
  const [summary, revenue] = await Promise.all([
    fetchJson(`/api/summary?period=${period}`),
    fetchJson('/api/revenue-timeline'),
  ]);

  $('revTotalMrr').textContent = fmt(summary.totalMrr);
  $('revLostMrr').textContent = fmt(summary.lostMrr);
  $('revAtRiskMrr').textContent = fmt(summary.atRiskMrr);
  const netEl = $('revNetChange');
  netEl.textContent = (summary.netMrrChange >= 0 ? '+' : '') + fmt(summary.netMrrChange);
  netEl.className = 'kpi-value ' + (summary.netMrrChange >= 0 ? 'success-text' : 'danger-text');

  // Dual bar: MRR vs MRR lost
  dualBarChart('revStackChart', revenue, {
    keyA: 'mrr',
    keyB: 'churnedMrr',
    labelKey: 'label',
    colorA: 'primary',
    colorB: 'danger',
    tipA: d => `${d.label} Active MRR: ${fmt(d.mrr)}`,
    tipB: d => `${d.label} Churned MRR: ${fmt(d.churnedMrr)}`,
  });
}

/* ─── Navigation ─────────────────────────────────────────────────────────── */

const views = {
  overview:   loadOverview,
  customers:  () => loadCustomers($('statusFilter')?.value || 'all'),
  stickiness: loadStickiness,
  churn:      loadChurn,
  revenue:    loadRevenue,
};

let currentView = 'overview';

function switchView(view) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const viewEl = document.getElementById(`view-${view}`);
  const navEl = document.querySelector(`[data-view="${view}"]`);
  if (viewEl) viewEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  currentView = view;
  if (views[view]) views[view]();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    switchView(el.dataset.view);
  });
});

/* ─── Period selector ────────────────────────────────────────────────────── */

$('periodSelect').addEventListener('change', e => {
  period = parseInt(e.target.value);
  if (views[currentView]) views[currentView]();
});

/* ─── Customer filter ────────────────────────────────────────────────────── */

$('statusFilter')?.addEventListener('change', e => {
  loadCustomers(e.target.value);
});

/* ─── Email modal ────────────────────────────────────────────────────────── */

$('emailBtn').addEventListener('click', async () => {
  const modal = $('emailModal');
  const iframe = $('emailIframe');
  const previewLink = $('openEmailPreview');

  const url = `/api/email-report?period=${period}`;
  iframe.src = url;
  previewLink.href = url;
  modal.classList.add('open');
});

$('closeModal').addEventListener('click', () => {
  $('emailModal').classList.remove('open');
});

$('emailModal').addEventListener('click', e => {
  if (e.target === $('emailModal')) $('emailModal').classList.remove('open');
});

$('copyHtmlBtn').addEventListener('click', async () => {
  try {
    const r = await fetch(`/api/email-report?period=${period}`);
    const html = await r.text();
    await navigator.clipboard.writeText(html);
    const btn = $('copyHtmlBtn');
    btn.textContent = 'Copied!';
    btn.style.background = '#dcfce7';
    btn.style.color = '#16a34a';
    btn.style.borderColor = '#86efac';
    setTimeout(() => {
      btn.textContent = 'Copy HTML';
      btn.style = '';
    }, 2000);
  } catch (err) {
    alert('Copy failed: ' + err.message);
  }
});

/* ─── Init ───────────────────────────────────────────────────────────────── */

switchView('overview');
