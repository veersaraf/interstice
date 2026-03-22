# INTERSTICE — Full Pitch Script (~18-20 minutes)

## FORMAT
- **Varun** = business narrative, problem, moats, market, close
- **Veer** = technical depth, live demo, architecture walkthrough
- Pitch deck on one screen. Dashboard on the other. OMI on Veer's wrist.
- Lead with deck (required), pivot to live demo mid-presentation.
- Expo-style: conversational, not memorized. Know the beats, speak naturally.

---

## PRE-JUDGE SETUP (Before they walk up)

Dashboard running on one screen. Pitch deck on the other, slide 1 visible. Veer has OMI on. Agents are idle but alive. Have `company.md` ready to pull up in a tab.

---

## [0:00-0:30] THE HOOK — Varun

*Judge walks up. Make eye contact. Don't wait for them to ask.*

**VARUN:**

Hey, welcome — thanks for coming over. I'm Varun, this is Veer. We built Interstice.

Before I get into the deck, let me ask you something. How many tools do you use to run a project? You've got one thing for research, another for emails, another for building, another for calls, and then you — holding it all together. You're the glue.

That's the problem we solved. Interstice is an AI company you wear on your wrist. You speak a command, and a full team of AI agents — that remember, that talk to each other, that actually learn — handles the rest while you go live your life.

Let me walk you through it.

*Click to Slide 2 — Problem*

---

## [0:30-2:00] THE PROBLEM — Varun

**VARUN:**

So here's the reality for any solopreneur, any founder, honestly any student trying to launch something. You're doing five jobs.

*Point at the five items on slide*

You're the researcher — Googling, reading 20 tabs, trying to summarize what the competitive landscape looks like. You're the comms person — drafting every email, personalizing each one manually. You're the developer — building the landing page, writing the copy. You're the caller — making every follow-up call yourself. And you're the coordinator — you're the one remembering what's done, what's not, and what depends on what.

Now, every AI tool out there — ChatGPT, Copilot, whatever — they replaced the keyboard with a chatbox. But the bottleneck didn't change. It's still you. You still have to sit there, type the prompt, read the output, copy-paste it somewhere, and repeat. One task at a time. No memory between sessions. No coordination.

That's not AI working for you. That's you working for AI.

*Click to Slide 3 — Solution*

---

## [2:00-3:30] THE SOLUTION — Varun

**VARUN:**

Interstice flips that entirely. Speak. Delegate. Done.

*Point at the 5-step flow*

Here's how it works. You speak a command into an OMI wearable — that's an open-source AI device on your wrist. Our AI CEO receives that command, breaks it down into subtasks, and delegates to specialist agents. A Research Agent, a Communications Agent, a Developer Agent, a Call Agent. They execute in parallel.

But here's what makes this different from everything else — and this is the part I really want you to pay attention to —

*Pause for emphasis*

They talk to each other. Mid-task. The Research Agent posts findings to a shared channel. The Developer Agent reads those findings before it writes a single line of code. The Communications Agent reads those findings before it drafts a single email. They're not running in isolation — they're collaborating.

When all tasks complete, the CEO synthesizes everything and reports back through your wrist. You get a buzz. You get a summary. You never opened a laptop.

This isn't a chatbot wrapper. This is a real AI company with an org chart, a memory system, and a delegation hierarchy.

*Click to Slide 4 — Not an API Call*

---

## [3:30-5:30] THE 5 MOATS — Varun

**VARUN:**

So the judging criteria for this hackathon literally asks: "Is it more than a basic API call?" I want to answer that directly. Here are five moats that make Interstice a company, not a wrapper.

*Point at each moat as you go*

**One — Persistent Agent Sessions.** Every agent runs as a Claude CLI subprocess with session persistence. When the Research Agent wakes up, it doesn't start from zero — it resumes. It remembers every search it's ever done, every correction you've made, every finding it posted. That's --resume sessions stored in our database. No context re-stuffing. No token waste. Real memory.

**Two — Inter-Agent Communication.** We built a real-time message bus through Convex. When Research discovers something, it posts to a shared findings channel. Developer and Comms subscribe to that channel. They read each other's work and adapt. This is agents that actually talk to each other — not just run next to each other.

**Three — Four-Layer Memory.** And this is one I'm really proud of. We have company-wide shared memory — identity, contacts, decisions, activity log. We have per-agent memory through session persistence. We have a contact system that builds itself from voice — you say a name, it knows their number, their email, your last interaction. And we have a shared findings channel where all research gets published. The company gets smarter every single day without retraining.

**Four — Background Execution.** Agents run on a heartbeat scheduler. They work while you do other things. But they're not rogue — we have approval gates. Any high-stakes action — sending an email, making a phone call, deploying code — pauses and asks you first. You approve by voice or by tapping the dashboard. That's real human-in-the-loop.

**Five — Wearable-Native.** This isn't a web app. The input is your voice through OMI. The output is a notification back to your wrist. You can run your AI company while driving, while cooking, while walking between classes. Nobody else at this hackathon built on wearable hardware.

*Click to Slide 5 — Memory*

---

## [5:30-7:00] MEMORY DEEP-DIVE — Varun

**VARUN:**

Let me zoom in on the memory system because this is where the real depth is.

*Point at the 2x2 grid*

Top left — Company Memory. This is a shared file that every agent reads and writes to. It has our company identity, our key contacts, every research finding, every call transcript, every decision we've made. When I say "email Veer a summary of what we accomplished today" — I don't have to explain what we accomplished. The Communications Agent reads from company memory and already knows.

Top right — Contact Memory. This is a CRM that builds itself. When we make a call, the system stores the contact — name, number, email, what we talked about. Next time I say "call Veer back," it knows who Veer is, it knows his number, and it knows what the last conversation was about. I never entered that into a database. It learned it from operating.

Bottom left — Per-Agent Memory. Each agent carries its own expertise. The Research Agent remembers your competitive landscape. The Comms Agent remembers your brand voice from previous emails. The Developer Agent remembers your tech stack preferences. They specialize over time.

Bottom right — Shared Findings. When any agent discovers something, it publishes to a shared channel. Every other agent can read it. If Research finds that a competitor just raised $50 million, the entire company knows within seconds. Comms adjusts the investor pitch. CEO re-prioritizes. That's institutional knowledge that compounds.

I want to actually show you this. Veer, can you pull up company.md?

*Veer pulls up company.md on screen — scrolls through it showing the contacts, research findings, call transcripts, decisions*

See this? This file didn't exist 24 hours ago. Everything in here — the competitive research, the call scripts, the investor contacts — the agents wrote all of this. This is a company that learned by operating.

*Click to Slide 6 — Perplexity*

---

## [7:00-9:00] PERPLEXITY AGENT API — Varun starts, Veer adds depth

**VARUN:**

So our Research Agent is powered by the Perplexity Agent API. And I want to be clear — we're not using the basic Sonar search endpoint. We're using the full Agent API at /v1/agent with the deep research preset.

Here's what that means. When I ask for a competitive analysis, the Agent API doesn't just search and return text. It runs up to 10 autonomous research steps. It plans what to search, searches it, reads full web pages using fetch_url, evaluates what it found, and iterates. It does this autonomously — we don't prompt it 10 times, it does 10 steps in one call.

But here's the really important part — we use structured JSON outputs. The Agent API returns schema-enforced data, not prose. So when I say "find me 10 investors in AI wearables in the Bay Area," it doesn't come back with a paragraph. It comes back with a JSON array — name, firm, email, recent investment, relevance score. Structured data.

And then — this is where the inter-agent communication kicks in — our Communications Agent reads that structured JSON and programmatically drafts 10 personalized emails. Each one references the investor's actual recent deals. Each one goes through an approval gate before sending.

That's not search. That's an autonomous research department.

**VEER** *(jumps in):*

And just to add — we're also using domain filtering to lock searches to Crunchbase, LinkedIn, and PitchBook so we get targeted results, not noise. And we do multi-model routing through the Agent API — Claude Opus for deep synthesis, Grok for quick lookups. All through one endpoint. The Agent API handles the routing.

*Click to Slide 7 — ElevenLabs*

---

## [9:00-10:30] ELEVENLABS — Varun

**VARUN:**

Our Call Agent is powered by ElevenLabs Conversational AI 2.0. Again — this is not text-to-speech. This is a full conversational AI platform.

When the CEO delegates a call — say "call Veer and give him a status update" — the Call Agent reads from company memory to understand what happened today. It generates a contextual call script. An approval card pops up on the dashboard. You approve. And then a real phone rings.

ElevenLabs conducts a real back-and-forth conversation. Sub-100 millisecond turn-taking. It knows when to pause, when to respond, when to listen. It's wired through native Twilio integration. And the transcript streams live on our dashboard so you can watch the conversation happen in real time.

We're going to show you this live in a moment. A real phone is going to ring.

*Click to Slide 8 — Live Demo*

---

## [10:30-11:00] DEMO TRANSITION — Varun

**VARUN:**

Alright. Enough slides. Let me show you what this actually looks like.

*Point at the dashboard screen*

This is our real-time dashboard. Built with React and Convex — Convex gives us live subscriptions, so everything you're about to see updates in real time. No polling, no refreshing. You'll see agents activate, tasks move across the board, and messages flow between agents as they collaborate.

Veer, take it away.

---

## [11:00-16:00] LIVE DEMO — Veer

**VEER:**

Alright, so I'm going to give two commands. The first one is going to show you multi-agent orchestration with inter-agent communication. The second one is going to make a real phone call.

*Speak into OMI or type the command:*

"Find the top competitors in the AI wearable market, build me a landing page for Interstice, and draft an investor outreach email using the research."

*Turn to judges while it runs:*

Okay, watch the dashboard. You can see the command just came in through the OMI webhook. Now the CEO Agent is activating — see it glow on the org chart? It's decomposing the command into three tasks.

*Point at the task board*

There — three task cards just appeared. Research got "competitive analysis." Developer got "landing page." Communications got "investor email." All three agents are now running in parallel.

Watch the Research Agent first — it's hitting the Perplexity Agent API right now. You can see the activity feed streaming its output live. It's searching, reading pages, synthesizing findings.

*Wait for Research to post findings*

Okay — Research just posted findings to the shared channel. Now watch this — see those message lines on the org chart? That's Research feeding its findings to Developer and Communications. The Developer Agent is reading the competitive data before writing the landing page. The Comms Agent is reading it before drafting the email. They're not working in a vacuum. They're collaborating.

*Wait for tasks to complete*

Developer just finished — there's the landing page. Comms just finished — there's the investor email. And look — the email has an approval gate. It won't send until you approve it. That's the human-in-the-loop.

Now the CEO is synthesizing. It reads all three outputs and... there. CEO reports back through OMI. Summary of everything that happened.

Now let me show you the second command.

*Speak into OMI:*

"Call Veer and give him a quick update on what we accomplished today."

*Point at dashboard*

Call Agent is activating. It's reading from company memory — it knows what Research found, it knows the landing page was built, it knows the email was drafted. It's generating a call script from all of that context. And...

*Approval card appears*

There's the approval card. It's asking me to approve an outbound call. Watch.

*Tap approve*

...

*Veer's phone rings*

There it is. That's ElevenLabs Conversational AI calling through Twilio right now. And you can see the transcript streaming live on the dashboard.

*Let it ring for a moment, let judges react*

That's a real phone call, generated from real context, made by an AI agent, mid-demo. That's not a feature. That's a proof of concept.

---

## [16:00-17:00] MARKET — Varun

*Click to Slide 9 — Market*

**VARUN:**

Okay, let me bring it back to the business case. We're sitting at the intersection of two massive markets.

AI agent orchestration — $8.5 billion in 2026, projected to hit $35 billion by 2030. That's a 42% CAGR. And AI wearable devices — $50 billion today, projected $200 billion plus by 2030.

Here's the thing — there are companies building AI agents. LangChain, CrewAI. And there are companies building AI wearables. OMI, Meta, Humane. But nobody is building the orchestration layer that connects wearable hardware to a multi-agent system with memory and inter-agent communication. That's the gap. That's the interstice. That's us.

*Click to Slide 10 — Competition*

---

## [17:00-18:00] COMPETITION — Varun

**VARUN:**

Quick competitive comparison. ChatGPT and Copilot — single agent, session-only memory, tab has to be open, no hardware integration. CrewAI and LangChain — multi-agent but stateless API calls, basic handoffs, script-based execution, no hardware.

Interstice — persistent sessions via --resume, real-time message bus, heartbeat scheduler, approval system with voice confirmation, OMI wearable integration, and institutional knowledge that compounds daily.

*Point at the Interstice column*

We win every row. And we built it in 24 hours.

*Click to Slide 11 — Team*

---

## [18:00-18:45] TEAM — Varun

**VARUN:**

Two-person team. Veer built the entire orchestration system — the Claude CLI subprocess runner, the Convex backend, the heartbeat scheduler, the inter-agent message bus, all the integrations — Perplexity, ElevenLabs, OMI, Twilio — in 24 hours. One person.

I handled the product positioning, the competitive analysis, the market strategy, the pitch you're hearing right now.

And honestly, that's the proof of concept. Two people running an AI-powered company. If two college students can do it in a hackathon, imagine what a solopreneur can do with this every day.

*Click to Slide 12 — Close*

---

## [18:45-19:15] CLOSE — Varun

**VARUN:**

Interstice. The space between what you want and what gets done. We filled it.

It's built on OMI for voice, Perplexity Agent API for autonomous research, ElevenLabs for real AI phone calls, Convex for real-time state, and Claude for the agent brains.

We're competing for the AI-Driven Entrepreneurship track, Best AI Depth and Integration, and the Perplexity Best Project Built with the Agent API.

Thank you. Happy to answer any questions.

---

## [19:15-20:00] Q&A — Anticipated Questions & Answers

### "How is this different from CrewAI?"

**VARUN:** CrewAI runs stateless API calls — every run starts from scratch. Our agents persist sessions across heartbeats. They resume, they remember. And CrewAI doesn't have inter-agent communication mid-task — agents run and merge. Ours actively collaborate through a real-time message bus.

### "How does the memory work technically?"

**VEER:** Claude CLI has a --resume flag that stores the full session. We persist the session ID in Convex. Every time an agent's heartbeat fires, it resumes the same session. For shared memory, we use a company.md file that agents read and write to, plus a Convex findings table that all agents subscribe to.

### "Is this actually useful or is it a demo?"

**VARUN:** The fact that we ran it for 24 hours and it built real research reports, made real phone calls, sent real emails, and generated real landing pages — that's not a demo. The company memory file you saw grew organically. We didn't seed it. The agents wrote it. That's a product operating, not a proof of concept.

### "What about hallucination?"

**VEER:** The Research Agent uses Perplexity's Agent API which searches the live web with citations. Structured outputs enforce the schema so we get data, not guesses. And the approval gate system means no high-stakes action happens without a human confirming.

### "What would you do with more time?"

**VARUN:** Agent marketplace — hire and fire specialist agents. Inter-company agent communication — your AI company negotiates with another AI company. And an "org chart as code" platform where people share and fork company configurations on GitHub.

### "Why OMI specifically?"

**VARUN:** OMI is open-source hardware with real-time transcript webhooks and a proactive notification API. It's the only wearable that lets us build a full voice-in, voice-out loop without building custom hardware. And honestly — running a company from your wrist is a use case nobody else is building for.

---

## DELIVERY NOTES FOR VARUN

1. **Don't memorize word-for-word.** Know the beats, speak naturally. The script is a map, not a teleprompter.
2. **Make eye contact with judges.** This is a conversation at a table, not a stage performance.
3. **Point at things.** Point at the dashboard. Point at the slide. Point at the org chart when agents light up. Physical gestures keep attention.
4. **Pause after big claims.** After "they talk to each other" — pause. Let it land. After the phone rings — pause. Let judges react.
5. **Name sponsors naturally.** Don't force it. Say "Perplexity Agent API" when explaining research. Say "ElevenLabs Conversational AI" when explaining calls. It sounds organic.
6. **The close is fast.** Don't linger. Say the line, list the prizes, say thank you. Confidence is brevity.
7. **During Q&A, defer technical questions to Veer.** Business questions are yours. Architecture questions are his. Tag-team it.
