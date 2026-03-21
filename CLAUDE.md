# Interstice — CLAUDE.md

## What Is This Project?

Interstice is a lean AI agent orchestration system built at HackHayward 2026 (March 21-22). It lets you run an AI-powered company by speaking commands through an OMI wearable device. Your AI CEO receives the command, breaks it into tasks, delegates to specialist agents, they execute in parallel — communicating with each other as needed — and the CEO synthesizes results, responding back through your wrist.

The name **Interstice** refers to the small gap between human intent and execution — the space where AI agents now live and work.

Inspired by Paperclip AI (open-source orchestration for zero-human companies), but stripped down and purpose-built for demo-ability and real-world solopreneur use.

---

## Core Concept

You speak → CEO hears → CEO delegates → agents execute + communicate → CEO reports back.

This is NOT a chatbot wrapper. It is a multi-agent orchestration system with:
- A real org chart (CEO delegates down to specialists)
- A heartbeat-based execution model (agents wake, pick up tasks, report back)
- A ticket-based task queue (atomic checkout — no two agents duplicate work)
- **Inter-agent communication** (agents can message each other mid-task — Research feeds Comms, Comms feeds CEO, etc.)
- An approval gate system (certain actions pause for human confirm before executing)
- A drop-in skill system (add a new skill by dropping one TypeScript file)
- A real-time dashboard showing all of this happening live via Convex subscriptions

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | TypeScript + Node.js | Same stack as Paperclip, great Claude subprocess support |
| LLM | Claude CLI (local) | No API key needed — uses `claude --print - --output-format stream-json --resume [sessionId]` |
| Database + Real-time | Convex | Real-time reactive queries, no WebSocket boilerplate, schema as code |
| Frontend | React + Convex client | Agents light up live via Convex subscriptions, no polling |
| Voice In | OMI wearable webhook | Real-time transcript via HTTP webhook |
| Voice Out | OMI proactive notification + ElevenLabs TTS | CEO speaks response back through device + calls |
| Research | Perplexity API | Research agent web search (hackathon credits) |
| Phone Calls | ElevenLabs Conversational AI + Twilio | Call Agent dials numbers and has real voice conversations |
| Hosting | Local + ngrok | OMI webhooks need public URL |

---

## How Agents Run (No API Key Needed)

This is the key technical decision. Agents are Claude CLI subprocesses, not API calls.

```typescript
const proc = spawn("claude", [
  "--print", "-",
  "--output-format", "stream-json",
  "--verbose",
  "--resume", sessionId,          // persists session across heartbeats
  "--append-system-prompt-file", agentSystemPromptPath,
  "--add-dir", skillsDir,         // inject agent's available skills
], { stdio: ["pipe", "pipe", "pipe"] });

proc.stdin.write(prompt);
proc.stdin.end();
```

Output is parsed line-by-line as streaming JSON:
- `system` event → captures `session_id` for next `--resume`
- `assistant` event → LLM output, streamed to Convex activity log in real-time
- `result` event → final output + usage stats

Sessions persist across heartbeats via `--resume [sessionId]` stored in Convex. Agents remember full context between wakeups.

This replicates Paperclip's `claude-local` adapter exactly, in TypeScript.

---

## Agent Structure

### CEO Agent
- **Role:** Receives voice command from OMI. Decomposes into subtasks. Delegates to specialists via task queue. Monitors progress via Convex subscriptions. Synthesizes final response when all tasks complete. Sends response back through OMI + ElevenLabs.
- **Inter-agent comms:** CEO can message any agent mid-task to re-prioritize, add context, or redirect
- **Skills:** `task_decompose`, `delegate`, `synthesize`, `omi_respond`, `read_agent_results`

### Research Agent
- **Role:** Web research, competitive analysis, market summaries, fact-finding. Publishes structured findings to Convex so other agents can read and build on them.
- **Inter-agent comms:** Posts research results to shared message bus. Communications Agent and Developer Agent read these findings to inform their outputs — email uses real data, landing page uses real copy.
- **Skills:** `web_search` (Perplexity API), `summarize`, `format_report`, `post_findings`

### Communications Agent
- **Role:** Email drafting, outreach templates, investor messages, follow-ups. Reads Research Agent output to write data-driven emails.
- **Inter-agent comms:** Reads from Research Agent findings. Reports draft to CEO for review before any send action.
- **Skills:** `draft_email`, `send_email` (requires approval gate), `format_message`, `read_research`

### Developer Agent
- **Role:** Code generation, landing page creation, scaffolding, file output. Uses Research Agent findings to write real copy, not placeholder text.
- **Inter-agent comms:** Reads Research Agent output for copy and market context. Reports generated file paths back to CEO.
- **Skills:** `generate_code`, `write_file`, `create_landing_page`, `read_research`

### Call Agent
- **Role:** Makes outbound phone calls on behalf of the CEO using ElevenLabs Conversational AI + Twilio. Can introduce Interstice, pitch to investors, follow up with leads, conduct research calls.
- **Inter-agent comms:** Receives briefing from CEO (who to call, what to say, goal of call). Reports back call transcript + outcome.
- **Skills:** `make_call` (requires approval gate), `generate_call_script`, `report_call_outcome`

---

## Inter-Agent Communication

Agents don't just run in isolation — they actively share information through a message bus stored in Convex.

**How it works:**
1. Each agent has an `inbox` and `outbox` in Convex
2. CEO posts delegation messages to agent inboxes
3. Agents post results to their outbox + to a shared `findings` channel
4. Other agents can subscribe to the findings channel and incorporate results
5. CEO monitors all outboxes — when all delegated tasks complete, it synthesizes

**Why this matters for the demo:** When you ask for a competitive analysis AND a landing page, the Developer Agent doesn't write generic placeholder copy — it waits for the Research Agent's findings, reads them from Convex, and uses real market data in the landing page. That's agents actually collaborating, not just running in parallel.

---

## Skill System

Skills live in `skills/`. Each skill is one TypeScript file with a standard interface:

```typescript
// skills/web_search.ts
export const skill = {
  name: "web_search",
  description: "Search the web using Perplexity API",
  requiresApproval: false,
  execute: async (input: { query: string }, context: AgentContext): Promise<SkillResult> => {
    // ... implementation
    return { result: "...", sources: [...] };
  }
};
```

To add a new skill: drop a file in `skills/`, register it to an agent. Zero rebuilding of core.

Skills with `requiresApproval: true` (e.g., `send_email`, `make_call`) pause the task queue, show an approval card on the dashboard, and send an OMI notification before executing.

---

## Approval Gates

When an agent hits a skill with `requiresApproval: true`:
1. Task status → `pending_approval` in Convex
2. Dashboard instantly shows approval card (Convex real-time subscription)
3. OMI notification: "Your CEO wants to call [name] at [number]. Say 'approve' or 'deny'."
4. User approves via dashboard button OR speaks "approve" into OMI
5. On approve → task resumes, agent executes the action
6. On deny → task cancelled, CEO notified, CEO communicates alternative plan

---

## Convex Schema (~10 tables)

```typescript
// convex/schema.ts
agents           — agent registry (id, name, role, sessionId, status)
tasks            — task queue (id, agentId, status, input, output, createdAt)
heartbeat_runs   — log of every agent wakeup (runId, agentId, startedAt, completedAt)
activity_log     — immutable audit trail (every action, streaming output from claude)
messages         — inter-agent message bus (from, to, channel, content, readAt)
findings         — shared research/results channel (agentId, content, taskId)
approvals        — approval gate queue (taskId, action, details, status)
goals            — high-level company goals (for context in agent prompts)
sessions         — Claude session IDs per agent (for --resume persistence)
omi_sessions     — active OMI user sessions (uid, sessionId, lastTranscript)
```

---

## OMI Integration

OMI is an open-source AI wearable (by BasedHardware). It transcribes speech in real-time and fires HTTP webhooks.

**Setup:**
1. Register Interstice app on OMI developer console
2. Capabilities: `external_integration`, `proactive_notification`
3. Webhook URL: `https://[ngrok-url]/api/omi/transcript`

**Flow:**
1. User speaks into OMI
2. OMI streams transcript segments to our webhook as speech happens
3. Server buffers segments, detects command completion
4. Full command passed to CEO agent via Convex task insert
5. CEO heartbeat fires, decomposes, delegates
6. Agents execute, communicate via Convex message bus
7. CEO synthesizes when all tasks done
8. Response sent back: OMI proactive notification (text) + ElevenLabs TTS (voice)

**Webhook in:**
```
POST /api/omi/transcript?session_id=xxx&uid=xxx
Body: [{"text": "...", "speaker": "SPEAKER_00", "is_user": true, "start": 10.0}]
```

**Notification out:**
```
POST https://api.omi.me/v2/integrations/{app_id}/notification?uid={uid}&message={response}
Authorization: Bearer <APP_SECRET>
```

---

## ElevenLabs + Twilio — Call Agent

The Call Agent uses ElevenLabs Conversational AI to conduct real phone calls.

**How it works:**
1. CEO delegates: "Call [name] at [number] and pitch Interstice"
2. Call Agent generates a call script from context (using Research Agent findings if relevant)
3. Approval gate fires — shows on dashboard + OMI notification
4. On approve: Twilio initiates outbound call, ElevenLabs voice takes over
5. ElevenLabs Conversational AI conducts the call using the script as context
6. Call transcript posted back to Convex findings channel
7. CEO summarizes outcome and reports back through OMI

**Demo moment:** Mid-demo, speak into OMI: "Call the OMI sponsor table and tell them what we built." Approval card appears on dashboard. Hit approve. A real call goes out. Judges lose their minds.

---

## Dashboard (React + Convex)

No WebSocket setup needed — Convex subscriptions give real-time reactivity out of the box.

**Components:**
- **Org chart** — CEO at top, agents below with connecting lines showing active delegation. Agents glow when their heartbeat is running. Message lines animate between agents when inter-agent comms happen.
- **Task board** — Kanban: Incoming → Delegated → In Progress → Pending Approval → Done
- **Activity feed** — Streaming Claude output per agent, live as it happens
- **Message bus visualizer** — Shows inter-agent messages flowing in real-time (Research → Dev, Research → Comms, etc.)
- **Approval queue** — Cards for pending actions with full context + Approve/Deny
- **Results panel** — Final outputs: research reports, drafted emails, generated code, call transcripts

---

## What We Took from Paperclip AI

- Heartbeat-based agent execution model
- Claude CLI subprocess runner with session persistence (`--resume`)
- Atomic task checkout (prevents double-work)
- Skill injection via `--add-dir`
- Activity audit log
- Org chart delegation hierarchy
- TypeScript stack

## What We Deliberately Skipped

- Multi-tenancy (one company, one user)
- Full auth system (JWT, permissions, invites)
- 60+ database tables → ~10 Convex tables
- Full plugin sandboxing (simplified to `skills/` dir with standard interface)
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
**Sponsors leveraged:** OMI (hardware + sponsor), Perplexity (research agent), ElevenLabs (call agent voice)

---

## The Demo

**Setup:** Veer walks up to judges. OMI on his wrist. Dashboard live on screen. Two windows: the org chart on the left, the activity feed + task board on the right.

**Command 1 — Multi-agent research + build:**
> "I need a competitive analysis of the AI wearable market, a landing page for Interstice, and draft an outreach email to potential investors."

What judges watch happen in real-time:
1. OMI receives the transcript. Dashboard shows command arriving.
2. **CEO activates** — glows on org chart. Activity feed shows CEO thinking: decomposing into 3 tasks.
3. CEO delegates: Research gets "competitive analysis", Developer gets "landing page", Comms gets "investor email". Three task cards appear on board simultaneously.
4. **All three agents activate** — org chart lights up. Delegation lines animate from CEO to each agent.
5. **Research Agent** starts searching — activity feed shows Perplexity queries firing, results coming back, Claude synthesizing.
6. Research Agent posts findings to the shared channel. **Message lines animate** on the org chart from Research → Developer and Research → Comms. This is the moment judges see agents actually talking to each other.
7. **Developer Agent** reads the research findings and builds the landing page using real market data — not placeholder copy.
8. **Communications Agent** reads the research findings and writes a data-driven investor email referencing the actual competitive landscape.
9. All three task cards flip to Done. **CEO synthesizes** — reads all three outputs.
10. OMI buzzes. CEO responds: *"Done. Research shows OMI leads hardware but has no orchestration layer — that's our wedge. Landing page is live at /output/index.html. Investor email drafted and waiting for your approval before sending."*
11. **Approval card appears** on dashboard for the email send. Veer says "approve" into OMI. Email sends.

**Command 2 — The call (if ElevenLabs is ready):**
> "Call the OMI sponsor table and tell them what we built."

1. Call Agent activates. Generates script from context.
2. Approval card appears: "Call [number] — script ready. Approve?"
3. Veer taps Approve on dashboard.
4. **A real phone rings at the OMI sponsor table across the room.**
5. ElevenLabs voice: "Hi, this is Interstice — an AI orchestration system built on OMI at this hackathon. Our CEO asked me to reach out..."
6. Call transcript streams live into the dashboard.

The judges have never seen a hackathon project make a real phone call mid-demo.

---

## Commit Convention

Every completed feature phase gets a commit + push:
```
feat(core): add Convex schema and agent registry
feat(runner): implement Claude CLI subprocess runner with session persistence
feat(orchestration): add heartbeat scheduler and atomic task queue
feat(agents): implement CEO agent with task decomposition and delegation
feat(comms): add inter-agent message bus via Convex findings channel
feat(omi): add transcript webhook and proactive notification endpoint
feat(skills): add web_search, draft_email, generate_code, make_call skills
feat(approval): add approval gate system with OMI voice confirm
feat(dashboard): add real-time org chart, task board, activity feed
feat(call-agent): integrate ElevenLabs + Twilio for outbound calls
fix: polish demo flow end-to-end
```

---

## Build Order

1. Convex schema + project scaffold (TypeScript + Next.js or Vite React)
2. Claude CLI subprocess runner (TypeScript, replicating claude-local adapter)
3. Heartbeat scheduler + atomic task queue + agent registry in Convex
4. Inter-agent message bus (Convex messages + findings tables)
5. Approval gate system
6. Skill system (`skills/` dir + loader + `requiresApproval` flag)
7. CEO agent (OMI in → decompose → delegate → monitor → synthesize → OMI out)
8. Research Agent (Perplexity search → post to findings)
9. Communications Agent (read findings → draft email → approval gate on send)
10. Developer Agent (read findings → generate landing page)
11. Call Agent (ElevenLabs + Twilio → approval gate → make call → transcript back)
12. React dashboard (org chart with live message animations, task board, activity feed, approvals, results)
13. End-to-end demo polish
