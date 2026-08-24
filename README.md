# Interstice

_Speak a command to a wearable, and a team of AI agents researches, writes, and reaches out — then reports back to your wrist._

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status: prototype](https://img.shields.io/badge/status-prototype-orange.svg)

Interstice is a voice-driven multi-agent orchestration system: an AI "CEO" agent receives a spoken command through an [OMI](https://omi.me) wearable, decomposes it into subtasks, delegates them to specialist agents that run as CLI subprocesses and coordinate through a shared task queue, then synthesizes the results and speaks them back.

It was built at HackHayward 2026. The name refers to the *interstice* — the gap between human intent and execution — which is the space the agents are meant to fill.

> [!NOTE]
> This is a hackathon prototype, not a maintained product. It runs, but it expects several external accounts and CLIs to be configured, and some safety features (approval gates) are bypassed in the demo path. See [Status](#status) before relying on it.

---

## What it does

- **Turns a spoken sentence into delegated work.** An OMI transcript webhook buffers your speech, waits for a wake word (`interstice` / `hey interstice` / `steve`), and creates a task for the CEO agent. You can also submit commands over HTTP (`POST /api/command`) or from the dashboard.
- **Decomposes and delegates.** The CEO agent emits JSON describing subtasks and which specialist should own each one. The orchestrator creates those child tasks and dispatches them.
- **Runs a fixed roster of specialists** — Research, Content, Outreach, and Analytics — each with its own system prompt and tool permissions.
- **Passes data between agents.** Every specialist posts its output to a shared *findings* channel in the database. Downstream agents read sibling findings before they run, so Content and Outreach build on what Research produced rather than starting from scratch.
- **Orders work by dependency.** Research (a data *producer*) runs first; Content and Outreach (data *consumers*) wait until Research has actually posted findings; Analytics runs last, after every sibling has finished.
- **Executes real side effects through skills** — Perplexity web search, Bland AI outbound phone calls, email via Resend/SMTP, OpenAI image generation for slideshows, social drafts via Postiz, product-page scraping, and GitHub-based repo analysis.
- **Speaks the result back.** If a command came from OMI, the CEO's synthesized answer is pushed back to the device as a notification.
- **Shows all of it live.** A Next.js dashboard subscribes to the backend and renders the org chart, task board, activity feed, findings, and an approval queue in real time.
- **Persists a running memory.** Agent outputs are appended to `memory/company.md` and stored in the database, and that memory is injected into future prompts.

---

## Architecture

Interstice is three cooperating pieces around a realtime database:

```
                 ┌─────────────────────────────┐
  OMI wearable   │  Next.js app (src/app)       │
  ── speech ──►  │  • /api/omi/transcript       │        ┌──────────────────┐
                 │  • /api/command              │◄──────►│  Convex           │
  ◄─ wrist ───   │  • /api/approve              │  live  │  (realtime DB +   │
   notification  │  • dashboard UI              │  subs  │   query/mutation) │
                 └─────────────────────────────┘        └──────────────────┘
                                                                  ▲
                                                                  │ poll every 4s
                                                          ┌───────┴──────────┐
                                                          │ Heartbeat server │
                                                          │ (lib/server.ts)  │
                                                          │ • claims tasks   │
                                                          │ • spawns agents  │
                                                          │ • runs skills    │
                                                          └───────┬──────────┘
                                                                  │ spawn subprocess
                                                          ┌───────┴──────────┐
                                                          │  Agent CLI       │
                                                          │  (per task)      │
                                                          └──────────────────┘
```

**1. The dashboard + API (`src/app`)** — a Next.js app. Its API routes are the ingress points: the OMI transcript webhook, the `/api/command` HTTP endpoint, and the `/api/approve` endpoint. Every page reads from Convex over live subscriptions, so the UI updates as agents work.

**2. Convex (`convex/`)** — the realtime backend and single source of truth. It holds the agent registry, the task queue (with parent/child hierarchy and atomic claiming), inter-agent messages, the findings channel, approvals, an activity log, agent session IDs, company goals, contacts, and OMI session state. The schema is in `convex/schema.ts`.

**3. The heartbeat server (`lib/server.ts` → `lib/heartbeat.ts`)** — a long-running Node process. Every ~4 seconds it:
1. recovers any tasks orphaned by a previous crash,
2. pulls pending tasks and sorts them by role dependency (producers → consumers → final),
3. atomically claims a task and spawns a single agent subprocess for it (concurrency is capped at one),
4. injects context into the prompt — the task, company memory, sibling findings, active goals, and known contacts,
5. handles the result: CEO output is parsed as either a delegation (creates child tasks) or a direct/synthesis response; specialist output is posted to findings and appended to company memory; Outreach output can trigger real calls/emails,
6. triggers CEO synthesis once all children of a parent task are done, and routes that synthesis back to OMI if the command originated there.

**Agents are CLI subprocesses, not API calls.** Each agent run spawns a coding-agent CLI in non-interactive mode (`<cli> exec --json`), streams back JSON events, and can resume a prior session via a stored session ID so an agent picks up where it left off. An adapter layer (`lib/agent-runner.ts`) abstracts the backend behind a common interface.

The current code runs the **`codex` CLI with model `gpt-5.3-codex`** for every agent. You must have the `codex` CLI installed and authenticated for agents to run.

**Skills (`skills/`)** are standalone TypeScript files, each runnable on its own (`npx tsx skills/<name>.ts ...`) and importable by the heartbeat. Adding a capability means dropping in one file. Current skills: `web_search` (Perplexity), `bland_call` (Bland AI), `send_email` (Resend or SMTP), `generate_images` (OpenAI `gpt-image-1`), `postiz_post`, `scrape_product`, `macroscope_analyze` (GitHub API), and `airbyte_fetch`. `lib/auth0-vault.ts` provides OAuth token brokering for skills that need third-party tokens.

### The agent roster

| Agent | Role | Responsibility |
|-------|------|----------------|
| `ceo` | Chief Executive | Receives commands, decomposes them into subtasks as JSON, delegates, and synthesizes the final answer. |
| `research` | Research Analyst | Web research and competitive analysis via Perplexity. Runs first; others depend on its findings. |
| `content` | Content Creator | Turns research into marketing content — slideshows, social posts, landing pages, email copy. |
| `outreach` | Outreach Specialist | Personalized emails and Bland AI phone calls; lead tracking. |
| `analytics` | Analytics | Runs last; reviews channel performance across the completed work. |

Each agent's system prompt lives in `interstice/agents/<name>.md`. The roster is seeded into Convex via `npm run seed`.

---

## Getting started

> The Next.js app lives in the **`interstice/`** subdirectory of this repository, so all commands below run from there.

### Prerequisites

- **Node.js 20+**
- A **Convex** account (`npx convex dev` will prompt you to log in and provision a deployment)
- The **[Codex CLI](https://github.com/openai/codex)**, installed and authenticated — agents will not run without it
- API keys for whichever skills you want to exercise (see [Configuration](#configuration)). With no keys, skills fall back to log-only / no-op behavior where possible.
- For voice: an **OMI** device + app, and a public tunnel (e.g. ngrok) so OMI can reach your local webhook.

### Install and run

```bash
git clone https://github.com/veersaraf/interstice
cd interstice/interstice        # the Next.js app lives one level down

npm install

# 1. Provision the Convex backend (writes NEXT_PUBLIC_CONVEX_URL to .env.local)
npx convex dev                  # leave running, or run once to set up

# 2. Seed the agent roster (CEO + 4 specialists)
npm run seed

# 3. Start the dashboard
npm run dev                     # http://localhost:3000

# 4. In a second terminal, start the orchestration engine
npm run heartbeat               # polls Convex, spawns agents
```

You need **three things running** for the full loop: `convex dev`, `npm run dev`, and `npm run heartbeat`.

### Connecting OMI (voice)

1. Expose your local server: `ngrok http 3000`.
2. In the OMI developer console, register the transcript webhook at `https://<your-ngrok-url>/api/omi/transcript` with the `external_integration` and `proactive_notification` capabilities.
3. Set `OMI_APP_ID` (and optionally `OMI_APP_SECRET`) in `.env.local` so responses can be pushed back to the device.
4. Say a command beginning with the wake word — e.g. *"Interstice, research the top three competitors in AI wearables. Over."* The `over` acts as an end marker; without it the parser falls back to sentence-boundary detection.

---

## Usage example

Without any hardware, drive the whole pipeline over HTTP:

```bash
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "Research the top 3 competitors for a smart stapler and draft a TikTok slideshow about ours."}'
# → { "taskId": "...", "status": "pending" }
```

What happens next, visible live on the dashboard:

1. The **CEO** claims the task and emits a delegation like
   `{"tasks":[{"agent":"research","input":"..."},{"agent":"content","input":"..."}]}`.
2. **Research** runs first, calls Perplexity, and posts findings to the shared channel.
3. **Content** waits until those findings exist, then writes the slideshow copy — auto-generating images via OpenAI when the output is TikTok-style, and writing artifacts to `output/`.
4. Once all children finish, the **CEO** synthesizes a summary. If the command came from OMI, that summary is spoken back to your wrist.

Generated artifacts land in `interstice/output/` (the repo includes a sample, `output/staplers.html`).

---

## Configuration

All config is via `.env.local` inside `interstice/` (git-ignored). Copy the table below into that file.

**Required:**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL (written by `npx convex dev`). The heartbeat exits without it. |

**Optional — enable per skill/feature (each degrades gracefully when unset):**

| Variable(s) | Enables |
|-------------|---------|
| `OMI_APP_ID`, `OMI_APP_SECRET` | Pushing CEO responses back to the OMI device |
| `PERPLEXITY_API_KEY` | Research web search |
| `BLAND_API_KEY` | Outbound phone calls |
| `RESEND_API_KEY` *or* `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` | Sending email (Resend preferred, SMTP fallback, log-only if neither) |
| `OPENAI_API_KEY` | Slideshow image generation (`gpt-image-1`) |
| `POSTIZ_API_KEY`, `POSTIZ_API_URL`, `POSTIZ_INTEGRATION_ID` | Social media drafts |
| `AIRBYTE_CLIENT_ID`, `AIRBYTE_CLIENT_SECRET`, `AIRBYTE_API_URL` | External data pulls |
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_M2M_CLIENT_ID`, `AUTH0_M2M_CLIENT_SECRET`, `AUTH0_AUDIENCE` | OAuth token vault for skills |
| `GITHUB_TOKEN` | Higher rate limits / private repos for `macroscope_analyze` |
| `CODEX_BIN` | Override the path to the `codex` CLI binary |

---

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI primitives, `lucide-react`, `react-markdown`.
- **Backend / realtime data:** Convex.
- **Orchestration:** a standalone Node process run via `tsx`, spawning coding-agent CLI subprocesses (`codex`, `gpt-5.3-codex`).
- **Skills / integrations:** Perplexity, Bland AI, OpenAI, Resend / Nodemailer, Postiz, Airbyte, Auth0, GitHub API.
- **Voice hardware:** OMI wearable (transcript webhook in, notification out).
- **Language:** TypeScript throughout.

---

## Status

Interstice is a **HackHayward 2026 prototype**. It works end to end, but be aware of the following before building on it:

- **No automated tests.** Correctness is currently demonstrated by running the live demo.
- **Approval gates are bypassed in the demo path.** The schema, dashboard approval queue, `/api/approve` route, and even voice approve/deny all exist — but the heartbeat currently **auto-executes** Outreach actions (real emails and phone calls) without waiting for approval. Re-enabling them is a one-block change in `lib/heartbeat.ts`. Treat outbound side effects with care until then.
- **Agent memory across restarts is partial.** Session IDs are stored for resume, but the heartbeat clears them on startup, so cross-restart continuity relies on `memory/company.md` and the Convex findings/activity history rather than live agent sessions.
- **Repository layout is nested.** The app that runs is in `interstice/`. Older copies of `agents/`, `convex/`, `lib/`, and `memory/` also sit at the repo root and are not what the dashboard uses.
- **Perplexity integration** uses the standard `chat/completions` endpoint (`skills/web_search.ts`).

## License

MIT — see [`LICENSE`](./LICENSE).
