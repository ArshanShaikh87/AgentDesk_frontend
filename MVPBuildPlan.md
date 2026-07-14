# AgentDesk — MVP Build Plan (Execution Checklist)

> Goal: ship a working single-user MVP as fast as possible. Everything below is the FULL scope — nothing more, nothing less. Build top to bottom; each section unblocks the next.

---

## ✅ Already Done
- [x] SQLite `tasks` table + `db.js`
- [x] Express server with task create/list/status
- [x] Parallel execution + "needs input" pattern detection (dummy commands)
- [x] Frontend landing page (deployed)
- [x] Frontend ↔ Backend connected, live status confirmed working

---

## 🗄️ DATABASE — 4 Tables Total (This Is All You Need for MVP)

### 1. `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt |
| plan_tier | TEXT | default 'free' |
| created_at | TEXT | |

### 2. `api_keys`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| encrypted_key | TEXT | AES-256 encrypted |
| provider | TEXT | default 'anthropic' |
| created_at | TEXT | |

### 3. `tasks` (already exists — just add `user_id`)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | **← add this column now** |
| description | TEXT | |
| status | TEXT | queued/working/needs_input/done/blocked |
| worktree_path | TEXT | |
| pending_question | TEXT | |
| created_at / updated_at | TEXT | |

### 4. `task_logs` (optional for MVP, add if time allows)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| task_id | INTEGER FK → tasks.id | |
| log_line | TEXT | |
| timestamp | TEXT | |

**That's it — 4 tables, no more.** Don't add anything else until MVP is live and used.

---

## 🔧 BACKEND — Exact Endpoints Needed

### Auth (new — not built yet)
| Method | Endpoint | Does |
|---|---|---|
| POST | `/auth/signup` | Create user, hash password, return JWT |
| POST | `/auth/login` | Verify password, return JWT |
| Middleware | `requireAuth` | Reads JWT, attaches `req.userId` to every protected route |

### Settings (new)
| Method | Endpoint | Does |
|---|---|---|
| POST | `/settings/api-key` | Encrypt + store user's Claude API key |
| GET | `/settings/api-key` | Return masked key (e.g. `sk-ant-***1234`) so UI shows "key saved" without exposing it |

### Tasks (mostly exists — add `user_id` scoping)
| Method | Endpoint | Does |
|---|---|---|
| POST | `/tasks` | ✅ exists — **add**: scope to `req.userId` |
| GET | `/tasks` | ✅ exists — **add**: filter `WHERE user_id = ?` |
| GET | `/tasks/:id` | ✅ exists — **add**: verify task belongs to user |
| POST | `/tasks/:id/respond` | ✅ exists |

### Real-time (new — replaces manual polling)
| Type | Does |
|---|---|
| WebSocket `/ws` | Pushes task status changes live to frontend — no more needing to re-call GET /tasks manually |

**Not building yet (correctly deferred):** teams/shared dashboards, cost tracking, AI-based classification, diff/merge review UI (add after core loop is proven with real Claude Code).

---

## 🎨 FRONTEND — Exact Pages Needed

You currently have: **Landing Page** (done). Now build these **4 more pages**:

### 1. `/signup` and `/login`
- Simple form: email + password
- Calls `/auth/signup` or `/auth/login`
- Stores returned JWT (in memory / localStorage-equivalent — for React, use state + a simple auth context)

### 2. `/settings`
- One input: paste Claude API key → Save
- Shows masked key if already saved
- This is the ONLY settings needed for MVP — no billing page yet

### 3. `/dashboard` (the core product screen)
- Task list (reuse the version you already connected to backend)
- "New Task" input at top
- Status pills per task (queued/working/needs_input/done/blocked)
- Live updates via WebSocket instead of manual refresh

### 4. `/dashboard/task/:id` (task detail)
- Shows task description + live log
- If status = `needs_input`: shows the pending question + a respond box
- (Diff review UI — **skip for MVP**, just show "Done" for now; add diff viewer after real Claude Code is wired in)

**Total frontend pages for MVP: Landing (done) + Login + Signup + Settings + Dashboard + Task Detail = 5 pages.** That's the complete scope. Nothing else.

---

## 🔐 AUTH — Keep It Boring and Standard

- JWT-based, stored client-side, sent as `Authorization: Bearer <token>` header
- `bcrypt` for password hashing (never store plain passwords)
- Every task/api-key query filtered by `user_id` — no exceptions, check this in every single query
- No "forgot password" / social login / email verification for MVP — add later. Boring auth is faster and safer than clever auth.

---

## 🏗️ BUILD ORDER — Do It in This Exact Sequence

```
1. Add `user_id` column to tasks table
2. Build auth (signup/login + JWT middleware)                    ← unlocks everything else
3. Scope existing task endpoints to req.userId
4. Build API key encrypt/store endpoint
5. Build Login + Signup pages (frontend)
6. Build Settings page (frontend)
7. Add WebSocket for live task updates (backend + frontend)
8. Build Task Detail page + respond UI (frontend)
9. Swap dummy command → real Claude Code CLI (test on throwaway repo first)
10. Wire in git worktree isolation (already built — just connect it)
11. Beta test with yourself on a real small repo for 2-3 days
```

**Why this order:** Auth comes second because literally nothing else can be properly scoped/secured without it. Real Claude Code integration comes near the end — it's the highest-risk, highest-cost step, so everything around it should be solid first.

---

## ⏱️ Speed Tips (Since You Want This Fast)

- Don't build a fancy auth UI — plain form, no styling polish yet. Polish later.
- Don't add password reset, email verification, or OAuth — boring auth ships faster.
- Reuse the same status-pill/task-list component you already built for the connected dashboard — don't rebuild it.
- Test each backend endpoint with Postman/Invoke-RestMethod BEFORE wiring frontend to it — catches bugs faster than debugging through the UI.
- Skip the diff/merge review screen entirely for now — just prove the full loop (submit → parallel run → notify → respond → done) works with real Claude Code first.

---

## 🚦 MVP "Done" Definition

You're MVP-complete when: **you can sign up, add your API key, submit 2 real coding tasks on a test repo, see them run in parallel, get notified when one needs input, respond to it, and see both finish — entirely through the UI, no manual terminal work.**

That's the finish line. Everything else is v1.1+.