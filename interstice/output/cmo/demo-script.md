# Interstice — Demo Script

**Duration:** 2:30 – 3:00 minutes
**Setup:** OMI on wrist. Laptop showing dashboard (org chart left, activity feed + task board right). Two browser windows arranged.

---

## 0:00 – 0:20 | The Hook

**Say:**
> "I'm going to run a company from my wrist. Not a chatbot — a company. I'll speak one command, and you'll watch five AI agents wake up, share data with each other in real-time, and execute real actions. Including making a phone call."

**Show:** Dashboard is idle. All agents show "idle" status. Empty task board.

---

## 0:20 – 0:40 | The Command

**Say:**
> "Here's what a solopreneur's morning looks like. One idea, five steps."

**Do:** Speak into OMI (or type into command input if OMI isn't connected):
> *"I need a competitive analysis of the AI wearable market, a landing page for Interstice, and draft an outreach email to potential investors."*

**Say:**
> "One command. Watch the org chart."

---

## 0:40 – 1:00 | CEO Decomposes

**Judges see:**
- OMI transcript appears in activity feed
- CEO agent glows active on org chart
- Activity feed shows CEO thinking: parsing the command, identifying 3 tasks
- Three task cards appear on the task board simultaneously: Research, Developer, Communications

**Say:**
> "The CEO heard me. It decomposed my intent into three tasks and delegated to specialists. Watch — they all activate at once."

---

## 1:00 – 1:30 | Agents Execute in Parallel

**Judges see:**
- Research, Developer, and Communications agents all glow active on org chart
- Delegation lines animate from CEO to each agent
- Activity feed streams Research Agent output: Perplexity queries, market data coming in
- Research Agent posts findings to the shared channel

**Say (when Research findings post):**
> "This is the moment. Watch the data lines."

**Judges see:**
- Animated lines flow from Research to Developer and Communications on the org chart
- Developer reads the findings and starts building — real market data, not placeholder text
- Communications reads the findings and drafts an investor email with actual competitor names

**Say:**
> "The agents aren't just running in parallel — they're collaborating. The Developer is building a landing page with real market data from Research. Communications is writing an investor email that cites actual competitors. This is inter-agent communication, not just parallel execution."

---

## 1:30 – 1:50 | Approval Gate

**Judges see:**
- Developer task completes: landing page generated
- Communications task completes: email drafted
- Approval card appears on dashboard for the email

**Say:**
> "The email is ready, but it won't send until I approve it. Every action that touches the outside world has an approval gate. I'm in control."

**Do:** Click "Approve" on the dashboard.

**Say:**
> "Approved. Now the CEO sees all three tasks are done and synthesizes."

---

## 1:50 – 2:10 | CEO Synthesizes

**Judges see:**
- CEO glows active again
- Activity feed shows synthesis output
- OMI notification (if connected): CEO reports back with summary

**Say:**
> "Done. In under two minutes: competitive research with sources, a landing page built with real data, and an investor email citing the actual market. All from one voice command, all agents sharing data."

---

## 2:10 – 2:40 | The Call (The Showstopper)

**Say:**
> "Now the part no hackathon project has ever done."

**Do:** Speak into OMI (or type):
> *"Call the OMI sponsor table and tell them what we built."*

**Judges see:**
- Call Agent activates on org chart
- Call script generated in activity feed
- Approval card appears: "Call [number] — Approve?"

**Do:** Tap Approve.

**Judges see:**
- Call status updates in real-time
- If a real phone number is configured: **a phone actually rings**
- ElevenLabs voice: "Hi, this is Interstice — an AI orchestration system built on OMI at this hackathon..."
- Call transcript streams live into the dashboard

**Say:**
> "A real phone call, initiated by voice, approved by me, conducted by AI. That's Interstice — the gap between intent and execution, closed."

---

## 2:40 – 3:00 | Close

**Say:**
> "OMI has 250 apps. Zero orchestration layers. We're building the operating system for voice-first AI hardware. Five agents, three executable skills, ten database tables, full real-time dashboard — built in 24 hours."

**Show:** Pause on the org chart with all agents showing completed status. The task board shows all tasks in the "Done" column.

---

## Fallback Plans

**If OMI isn't connected:** Use the command input on the dashboard. Same demo flow, just typed instead of spoken. Mention: "In production, this comes from your OMI wearable — voice in, response back to your wrist."

**If the call fails:** Skip the call demo. The multi-agent + inter-agent communication demo is already impressive. Say: "We also have a Call Agent that makes real outbound calls via ElevenLabs and Twilio — the approval gate is the same pattern you just saw."

**If agents are slow:** Talk through the architecture while they process. Point to the real-time streaming in the activity feed: "You can see the agent thinking in real-time — that's Claude processing via persistent sessions."

**If Perplexity is down:** Research Agent will still produce output from Claude's knowledge. Less impressive but functional. Don't mention the API issue.

---

## Key Phrases to Hit

- "Not a chatbot — a company"
- "One command, five agents"
- "Agents sharing data in real-time" (point to the data lines animating)
- "Approval gates — you're always in control"
- "Built in 24 hours"
- "250 apps on OMI, zero orchestration layers — until now"
