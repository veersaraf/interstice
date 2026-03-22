# Interstice

**Run your AI company from your wrist.**

Interstice is a multi-agent AI orchestration system that turns spoken commands into coordinated action. Speak into an [OMI](https://omi.me) wearable, and your AI CEO decomposes the task, delegates to specialist agents, they execute in parallel — communicating with each other as needed — and the CEO synthesizes results, responding back through your wrist.

Built at **HackHayward 2026** (March 21-22) at Cal State East Bay.

**Track:** AI-Driven Entrepreneurship

---

## The Problem

Solo founders and solopreneurs juggle research, outreach, development, and communications simultaneously. Existing AI tools are single-purpose chatbots that require constant manual input and don't coordinate with each other. There's no way to say one thing and have an entire team execute on it.

## The Solution

Interstice fills the gap between human intent and execution. One voice command triggers a full organizational response:

1. **You speak** into the OMI wearable
2. **AI CEO** receives the command and decomposes it into subtasks
3. **Specialist agents** (Research, Communications, Developer, Call) execute in parallel
4. **Agents communicate** with each other mid-task — Research findings feed into emails and landing pages
5. **CEO synthesizes** all results and responds back through your wrist

This is not a chatbot wrapper. It's a real multi-agent system with an org chart, a task queue, inter-agent communication, approval gates, and persistent memory.

---

## Key Features

- **Voice-First Interface** — Speak commands through OMI wearable, get responses back through voice (ElevenLabs TTS)
- **Multi-Agent Orchestration** — CEO delegates to Research, Communications, Developer, and Call agents with real task decomposition
- **Inter-Agent Communication** — Agents share findings via a Convex message bus. Research data flows into emails and landing pages automatically
- **Approval Gates** — High-stakes actions (sending emails, making calls) pause for human approval via dashboard or voice
- **Persistent Memory** — Agents remember full context across sessions via Claude CLI `--resume`
- **Real Phone Calls** — Call Agent dials real numbers using ElevenLabs Conversational AI + Twilio
- **Live Dashboard** — Real-time org chart, task board, activity feed, and approval queue powered by Convex subscriptions
- **Drop-in Skill System** — Add new agent capabilities by dropping a single TypeScript file into `skills/`

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│  OMI Device  │────>│  Webhook Server (/api/omi/transcript)            │
└─────────────┘     └──────────────────┬───────────────────────────────┘
                                       │
                                       v
                              ┌────────────────┐
                              │    CEO Agent    │
                              │  (Decompose &   │
                              │   Delegate)     │
                              └───┬────┬────┬───┘
                                  │    │    │
                    ┌─────────────┘    │    └─────────────┐
                    v                  v                  v
             ┌────────────┐   ┌────────────┐    ┌────────────────┐
             │  Research   │   │ Developer  │    │ Communications │
             │   Agent     │   │   Agent    │    │     Agent      │
             └─────┬───────┘   └─────┬──────┘    └───────┬────────┘
                   │                 │                    │
                   └────> Findings Channel <─────────────┘
                          (Convex real-time)
                                  │
                                  v
                         ┌────────────────┐
                         │  Call Agent    │
                         │ (ElevenLabs + │
                         │   Twilio)     │
                         └────────────────┘
```

### How Agents Run

Agents are **Claude CLI subprocesses**, not API calls — no API key needed:

```bash
claude --print - --output-format stream-json --resume <sessionId> \
  --append-system-prompt-file <agentPrompt> --add-dir skills/
```

Sessions persist across heartbeats via `--resume`, giving agents persistent memory across wakeups.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 | Dashboard with real-time Convex subscriptions |
| Backend | Convex | Real-time database, reactive queries, schema-as-code |
| LLM Runtime | Claude CLI (local) | Agent execution with session persistence |
| Voice Input | OMI Wearable | Real-time speech transcription via webhook |
| Voice Output | ElevenLabs TTS | CEO speaks responses back through device |
| Phone Calls | ElevenLabs Conversational AI + Twilio | Outbound voice calls |
| Web Research | Perplexity API | Research agent deep search |
| UI Components | Radix UI + Tailwind CSS | Accessible, styled component library |

---

## Project Structure

```
interstice/
├── src/
│   ├── app/              # Next.js app router (pages, API routes)
│   │   └── api/          # Webhook endpoints (OMI, commands, approvals)
│   └── components/       # React dashboard components
├── convex/
│   └── schema.ts         # 10-table Convex schema (agents, tasks, messages, etc.)
├── agents/               # Agent system prompts (CEO, Research, Comms, Dev, Call)
├── skills/               # Drop-in skill files (web_search, send_email, make_call)
├── lib/
│   ├── claude-runner.ts  # Claude CLI subprocess runner with streaming JSON
│   ├── heartbeat.ts      # Heartbeat scheduler for agent wakeups
│   ├── agent-runner.ts   # Agent execution orchestration
│   └── omi.ts            # OMI webhook integration
├── memory/               # Shared company memory
└── output/               # Generated artifacts from agent runs
```

---

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Claude CLI** installed and authenticated (`claude` available in PATH)
- **Convex account** (free tier works) — [convex.dev](https://convex.dev)
- **ngrok** (for exposing local webhook to OMI)

### Optional (for full feature set)

- **OMI wearable device** — for voice input/output
- **Perplexity API key** — for Research Agent web search
- **ElevenLabs API key** — for voice responses and phone calls
- **Twilio account** — for outbound phone calls
- **SMTP credentials** — for Communications Agent email sending

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/interstice.git
cd interstice/interstice
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Convex

```bash
npx convex dev
```

This will prompt you to create a Convex project and start the local development backend. Keep this terminal running.

### 4. Configure environment variables

Create a `.env.local` file in the `interstice/` directory:

```env
# Convex (auto-configured by npx convex dev)
CONVEX_DEPLOYMENT=<your-deployment>
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Perplexity (Research Agent)
PERPLEXITY_API_KEY=<your-key>

# ElevenLabs (Voice + Call Agent)
ELEVENLABS_API_KEY=<your-key>
ELEVENLABS_AGENT_ID=<your-agent-id>

# Twilio (Call Agent)
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-number>

# OMI (Wearable integration)
OMI_APP_ID=<your-app-id>
OMI_APP_SECRET=<your-secret>

# Email (Communications Agent)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-password>
```

### 5. Seed the agent registry

```bash
npm run seed
```

This populates Convex with the 5 default agents (CEO, Research, Communications, Developer, Call).

### 6. Start the development server

In a new terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

### 7. Start the heartbeat scheduler

In another terminal:

```bash
npm run heartbeat
```

This starts the agent heartbeat loop that wakes agents to check for and execute tasks.

### 8. (Optional) Expose webhook for OMI

```bash
ngrok http 3000
```

Copy the public URL and configure it as the webhook endpoint in the OMI developer console:
`https://<your-ngrok-url>/api/omi/transcript`

---

## Usage

### Via Dashboard

Navigate to `http://localhost:3000` and use the command input to type or speak commands to the CEO agent. Watch agents activate in real-time on the org chart.

### Via OMI Wearable

With the webhook configured, speak into your OMI device. The transcript is sent to the CEO, who decomposes and delegates automatically.

### Example Commands

- "Do a competitive analysis of the AI wearable market"
- "Draft an outreach email to potential investors"
- "Build me a landing page for Interstice"
- "Call [name] at [number] and pitch our product"

---

## Agents

| Agent | Role | Skills |
|-------|------|--------|
| CEO | Receives commands, decomposes tasks, delegates, synthesizes results | `task_decompose`, `delegate`, `synthesize`, `omi_respond` |
| Research | Web search, competitive analysis, market research | `web_search` (Perplexity API) |
| Communications | Email drafting, outreach, investor messaging | `draft_email`, `send_email` (requires approval) |
| Developer | Code generation, landing pages, file output | `generate_code`, `create_landing_page` |
| Call | Outbound phone calls with AI voice | `make_call` (requires approval), `generate_call_script` |

---

## Judging Criteria Alignment

| Criteria | How Interstice Addresses It |
|----------|---------------------------|
| **Problem & Value** | Solo founders can't coordinate multiple business functions simultaneously. Interstice lets one person run an entire company through voice. |
| **Technical Execution** | Real multi-agent orchestration with persistent sessions, atomic task queue, inter-agent message bus, and streaming output — not a wrapper around a single LLM call. |
| **AI Depth & Integration** | 5 specialized AI agents with distinct roles, inter-agent communication, persistent memory across sessions, approval gates, and real-world integrations (phone calls, email, web research). |
| **Entrepreneurial Strength** | Clear target market (solopreneurs), defensible moats (persistent memory, agent communication, wearable-native), and a scalable platform model. |
| **Presentation** | Live demo where agents activate in real-time, communicate with each other visibly, and make actual phone calls mid-presentation. |
| **UX/UI** | Warm, retro-futuristic design with agent characters, real-time org chart, and voice-first interaction through a wearable. |

---

## Team

- **Veer Saraf** — Builder (architecture, agents, backend, frontend, integrations)
- **Warren Kalvakota** — Pitch (business narrative, market positioning, presentation)

---

## Built With

- [Claude CLI](https://claude.ai) — Local LLM agent runtime
- [Convex](https://convex.dev) — Real-time backend
- [Next.js](https://nextjs.org) — React framework
- [OMI](https://omi.me) — AI wearable device
- [Perplexity](https://perplexity.ai) — Web research API
- [ElevenLabs](https://elevenlabs.io) — Voice AI and phone calls
- [Twilio](https://twilio.com) — Phone infrastructure
- [Radix UI](https://radix-ui.com) — Accessible UI components
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS

---

## License

Built for HackHayward 2026. MIT License.
