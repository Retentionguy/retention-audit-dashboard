const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'retention.db');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      company TEXT,
      plan TEXT NOT NULL CHECK(plan IN ('starter','growth','pro','enterprise')),
      mrr REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','churned','at_risk','paused')),
      created_at TEXT NOT NULL,
      churned_at TEXT,
      churn_reason TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      session_date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0,
      features_used INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('paid','unpaid','refunded')),
      due_date TEXT NOT NULL,
      paid_at TEXT
    );
  `);
}

module.exports = { getDb, initSchema, DB_PATH };
