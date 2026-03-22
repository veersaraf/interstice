const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Varun Kalvakota & Veer Saraf";
pres.title = "Interstice — Your AI Company, On Your Wrist";

// ============================================================
// COLOR PALETTE — Midnight Premium
// ============================================================
const C = {
  bg: "0D1117",        // near-black
  bgCard: "161B22",    // dark card
  bgCard2: "1C2333",   // slightly lighter card
  accent: "58A6FF",    // electric blue
  accent2: "3FB950",   // green
  accent3: "F78166",   // orange
  accent4: "D2A8FF",   // purple
  white: "FFFFFF",
  gray: "8B949E",
  lightGray: "C9D1D9",
  dim: "484F58",
  perplexity: "20808D", // perplexity teal
  eleven: "F5A623",     // elevenlabs gold
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, color: "000000", opacity: 0.4 });

// ============================================================
// SLIDE 1 — TITLE
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };

  // Subtle gradient-like top bar
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  // Main title
  slide.addText("INTERSTICE", {
    x: 0.8, y: 1.2, w: 8.4, h: 1.2,
    fontSize: 54, fontFace: "Arial Black", color: C.white, bold: true,
    charSpacing: 8, margin: 0
  });

  // Tagline
  slide.addText("Your AI Company, On Your Wrist", {
    x: 0.8, y: 2.3, w: 8.4, h: 0.6,
    fontSize: 24, fontFace: "Calibri", color: C.accent, italic: true, margin: 0
  });

  // Divider line
  slide.addShape(pres.shapes.LINE, { x: 0.8, y: 3.2, w: 2.5, h: 0, line: { color: C.accent, width: 2 } });

  // Description
  slide.addText("Speak into your wrist. A team of AI agents that remember,\ncommunicate, and evolve handles the rest.", {
    x: 0.8, y: 3.5, w: 7, h: 0.8,
    fontSize: 15, fontFace: "Calibri", color: C.gray, margin: 0
  });

  // Team
  slide.addText([
    { text: "Varun Kalvakota", options: { bold: true, color: C.white } },
    { text: "  Strategy & Pitch", options: { color: C.gray } },
    { text: "    |    ", options: { color: C.dim } },
    { text: "Veer Saraf", options: { bold: true, color: C.white } },
    { text: "  Engineering", options: { color: C.gray } },
  ], {
    x: 0.8, y: 4.6, w: 8, h: 0.4,
    fontSize: 13, fontFace: "Calibri", margin: 0
  });

  // Event badge
  slide.addText("HackHayward 2026  |  AI-Driven Entrepreneurship Track", {
    x: 0.8, y: 5.1, w: 8, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.dim, margin: 0
  });
})();

// ============================================================
// SLIDE 2 — PROBLEM
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent3 } });

  slide.addText("THE PROBLEM", {
    x: 0.8, y: 0.4, w: 8, h: 0.6,
    fontSize: 14, fontFace: "Arial", color: C.accent3, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Solopreneurs do 5 jobs.\nAI tools still make you the bottleneck.", {
    x: 0.8, y: 1.0, w: 8, h: 1.2,
    fontSize: 30, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Pain point cards
  const pains = [
    { icon: "01", title: "Research", desc: "You Google, read 20 tabs, summarize yourself" },
    { icon: "02", title: "Outreach", desc: "You draft every email, personalize each one manually" },
    { icon: "03", title: "Development", desc: "You build landing pages, write copy, deploy" },
    { icon: "04", title: "Calls", desc: "You make every follow-up call personally" },
    { icon: "05", title: "Coordination", desc: "You are the glue holding it all together" },
  ];

  pains.forEach((p, i) => {
    const y = 2.5 + (i * 0.55);
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: y, w: 8.4, h: 0.45, fill: { color: C.bgCard } });
    slide.addText(p.icon, { x: 0.95, y: y, w: 0.5, h: 0.45, fontSize: 13, fontFace: "Consolas", color: C.accent3, bold: true, valign: "middle", margin: 0 });
    slide.addText(p.title, { x: 1.5, y: y, w: 1.8, h: 0.45, fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });
    slide.addText(p.desc, { x: 3.3, y: y, w: 5.5, h: 0.45, fontSize: 13, fontFace: "Calibri", color: C.gray, valign: "middle", margin: 0 });
  });

  slide.addText("Every AI tool replaced the keyboard with a chatbox\nbut kept the bottleneck: YOU.", {
    x: 0.8, y: 5.0, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: C.accent3, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 3 — SOLUTION
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent2 } });

  slide.addText("THE SOLUTION", {
    x: 0.8, y: 0.4, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent2, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Speak. Delegate. Done.", {
    x: 0.8, y: 0.9, w: 8, h: 0.7,
    fontSize: 34, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Flow diagram using cards with arrows
  const steps = [
    { label: "YOU SPEAK", sub: "Voice command\nvia OMI wearable", color: C.accent },
    { label: "CEO HEARS", sub: "AI CEO decomposes\ninto subtasks", color: C.accent2 },
    { label: "AGENTS RUN", sub: "Research, Comms, Dev,\nCalls execute in parallel", color: C.accent3 },
    { label: "THEY TALK", sub: "Agents share findings\n& collaborate mid-task", color: C.accent4 },
    { label: "CEO REPORTS", sub: "Synthesized result\nback to your wrist", color: C.accent },
  ];

  steps.forEach((s, i) => {
    const x = 0.5 + (i * 1.9);
    // Card background
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.9, w: 1.7, h: 2.2,
      fill: { color: C.bgCard }, shadow: makeShadow()
    });
    // Top accent bar
    slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 1.9, w: 1.7, h: 0.06, fill: { color: s.color } });
    // Step number
    slide.addText(`${i + 1}`, { x: x, y: 2.05, w: 1.7, h: 0.45, fontSize: 28, fontFace: "Arial Black", color: s.color, align: "center", valign: "middle", margin: 0 });
    // Label
    slide.addText(s.label, { x: x + 0.1, y: 2.55, w: 1.5, h: 0.4, fontSize: 11, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    // Sub text
    slide.addText(s.sub, { x: x + 0.1, y: 2.95, w: 1.5, h: 0.8, fontSize: 10, fontFace: "Calibri", color: C.gray, align: "center", valign: "top", margin: 0 });

    // Arrow between cards
    if (i < steps.length - 1) {
      slide.addText("\u2192", { x: x + 1.65, y: 2.6, w: 0.3, h: 0.4, fontSize: 18, color: C.dim, align: "center", valign: "middle", margin: 0 });
    }
  });

  slide.addText("Not a chatbot wrapper. A real AI company with an org chart, memory, and delegation.", {
    x: 0.8, y: 4.5, w: 8.4, h: 0.5,
    fontSize: 14, fontFace: "Calibri", color: C.accent2, italic: true, margin: 0
  });

  // Bottom tag
  slide.addText("Built with: OMI  \u2022  Perplexity Agent API  \u2022  ElevenLabs Conversational AI  \u2022  Convex  \u2022  Claude CLI", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: C.dim, align: "center", margin: 0
  });
})();

// ============================================================
// SLIDE 4 — WHY THIS ISN'T AN API CALL (5 MOATS)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent4 } });

  slide.addText("WHY THIS ISN'T AN API CALL", {
    x: 0.8, y: 0.3, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent4, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("5 moats that make Interstice a company, not a wrapper.", {
    x: 0.8, y: 0.8, w: 8, h: 0.5,
    fontSize: 22, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  const moats = [
    { num: "01", title: "Persistent Agent Sessions", desc: "Agents resume via --resume. They remember everything. No context re-stuffing.", color: C.accent },
    { num: "02", title: "Inter-Agent Communication", desc: "Real-time message bus. Research feeds Dev and Comms mid-task. They collaborate.", color: C.accent2 },
    { num: "03", title: "4-Layer Memory System", desc: "Company memory, contacts, per-agent memory, shared findings. Gets smarter daily.", color: C.accent3 },
    { num: "04", title: "Background Execution", desc: "Heartbeat scheduler + approval gates. Agents work while you live. Interrupt for decisions only.", color: C.accent4 },
    { num: "05", title: "Wearable-Native", desc: "OMI in, OMI out. Run your company from your wrist. No screen required.", color: C.accent },
  ];

  moats.forEach((m, i) => {
    const y = 1.5 + (i * 0.78);
    // Accent bar left
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: y, w: 0.07, h: 0.65, fill: { color: m.color } });
    // Card
    slide.addShape(pres.shapes.RECTANGLE, { x: 0.87, y: y, w: 8.33, h: 0.65, fill: { color: C.bgCard } });
    // Number
    slide.addText(m.num, { x: 1.05, y: y, w: 0.5, h: 0.65, fontSize: 16, fontFace: "Consolas", color: m.color, bold: true, valign: "middle", margin: 0 });
    // Title
    slide.addText(m.title, { x: 1.6, y: y, w: 2.8, h: 0.65, fontSize: 14, fontFace: "Calibri", color: C.white, bold: true, valign: "middle", margin: 0 });
    // Description
    slide.addText(m.desc, { x: 4.5, y: y, w: 4.5, h: 0.65, fontSize: 12, fontFace: "Calibri", color: C.gray, valign: "middle", margin: 0 });
  });

  slide.addText("The judging criteria literally asks: \"Is it more than a basic API call?\" This is our answer.", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.accent4, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 5 — MEMORY: THE COMPANY BRAIN
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent3 } });

  slide.addText("MEMORY", {
    x: 0.8, y: 0.3, w: 4, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent3, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("The company brain that never forgets.", {
    x: 0.8, y: 0.75, w: 8, h: 0.5,
    fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // 4 memory layers in a 2x2 grid
  const layers = [
    { title: "Company Memory", desc: "Shared file all agents read/write.\nIdentity, decisions, activity log.\n\"Email Veer about today\" \u2014\nagent already knows what happened.", color: C.accent, x: 0.8, y: 1.5 },
    { title: "Contact Memory", desc: "CRM that builds itself from voice.\nNames, numbers, emails, last\ninteraction. Say a name, it\nknows who they are.", color: C.accent2, x: 5.2, y: 1.5 },
    { title: "Per-Agent Memory", desc: "Each agent remembers via\n--resume sessions. Research\nknows your market. Comms knows\nyour voice. Dev knows your stack.", color: C.accent3, x: 0.8, y: 3.3 },
    { title: "Shared Findings", desc: "Research posts to a shared\nchannel. Every agent reads it.\nCompetitor raises $50M? The\nentire company knows in seconds.", color: C.accent4, x: 5.2, y: 3.3 },
  ];

  layers.forEach((l) => {
    slide.addShape(pres.shapes.RECTANGLE, { x: l.x, y: l.y, w: 4.2, h: 1.6, fill: { color: C.bgCard }, shadow: makeShadow() });
    slide.addShape(pres.shapes.RECTANGLE, { x: l.x, y: l.y, w: 4.2, h: 0.06, fill: { color: l.color } });
    slide.addText(l.title, { x: l.x + 0.2, y: l.y + 0.15, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: l.color, bold: true, margin: 0 });
    slide.addText(l.desc, { x: l.x + 0.2, y: l.y + 0.5, w: 3.8, h: 1.0, fontSize: 11, fontFace: "Calibri", color: C.gray, margin: 0 });
  });

  slide.addText("\"The company gets smarter every day without retraining.\"", {
    x: 0.8, y: 5.1, w: 8.4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.accent3, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 6 — POWERED BY PERPLEXITY AGENT API
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.perplexity } });

  slide.addText("POWERED BY PERPLEXITY AGENT API", {
    x: 0.8, y: 0.3, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.perplexity, bold: true, charSpacing: 3, margin: 0
  });

  slide.addText("Not basic search. Autonomous research missions.", {
    x: 0.8, y: 0.8, w: 8, h: 0.5,
    fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Left column — what we use
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 4.2, h: 3.5, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addText("What Our Research Agent Does", { x: 1.0, y: 1.6, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.perplexity, bold: true, margin: 0 });

  slide.addText([
    { text: "Agent API endpoint (/v1/agent)", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Deep Research preset: 10 autonomous steps", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Structured JSON outputs (schema-enforced)", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Domain filtering (Crunchbase, LinkedIn, PitchBook)", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "web_search + fetch_url built-in tools", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Multi-model routing (Claude Opus, GPT-5, Grok)", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Results fed to Comms & Dev agents as structured data", options: { bullet: true, fontSize: 12, color: C.lightGray } },
  ], { x: 1.0, y: 2.05, w: 3.8, h: 2.8, valign: "top", margin: 0 });

  // Right column — the flow
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.5, w: 4.2, h: 3.5, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addText("How It Works In Practice", { x: 5.4, y: 1.6, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.perplexity, bold: true, margin: 0 });

  const flowSteps = [
    { step: "1", text: "\"Find 10 AI wearable investors in the Bay Area\"" },
    { step: "2", text: "Agent API triggers deep-research (10 autonomous steps)" },
    { step: "3", text: "Searches Crunchbase, LinkedIn \u2014 reads full pages" },
    { step: "4", text: "Returns structured JSON: name, firm, email, relevance" },
    { step: "5", text: "Comms Agent reads JSON \u2192 drafts 10 personalized emails" },
    { step: "6", text: "Approval gates \u2192 you approve each send" },
  ];

  flowSteps.forEach((f, i) => {
    const y = 2.1 + (i * 0.42);
    slide.addText(f.step, { x: 5.4, y: y, w: 0.35, h: 0.35, fontSize: 11, fontFace: "Consolas", color: C.perplexity, bold: true, valign: "middle", margin: 0 });
    slide.addText(f.text, { x: 5.8, y: y, w: 3.4, h: 0.35, fontSize: 10.5, fontFace: "Calibri", color: C.lightGray, valign: "middle", margin: 0 });
  });

  slide.addText("Not search. An autonomous research department powered by Perplexity.", {
    x: 0.8, y: 5.15, w: 8.4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.perplexity, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 7 — POWERED BY ELEVENLABS CONVERSATIONAL AI
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.eleven } });

  slide.addText("POWERED BY ELEVENLABS CONVERSATIONAL AI", {
    x: 0.8, y: 0.3, w: 9, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.eleven, bold: true, charSpacing: 3, margin: 0
  });

  slide.addText("Not text-to-speech. Real AI phone calls.", {
    x: 0.8, y: 0.8, w: 8, h: 0.5,
    fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Left — capabilities
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.5, w: 4.2, h: 3.0, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addText("Call Agent Capabilities", { x: 1.0, y: 1.6, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.eleven, bold: true, margin: 0 });

  slide.addText([
    { text: "Conversational AI 2.0 \u2014 not scripted TTS", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Native Twilio integration for real outbound calls", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Sub-100ms turn-taking \u2014 natural conversation", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Server tools: queries Convex mid-call for context", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Reads from company memory during live calls", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "32+ language auto-detection mid-conversation", options: { bullet: true, fontSize: 12, color: C.lightGray } },
  ], { x: 1.0, y: 2.05, w: 3.8, h: 2.3, valign: "top", margin: 0 });

  // Right — the demo moment
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.5, w: 4.2, h: 3.0, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addText("The Demo Moment", { x: 5.4, y: 1.6, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.eleven, bold: true, margin: 0 });

  slide.addText("\"Call Veer and give him a\nstatus update on what we\naccomplished today.\"", {
    x: 5.4, y: 2.1, w: 3.8, h: 0.9,
    fontSize: 14, fontFace: "Calibri", color: C.white, italic: true, margin: 0
  });

  slide.addText([
    { text: "Call Agent reads company memory", options: { bullet: true, breakLine: true, fontSize: 11, color: C.lightGray } },
    { text: "Generates contextual call script", options: { bullet: true, breakLine: true, fontSize: 11, color: C.lightGray } },
    { text: "Approval card \u2192 you approve", options: { bullet: true, breakLine: true, fontSize: 11, color: C.lightGray } },
    { text: "Real phone rings. Real conversation.", options: { bullet: true, breakLine: true, fontSize: 11, color: C.lightGray } },
    { text: "Transcript streams live on dashboard", options: { bullet: true, fontSize: 11, color: C.lightGray } },
  ], { x: 5.4, y: 3.1, w: 3.8, h: 1.3, valign: "top", margin: 0 });

  slide.addText("A real phone call, mid-demo. Powered by ElevenLabs + Twilio.", {
    x: 0.8, y: 4.7, w: 8.4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.eleven, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 8 — LIVE DEMO (transition slide)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };

  slide.addText("LIVE DEMO", {
    x: 0, y: 1.5, w: 10, h: 1.2,
    fontSize: 60, fontFace: "Arial Black", color: C.white, bold: true,
    align: "center", valign: "middle", charSpacing: 10, margin: 0
  });

  slide.addShape(pres.shapes.LINE, { x: 3.5, y: 2.85, w: 3, h: 0, line: { color: C.accent, width: 2 } });

  slide.addText("Watch the agents work in real time.", {
    x: 0, y: 3.1, w: 10, h: 0.5,
    fontSize: 18, fontFace: "Calibri", color: C.gray, align: "center", italic: true, margin: 0
  });

  slide.addText([
    { text: "Command 1: ", options: { bold: true, color: C.accent } },
    { text: "\"Find investors, build a landing page, draft outreach emails.\"", options: { color: C.lightGray } },
    { text: "", options: { breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "Command 2: ", options: { bold: true, color: C.eleven } },
    { text: "\"Call Veer and update him on what we accomplished today.\"", options: { color: C.lightGray } },
  ], {
    x: 1.5, y: 3.8, w: 7, h: 1.2,
    fontSize: 14, fontFace: "Calibri", align: "center", margin: 0
  });
})();

// ============================================================
// SLIDE 9 — MARKET OPPORTUNITY
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  slide.addText("MARKET OPPORTUNITY", {
    x: 0.8, y: 0.3, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Two massive markets. We sit at the intersection.", {
    x: 0.8, y: 0.8, w: 8, h: 0.5,
    fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Market 1 — AI Agents
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 4.2, h: 2.5, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 4.2, h: 0.06, fill: { color: C.accent } });
  slide.addText("AI Agent Orchestration", { x: 1.0, y: 1.75, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.accent, bold: true, margin: 0 });
  slide.addText("$8.5B", { x: 1.0, y: 2.15, w: 2, h: 0.7, fontSize: 42, fontFace: "Arial Black", color: C.white, margin: 0 });
  slide.addText("2026", { x: 3.0, y: 2.35, w: 1.5, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.gray, margin: 0 });
  slide.addText("\u2192", { x: 1.0, y: 2.85, w: 0.5, h: 0.4, fontSize: 20, color: C.accent, margin: 0 });
  slide.addText("$35B", { x: 1.5, y: 2.85, w: 2, h: 0.5, fontSize: 32, fontFace: "Arial Black", color: C.accent, margin: 0 });
  slide.addText("by 2030", { x: 3.4, y: 2.95, w: 1.5, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.gray, margin: 0 });
  slide.addText("CAGR ~42%", { x: 1.0, y: 3.4, w: 3, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.accent2, bold: true, margin: 0 });

  // Market 2 — AI Wearables
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.2, h: 2.5, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.2, h: 0.06, fill: { color: C.accent3 } });
  slide.addText("AI Wearable Devices", { x: 5.4, y: 1.75, w: 3.8, h: 0.35, fontSize: 14, fontFace: "Calibri", color: C.accent3, bold: true, margin: 0 });
  slide.addText("$50B", { x: 5.4, y: 2.15, w: 2, h: 0.7, fontSize: 42, fontFace: "Arial Black", color: C.white, margin: 0 });
  slide.addText("2026", { x: 7.4, y: 2.35, w: 1.5, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.gray, margin: 0 });
  slide.addText("\u2192", { x: 5.4, y: 2.85, w: 0.5, h: 0.4, fontSize: 20, color: C.accent3, margin: 0 });
  slide.addText("$200B+", { x: 5.9, y: 2.85, w: 2, h: 0.5, fontSize: 32, fontFace: "Arial Black", color: C.accent3, margin: 0 });
  slide.addText("by 2030", { x: 7.9, y: 2.95, w: 1.5, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.gray, margin: 0 });
  slide.addText("CAGR ~25%", { x: 5.4, y: 3.4, w: 3, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.accent2, bold: true, margin: 0 });

  // Intersection callout
  slide.addShape(pres.shapes.RECTANGLE, { x: 2.5, y: 4.4, w: 5, h: 0.8, fill: { color: C.bgCard2 }, shadow: makeShadow() });
  slide.addText("Interstice = AI orchestration layer for wearable hardware.\nNo one else sits here.", {
    x: 2.5, y: 4.4, w: 5, h: 0.8,
    fontSize: 13, fontFace: "Calibri", color: C.white, bold: true, align: "center", valign: "middle", margin: 0
  });
})();

// ============================================================
// SLIDE 10 — COMPETITION MATRIX
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  slide.addText("COMPETITIVE LANDSCAPE", {
    x: 0.8, y: 0.3, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, charSpacing: 4, margin: 0
  });

  // Table
  const headerOpts = { fill: { color: C.bgCard2 }, color: C.accent, bold: true, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
  const cellOpts = { fill: { color: C.bgCard }, color: C.lightGray, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
  const cellWin = { fill: { color: "0D2818" }, color: C.accent2, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle", bold: true };
  const cellLose = { fill: { color: C.bgCard }, color: C.dim, fontSize: 11, fontFace: "Calibri", align: "center", valign: "middle" };
  const featureOpts = { fill: { color: C.bgCard }, color: C.white, fontSize: 11, fontFace: "Calibri", valign: "middle", bold: true };

  let tableData = [
    [
      { text: "Feature", options: headerOpts },
      { text: "ChatGPT / Copilot", options: headerOpts },
      { text: "CrewAI / LangChain", options: headerOpts },
      { text: "Interstice", options: { ...headerOpts, color: C.accent2 } },
    ],
    [
      { text: "  Persistent Memory", options: featureOpts },
      { text: "Session only", options: cellLose },
      { text: "Stateless API", options: cellLose },
      { text: "\u2713  --resume sessions", options: cellWin },
    ],
    [
      { text: "  Inter-Agent Comms", options: featureOpts },
      { text: "Single agent", options: cellLose },
      { text: "Basic handoff", options: cellLose },
      { text: "\u2713  Real-time message bus", options: cellWin },
    ],
    [
      { text: "  Background Work", options: featureOpts },
      { text: "Tab must be open", options: cellLose },
      { text: "Script-based", options: cellLose },
      { text: "\u2713  Heartbeat scheduler", options: cellWin },
    ],
    [
      { text: "  Human-in-the-Loop", options: featureOpts },
      { text: "Always or never", options: cellLose },
      { text: "Manual gates", options: cellLose },
      { text: "\u2713  Approval system + voice", options: cellWin },
    ],
    [
      { text: "  Hardware Integration", options: featureOpts },
      { text: "None", options: cellLose },
      { text: "None", options: cellLose },
      { text: "\u2713  OMI wearable", options: cellWin },
    ],
    [
      { text: "  Institutional Knowledge", options: featureOpts },
      { text: "Resets", options: cellLose },
      { text: "Resets", options: cellLose },
      { text: "\u2713  Compounds over time", options: cellWin },
    ],
  ];

  slide.addTable(tableData, {
    x: 0.5, y: 1.0, w: 9, h: 4.2,
    colW: [2.2, 2.2, 2.2, 2.4],
    border: { pt: 0.5, color: C.dim },
    rowH: [0.5, 0.55, 0.55, 0.55, 0.55, 0.55, 0.55],
  });

  slide.addText("We win every row.", {
    x: 0.8, y: 5.1, w: 8, h: 0.3,
    fontSize: 13, fontFace: "Calibri", color: C.accent2, bold: true, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 11 — TEAM
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.accent } });

  slide.addText("THE TEAM", {
    x: 0.8, y: 0.3, w: 8, h: 0.5,
    fontSize: 14, fontFace: "Arial", color: C.accent, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Two people. One AI company running autonomously.", {
    x: 0.8, y: 0.8, w: 8, h: 0.5,
    fontSize: 24, fontFace: "Calibri", color: C.white, bold: true, margin: 0
  });

  // Veer card
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 4.2, h: 3.2, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 1.6, w: 4.2, h: 0.06, fill: { color: C.accent2 } });
  slide.addText("Veer Saraf", { x: 1.0, y: 1.85, w: 3.8, h: 0.5, fontSize: 22, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
  slide.addText("Engineering", { x: 1.0, y: 2.3, w: 3.8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.accent2, margin: 0 });
  slide.addText([
    { text: "Built the entire orchestration system in 24 hours", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Claude CLI subprocess runner with session persistence", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Convex real-time backend + heartbeat scheduler", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Inter-agent message bus architecture", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Perplexity, ElevenLabs, OMI, Twilio integrations", options: { bullet: true, fontSize: 12, color: C.lightGray } },
  ], { x: 1.0, y: 2.7, w: 3.8, h: 2.0, valign: "top", margin: 0 });

  // Varun card
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.2, h: 3.2, fill: { color: C.bgCard }, shadow: makeShadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 1.6, w: 4.2, h: 0.06, fill: { color: C.accent } });
  slide.addText("Varun Kalvakota", { x: 5.4, y: 1.85, w: 3.8, h: 0.5, fontSize: 22, fontFace: "Calibri", color: C.white, bold: true, margin: 0 });
  slide.addText("Strategy & Pitch", { x: 5.4, y: 2.3, w: 3.8, h: 0.3, fontSize: 14, fontFace: "Calibri", color: C.accent, margin: 0 });
  slide.addText([
    { text: "Product positioning & market strategy", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Competitive analysis & moat identification", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Go-to-market & customer segmentation", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "Pitch design & demo narrative", options: { bullet: true, breakLine: true, fontSize: 12, color: C.lightGray } },
    { text: "The voice you're hearing right now", options: { bullet: true, fontSize: 12, color: C.lightGray } },
  ], { x: 5.4, y: 2.7, w: 3.8, h: 2.0, valign: "top", margin: 0 });

  slide.addText("That's the proof of concept \u2014 two people running an AI-powered company.", {
    x: 0.8, y: 5.0, w: 8.4, h: 0.3,
    fontSize: 13, fontFace: "Calibri", color: C.gray, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 12 — CLOSE
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.bg };

  slide.addText("INTERSTICE", {
    x: 0, y: 1.2, w: 10, h: 1.0,
    fontSize: 52, fontFace: "Arial Black", color: C.white, bold: true,
    align: "center", charSpacing: 8, margin: 0
  });

  slide.addShape(pres.shapes.LINE, { x: 3.5, y: 2.35, w: 3, h: 0, line: { color: C.accent, width: 2 } });

  slide.addText("The space between what you want\nand what gets done.", {
    x: 1.5, y: 2.6, w: 7, h: 0.8,
    fontSize: 20, fontFace: "Calibri", color: C.accent, align: "center", italic: true, margin: 0
  });

  slide.addText("We filled it.", {
    x: 0, y: 3.5, w: 10, h: 0.6,
    fontSize: 22, fontFace: "Calibri", color: C.white, align: "center", bold: true, margin: 0
  });

  // Sponsor badges
  slide.addText("Built with  OMI  \u2022  Perplexity Agent API  \u2022  ElevenLabs  \u2022  Convex  \u2022  Claude  \u2022  Twilio", {
    x: 0, y: 4.6, w: 10, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: C.dim, align: "center", margin: 0
  });

  slide.addText("Varun Kalvakota  &  Veer Saraf  |  HackHayward 2026", {
    x: 0, y: 5.0, w: 10, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: C.gray, align: "center", margin: 0
  });
})();

// ============================================================
// GENERATE
// ============================================================
const outputPath = "/Users/veersaraf/Desktop/interstice/interstice/Interstice-Pitch-Deck.pptx";
pres.writeFile({ fileName: outputPath }).then(() => {
  console.log("Pitch deck saved to: " + outputPath);
}).catch(err => {
  console.error("Error:", err);
});
