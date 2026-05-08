/* ── State ──────────────────────────────────────────────────────────────────── */
let currentUser = null;
let currentView = 'overview';
let allTests = [];

const API = async (path, opts = {}) => {
  const token = localStorage.getItem('pte_token');
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
};

/* ── Auth ────────────────────────────────────────────────────────────────────── */
function showLogin() {
  document.getElementById('login-form').style.display = '';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-error').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = '';
  document.getElementById('reg-error').style.display = 'none';
}

async function doLogin() {
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = 'Logging in…';
  err.style.display = 'none';

  try {
    const data = await API('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      }),
    });
    localStorage.setItem('pte_token', data.token);
    currentUser = data.user;
    showApp();
  } catch (e) {
    err.textContent = e.error || 'Login failed';
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log In';
  }
}

async function doRegister() {
  const btn = document.getElementById('reg-btn');
  const err = document.getElementById('reg-error');
  btn.disabled = true;
  btn.textContent = 'Creating account…';
  err.style.display = 'none';

  try {
    const data = await API('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
      }),
    });
    localStorage.setItem('pte_token', data.token);
    currentUser = data.user;
    showApp();
  } catch (e) {
    err.textContent = e.error || 'Registration failed';
    err.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

function doLogout() {
  localStorage.removeItem('pte_token');
  currentUser = null;
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-modal').style.display = 'flex';
}

/* ── App shell ──────────────────────────────────────────────────────────────── */
async function showApp() {
  document.getElementById('auth-modal').style.display = 'none';
  document.getElementById('app').style.display = 'flex';

  if (!currentUser) {
    try {
      currentUser = await API('/api/auth/me');
    } catch {
      doLogout(); return;
    }
  }

  // Update sidebar user info
  const initials = (currentUser.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name-display').textContent = currentUser.name;
  document.getElementById('user-plan-display').textContent = planLabel(currentUser.plan, currentUser.credits);
  document.getElementById('greeting-name').textContent = currentUser.name.split(' ')[0];

  // Check for payment redirect
  const params = new URLSearchParams(location.search);
  if (params.get('payment') === 'success') {
    currentUser = await API('/api/auth/me');
    showNotification('Payment successful! Your plan has been activated.', 'success');
    history.replaceState({}, '', 'dashboard.html');
  }

  // Check for plan redirect from landing page
  const plan = params.get('plan');
  if (plan) {
    history.replaceState({}, '', 'dashboard.html');
    showView('pricing');
    setTimeout(() => startPurchase(plan), 500);
    return;
  }

  showView(currentView);
  loadTests();
}

function planLabel(plan, credits) {
  if (plan === 'monthly') return 'Monthly Plan';
  if (plan === 'annual') return 'Annual Plan';
  if (plan === 'credits') return `${credits} credit${credits !== 1 ? 's' : ''} remaining`;
  return 'Free Plan';
}

/* ── Views ──────────────────────────────────────────────────────────────────── */
function showView(view) {
  currentView = view;
  document.querySelectorAll('[id^="view-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.style.display = '';

  const navEl = document.getElementById('nav-' + view);
  if (navEl) navEl.classList.add('active');

  if (view === 'overview') loadOverview();
  if (view === 'tests') renderTests();
  if (view === 'practice') renderPractice();
  if (view === 'history') loadHistory();
  if (view === 'account') loadAccount();
}

/* ── Overview ───────────────────────────────────────────────────────────────── */
async function loadOverview() {
  try {
    const stats = await API('/api/user/stats');
    const me = await API('/api/auth/me');
    currentUser = me;

    document.getElementById('stat-tests').textContent = me.completedCount;
    document.getElementById('stat-credits').textContent =
      (me.plan === 'monthly' || me.plan === 'annual') ? '∞' : me.credits;

    const avgs = stats.sectionAverages;
    ['speaking', 'writing', 'reading', 'listening'].forEach(sec => {
      const val = avgs[sec];
      document.getElementById('avg-' + sec).textContent = val ? val + '%' : '—';
      document.getElementById('bar-' + sec).style.width = (val || 0) + '%';
    });

    const allPcts = Object.values(avgs).filter(v => v > 0);
    const overall = allPcts.length ? Math.round(allPcts.reduce((s, v) => s + v, 0) / allPcts.length) : null;
    document.getElementById('stat-best').textContent = overall ? overall + '%' : '—';

    // Recent activity
    const recent = stats.recentAttempts.slice(0, 5);
    const actEl = document.getElementById('recent-activity');
    if (recent.length) {
      actEl.innerHTML = recent.map(a => {
        const pct = a.max_score > 0 ? Math.round(a.total_score / a.max_score * 100) : 0;
        const date = new Date(a.completed_at || a.started_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
          <div><strong>${a.title}</strong><span style="color:var(--text-muted);margin-left:8px">${date}</span></div>
          <span class="chip chip-blue">${pct}%</span>
        </div>`;
      }).join('');
    }

    // Plan banner
    renderPlanBanner();

    // Featured tests
    if (allTests.length) {
      const featured = allTests.filter(t => t.type === 'full').slice(0, 3);
      document.getElementById('featured-tests').innerHTML = featured.map(renderTestCard).join('');
    }

  } catch (e) { console.error(e); }
}

function renderPlanBanner() {
  const el = document.getElementById('plan-banner-area');
  if (!currentUser) return;

  if (currentUser.plan === 'free') {
    el.innerHTML = `<div class="plan-banner">
      <div><h3>Upgrade to Unlimited</h3><p>You have 2 free mock tests. Upgrade for unlimited access to all 200+ tests.</p></div>
      <button class="btn" onclick="showView('pricing')">View Plans</button>
    </div>`;
  } else if (currentUser.plan === 'credits' && currentUser.credits <= 3) {
    el.innerHTML = `<div class="plan-banner" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
      <div><h3>Low on Credits</h3><p>You have ${currentUser.credits} credit(s) left. Top up or switch to unlimited monthly.</p></div>
      <button class="btn" onclick="showView('pricing')">Buy Credits</button>
    </div>`;
  } else {
    el.innerHTML = '';
  }
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */
async function loadTests() {
  try {
    allTests = await API('/api/tests');
    renderTests();
    renderPractice();

    const featured = allTests.filter(t => t.type === 'full').slice(0, 3);
    document.getElementById('featured-tests').innerHTML = featured.map(renderTestCard).join('');
  } catch (e) { console.error(e); }
}

let activeFilter = 'all';

function filterTests(type) {
  activeFilter = type;
  document.querySelectorAll('[id^="filter-"]').forEach(btn => {
    btn.className = 'btn btn-sm btn-ghost';
  });
  document.getElementById('filter-' + type).className = 'btn btn-sm btn-primary';
  renderTests();
}

function renderTests() {
  const filtered = activeFilter === 'all' ? allTests : allTests.filter(t => t.type === activeFilter);
  document.getElementById('all-tests-grid').innerHTML =
    filtered.length ? filtered.map(renderTestCard).join('') : '<p style="color:var(--text-muted)">No tests found.</p>';
}

function renderPractice() {
  const practice = allTests.filter(t => ['speaking','writing','reading','listening'].includes(t.type));
  document.getElementById('practice-grid').innerHTML =
    practice.length ? practice.map(renderTestCard).join('') : '<p style="color:var(--text-muted)">Loading...</p>';
}

function renderTestCard(t) {
  const typeColors = { full: 'blue', speaking: 'purple', writing: 'amber', reading: 'green', listening: 'blue', mini: 'gray' };
  const diffColors = { easy: 'green', medium: 'amber', hard: 'red' };
  const color = typeColors[t.type] || 'gray';
  const diffColor = diffColors[t.difficulty] || 'gray';
  const pct = t.bestScore && t.max_score ? Math.round(t.bestScore / t.max_score * 100) : null;

  return `<div class="test-card" onclick="startTest(${t.id})">
    <div class="test-card-header">
      <span class="test-title">${t.title}</span>
      <span class="chip chip-${color}">${t.type}</span>
    </div>
    <p class="test-desc">${t.description || ''}</p>
    <div class="test-meta">
      <span class="chip chip-${diffColor}">${t.difficulty}</span>
      <span class="chip chip-gray">⏱ ${t.duration} min</span>
      <span class="chip chip-gray">📝 ${t.total_questions} questions</span>
      ${t.credit_cost > 0 ? `<span class="chip chip-blue">💳 ${t.credit_cost} credit</span>` : ''}
    </div>
    <div class="test-stats">
      <span class="test-stat">Attempts: <strong>${t.userAttempts || 0}</strong></span>
      ${pct !== null ? `<span class="test-stat">Best: <strong>${pct}%</strong></span>` : ''}
    </div>
  </div>`;
}

function startTest(testId) {
  window.location.href = `test.html?id=${testId}`;
}

/* ── History ────────────────────────────────────────────────────────────────── */
async function loadHistory() {
  try {
    const rows = await API('/api/user/history');
    const tbody = document.getElementById('history-tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted)">No tests taken yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => {
      const pct = r.max_score > 0 ? Math.round(r.total_score / r.max_score * 100) : 0;
      const date = new Date(r.started_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' });
      const dur = r.time_spent ? Math.round(r.time_spent / 60) + ' min' : '—';
      return `<tr>
        <td><strong>${r.title}</strong></td>
        <td><span class="chip chip-gray">${r.type}</span></td>
        <td>${r.status === 'completed' ? `${Math.round(r.total_score)}/${Math.round(r.max_score)}` : '—'}</td>
        <td>${r.status === 'completed' ? `<span class="chip ${pct >= 65 ? 'chip-green' : pct >= 50 ? 'chip-amber' : 'chip-red'}">${pct}%</span>` : `<span class="chip chip-gray">${r.status}</span>`}</td>
        <td>${date}</td>
        <td>${dur}</td>
        <td>${r.status === 'completed' ? `<a class="btn btn-sm btn-outline" href="test.html?results=${r.id}">Results</a>` : `<a class="btn btn-sm btn-ghost" href="test.html?id=${r.test_id}">Retry</a>`}</td>
      </tr>`;
    }).join('');
  } catch (e) { console.error(e); }
}

/* ── Account ────────────────────────────────────────────────────────────────── */
async function loadAccount() {
  try {
    const me = await API('/api/auth/me');
    currentUser = me;
    document.getElementById('profile-name').value = me.name;
    document.getElementById('profile-email').value = me.email;
    document.getElementById('profile-since').value = new Date(me.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    const planEl = document.getElementById('account-plan-info');
    const actEl = document.getElementById('account-plan-actions');

    if (me.plan === 'free') {
      planEl.innerHTML = `<div class="alert alert-warn">You are on the <strong>Free Plan</strong>. You have ${2 - (me.completedCount || 0)} free test(s) remaining.</div>`;
      actEl.innerHTML = `<button class="btn btn-primary" onclick="showView('pricing')">Upgrade Now</button>`;
    } else if (me.plan === 'credits') {
      planEl.innerHTML = `<div class="alert alert-info">Credits plan: <strong>${me.credits} credit(s)</strong> remaining. Credits never expire.</div>`;
      actEl.innerHTML = `<button class="btn btn-outline" onclick="showView('pricing')">Buy More Credits</button>`;
    } else {
      const expires = me.plan_expires_at ? new Date(me.plan_expires_at).toLocaleDateString('en-AU') : '—';
      planEl.innerHTML = `<div class="alert alert-success"><strong>${me.plan === 'annual' ? 'Annual' : 'Monthly'} Plan</strong> — Active until ${expires}. Unlimited tests included.</div>`;
      actEl.innerHTML = `<button class="btn btn-ghost" style="color:var(--text-muted);font-size:13px" onclick="alert('To cancel, contact support@ptemaster.com')">Cancel Subscription</button>`;
    }
  } catch (e) { console.error(e); }
}

/* ── Purchase ────────────────────────────────────────────────────────────────── */
async function startPurchase(plan) {
  const btn = event ? event.target : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  try {
    const data = await API('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan, redirect_url: window.location.origin + '/dashboard.html?payment=success' }),
    });

    if (data.checkout_url) {
      window.location.href = data.checkout_url;
    } else if (data.demo) {
      showNotification(data.message || 'Plan activated!', 'success');
      currentUser = await API('/api/auth/me');
      document.getElementById('user-plan-display').textContent = planLabel(currentUser.plan, currentUser.credits);
      showView('overview');
    }
  } catch (e) {
    showNotification(e.error || 'Purchase failed. Please try again.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = btn.textContent.replace('Processing…', btn.textContent); }
  }
}

/* ── Notifications ──────────────────────────────────────────────────────────── */
function showNotification(msg, type = 'info') {
  const colors = { success: 'alert-success', error: 'alert-error', info: 'alert-info', warn: 'alert-warn' };
  const el = document.createElement('div');
  el.className = `alert ${colors[type]}`;
  el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;max-width:360px;box-shadow:var(--shadow-lg)';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── Init ────────────────────────────────────────────────────────────────────── */
async function init() {
  const params = new URLSearchParams(location.search);
  const showSignup = params.get('signup') === '1';
  if (showSignup) showRegister();

  const token = localStorage.getItem('pte_token');
  if (!token) {
    document.getElementById('auth-modal').style.display = 'flex';
    return;
  }

  try {
    currentUser = await API('/api/auth/me');
    showApp();
  } catch {
    localStorage.removeItem('pte_token');
    document.getElementById('auth-modal').style.display = 'flex';
  }
}

// Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const loginVisible = document.getElementById('login-form').style.display !== 'none';
    const regVisible = document.getElementById('register-form').style.display !== 'none';
    const modalVisible = document.getElementById('auth-modal').style.display !== 'none';
    if (modalVisible && loginVisible) doLogin();
    if (modalVisible && regVisible) doRegister();
  }
});

init();
