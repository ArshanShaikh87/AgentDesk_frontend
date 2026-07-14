// db.js — SQLite database setup for AgentDesk backend
//
// This replaces the in-memory `tasks = {}` object from the runner_v2.js
// prototype with a real, persistent database. Now tasks survive a
// server restart, which is required before this can be a real product.

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'agentdesk.db'));

// Create the tasks table if it doesn't exist yet.
// This mirrors the schema we designed earlier in the architecture doc.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    encrypted_key TEXT NOT NULL,
    provider TEXT DEFAULT 'anthropic',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    worktree_path TEXT,
    pending_question TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Non-destructive addition of user_id to tasks if it was missing (from older schema)
try {
  db.exec('ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id)');
} catch (e) {
  // column likely already exists, ignore
}

// ---- Simple query helpers used by the rest of the app ----

function createTask(description, userId) {
  const stmt = db.prepare(
    'INSERT INTO tasks (description, status, user_id) VALUES (?, ?, ?)'
  );
  const info = stmt.run(description, 'queued', userId);
  return getTaskById(info.lastInsertRowid, userId);
}

function getTaskById(id, userId) {
  return db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId);
}

function getAllTasks(userId) {
  return db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function getTaskByIdAdmin(id) {
  // For background agent runner which doesn't have a session userId context
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getQueuedTasksAdmin() {
  return db.prepare('SELECT * FROM tasks WHERE status = "queued" ORDER BY created_at ASC').all();
}

function updateTaskStatus(id, status, pendingQuestion = null) {
  db.prepare(
    `UPDATE tasks
     SET status = ?, pending_question = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(status, pendingQuestion, id);
  return getTaskByIdAdmin(id);
}

function createUser(email, passwordHash) {
  const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
  const info = stmt.run(email, passwordHash);
  return getUserByEmail(email);
}

function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function saveApiKey(userId, encryptedKey) {
  // Replace existing key or insert new one
  const existing = getApiKey(userId);
  if (existing) {
    db.prepare('UPDATE api_keys SET encrypted_key = ? WHERE user_id = ?').run(encryptedKey, userId);
  } else {
    db.prepare('INSERT INTO api_keys (user_id, encrypted_key) VALUES (?, ?)').run(userId, encryptedKey);
  }
}

function getApiKey(userId) {
  return db.prepare('SELECT * FROM api_keys WHERE user_id = ?').get(userId);
}

module.exports = {
  createTask,
  getTaskById,
  getAllTasks,
  updateTaskStatus,
  createUser,
  getUserByEmail,
  saveApiKey,
  getApiKey,
  getTaskByIdAdmin,
  getQueuedTasksAdmin
};
