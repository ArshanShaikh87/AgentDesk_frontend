// server.js — AgentDesk Backend Core Loop
//
// This is the next real step after runner_v2.js. It combines:
//   1. A real database (db.js) instead of an in-memory object
//   2. An HTTP API so the frontend (or Postman, for now) can create
//      and check on tasks
//   3. The same background-process + pattern-detection logic you
//      already validated in runner_v2.js
//
// Still using DUMMY commands here (safe, zero API cost) — swapping
// in the real Claude Code CLI is the LAST step, once everything
// below is working reliably.

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const JWT_SECRET = 'your-super-secret-jwt-key-agentdesk';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  socket.on('authenticate', (token) => {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.join(payload.userId.toString());
    } catch (err) {
      socket.disconnect();
    }
  });
});

const MAX_PARALLEL_AGENTS = 3; // matches the plan-tier limit from our NFRs
let activeCount = 0;

const NEEDS_INPUT_PATTERNS = [
  /permission/i,
  /waiting for/i,
  /do you want to proceed/i,
  /\(y\/n\)/i,
  /approve/i,
  /confirm/i,
  /\?\s*$/,
];

function looksLikeItNeedsInput(line) {
  return NEEDS_INPUT_PATTERNS.some((pattern) => pattern.test(line));
}

// ---- Authentication Middleware ----
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// ---- Core execution logic (same idea as runner_v2.js, now DB-backed) ----
function runTask(task) {
  activeCount++;
  db.updateTaskStatus(task.id, 'working');
  io.to(task.user_id.toString()).emit('task_update');
  console.log(`[Task ${task.id}] Started: "${task.description}"`);

  // Still a dummy command for now — this stands in for the real
  // `claude-code --task "..."` call.
  const proc = spawn('node', [
    '-e',
    `
      setTimeout(() => console.log("working on: ${task.description}"), 800);
      setTimeout(() => console.log("Do you want to proceed? (y/n)"), 2000);
    `,
  ]);

  proc.stdout.on('data', (data) => {
    const line = data.toString().trim();
    console.log(`[Task ${task.id}] ${line}`);

    if (looksLikeItNeedsInput(line)) {
      db.updateTaskStatus(task.id, 'needs_input', line);
      io.to(task.user_id.toString()).emit('task_update');
    }
  });

  proc.on('close', (code) => {
    activeCount--;
    const current = db.getTaskByIdAdmin(task.id);
    if (current.status !== 'needs_input') {
      db.updateTaskStatus(task.id, code === 0 ? 'done' : 'blocked');
    }
    io.to(task.user_id.toString()).emit('task_update');
    console.log(`[Task ${task.id}] Finished.`);
    processQueue(); // free slot -> try to start the next queued task
  });
}

// ---- Simple queue: only start a task if we're under the parallel limit ----
function processQueue() {
  if (activeCount >= MAX_PARALLEL_AGENTS) return;

  const queued = db.getQueuedTasksAdmin();
  if (queued.length > 0) {
    runTask(queued[0]);
  }
}

// ---- API ----

// --- Auth Endpoints ---
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const existing = db.getUserByEmail(email);
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const user = db.createUser(email, hash);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.getUserByEmail(email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email } });
});

// --- Settings Endpoints ---
app.post('/settings/api-key', requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'API key is required' });
  
  // Basic mock encryption for MVP (in production use real crypto AES-256)
  const encryptedKey = Buffer.from(apiKey).toString('base64');
  db.saveApiKey(req.userId, encryptedKey);
  res.json({ message: 'API Key saved successfully' });
});

app.get('/settings/api-key', requireAuth, (req, res) => {
  const keyRecord = db.getApiKey(req.userId);
  if (!keyRecord) return res.json({ saved: false });
  // Just show it's saved without exposing the raw key
  res.json({ saved: true, masked: 'sk-ant-***' });
});

// --- Tasks Endpoints ---
// Create a new task
app.post('/tasks', requireAuth, (req, res) => {
  const { description } = req.body;
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Task description is required' });
  }

  const task = db.createTask(description.trim(), req.userId);
  processQueue(); // try to start it immediately if a slot is free
  res.status(201).json(task);
});

// List all tasks with current status
app.get('/tasks', requireAuth, (req, res) => {
  res.json(db.getAllTasks(req.userId));
});

// Get one task
app.get('/tasks/:id', requireAuth, (req, res) => {
  const task = db.getTaskById(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
  res.json(task);
});

// Respond to a task that's waiting on input
app.post('/tasks/:id/respond', requireAuth, (req, res) => {
  const task = db.getTaskById(req.params.id, req.userId);
  if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
  if (task.status !== 'needs_input') {
    return res.status(400).json({ error: 'Task is not waiting for input' });
  }

  db.updateTaskStatus(task.id, 'working', null);
  io.to(req.userId.toString()).emit('task_update');
  res.json({ message: 'Response received, task resumed' });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`AgentDesk backend running on http://localhost:${PORT}`);
});
