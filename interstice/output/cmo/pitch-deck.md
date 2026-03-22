# Interstice — Pitch Deck

*For HackHayward 2026 | AI-Driven Entrepreneurship Track*

---

## Slide 1: Title

**INTERSTICE**
Voice-to-action AI orchestration for your wrist.

*Speak it. They build it.*

HackHayward 2026 — AI-Driven Entrepreneurship
Veer Saraf & Warren

---

## Slide 2: The Problem

**Running a business alone means doing 5 things at once — badly.**

A solopreneur gets an idea: "I need to understand my competition, build a landing page, and reach out to investors."

Today, that's:
- 45 min researching in ChatGPT
- 30 min copy-pasting findings into an email draft
- 1 hour building a landing page with generic placeholder text
- The landing page doesn't reference the research. The email doesn't cite the market data. Nothing connects.

**The gap between intent and execution is where productivity dies.**

---

## Slide 3: The Insight

**Single AI agents aren't enough. Humane ($700 AI Pin) and Rabbit ($200 R1) proved it — both failed.**

One agent can't research AND write AND build AND call. The same way one employee can't be your analyst, copywriter, developer, and sales rep.

**What if your AI worked like a company — with a CEO and specialist agents?**

---

## Slide 4: The Solution

**Interstice: A multi-agent AI company on your wrist.**

You speak one command into your OMI wearable:
> "Research the AI wearable market, build me a landing page, and draft an investor email."

Your AI CEO decomposes it. Five specialist agents execute simultaneously:

| Agent | Role | Real Output |
|-------|------|------------|
| CEO | Decomposes, delegates, synthesizes | Org-level coordination |
| Research | Web search via Perplexity | Market data, competitive analysis |
| Communications | Email, outreach | Data-driven investor emails |
| Developer | Code, landing pages | Pages built with real research data |
| Call Agent | Real phone calls via ElevenLabs + Twilio | Actual outbound calls |

**Agents share data in real-time.** Research findings flow to Communications and Developer automatically — your landing page uses real market data, your email cites actual competitors.

---

## Slide 5: How It Works (Architecture)

```
Voice (OMI) → CEO Agent → Decomposes into tasks
                              ↓
              ┌────────────┬────────────┬────────────┐
              │            │            │            │
          Research    Communications  Developer   Call Agent
              │            │            │            │
              └──── Findings Channel ───┘            │
                    (real-time data sharing)         │
                              ↓                      │
                    Approval Gates ←─────────────────┘
                    (human confirms actions)
                              ↓
                    CEO Synthesizes → OMI Response
```

**Key technical decisions:**
- **Claude CLI subprocesses** — no API key needed, persistent sessions via `--resume`
- **Convex real-time backend** — all agent state updates are live, no polling
- **Atomic task checkout** — no two agents duplicate work
- **Heartbeat-based execution** — agents wake, work, report, sleep

---

## Slide 6: Live Demo

**Watch it happen in real-time.**

1. Veer speaks into OMI: *"Research the AI wearable market, build a landing page, and draft an investor outreach email."*
2. Dashboard lights up — CEO activates, decomposes into 3 tasks
3. Research, Developer, and Communications agents activate simultaneously
4. Research posts findings → animated data lines flow to Dev and Comms
5. Developer builds a landing page with real market data (not Lorem Ipsum)
6. Communications drafts an investor email citing actual competitive analysis
7. Approval card appears for the email → Veer approves
8. CEO synthesizes: *"Done. Here's what your team built."*

**Then:** *"Call the OMI sponsor table and tell them what we built."*
- Approval card appears → Veer taps Approve
- A real phone rings across the room
- ElevenLabs voice conducts the conversation
- Live transcript streams on the dashboard

---

## Slide 7: The Approval Gate

**AI that acts, but only when you say so.**

Certain actions (sending emails, making calls) require human approval before executing.

- Agent completes work → Approval card appears on dashboard + OMI notification
- You review the email draft, call script, or action details
- Tap Approve or say "approve" into OMI
- Action executes. Or doesn't. You're always in control.

This isn't just a safety feature — it's the difference between an assistant and an autonomous system you trust.

---

## Slide 8: Why OMI

**OMI has 250+ apps. Zero orchestration layers.**

| OMI Today | OMI + Interstice |
|-----------|-----------------|
| Transcribes your speech | Transcribes → decomposes → delegates → executes |
| Single AI assistant responses | Multi-agent coordination with specialist roles |
| Text summaries | Real actions: emails, calls, landing pages, research reports |
| App marketplace with point solutions | One orchestration layer that replaces 5+ apps |

**Market opportunity:** $32B wearable AI market in 2025, growing to $368B by 2035.
OMI is the fastest-growing open-source AI wearable. We're building their missing infrastructure.

---

## Slide 9: Technical Depth

**This is not a prompt chain. This is real orchestration.**

| Feature | Implementation |
|---------|---------------|
| Agent execution | Claude CLI subprocesses with `--resume` session persistence |
| Task queue | Atomic checkout in Convex — no race conditions, no duplicate work |
| Inter-agent comms | Findings channel in Convex — agents read each other's output in real-time |
| Dashboard | React + Convex subscriptions — zero-latency UI updates |
| Skills | Drop-in TypeScript files: `web_search.ts`, `send_email.ts`, `make_call.ts` |
| Approval gates | Convex-backed queue with HTTP action execution |
| Voice I/O | OMI webhook in, proactive notification + TTS out |
| Memory | Company memory accumulates across all agent interactions |

**10 Convex tables. 5 agents. 3 executable skills. Full real-time dashboard. Built in 24 hours.**

---

## Slide 10: Competitive Landscape

| | Interstice | ChatGPT | CrewAI | Humane AI Pin | Rabbit R1 |
|---|---|---|---|---|---|
| Multi-agent | 5 specialists | Single | Framework | Single | Single |
| Voice-first | OMI wearable | No | No | Yes (dead) | Yes |
| Inter-agent comms | Real-time findings | N/A | Sequential | N/A | N/A |
| Real actions | Calls, emails | No | Code only | Limited | Limited |
| Approval gates | Built-in | No | No | No | No |
| Hardware cost | $89 (OMI) | N/A | N/A | $700 (dead) | $199 |
| Open source HW | Yes | No | N/A | No | No |

---

## Slide 11: Team

**Veer Saraf** — Builder. Full-stack engineer. Built the entire system in 24 hours: agent orchestration, Convex backend, real-time dashboard, OMI integration, ElevenLabs+Twilio calling.

**Warren** — Pitch. Product strategy, market positioning, demo narrative.

---

## Slide 12: The Ask

**What we're building:**
The default orchestration layer for voice-first AI hardware — starting with OMI.

**What's next:**
- Launch on OMI app marketplace (250+ apps, zero orchestration competitors)
- Add more specialist agents (Sales, Finance, Ops)
- Expand to other voice-first hardware (Meta glasses, future wearables)
- Build the agent marketplace — let anyone create specialist agents

**What we need:**
- OMI partnership (we fill their biggest ecosystem gap)
- Early adopters who want to run their business from their wrist
- Feedback from builders who see the multi-agent future

---

*Interstice — the gap between intent and execution, now filled.*
