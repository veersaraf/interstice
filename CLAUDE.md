# Interstice — CLAUDE.md

## What Is This Project?

Interstice is a lean AI agent orchestration system built at HackHayward 2026 (March 21-22). It lets you run an AI-powered company by speaking commands through an OMI wearable device. Your AI CEO receives the command, breaks it into tasks, delegates to specialist agents, they execute in parallel, and the CEO synthesizes results — responding back through your wrist.

The name **Interstice** refers to the small gap between human intent and execution — the space where AI agents now live and work.

Inspired by Paperclip AI (open-source orchestration for zero-human companies), but stripped down and purpose-built for demo-ability and real-world solopreneur use.

---

## Core Concept

You speak → CEO hears → CEO delegates → agents execute → CEO reports back.

This is NOT a chatbot wrapper. It is a multi-agent orchestration system with:
- A real org chart (CEO delegates down to specialists)
- A heartbeat-based execution model (agents wake, pick up tasks, report back)
- A ticket-based task queue (atomic checkout — no two agents duplicate work)
- An approval gate system (certain actions pause for human confirm)
- A drop-in skill system (add a new skill by dropping one Python file)
- A real-time dashboard showing all of this happening live

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Python FastAPI | Fast to build, great subprocess/async support |
| LLM | Claude CLI (local) | No API key needed — uses `claude --print - --output-format stream-json --resume [sessionId]` |
| Database | SQLite + WebSockets | Real-time dashboard without cloud dependency |
| Frontend | React | Org chart + task board + activity feed + approval queue |
| Voice In | OMI wearable webhook | Real-time transcript via HTTP webhook |
| Voice Out | OMI proactive notification | CEO speaks response back to user |
| Research | Perplexity API | Research agent web search (hackathon credits) |
| Hosting | Local + ngrok | OMI webhooks need public URL |

---

## How Agents Run (No API Key Needed)

This is the key technical decision. Agents are Claude CLI subprocesses, not API calls.

```python
subprocess.run([
    "claude", "--print", "-",
    "--output-format", "stream-json",
    "--verbose",
    "--resume", session_id,  # persists session across heartbeats
    "--append-system-prompt-file", agent_system_prompt_path,
    "--add-dir", skills_dir,  # inject agent's skills
], input=prompt, capture_output=True, text=True)
```

Output is parsed line-by-line as streaming JSON. Each line is an event: `system` (init, gives session_id), `assistant` (LLM output), `result` (final, with usage stats).

Sessions persist across heartbeats via `--resume [sessionId]`. Agents remember context between wakeups.

This is exactly how Paperclip's `claude-local` adapter works. We replicated it in Python.

---

## Agent Structure

### CEO Agent
- **Role:** Receives voice command from OMI. Decomposes into subtasks. Delegates to specialists via task queue. Monitors progress. Synthesizes final response. Sends back through OMI.
- **System prompt:** You are the CEO of a one-person AI company. Your job is to take high-level commands and break them into concrete tasks for your team.
- **Skills:** task_decompose, delegate, synthesize, omi_respond

### Research Agent
- **Role:** Web research, competitive analysis, market summaries, fact-finding
- **System prompt:** You are a research analyst. When given a task, you search the web thoroughly and return structured, cited findings.
- **Skills:** web_search (Perplexity API), summarize, format_report

### Communications Agent
- **Role:** Email drafting, outreach templates, investor messages, follow-ups
- **System prompt:** You are a communications specialist. You write clear, compelling emails and messages on behalf of the company.
- **Skills:** draft_email, send_email (requires approval gate), format_message

### Developer Agent
- **Role:** Code generation, landing page creation, scaffolding, file output
- **System prompt:** You are a software developer. When given a task, you write clean, working code and save it to the appropriate files.
- **Skills:** generate_code, write_file, create_landing_page

---

## Skill System

Skills live in `skills/`. Each skill is one Python file with a standard interface:

```python
# skills/web_search.py
SKILL_NAME = "web_search"
SKILL_DESCRIPTION = "Search the web using Perplexity API"
REQUIRES_APPROVAL = False

def execute(query: str, context: dict) -> dict:
    # ... implementation
    return {"result": "...", "sources": [...]}
```

To add a new skill: drop a file in `skills/`. Agents pick it up automatically via `--add-dir`.

Skills that require approval (e.g., `send_email`, `make_call`) set `REQUIRES_APPROVAL = True`. The task pauses, an approval request appears on the dashboard and/or OMI, and resumes on confirm.

---

## Approval Gates

When an agent wants to execute a skill with `REQUIRES_APPROVAL = True`:
1. Task status → `pending_approval`
2. Dashboard shows approval card with action details
3. OMI notification sent: "Your CEO wants to send an email to X. Say 'approve' or 'deny'."
4. On approve → task status → `approved` → agent resumes
5. On deny → task status → `cancelled` → CEO notified

---

## Database Schema (~10 tables)

```
agents           — agent registry (CEO, Research, Comms, Dev)
tasks            — task queue (id, agent_id, status, input, output, created_at)
heartbeat_runs   — log of every agent wakeup
activity_log     — immutable audit trail (every action, every agent)
messages         — inter-agent communication
approvals        — approval gate queue
goals            — high-level goals (optional, for demo context)
sessions         — Claude session IDs per agent (for --resume)
```

---

## OMI Integration

OMI is a wearable AI device (by BasedHardware). It transcribes speech in real-time and sends it to a registered webhook.

**Flow:**
1. Register app on OMI developer console with capability: `external_integration`, `proactive_notification`
2. Set webhook URL to `https://[ngrok-url]/api/omi/transcript`
3. OMI sends POST with transcript segments as user speaks
4. Our server buffers segments, detects end of command (silence or punctuation)
5. Passes complete command to CEO agent
6. CEO processes, agents execute
7. When done, POST to OMI notification API: CEO's response is spoken back to user

**Webhook in:**
```
POST /api/omi/transcript?session_id=xxx&uid=xxx
Body: [{"text": "...", "speaker": "SPEAKER_00", "is_user": true}]
```

**Notification out:**
```
POST https://api.omi.me/v2/integrations/{app_id}/notification?uid={uid}&message={ceo_response}
Authorization: Bearer <APP_SECRET>
```

---

## Dashboard (React)

Real-time via WebSocket connection to backend.

**Components:**
- **Org chart** — CEO at top, 3 agents below. Agents pulse/glow when active.
- **Task board** — Kanban: Incoming → Delegated → In Progress → Done
- **Activity feed** — Live scrolling log of what each agent is doing
- **Approval queue** — Cards for pending approvals with Approve/Deny buttons
- **Results panel** — Output of completed tasks (research reports, drafted emails, generated code)

---

## What We Took from Paperclip AI

- Heartbeat-based agent execution model
- Claude CLI subprocess runner with session persistence (`--resume`)
- Atomic task checkout (prevents double-work)
- Skill injection via `--add-dir`
- Activity audit log
- Org chart delegation hierarchy

## What We Deliberately Skipped

- Multi-tenancy (one company, one user)
- Full auth system (JWT, permissions, invites)
- 60+ database tables → ~10
- Full plugin sandboxing (simplified to `skills/` dir)
- Budget hard-cap enforcement
- 7 agent adapters (just claude-local)
- Company portability / export
- E2E test suites

---

## Hackathon Context

**Event:** HackHayward 2026, Cal State East Bay, March 21-22
**Track:** AI-Driven Entrepreneurship
**Team:** Veer Saraf (builder), Warren (pitch)
**Judging criteria:** Problem & Value, Technical Execution, AI Depth & Integration, Entrepreneurial Strength, Presentation, UX/UI
**Target prizes:** 1st place (AI-Driven Entrepreneurship), Best AI Depth & Integration

**Sponsors we're leveraging:** OMI (hardware), Perplexity (research agent), ElevenLabs (stretch: voice synthesis)

**Demo script:**
1. Walk up to judges with OMI on wrist, dashboard on screen
2. Say: "I need a competitive analysis of the AI wearable market and a landing page for Interstice"
3. Dashboard shows CEO activate → delegates to Research Agent + Developer Agent
4. Both agents pulse on org chart, tasks appear on board
5. Research Agent searches and returns structured analysis
6. Developer Agent writes and saves a landing page
7. CEO synthesizes and responds through OMI: "Done. Research is ready, landing page is at index.html. Want me to draft an investor email based on the research?"
8. Show dashboard: task board all green, activity feed showing every step, results in panel

---

## Stretch Goals (do after core is working)

- [ ] ElevenLabs TTS: CEO speaks responses through laptop/speaker, not just OMI notification
- [ ] Phone calls: CEO can call a number via Twilio + ElevenLabs and have a conversation
- [ ] Live hosted version (Railway or Fly.io)

---

## Commit Convention

Every completed feature gets a commit:
```
feat(core): add heartbeat scheduler and task queue
feat(agents): implement CEO agent with task decomposition
feat(omi): add transcript webhook + notification endpoint
feat(dashboard): add real-time org chart with WebSocket
fix(agents): handle session resume on cold start
```

---

## Build Order

1. Project scaffold + database schema
2. Claude CLI subprocess runner (claude-local equivalent)
3. Heartbeat scheduler + task queue + agent registry
4. Approval gate system
5. Skill system (`skills/` directory + loader)
6. CEO agent (OMI webhook in → decompose → delegate → synthesize → OMI out)
7. Research Agent (Perplexity search)
8. Communications Agent (email draft)
9. Developer Agent (code/landing page gen)
10. React dashboard (org chart, task board, approvals, activity feed, results)
11. End-to-end demo polish
