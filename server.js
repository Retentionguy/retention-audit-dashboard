const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, initSchema } = require('./database/pte-schema');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pte-prep-secret-2026-change-in-production';
const SETTLESMART_KEY = process.env.SETTLESMART_KEY || '';
const SETTLESMART_SECRET = process.env.SETTLESMART_SECRET || '';
const SETTLESMART_BASE = process.env.SETTLESMART_BASE || 'https://api.settlesmart.com.au/v1';

const db = getDb();
initSchema(db);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auth middleware ─────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

// ─── Scoring engine ──────────────────────────────────────────────────────────

function scoreAnswer(question, userAnswer) {
  const type = question.type;
  const answer = JSON.parse(question.answer || '{}');
  const guide = JSON.parse(question.scoring_guide || '{}');
  let score = 0;
  let maxScore = question.points;
  let feedback = '';

  switch (type) {
    case 'reading_rw_fill_blanks':
    case 'reading_fill_blanks':
    case 'listening_fill_blanks': {
      const correctAnswers = answer.answers || [];
      const userAnswers = userAnswer.answers || [];
      const perBlank = guide.per_blank || 1;
      maxScore = correctAnswers.length * perBlank;
      correctAnswers.forEach(ca => {
        const ua = userAnswers.find(a => a.id === ca.id);
        if (ua && ua.word && ua.word.toLowerCase().trim() === ca.word.toLowerCase().trim()) {
          score += perBlank;
        }
      });
      feedback = `${score}/${maxScore} blanks correct`;
      break;
    }

    case 'reading_mcsa':
    case 'listening_mcsa':
    case 'listening_highlight_summary':
    case 'listening_missing_word': {
      maxScore = guide.total || 1;
      if (userAnswer.selected === answer.correct) {
        score = maxScore;
        feedback = 'Correct!';
      } else {
        feedback = `Incorrect. The correct answer was: ${answer.correct}`;
      }
      break;
    }

    case 'reading_mcma':
    case 'listening_mcma': {
      const correct = new Set(answer.correct || []);
      const selected = new Set(userAnswer.selected || []);
      const perCorrect = guide.per_correct || 1;
      const perWrong = guide.per_wrong || -1;
      maxScore = correct.size * perCorrect;
      selected.forEach(s => {
        if (correct.has(s)) score += perCorrect;
        else score += perWrong;
      });
      score = Math.max(0, Math.min(score, maxScore));
      feedback = `You selected ${selected.size} option(s). Correct: ${[...correct].join(', ')}`;
      break;
    }

    case 'reading_reorder': {
      const correctOrder = answer.order || [];
      const userOrder = userAnswer.order || [];
      maxScore = Math.max(0, correctOrder.length - 1);
      // Score adjacent pairs
      for (let i = 0; i < correctOrder.length - 1; i++) {
        const ci = userOrder.indexOf(correctOrder[i]);
        const cj = userOrder.indexOf(correctOrder[i + 1]);
        if (ci !== -1 && cj !== -1 && cj === ci + 1) score++;
      }
      feedback = `${score}/${maxScore} adjacent pairs correct`;
      break;
    }

    case 'listening_highlight_incorrect': {
      const incorrect = new Set(answer.incorrect_words || []);
      const selected = new Set(userAnswer.selected || []);
      const perCorrect = guide.per_correct || 1;
      const perWrong = guide.per_wrong || -1;
      maxScore = incorrect.size * perCorrect;
      selected.forEach(w => {
        if (incorrect.has(w)) score += perCorrect;
        else score += perWrong;
      });
      score = Math.max(0, Math.min(score, maxScore));
      feedback = `Identified ${[...selected].filter(w => incorrect.has(w)).length}/${incorrect.size} incorrect words`;
      break;
    }

    case 'listening_write_dictation': {
      const correctText = (answer.text || '').toLowerCase().trim();
      const userText = (userAnswer.text || '').toLowerCase().trim();
      const correctWords = correctText.split(/\s+/).filter(Boolean);
      const userWords = userText.split(/\s+/).filter(Boolean);
      maxScore = correctWords.length;
      const userWordSet = new Set(userWords);
      correctWords.forEach(w => { if (userWordSet.has(w)) score++; });
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      feedback = `${pct}% accurate (${score}/${maxScore} words correct)`;
      break;
    }

    // Subjective types — heuristic scoring
    case 'writing_summarize_text':
    case 'listening_summarize': {
      const text = (userAnswer.text || '').trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      maxScore = guide.content + guide.form + guide.grammar + guide.vocabulary + guide.spelling;

      // Form check: single sentence, 5-75 words
      const formScore = (words >= 5 && words <= 75 && text.endsWith('.')) ? guide.form : 0;

      // Content: check key points coverage
      const keyPoints = answer.key_points || [];
      const textLower = text.toLowerCase();
      const covered = keyPoints.filter(kp =>
        kp.toLowerCase().split(' ').some(w => w.length > 4 && textLower.includes(w))
      ).length;
      const contentScore = Math.round((covered / Math.max(keyPoints.length, 1)) * guide.content);

      // Grammar + vocabulary heuristic based on word variety
      const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
      const grammarScore = words > 10 ? Math.min(guide.grammar, 2) : 1;
      const vocabScore = uniqueWords / words > 0.7 ? guide.vocabulary : Math.floor(guide.vocabulary / 2);
      const spellingScore = guide.spelling; // assume correct (no spell checker)

      score = formScore + contentScore + grammarScore + vocabScore + spellingScore;
      score = Math.min(score, maxScore);
      feedback = `Word count: ${words}. Key points covered: ${covered}/${keyPoints.length}`;
      break;
    }

    case 'writing_essay': {
      const text = (userAnswer.text || '').trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      maxScore = (guide.content || 3) + (guide.form || 2) + (guide.grammar || 2) +
                 (guide.vocabulary || 2) + (guide.spelling || 2) + (guide.cohesion || 2);

      // Form: 200-300 words
      const formScore = words >= 200 && words <= 300 ? guide.form : words > 100 ? 1 : 0;
      // Content: keyword coverage
      const args = answer.key_arguments || [];
      const textLower = text.toLowerCase();
      const coveredArgs = args.filter(a =>
        a.toLowerCase().split(' ').some(w => w.length > 4 && textLower.includes(w))
      ).length;
      const contentScore = Math.round((coveredArgs / Math.max(args.length, 1)) * (guide.content || 3));
      const grammarScore = words > 100 ? guide.grammar : 1;
      const vocabScore = guide.vocabulary;
      const cohesionScore = words > 150 ? guide.cohesion : 0;
      const spellingScore = guide.spelling;

      score = formScore + contentScore + grammarScore + vocabScore + cohesionScore + spellingScore;
      score = Math.min(score, maxScore);
      feedback = `Word count: ${words}/200-300 required. Arguments covered: ${coveredArgs}/${args.length}`;
      break;
    }

    // Speaking types — cannot auto-score audio; give partial credit
    case 'speaking_read_aloud':
    case 'speaking_repeat_sentence':
    case 'speaking_describe_image':
    case 'speaking_retell_lecture':
    case 'speaking_answer_short': {
      maxScore = question.points;
      // Check if user submitted a recording
      if (userAnswer.recorded) {
        score = Math.round(maxScore * 0.6); // baseline score; real scoring needs AI
        feedback = 'Recording submitted. Score estimated — detailed AI analysis pending.';
      } else {
        score = 0;
        feedback = 'No recording submitted.';
      }
      break;
    }

    default:
      score = 0;
      feedback = 'Unknown question type';
  }

  return { score: Math.max(0, score), maxScore, feedback };
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    const result = stmt.run(name.trim(), email.toLowerCase().trim(), hash);
    const user = db.prepare('SELECT id, name, email, plan, credits FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, plan, credits, plan_expires_at, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const attemptCount = db.prepare('SELECT COUNT(*) as c FROM attempts WHERE user_id = ?').get(req.user.id).c;
  const completedCount = db.prepare('SELECT COUNT(*) as c FROM attempts WHERE user_id = ? AND status = ?').get(req.user.id, 'completed').c;

  res.json({ ...user, attemptCount, completedCount });
});

// ─── Tests routes ─────────────────────────────────────────────────────────────

app.get('/api/tests', requireAuth, (req, res) => {
  const { type, difficulty } = req.query;
  let where = '1=1';
  const params = [];

  if (type) { where += ' AND type = ?'; params.push(type); }
  if (difficulty) { where += ' AND difficulty = ?'; params.push(difficulty); }

  const tests = db.prepare(`SELECT * FROM tests WHERE ${where} ORDER BY id`).all(...params);

  // Attach user's attempt history for each test
  const testIds = tests.map(t => t.id);
  const attempts = testIds.length
    ? db.prepare(`
        SELECT test_id, COUNT(*) as attempts, MAX(total_score) as best_score, MAX(completed_at) as last_attempt
        FROM attempts WHERE user_id = ? AND test_id IN (${testIds.map(() => '?').join(',')}) AND status = 'completed'
        GROUP BY test_id
      `).all(req.user.id, ...testIds)
    : [];

  const attemptsMap = {};
  attempts.forEach(a => { attemptsMap[a.test_id] = a; });

  res.json(tests.map(t => ({
    ...t,
    userAttempts: attemptsMap[t.id]?.attempts || 0,
    bestScore: attemptsMap[t.id]?.best_score || null,
    lastAttempt: attemptsMap[t.id]?.last_attempt || null,
  })));
});

app.get('/api/tests/:id', requireAuth, (req, res) => {
  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const questions = db.prepare(`
    SELECT id, section, type, order_no, title, content, scoring_guide, points, time_limit,
           CASE WHEN section IN ('listening') THEN audio_text ELSE NULL END as audio_text
    FROM questions WHERE test_id = ? ORDER BY order_no
  `).all(test.id);

  res.json({
    ...test,
    questions: questions.map(q => ({
      ...q,
      content: JSON.parse(q.content || '{}'),
      scoring_guide: JSON.parse(q.scoring_guide || '{}'),
    }))
  });
});

// ─── Attempt routes ──────────────────────────────────────────────────────────

app.post('/api/attempts', requireAuth, (req, res) => {
  const { test_id } = req.body;
  if (!test_id) return res.status(400).json({ error: 'test_id required' });

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(test_id);
  if (!test) return res.status(404).json({ error: 'Test not found' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  // Access check
  const now = new Date();
  const isSubscribed = user.plan === 'monthly' || user.plan === 'annual';
  const planValid = user.plan_expires_at && new Date(user.plan_expires_at) > now;

  if (!(isSubscribed && planValid) && user.plan !== 'free') {
    // Credits plan
    if (user.credits < test.credit_cost) {
      return res.status(402).json({ error: 'Insufficient credits', required: test.credit_cost, available: user.credits });
    }
    db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(test.credit_cost, user.id);
  } else if (user.plan === 'free') {
    // Free users get 2 free attempts total
    const totalAttempts = db.prepare('SELECT COUNT(*) as c FROM attempts WHERE user_id = ?').get(user.id).c;
    if (totalAttempts >= 2) {
      return res.status(402).json({ error: 'Free limit reached. Please subscribe to continue.', freeLimit: true });
    }
  }

  const maxScore = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM questions WHERE test_id = ?').get(test_id).total;

  const result = db.prepare(`
    INSERT INTO attempts (user_id, test_id, max_score) VALUES (?, ?, ?)
  `).run(req.user.id, test_id, maxScore);

  res.json({ attempt_id: result.lastInsertRowid, test_id, max_score: maxScore });
});

app.post('/api/attempts/:id/answer', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Attempt already completed' });

  const { question_id, user_answer } = req.body;
  const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const { score, maxScore, feedback } = scoreAnswer(question, user_answer || {});

  // Upsert answer
  const existing = db.prepare('SELECT id FROM user_answers WHERE attempt_id = ? AND question_id = ?').get(attempt.id, question_id);
  if (existing) {
    db.prepare('UPDATE user_answers SET user_answer = ?, score = ?, max_score = ?, feedback = ?, answered_at = datetime(\'now\') WHERE id = ?')
      .run(JSON.stringify(user_answer), score, maxScore, feedback, existing.id);
  } else {
    db.prepare('INSERT INTO user_answers (attempt_id, question_id, user_answer, score, max_score, feedback) VALUES (?, ?, ?, ?, ?, ?)')
      .run(attempt.id, question_id, JSON.stringify(user_answer), score, maxScore, feedback);
  }

  // Update attempt progress
  db.prepare('UPDATE attempts SET current_question = ? WHERE id = ?').run(req.body.question_index || 0, attempt.id);

  res.json({ score, maxScore, feedback });
});

app.post('/api/attempts/:id/complete', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

  // Tally scores
  const answers = db.prepare('SELECT * FROM user_answers WHERE attempt_id = ?').all(attempt.id);
  const questions = db.prepare('SELECT * FROM questions WHERE test_id = ?').all(attempt.test_id);

  const sectionScores = { speaking: { score: 0, max: 0 }, writing: { score: 0, max: 0 }, reading: { score: 0, max: 0 }, listening: { score: 0, max: 0 } };

  questions.forEach(q => {
    const ua = answers.find(a => a.question_id === q.id);
    const s = sectionScores[q.section];
    s.max += ua ? ua.max_score : q.points;
    s.score += ua ? ua.score : 0;
  });

  const totalScore = Object.values(sectionScores).reduce((sum, s) => sum + s.score, 0);
  const maxScore = Object.values(sectionScores).reduce((sum, s) => sum + s.max, 0);

  db.prepare(`
    UPDATE attempts SET status = 'completed', completed_at = datetime('now'),
    total_score = ?, max_score = ?, section_scores = ?, time_spent = ?
    WHERE id = ?
  `).run(totalScore, maxScore, JSON.stringify(sectionScores), req.body.time_spent || 0, attempt.id);

  res.json({ total_score: totalScore, max_score: maxScore, section_scores: sectionScores });
});

app.get('/api/attempts/:id/results', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(attempt.test_id);
  const answers = db.prepare(`
    SELECT ua.*, q.section, q.type, q.title, q.content, q.answer, q.order_no
    FROM user_answers ua
    JOIN questions q ON q.id = ua.question_id
    WHERE ua.attempt_id = ?
    ORDER BY q.order_no
  `).all(attempt.id);

  const sectionScores = attempt.section_scores ? JSON.parse(attempt.section_scores) : {};
  const pct = attempt.max_score > 0 ? Math.round((attempt.total_score / attempt.max_score) * 100) : 0;

  // PTE score bands (approximate)
  const pteBand = pct >= 90 ? 90 : pct >= 79 ? 79 : pct >= 65 ? 65 : pct >= 50 ? 50 : pct >= 36 ? 36 : 10;

  res.json({
    attempt: { ...attempt, section_scores: sectionScores },
    test,
    answers: answers.map(a => ({
      ...a,
      content: JSON.parse(a.content || '{}'),
      answer: JSON.parse(a.answer || '{}'),
      user_answer: JSON.parse(a.user_answer || '{}'),
    })),
    summary: { pct, pteBand },
  });
});

// ─── User stats ──────────────────────────────────────────────────────────────

app.get('/api/user/stats', requireAuth, (req, res) => {
  const attempts = db.prepare(`
    SELECT a.*, t.title, t.type
    FROM attempts a JOIN tests t ON t.id = a.test_id
    WHERE a.user_id = ? AND a.status = 'completed'
    ORDER BY a.completed_at DESC
  `).all(req.user.id);

  const sectionAvgs = { speaking: [], writing: [], reading: [], listening: [] };
  attempts.forEach(a => {
    if (!a.section_scores) return;
    const ss = JSON.parse(a.section_scores);
    Object.entries(ss).forEach(([sec, { score, max }]) => {
      if (max > 0) sectionAvgs[sec].push(score / max * 100);
    });
  });

  const avg = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  res.json({
    totalAttempts: attempts.length,
    recentAttempts: attempts.slice(0, 10),
    sectionAverages: {
      speaking: avg(sectionAvgs.speaking),
      writing: avg(sectionAvgs.writing),
      reading: avg(sectionAvgs.reading),
      listening: avg(sectionAvgs.listening),
    },
  });
});

app.get('/api/user/history', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.started_at, a.completed_at, a.status, a.total_score, a.max_score, a.time_spent,
           t.title, t.type, t.difficulty
    FROM attempts a JOIN tests t ON t.id = a.test_id
    WHERE a.user_id = ?
    ORDER BY a.started_at DESC
    LIMIT 50
  `).all(req.user.id);

  res.json(rows);
});

// ─── Subscription / Payment routes ───────────────────────────────────────────

const PLANS = {
  monthly: { amount: 29.99, billing_cycle: 'monthly', credits: null, label: 'Monthly Unlimited' },
  annual:  { amount: 199.99, billing_cycle: 'annual', credits: null, label: 'Annual Unlimited' },
  credits_5:  { amount: 9.99,  credits: 5,  label: '5 Mock Credits' },
  credits_15: { amount: 24.99, credits: 15, label: '15 Mock Credits' },
  credits_30: { amount: 39.99, credits: 30, label: '30 Mock Credits' },
};

app.get('/api/plans', (req, res) => res.json(PLANS));

app.post('/api/subscribe', requireAuth, async (req, res) => {
  const { plan, redirect_url } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

  const planInfo = PLANS[plan];
  const txId = crypto.randomUUID();

  // Record pending transaction
  db.prepare(`
    INSERT INTO transactions (user_id, amount, credits, type, gateway_ref)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, planInfo.amount, planInfo.credits || 0,
    planInfo.credits ? 'credit_purchase' : 'subscription', txId);

  // If Settlesmart is configured, create a payment session
  if (SETTLESMART_KEY) {
    try {
      const payload = {
        reference: txId,
        amount: planInfo.amount,
        currency: 'AUD',
        description: `PTE Prep - ${planInfo.label}`,
        customer: { id: req.user.id, email: req.user.email },
        redirect_url: redirect_url || `${req.protocol}://${req.get('host')}/dashboard.html?payment=success`,
        webhook_url: `${req.protocol}://${req.get('host')}/api/webhook/settlesmart`,
        metadata: { plan, user_id: req.user.id, tx_id: txId },
      };
      const response = await fetch(`${SETTLESMART_BASE}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SETTLESMART_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.checkout_url) {
        return res.json({ checkout_url: data.checkout_url, tx_id: txId });
      }
    } catch (e) {
      console.error('Settlesmart error:', e.message);
    }
  }

  // Demo mode: auto-approve (no real payment gateway configured)
  if (!SETTLESMART_KEY) {
    activatePlan(req.user.id, plan, txId);
    return res.json({ success: true, demo: true, message: 'Payment simulated (demo mode)' });
  }

  res.status(502).json({ error: 'Payment gateway unavailable' });
});

app.post('/api/webhook/settlesmart', (req, res) => {
  // Verify webhook signature
  const sig = req.headers['x-settlesmart-signature'] || '';
  if (SETTLESMART_SECRET) {
    const expected = crypto.createHmac('sha256', SETTLESMART_SECRET)
      .update(JSON.stringify(req.body)).digest('hex');
    if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });
  }

  const { status, metadata } = req.body;
  if (status === 'completed' && metadata) {
    activatePlan(metadata.user_id, metadata.plan, metadata.tx_id);
  }

  res.json({ received: true });
});

function activatePlan(userId, plan, txId) {
  const planInfo = PLANS[plan];
  if (!planInfo) return;

  const now = new Date();

  if (planInfo.credits) {
    db.prepare('UPDATE users SET plan = \'credits\', credits = credits + ? WHERE id = ?')
      .run(planInfo.credits, userId);
  } else {
    const expires = new Date(now);
    if (planInfo.billing_cycle === 'monthly') expires.setMonth(expires.getMonth() + 1);
    else expires.setFullYear(expires.getFullYear() + 1);

    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?')
      .run(plan, expires.toISOString(), userId);

    db.prepare('INSERT INTO subscriptions (user_id, plan, amount, billing_cycle, expires_at, gateway_ref) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, plan, planInfo.amount, planInfo.billing_cycle, expires.toISOString(), txId);
  }

  db.prepare('UPDATE transactions SET status = \'completed\', completed_at = datetime(\'now\') WHERE gateway_ref = ?').run(txId);
}

// ─── Admin routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const paid = db.prepare('SELECT COUNT(*) as c FROM users WHERE plan != \'free\'').get().c;
  const monthly = db.prepare('SELECT COUNT(*) as c FROM users WHERE plan = \'monthly\'').get().c;
  const annual = db.prepare('SELECT COUNT(*) as c FROM users WHERE plan = \'annual\'').get().c;
  const revenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = \'completed\'').get().total;
  const attempts = db.prepare('SELECT COUNT(*) as c FROM attempts').get().c;
  res.json({ users, paid, monthly, annual, revenue, attempts });
});

// ─── Serve SPA routes ─────────────────────────────────────────────────────────

app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/test', (req, res) => res.sendFile(path.join(__dirname, 'public/test.html')));
app.get('/results', (req, res) => res.sendFile(path.join(__dirname, 'public/test.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

app.listen(PORT, () => {
  console.log(`PTE Prep Dashboard running at http://localhost:${PORT}`);
});
