const { getDb, initSchema } = require('./schema');

const db = getDb();
initSchema(db);

// Clear existing data
db.exec(`
  DELETE FROM invoices;
  DELETE FROM events;
  DELETE FROM sessions;
  DELETE FROM customers;
`);

const now = new Date('2026-05-01');
function daysAgo(n) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const plans = [
  { name: 'starter', mrr: 49 },
  { name: 'growth', mrr: 149 },
  { name: 'pro', mrr: 349 },
  { name: 'enterprise', mrr: 999 },
];

const churnReasons = [
  'Too expensive', 'Missing features', 'Switched to competitor',
  'Business closed', 'Not using product', 'Poor support experience',
];

const customers = [
  // Active healthy customers
  { name: 'Acme Corp',         email: 'admin@acme.com',         company: 'Acme Corp',         plan: 'enterprise', mrr: 999,  status: 'active',   created_at: daysAgo(180), stickiness: 'high' },
  { name: 'Bright Labs',       email: 'ops@brightlabs.io',      company: 'Bright Labs',       plan: 'pro',        mrr: 349,  status: 'active',   created_at: daysAgo(150), stickiness: 'high' },
  { name: 'CloudSync',         email: 'hello@cloudsync.app',    company: 'CloudSync',         plan: 'growth',     mrr: 149,  status: 'active',   created_at: daysAgo(120), stickiness: 'high' },
  { name: 'Driftwood Digital', email: 'team@driftwood.co',      company: 'Driftwood Digital', plan: 'pro',        mrr: 349,  status: 'active',   created_at: daysAgo(200), stickiness: 'high' },
  { name: 'EchoBase',          email: 'info@echobase.io',       company: 'EchoBase',          plan: 'growth',     mrr: 149,  status: 'active',   created_at: daysAgo(90),  stickiness: 'medium' },
  { name: 'Flint & Co',        email: 'billing@flintco.com',    company: 'Flint & Co',        plan: 'enterprise', mrr: 1499, status: 'active',   created_at: daysAgo(365), stickiness: 'high' },
  { name: 'GridMaster',        email: 'cto@gridmaster.dev',     company: 'GridMaster',        plan: 'pro',        mrr: 349,  status: 'active',   created_at: daysAgo(60),  stickiness: 'medium' },
  { name: 'HorizonAI',         email: 'team@horizonai.com',     company: 'HorizonAI',         plan: 'growth',     mrr: 149,  status: 'active',   created_at: daysAgo(75),  stickiness: 'high' },
  { name: 'IndigoWave',        email: 'hello@indigowave.io',    company: 'IndigoWave',        plan: 'starter',    mrr: 49,   status: 'active',   created_at: daysAgo(45),  stickiness: 'medium' },
  { name: 'JetStream HQ',      email: 'admin@jetstream.co',     company: 'JetStream HQ',      plan: 'enterprise', mrr: 999,  status: 'active',   created_at: daysAgo(300), stickiness: 'high' },
  // At-risk customers
  { name: 'KelvinTech',        email: 'ops@kelvintech.com',     company: 'KelvinTech',        plan: 'growth',     mrr: 149,  status: 'at_risk',  created_at: daysAgo(110), stickiness: 'low' },
  { name: 'LumaPath',          email: 'hi@lumapath.io',         company: 'LumaPath',          plan: 'starter',    mrr: 49,   status: 'at_risk',  created_at: daysAgo(95),  stickiness: 'low' },
  { name: 'MomentumCo',        email: 'team@momentumco.app',    company: 'MomentumCo',        plan: 'pro',        mrr: 349,  status: 'at_risk',  created_at: daysAgo(130), stickiness: 'low' },
  { name: 'NovaSpark',         email: 'hello@novaspark.dev',    company: 'NovaSpark',         plan: 'growth',     mrr: 149,  status: 'at_risk',  created_at: daysAgo(85),  stickiness: 'low' },
  // Churned customers (this month)
  { name: 'OpalSystems',       email: 'ops@opalsystems.com',    company: 'OpalSystems',       plan: 'pro',        mrr: 349,  status: 'churned',  created_at: daysAgo(200), churned_at: daysAgo(12), churn_reason: 'Switched to competitor', stickiness: 'none' },
  { name: 'PrismaHQ',          email: 'admin@prismahq.io',      company: 'PrismaHQ',          plan: 'growth',     mrr: 149,  status: 'churned',  created_at: daysAgo(160), churned_at: daysAgo(8),  churn_reason: 'Too expensive', stickiness: 'none' },
  { name: 'QuartzFlow',        email: 'team@quartzflow.co',     company: 'QuartzFlow',        plan: 'starter',    mrr: 49,   status: 'churned',  created_at: daysAgo(90),  churned_at: daysAgo(5),  churn_reason: 'Not using product', stickiness: 'none' },
  { name: 'RapidNode',         email: 'hello@rapidnode.dev',    company: 'RapidNode',         plan: 'enterprise', mrr: 999,  status: 'churned',  created_at: daysAgo(400), churned_at: daysAgo(18), churn_reason: 'Missing features', stickiness: 'none' },
  { name: 'SkyVault',          email: 'ops@skyvault.io',        company: 'SkyVault',          plan: 'pro',        mrr: 349,  status: 'churned',  created_at: daysAgo(180), churned_at: daysAgo(25), churn_reason: 'Business closed', stickiness: 'none' },
  // Previous month churned
  { name: 'TerraSync',         email: 'admin@terrasync.com',    company: 'TerraSync',         plan: 'growth',     mrr: 149,  status: 'churned',  created_at: daysAgo(250), churned_at: daysAgo(35), churn_reason: 'Poor support experience', stickiness: 'none' },
  { name: 'UltraForge',        email: 'team@ultraforge.io',     company: 'UltraForge',        plan: 'pro',        mrr: 349,  status: 'churned',  created_at: daysAgo(210), churned_at: daysAgo(42), churn_reason: 'Too expensive', stickiness: 'none' },
  { name: 'VortexApp',         email: 'hello@vortexapp.dev',    company: 'VortexApp',         plan: 'starter',    mrr: 49,   status: 'churned',  created_at: daysAgo(140), churned_at: daysAgo(50), churn_reason: 'Switched to competitor', stickiness: 'none' },
  { name: 'WaveStack',         email: 'ops@wavestack.co',       company: 'WaveStack',         plan: 'growth',     mrr: 149,  status: 'churned',  created_at: daysAgo(170), churned_at: daysAgo(38), churn_reason: 'Missing features', stickiness: 'none' },
  // New active customers
  { name: 'XcelData',          email: 'admin@xceldata.io',      company: 'XcelData',          plan: 'growth',     mrr: 149,  status: 'active',   created_at: daysAgo(15),  stickiness: 'medium' },
  { name: 'YieldMetrics',      email: 'team@yieldmetrics.com',  company: 'YieldMetrics',      plan: 'pro',        mrr: 349,  status: 'active',   created_at: daysAgo(10),  stickiness: 'medium' },
  { name: 'ZenithCloud',       email: 'hello@zenithcloud.dev',  company: 'ZenithCloud',       plan: 'starter',    mrr: 49,   status: 'active',   created_at: daysAgo(7),   stickiness: 'low' },
];

const insertCustomer = db.prepare(`
  INSERT INTO customers (name, email, company, plan, mrr, status, created_at, churned_at, churn_reason)
  VALUES (@name, @email, @company, @plan, @mrr, @status, @created_at, @churned_at, @churn_reason)
`);

const insertSession = db.prepare(`
  INSERT INTO sessions (customer_id, session_date, duration_minutes, features_used)
  VALUES (?, ?, ?, ?)
`);

const insertEvent = db.prepare(`
  INSERT INTO events (customer_id, event_type, event_date, metadata)
  VALUES (?, ?, ?, ?)
`);

const insertInvoice = db.prepare(`
  INSERT INTO invoices (customer_id, amount, status, due_date, paid_at)
  VALUES (?, ?, ?, ?, ?)
`);

const seedAll = db.transaction(() => {
  for (const c of customers) {
    const row = {
      name: c.name,
      email: c.email,
      company: c.company,
      plan: c.plan,
      mrr: c.mrr,
      status: c.status,
      created_at: c.created_at,
      churned_at: c.churned_at || null,
      churn_reason: c.churn_reason || null,
    };
    const result = insertCustomer.run(row);
    const cid = result.lastInsertRowid;

    if (c.status === 'active' || c.status === 'at_risk') {
      const sessionDays = c.stickiness === 'high' ? 60 : c.stickiness === 'medium' ? 30 : 10;
      for (let d = 0; d < 90; d++) {
        const shouldLog = c.stickiness === 'high'
          ? Math.random() < 0.75
          : c.stickiness === 'medium'
            ? Math.random() < 0.4
            : Math.random() < 0.12;
        if (shouldLog) {
          insertSession.run(cid, daysAgo(d), randInt(5, 90), randInt(1, 8));
        }
      }
      // Events
      const eventTypes = ['login', 'export', 'report_view', 'api_call', 'invite_sent', 'dashboard_open'];
      for (let i = 0; i < (c.stickiness === 'high' ? 80 : c.stickiness === 'medium' ? 35 : 8); i++) {
        insertEvent.run(cid, pick(eventTypes), daysAgo(randInt(0, 89)), null);
      }
    }

    // Invoices — monthly for each active month
    const startDay = parseInt(c.created_at.slice(8, 10));
    const monthsSince = Math.ceil((now - new Date(c.created_at)) / (1000 * 60 * 60 * 24 * 30));
    for (let m = 0; m < Math.min(monthsSince, 6); m++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() - m);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      if (c.status === 'churned' && c.churned_at && dueDateStr > c.churned_at) continue;

      const paid = c.status !== 'churned' || m > 0;
      insertInvoice.run(
        cid,
        c.mrr,
        paid ? 'paid' : 'unpaid',
        dueDateStr,
        paid ? dueDateStr : null
      );
    }
  }
});

seedAll();
console.log(`✓ Seeded ${customers.length} customers with sessions, events, and invoices.`);
db.close();
