# Interstice — Positioning, Marketing & Product-Market Fit

## The One-Liner

> **"Interstice is an AI company on your wrist — speak a command, and a team of AI agents that remember, communicate, and evolve handle the rest while you live your life."**

---

## 1. "Not an API Wrapper" — The Core Technical Differentiator

### What We Actually Are

Every agent in Interstice is a **living Claude CLI subprocess with persistent session memory** (`--resume [sessionId]`). Not a stateless API call. Not a context-stuffed prompt. A real process that picks up exactly where it left off.

### For Technical Buyers

> "Every agent in Interstice is a living process with full session memory. When your Research Agent wakes up at 3am to check competitor pricing, it remembers every prior conversation, every finding, every correction you've made. API wrappers start from zero every call — we resume from where we left off. It's the difference between hiring a contractor who reads the brief every morning vs. an employee who was in the room yesterday."

### For Non-Technical Buyers

> "Most AI tools are like calling a stranger every time you need help — you explain everything from scratch. Interstice agents are employees. They remember. They learn your business. They pick up where they left off."

### Why This Is a Moat

- Agents accumulate institutional knowledge over time
- No token waste re-explaining context every call
- Agents can be interrupted and resumed without losing state
- The "company" genuinely gets smarter the longer it runs
- API-based systems (CrewAI, AutoGen, LangChain) are fundamentally stateless — they fake persistence by stuffing context windows

**Tagline:** *"Your AI company doesn't reboot every morning."*

---

## 2. Inter-Agent Communication — Why Orchestration ≠ Parallelism

### The Problem with Everyone Else

Most "multi-agent" frameworks are just **parallel execution with a merge step**. Run 3 agents, collect 3 outputs, done. That's not a company — that's 3 freelancers who never met.

### What Interstice Does

Agents **actively shape each other's work mid-execution** through a shared message bus and findings channel in Convex:

- Research Agent publishes findings → Developer Agent reads them before writing a single line of code
- Research Agent discovers a competitor just raised $50M → Communications Agent immediately adjusts the investor pitch
- Developer Agent hits a technical limitation → CEO re-prioritizes before other agents waste cycles

> "In a real company, your marketing team doesn't write copy in a vacuum — they talk to product, they read the research, they check with legal. Interstice agents work the same way."

### The Demo Moment That Sells This

On the dashboard, animated message lines flow from Research → Developer and Research → Comms. That's not decoration — that's agents reading each other's work and adapting in real time.

Point at it during the pitch: *"Watch — the developer just changed the landing page headline because Research found that 'AI wearable' tests better than 'smart device' in the market data."*

**Tagline:** *"Agents that actually talk to each other. Not just run next to each other."*

---

## 3. Persistent Memory — The Company That Evolves

### The Thesis

**The company accumulates institutional knowledge.** Every heartbeat, every task, every inter-agent message gets logged in Convex. Session persistence means each agent carries forward everything it's learned. The findings channel is a **shared company brain** that grows over time.

### The Memory Update Loop

1. You give a voice command → CEO processes it
2. Agents execute, discover new information, post findings
3. Other agents read those findings and update their mental models
4. Next time a similar task comes in, every agent starts from a richer baseline
5. The company gets better at its job **without you retraining anything**

### How to Talk About It

> "On day one, your AI company knows nothing about your business. By day thirty, your Research Agent knows your competitive landscape cold. Your Comms Agent has your brand voice dialed. Your Developer Agent knows your tech stack preferences. By day ninety, these agents are running plays you never explicitly taught them — because they learned from each other."

**Tagline:** *"Your AI company has institutional memory. Fire an agent, hire a new one — the knowledge stays."*

---

## 4. Background Execution — "They Work While You Live"

### The Lifestyle Positioning

> "You speak a command into your wrist at 9am. By lunch, Research has mapped the competitive landscape, Developer has a landing page draft, and Comms has three investor emails queued for your approval. You didn't open a laptop. You didn't context-switch. You lived your morning and your company ran itself."

### Why the Approval Gate Makes This Trustworthy

Agents don't go rogue — they pause at decision points and ask. You get autonomous background work WITH human-in-the-loop at critical moments:

- `send_email` → pauses for approval
- `make_call` → pauses for approval
- `deploy` → pauses for approval
- Research, analysis, drafting → runs autonomously

> "Most AI tools require you to sit there and babysit them. Interstice runs in the background like a real team. Your agents pick up tasks, execute, coordinate with each other, and only interrupt you when they need a decision."

**Tagline:** *"Delegate, don't operate."*

---

## 5. Bold Ideas — Where This Goes

### A. "AI Company-in-a-Box" as a Product Category

Stop calling it an agent framework. It's a company you deploy.

> "Interstice isn't a tool. It's a company. You're the CEO of a company that has Research, Communications, Development, and Operations departments. They all report to your AI Chief of Staff. You manage by voice."

Competitive reframe: not competing with LangChain or CrewAI — competing with **hiring your first 5 employees**. TCO comparison: 5 agents running 24/7 vs. 5 salaries + benefits + management overhead.

### B. Agent Marketplace — Hire and Fire

Take the company metaphor literally:
- Browse an agent marketplace, hire specialists (SEO Agent, Legal Review Agent, Sales Agent)
- Each agent plugs into the existing org chart with pre-trained skills
- Fire underperforming agents, replace them — the replacement inherits institutional memory from the findings channel
- Agents have performance reviews based on task completion rates and quality scores

*"Hire a sales agent for $20/month instead of $5k/month."*

### C. Inter-Company Agent Communication

Two Interstice companies' agents can talk to each other:
- Your Sales Agent negotiates with a supplier's Procurement Agent
- Your Research Agent exchanges findings with a partner's Research Agent
- B2B, but the B's are AI companies

*"Your AI company just closed a deal with their AI company. You got a notification."*

### D. Org Chart as Code

For technical users, the org chart becomes infrastructure:

```yaml
company:
  ceo:
    delegates_to: [research, comms, dev, calls]
    escalation: human
  research:
    tools: [perplexity, web_scrape]
    publishes_to: findings
  comms:
    reads_from: findings
    approval_required: [send_email, post_social]
  dev:
    reads_from: findings
    approval_required: [deploy]
```

*"Define your company in a YAML file. Deploy it. It runs."*

Opens a GitHub-for-companies play where people share and fork org structures: "Here's my e-commerce company config — 8 agents, handles inventory, support, marketing, and bookkeeping."

### E. The Wearable-Native Moat

OMI gives us something nobody else has — a **hardware channel**:
- Manage your AI company while driving, working out, cooking
- Approval gates as voice interactions: *"Your CEO wants to send an email to Y Combinator. Approve?"* → *"Approve."*
- You're literally wearing your company on your wrist

*"The first company you can run from your wrist."*

### F. Company Replays

Everything logged in Convex = full replays of how the company handled any task:
- Watch CEO decompose the task
- See where Research went down a dead end and course-corrected
- Watch the moment Comms read the findings and changed the email draft
- Identify bottlenecks, improve the org chart

*"Watch your AI company work, in replay, at 10x speed."*

---

## 6. Target Customer & PMF Thesis

### Primary: Solo Founders & Solopreneurs

**The pain:** "I need to research competitors, write investor emails, build a landing page, and make follow-up calls — and I'm one person."

**The solution:** "Speak it. Your company handles it."

**PMF signal:** Users who come back daily and give increasingly complex multi-step commands. That means the memory is working, the delegation is trusted, and the background execution is saving real time.

### Secondary: Small Agencies (2-5 people)

Each human manages a fleet of AI agents that handle the grunt work. Scale output without hiring.

---

## 7. Competitive Positioning Matrix

| Feature | ChatGPT/Copilot | CrewAI/AutoGen | Interstice |
|---------|-----------------|----------------|------------|
| Persistent memory | ❌ Session-only | ❌ Stateless API | ✅ `--resume` sessions |
| Inter-agent comms | ❌ Single agent | ⚠️ Basic handoff | ✅ Real-time message bus |
| Background execution | ❌ Requires tab open | ⚠️ Script-based | ✅ Heartbeat scheduler |
| Human-in-the-loop | ❌ Always or never | ⚠️ Manual gates | ✅ Approval system + voice |
| Hardware integration | ❌ None | ❌ None | ✅ OMI wearable |
| Institutional knowledge | ❌ Resets | ❌ Resets | ✅ Compounds over time |

---

## 8. Perplexity Agent API — Deep Integration Strategy

### What We Use (Not Basic Sonar)

We use the **Perplexity Agent API** (`POST /v1/agent`), not the basic Sonar chat endpoint. This gives us:

- **Deep Research preset**: 10 autonomous steps where the agent plans, searches, reads full pages, evaluates, and iterates
- **Structured JSON outputs**: Schema-enforced responses our agents consume programmatically (not prose for humans)
- **Domain filtering**: Lock searches to Crunchbase, LinkedIn, PitchBook for targeted research
- **Built-in tools**: `web_search` + `fetch_url` for comprehensive investigation
- **Multi-model routing**: Claude Opus for synthesis, Grok for speed, GPT-5 for analysis — all through one API

### Killer Use Case: Autonomous Lead Generation

Command: "Find me 10 investors in AI wearables in the Bay Area and draft personalized outreach to each."

1. Research Agent hits Agent API with `preset: "deep-research"` (10 autonomous steps)
2. Domain-filtered to crunchbase.com, linkedin.com, pitchbook.com
3. Returns structured JSON array: `[{name, firm, email, recent_investment, relevance_score}]`
4. Communications Agent reads structured data, drafts 10 personalized emails
5. All 10 emails hit approval queue — user approves each send

**Why this wins the Perplexity sponsor prize**: Uses Agent API (not Sonar), deep-research preset, structured outputs, domain filtering, and results are programmatically consumed by other agents.

---

## 9. ElevenLabs Conversational AI — Deep Integration Strategy

### What We Use (Not Basic TTS)

We use **ElevenLabs Conversational AI 2.0**, the full conversational platform:

- **Real phone calls** via native Twilio integration
- **Sub-100ms turn-taking** — natural conversation, not scripted read-back
- **Server tools**: Call Agent queries Convex mid-call for live context
- **Company memory access**: Agent reads research findings, contacts, activity during live calls
- **32+ language auto-detection** mid-conversation

### The Demo Moment

"Call Veer and give him a status update on what we accomplished today."
- Call Agent reads company memory → knows what happened today
- Generates contextual call script
- Approval card → approve → real phone rings → ElevenLabs conducts conversation
- Transcript streams live on dashboard

---

## 10. Pitch Deck Strategy (HackHayward 2026)

### Format

Expo-style judging. ~20 minutes per judge group. Must lead with pitch deck, then show live product.

### Judging Criteria (from official guide)

1. **Problem & Value** — Is the problem meaningful? Clear value?
2. **Technical Execution** — Core features work reliably? Thoughtfully engineered?
3. **AI Depth & Integration** — "Is it more than a basic API call?" Central and meaningful?
4. **Entrepreneurial Strength** — Customer identified? Clear differentiation? Compelling venture concept?
5. **Presentation** — Clear, organized, confident? Explained thinking effectively?
6. **UX/UI Design** — Seamless UX, intuitive UI, visual clarity, innovation?

### Prizes We're Targeting

- **1st Place — AI-Driven Entrepreneurship Track**
- **Best AI Depth & Integration**
- **Perplexity Best Project Built with Agent API**
- Any OMI or ElevenLabs sponsor prizes

### Slide Structure

1. Title — "Your AI Company, On Your Wrist"
2. Problem — 5 jobs, AI tools still make you the bottleneck
3. Solution — Speak → CEO → Agents → Communicate → Report back
4. 5 Moats — Why this isn't an API call
5. Memory — 4-layer company brain
6. Perplexity Agent API — Deep research, structured outputs, domain filtering
7. ElevenLabs Conversational AI — Real phone calls, not TTS
8. LIVE DEMO (transition)
9. Market — AI agents ($8.5B→$35B) + AI wearables ($50B→$200B)
10. Competition — Matrix, we win every row
11. Team — Veer + Varun
12. Close — "The space between what you want and what gets done. We filled it."

---

## Key Marketing Lines (Pick List)

- *"Your AI company doesn't reboot every morning."*
- *"Agents that actually talk to each other. Not just run next to each other."*
- *"Delegate, don't operate."*
- *"The first company you can run from your wrist."*
- *"Your AI company has institutional memory."*
- *"Speak it. Your company handles it."*
- *"The space between intent and execution — that's where we live."*
- *"Not search. An autonomous research department powered by Perplexity."*
- *"A real phone call, mid-demo. Powered by ElevenLabs."*
