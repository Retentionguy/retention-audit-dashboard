const Database = require('better-sqlite3');
const path = require('path');

let _db;

function getDb() {
  if (!_db) {
    _db = new Database(path.join(__dirname, '../pte.db'));
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT DEFAULT 'free' CHECK(plan IN ('free','credits','monthly','annual')),
      credits INTEGER DEFAULT 0,
      plan_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('full','speaking','writing','reading','listening','mini')),
      difficulty TEXT DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
      duration INTEGER NOT NULL,
      credit_cost INTEGER DEFAULT 1,
      total_questions INTEGER DEFAULT 0,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER REFERENCES tests(id),
      section TEXT NOT NULL CHECK(section IN ('speaking','writing','reading','listening')),
      type TEXT NOT NULL,
      order_no INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      answer TEXT,
      scoring_guide TEXT,
      points INTEGER DEFAULT 1,
      audio_text TEXT,
      time_limit INTEGER
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      test_id INTEGER NOT NULL REFERENCES tests(id),
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      status TEXT DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','abandoned')),
      current_question INTEGER DEFAULT 0,
      total_score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      section_scores TEXT,
      time_spent INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES attempts(id),
      question_id INTEGER NOT NULL REFERENCES questions(id),
      user_answer TEXT,
      score REAL DEFAULT 0,
      max_score REAL DEFAULT 0,
      feedback TEXT,
      answered_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      plan TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_cycle TEXT CHECK(billing_cycle IN ('monthly','annual')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','cancelled','expired')),
      started_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT,
      gateway_ref TEXT,
      gateway TEXT DEFAULT 'settlesmart'
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      credits INTEGER DEFAULT 0,
      type TEXT NOT NULL CHECK(type IN ('credit_purchase','subscription','refund')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','refunded')),
      gateway_ref TEXT,
      gateway TEXT DEFAULT 'settlesmart',
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_questions_test ON questions(test_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_answers_attempt ON user_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
  `);
}

module.exports = { getDb, initSchema };
