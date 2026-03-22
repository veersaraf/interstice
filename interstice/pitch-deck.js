const pptxgen = require("pptxgenjs");

let pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Varun Kalvakota & Veer Saraf";
pres.title = "Interstice — Your AI Company, On Your Wrist";

// ============================================================
// COLOR PALETTE — Warm, Premium, Editorial
// Inspired by: soft cream backgrounds, deep charcoal text,
// warm coral accents, airy whitespace, serif typography
// ============================================================
const C = {
  cream:      "FBF8F3",   // warm off-white background
  warmWhite:  "F5F0E8",   // slightly darker cream for cards
  sand:       "EDE6D8",   // subtle card backgrounds
  charcoal:   "1A1A2E",   // deep navy-charcoal for text
  darkText:   "2D2D3F",   // slightly lighter heading text
  bodyText:   "4A4A5A",   // body text gray
  muted:      "9A9AAE",   // muted captions
  coral:      "E07A5F",   // warm coral accent (primary)
  deepCoral:  "C65D3E",   // darker coral
  sage:       "81B29A",   // sage green accent
  deepSage:   "5A9178",   // darker sage
  navy:       "3D405B",   // deep muted navy
  lavender:   "9B8EC4",   // soft purple
  gold:       "D4A574",   // warm gold
  teal:       "4EADA1",   // perplexity-adjacent teal
  amber:      "D4944C",   // elevenlabs-adjacent warm
  white:      "FFFFFF",
  black:      "000000",
};

// Header font: Georgia (elegant serif)
// Body font: Calibri (clean, modern)
const SERIF = "Georgia";
const SANS = "Calibri";

// ============================================================
// SLIDE 1 — TITLE (Cinematic, editorial feel)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.charcoal };

  // Large elegant brand name
  slide.addText([
    { text: "Inter", options: { fontFace: SERIF, fontSize: 72, color: C.cream, bold: false } },
    { text: "stice", options: { fontFace: SERIF, fontSize: 72, color: C.coral, italic: true, bold: false } },
  ], { x: 0, y: 0.8, w: 10, h: 1.5, align: "center", margin: 0 });

  // Thin elegant divider
  slide.addShape(pres.shapes.LINE, { x: 4, y: 2.5, w: 2, h: 0, line: { color: C.coral, width: 1 } });

  // Tagline
  slide.addText("Your AI Company, On Your Wrist", {
    x: 0, y: 2.8, w: 10, h: 0.6,
    fontSize: 22, fontFace: SERIF, color: C.sand, align: "center", italic: true, margin: 0
  });

  // Description
  slide.addText("Speak a command. A team of AI agents that remember,\ncommunicate, and evolve handles the rest while you live your life.", {
    x: 1.5, y: 3.7, w: 7, h: 0.8,
    fontSize: 14, fontFace: SANS, color: C.muted, align: "center", margin: 0
  });

  // Team names — elegant and minimal
  slide.addText("Varun Kalvakota  \u00B7  Veer Saraf", {
    x: 0, y: 4.7, w: 10, h: 0.3,
    fontSize: 13, fontFace: SANS, color: C.muted, align: "center", margin: 0
  });

  // Event
  slide.addText("HackHayward 2026  \u2014  AI-Driven Entrepreneurship", {
    x: 0, y: 5.1, w: 10, h: 0.25,
    fontSize: 10, fontFace: SANS, color: "5A5A6E", align: "center", charSpacing: 2, margin: 0
  });
})();

// ============================================================
// SLIDE 2 — PROBLEM
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  // Section label
  slide.addText("THE PROBLEM", {
    x: 0.9, y: 0.5, w: 4, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.coral, bold: true, charSpacing: 4, margin: 0
  });

  // Big statement — editorial serif
  slide.addText("You\u2019re doing five jobs.", {
    x: 0.9, y: 0.9, w: 8, h: 0.8,
    fontSize: 38, fontFace: SERIF, color: C.charcoal, margin: 0
  });

  slide.addText("AI tools still make you the bottleneck.", {
    x: 0.9, y: 1.6, w: 8, h: 0.6,
    fontSize: 24, fontFace: SERIF, color: C.coral, italic: true, margin: 0
  });

  // Pain cards — clean, minimal with left coral accent
  const pains = [
    { num: "01", title: "Research", desc: "You Google it, read 20 tabs, summarize it yourself." },
    { num: "02", title: "Outreach", desc: "You draft every email, personalize each one manually." },
    { num: "03", title: "Development", desc: "You build the landing page, write the copy, deploy it." },
    { num: "04", title: "Calls", desc: "You make every follow-up call personally." },
    { num: "05", title: "Coordination", desc: "You are the glue holding everything together." },
  ];

  pains.forEach((p, i) => {
    const y = 2.55 + (i * 0.56);
    // Left accent dot
    slide.addShape(pres.shapes.OVAL, { x: 0.9, y: y + 0.13, w: 0.18, h: 0.18, fill: { color: C.coral } });
    // Title
    slide.addText(p.title, { x: 1.25, y: y, w: 1.8, h: 0.45, fontSize: 14, fontFace: SANS, color: C.charcoal, bold: true, valign: "middle", margin: 0 });
    // Description
    slide.addText(p.desc, { x: 3.2, y: y, w: 5.8, h: 0.45, fontSize: 13, fontFace: SANS, color: C.bodyText, valign: "middle", margin: 0 });
  });

  // Bottom quote
  slide.addText("Every AI tool replaced the keyboard with a chatbox \u2014 but kept the bottleneck: you.", {
    x: 0.9, y: 5.1, w: 8, h: 0.3,
    fontSize: 12, fontFace: SERIF, color: C.muted, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 3 — SOLUTION
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("THE SOLUTION", {
    x: 0.9, y: 0.5, w: 4, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.sage, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText([
    { text: "Speak. ", options: { fontFace: SERIF, fontSize: 42, color: C.charcoal } },
    { text: "Delegate. ", options: { fontFace: SERIF, fontSize: 42, color: C.sage, italic: true } },
    { text: "Done.", options: { fontFace: SERIF, fontSize: 42, color: C.charcoal } },
  ], { x: 0.9, y: 0.9, w: 8, h: 1.0, margin: 0 });

  // Flow — horizontal cards with elegant styling
  const steps = [
    { num: "1", label: "You speak", sub: "Voice command\nvia OMI wearable", color: C.coral },
    { num: "2", label: "CEO hears", sub: "AI CEO decomposes\ninto subtasks", color: C.sage },
    { num: "3", label: "Agents run", sub: "Research, Comms, Dev\nexecute in parallel", color: C.lavender },
    { num: "4", label: "They talk", sub: "Agents share findings\n& collaborate mid-task", color: C.gold },
    { num: "5", label: "CEO reports", sub: "Synthesized result\nback through your wrist", color: C.teal },
  ];

  steps.forEach((s, i) => {
    const x = 0.4 + (i * 1.88);
    // Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 2.2, w: 1.72, h: 2.2,
      fill: { color: C.white },
      shadow: { type: "outer", blur: 10, offset: 3, color: "000000", opacity: 0.06 }
    });
    // Top color strip
    slide.addShape(pres.shapes.RECTANGLE, { x: x, y: 2.2, w: 1.72, h: 0.05, fill: { color: s.color } });
    // Number
    slide.addText(s.num, { x: x, y: 2.35, w: 1.72, h: 0.55, fontSize: 32, fontFace: SERIF, color: s.color, align: "center", valign: "middle", italic: true, margin: 0 });
    // Label
    slide.addText(s.label, { x: x + 0.1, y: 2.95, w: 1.52, h: 0.35, fontSize: 12, fontFace: SANS, color: C.charcoal, bold: true, align: "center", valign: "middle", margin: 0 });
    // Sub
    slide.addText(s.sub, { x: x + 0.1, y: 3.35, w: 1.52, h: 0.8, fontSize: 10, fontFace: SANS, color: C.bodyText, align: "center", valign: "top", margin: 0 });

    // Arrow
    if (i < steps.length - 1) {
      slide.addText("\u203A", { x: x + 1.68, y: 2.9, w: 0.25, h: 0.5, fontSize: 22, color: C.muted, align: "center", valign: "middle", margin: 0 });
    }
  });

  // Bottom
  slide.addText("Not a chatbot wrapper. A real AI company with an org chart, memory, and delegation.", {
    x: 0.9, y: 4.65, w: 8, h: 0.4,
    fontSize: 13, fontFace: SERIF, color: C.bodyText, italic: true, margin: 0
  });

  slide.addText("OMI  \u00B7  Perplexity Agent API  \u00B7  ElevenLabs  \u00B7  Convex  \u00B7  Claude  \u00B7  Twilio", {
    x: 0, y: 5.2, w: 10, h: 0.25,
    fontSize: 9, fontFace: SANS, color: C.muted, align: "center", charSpacing: 2, margin: 0
  });
})();

// ============================================================
// SLIDE 4 — NOT AN API CALL (5 Moats)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.charcoal };

  slide.addText("THIS ISN\u2019T AN API CALL", {
    x: 0.9, y: 0.5, w: 8, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.coral, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Five moats that make this\na company, not a wrapper.", {
    x: 0.9, y: 0.9, w: 6, h: 1.0,
    fontSize: 32, fontFace: SERIF, color: C.cream, margin: 0
  });

  const moats = [
    { num: "01", title: "Persistent Sessions", desc: "Agents resume via --resume. They remember everything across heartbeats.", color: C.coral },
    { num: "02", title: "Inter-Agent Comms", desc: "Real-time message bus. Research feeds Dev and Comms mid-task.", color: C.sage },
    { num: "03", title: "4-Layer Memory", desc: "Company memory, contacts, per-agent memory, shared findings channel.", color: C.gold },
    { num: "04", title: "Background Execution", desc: "Heartbeat scheduler + approval gates. They work while you live.", color: C.lavender },
    { num: "05", title: "Wearable-Native", desc: "OMI in, OMI out. Run your company from your wrist.", color: C.teal },
  ];

  moats.forEach((m, i) => {
    const y = 2.15 + (i * 0.65);
    // Number
    slide.addText(m.num, { x: 0.9, y: y, w: 0.55, h: 0.52, fontSize: 18, fontFace: SERIF, color: m.color, italic: true, valign: "middle", margin: 0 });
    // Vertical accent line
    slide.addShape(pres.shapes.LINE, { x: 1.55, y: y + 0.06, w: 0, h: 0.4, line: { color: m.color, width: 1.5 } });
    // Title
    slide.addText(m.title, { x: 1.75, y: y, w: 2.6, h: 0.52, fontSize: 15, fontFace: SANS, color: C.cream, bold: true, valign: "middle", margin: 0 });
    // Description
    slide.addText(m.desc, { x: 4.5, y: y, w: 4.8, h: 0.52, fontSize: 12, fontFace: SANS, color: C.muted, valign: "middle", margin: 0 });
  });

  slide.addText("The judging criteria asks: \u201CIs it more than a basic API call?\u201D  This is our answer.", {
    x: 0.9, y: 5.1, w: 8, h: 0.3,
    fontSize: 11, fontFace: SERIF, color: C.coral, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 5 — MEMORY
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("MEMORY", {
    x: 0.9, y: 0.5, w: 4, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.gold, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("A company brain\nthat never forgets.", {
    x: 0.9, y: 0.85, w: 8, h: 1.0,
    fontSize: 34, fontFace: SERIF, color: C.charcoal, margin: 0
  });

  // 2x2 grid of memory layers
  const layers = [
    { title: "Company Memory", desc: "Shared file all agents read & write.\nIdentity, decisions, activity log.\n\u201CEmail Veer what we did today\u201D\n\u2014 it already knows.", color: C.coral, x: 0.9, y: 2.1 },
    { title: "Contact Memory", desc: "A CRM that builds itself from voice.\nNames, numbers, emails, history.\nSay a name \u2014 it knows who they are\nand what you last discussed.", color: C.sage, x: 5.15, y: 2.1 },
    { title: "Per-Agent Memory", desc: "Each agent carries its own memory\nvia --resume sessions. Research knows\nyour market. Comms knows your voice.\nDev knows your stack.", color: C.lavender, x: 0.9, y: 3.75 },
    { title: "Shared Findings", desc: "Research posts to a shared channel.\nEvery agent reads it instantly.\nCompetitor raises $50M? The entire\ncompany knows in seconds.", color: C.gold, x: 5.15, y: 3.75 },
  ];

  layers.forEach((l) => {
    // Card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: l.x, y: l.y, w: 4.05, h: 1.45,
      fill: { color: C.white },
      shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
    });
    // Left accent bar
    slide.addShape(pres.shapes.RECTANGLE, { x: l.x, y: l.y, w: 0.06, h: 1.45, fill: { color: l.color } });
    // Title
    slide.addText(l.title, { x: l.x + 0.25, y: l.y + 0.1, w: 3.6, h: 0.3, fontSize: 14, fontFace: SANS, color: l.color, bold: true, margin: 0 });
    // Description
    slide.addText(l.desc, { x: l.x + 0.25, y: l.y + 0.45, w: 3.6, h: 0.9, fontSize: 11, fontFace: SANS, color: C.bodyText, margin: 0 });
  });

  slide.addText("\u201CThe company gets smarter every day \u2014 without retraining.\u201D", {
    x: 0.9, y: 5.2, w: 8, h: 0.25,
    fontSize: 12, fontFace: SERIF, color: C.muted, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 6 — PERPLEXITY AGENT API
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("POWERED BY PERPLEXITY", {
    x: 0.9, y: 0.5, w: 8, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.teal, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText([
    { text: "Not basic search.\n", options: { fontFace: SERIF, fontSize: 32, color: C.charcoal } },
    { text: "Autonomous research missions.", options: { fontFace: SERIF, fontSize: 32, color: C.teal, italic: true } },
  ], { x: 0.9, y: 0.85, w: 8, h: 1.1, margin: 0 });

  // Left column — capabilities
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.15, w: 4.05, h: 3.0,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.15, w: 0.06, h: 3.0, fill: { color: C.teal } });

  slide.addText("Agent API Capabilities", { x: 1.2, y: 2.25, w: 3.5, h: 0.3, fontSize: 14, fontFace: SANS, color: C.teal, bold: true, margin: 0 });

  const caps = [
    "Agent API endpoint  \u2014  not basic Sonar",
    "Deep Research preset: 10 autonomous steps",
    "Structured JSON outputs (schema-enforced)",
    "Domain filtering (Crunchbase, LinkedIn)",
    "web_search + fetch_url built-in tools",
    "Multi-model: Claude Opus, GPT-5, Grok",
    "Results consumed by other agents as data",
  ];

  slide.addText(
    caps.map((c, i) => ({ text: c, options: { bullet: true, breakLine: i < caps.length - 1, fontSize: 11, color: C.bodyText } })),
    { x: 1.2, y: 2.65, w: 3.5, h: 2.3, fontFace: SANS, valign: "top", margin: 0, paraSpaceAfter: 6 }
  );

  // Right column — the workflow
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 2.15, w: 4.05, h: 3.0,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.15, y: 2.15, w: 0.06, h: 3.0, fill: { color: C.teal } });

  slide.addText("In Practice", { x: 5.45, y: 2.25, w: 3.5, h: 0.3, fontSize: 14, fontFace: SANS, color: C.teal, bold: true, margin: 0 });

  const flow = [
    { n: "1", t: "\u201CFind 10 AI wearable investors in the Bay Area\u201D" },
    { n: "2", t: "Agent API runs deep-research (10 autonomous steps)" },
    { n: "3", t: "Searches Crunchbase, LinkedIn \u2014 reads full pages" },
    { n: "4", t: "Returns structured JSON: name, firm, email, relevance" },
    { n: "5", t: "Comms Agent reads JSON \u2192 drafts 10 personalized emails" },
    { n: "6", t: "Approval gates \u2192 you approve each send" },
  ];

  flow.forEach((f, i) => {
    const y = 2.7 + (i * 0.38);
    slide.addShape(pres.shapes.OVAL, { x: 5.45, y: y + 0.07, w: 0.22, h: 0.22, fill: { color: C.teal } });
    slide.addText(f.n, { x: 5.45, y: y + 0.03, w: 0.22, h: 0.26, fontSize: 9, fontFace: SANS, color: C.white, bold: true, align: "center", valign: "middle", margin: 0 });
    slide.addText(f.t, { x: 5.8, y: y, w: 3.2, h: 0.35, fontSize: 10, fontFace: SANS, color: C.bodyText, valign: "middle", margin: 0 });
  });

  slide.addText("Not search. An autonomous research department.", {
    x: 0.9, y: 5.2, w: 8, h: 0.25,
    fontSize: 12, fontFace: SERIF, color: C.teal, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 7 — ELEVENLABS
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("POWERED BY ELEVENLABS", {
    x: 0.9, y: 0.5, w: 8, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.amber, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText([
    { text: "Not text-to-speech.\n", options: { fontFace: SERIF, fontSize: 32, color: C.charcoal } },
    { text: "Real AI phone calls.", options: { fontFace: SERIF, fontSize: 32, color: C.amber, italic: true } },
  ], { x: 0.9, y: 0.85, w: 8, h: 1.1, margin: 0 });

  // Left — capabilities
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.15, w: 4.05, h: 2.6,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.15, w: 0.06, h: 2.6, fill: { color: C.amber } });

  slide.addText("Call Agent Capabilities", { x: 1.2, y: 2.25, w: 3.5, h: 0.3, fontSize: 14, fontFace: SANS, color: C.amber, bold: true, margin: 0 });

  const calls = [
    "Conversational AI 2.0 \u2014 not scripted TTS",
    "Native Twilio integration for outbound calls",
    "Sub-100ms turn-taking, natural conversation",
    "Server tools: queries Convex mid-call",
    "Reads company memory during live calls",
    "32+ language auto-detection",
  ];

  slide.addText(
    calls.map((c, i) => ({ text: c, options: { bullet: true, breakLine: i < calls.length - 1, fontSize: 11, color: C.bodyText } })),
    { x: 1.2, y: 2.65, w: 3.5, h: 1.9, fontFace: SANS, valign: "top", margin: 0, paraSpaceAfter: 6 }
  );

  // Right — the demo moment
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 2.15, w: 4.05, h: 2.6,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.15, y: 2.15, w: 0.06, h: 2.6, fill: { color: C.amber } });

  slide.addText("The Demo Moment", { x: 5.45, y: 2.25, w: 3.5, h: 0.3, fontSize: 14, fontFace: SANS, color: C.amber, bold: true, margin: 0 });

  slide.addText("\u201CCall Veer and give him a\nstatus update on what we\naccomplished today.\u201D", {
    x: 5.45, y: 2.65, w: 3.5, h: 0.75,
    fontSize: 14, fontFace: SERIF, color: C.charcoal, italic: true, margin: 0
  });

  const demoSteps = [
    "Call Agent reads company memory",
    "Generates contextual script from today\u2019s data",
    "Approval card \u2192 you approve",
    "A real phone rings. Real conversation.",
    "Transcript streams live on dashboard",
  ];

  slide.addText(
    demoSteps.map((d, i) => ({ text: d, options: { bullet: true, breakLine: i < demoSteps.length - 1, fontSize: 10.5, color: C.bodyText } })),
    { x: 5.45, y: 3.5, w: 3.5, h: 1.15, fontFace: SANS, valign: "top", margin: 0, paraSpaceAfter: 4 }
  );

  slide.addText("A real phone call, mid-demo. That\u2019s not a feature. That\u2019s a statement.", {
    x: 0.9, y: 5.0, w: 8, h: 0.25,
    fontSize: 12, fontFace: SERIF, color: C.amber, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 8 — LIVE DEMO (cinematic transition)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.charcoal };

  slide.addText([
    { text: "Live ", options: { fontFace: SERIF, fontSize: 68, color: C.cream, italic: true } },
    { text: "Demo", options: { fontFace: SERIF, fontSize: 68, color: C.coral } },
  ], { x: 0, y: 1.0, w: 10, h: 1.2, align: "center", margin: 0 });

  slide.addShape(pres.shapes.LINE, { x: 4.2, y: 2.4, w: 1.6, h: 0, line: { color: C.coral, width: 1 } });

  slide.addText("Watch the agents work in real time.", {
    x: 0, y: 2.7, w: 10, h: 0.5,
    fontSize: 16, fontFace: SERIF, color: C.muted, align: "center", italic: true, margin: 0
  });

  // Commands
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 3.5, w: 7, h: 0.7,
    fill: { color: "1F1F33" }
  });
  slide.addText([
    { text: "Command 1   ", options: { fontSize: 11, fontFace: SANS, color: C.coral, bold: true } },
    { text: "\u201CFind investors, build a landing page, draft outreach emails.\u201D", options: { fontSize: 12, fontFace: SERIF, color: C.sand, italic: true } },
  ], { x: 1.7, y: 3.5, w: 6.6, h: 0.7, valign: "middle", margin: 0 });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 4.35, w: 7, h: 0.7,
    fill: { color: "1F1F33" }
  });
  slide.addText([
    { text: "Command 2   ", options: { fontSize: 11, fontFace: SANS, color: C.amber, bold: true } },
    { text: "\u201CCall Veer and update him on what we accomplished today.\u201D", options: { fontSize: 12, fontFace: SERIF, color: C.sand, italic: true } },
  ], { x: 1.7, y: 4.35, w: 6.6, h: 0.7, valign: "middle", margin: 0 });
})();

// ============================================================
// SLIDE 9 — MARKET OPPORTUNITY
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("MARKET OPPORTUNITY", {
    x: 0.9, y: 0.5, w: 8, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.navy, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Two massive markets.\nWe sit at the intersection.", {
    x: 0.9, y: 0.85, w: 8, h: 1.0,
    fontSize: 34, fontFace: SERIF, color: C.charcoal, margin: 0
  });

  // Market 1
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.15, w: 4.05, h: 2.3,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.15, w: 0.06, h: 2.3, fill: { color: C.coral } });

  slide.addText("AI Agent Orchestration", { x: 1.2, y: 2.3, w: 3.5, h: 0.3, fontSize: 13, fontFace: SANS, color: C.coral, bold: true, margin: 0 });
  slide.addText("$8.5B", { x: 1.2, y: 2.65, w: 2.2, h: 0.7, fontSize: 48, fontFace: SERIF, color: C.charcoal, margin: 0 });
  slide.addText("2026", { x: 3.2, y: 2.85, w: 1, h: 0.35, fontSize: 13, fontFace: SANS, color: C.muted, margin: 0 });

  slide.addText("\u2192  $35B by 2030", { x: 1.2, y: 3.4, w: 3.5, h: 0.35, fontSize: 20, fontFace: SERIF, color: C.coral, italic: true, margin: 0 });
  slide.addText("CAGR ~42%", { x: 1.2, y: 3.8, w: 3.5, h: 0.25, fontSize: 11, fontFace: SANS, color: C.sage, bold: true, margin: 0 });

  // Market 2
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 2.15, w: 4.05, h: 2.3,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.15, y: 2.15, w: 0.06, h: 2.3, fill: { color: C.teal } });

  slide.addText("AI Wearable Devices", { x: 5.45, y: 2.3, w: 3.5, h: 0.3, fontSize: 13, fontFace: SANS, color: C.teal, bold: true, margin: 0 });
  slide.addText("$50B", { x: 5.45, y: 2.65, w: 2.2, h: 0.7, fontSize: 48, fontFace: SERIF, color: C.charcoal, margin: 0 });
  slide.addText("2026", { x: 7.45, y: 2.85, w: 1, h: 0.35, fontSize: 13, fontFace: SANS, color: C.muted, margin: 0 });

  slide.addText("\u2192  $200B+ by 2030", { x: 5.45, y: 3.4, w: 3.5, h: 0.35, fontSize: 20, fontFace: SERIF, color: C.teal, italic: true, margin: 0 });
  slide.addText("CAGR ~25%", { x: 5.45, y: 3.8, w: 3.5, h: 0.25, fontSize: 11, fontFace: SANS, color: C.sage, bold: true, margin: 0 });

  // Intersection callout
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 2.2, y: 4.7, w: 5.6, h: 0.65,
    fill: { color: C.charcoal }
  });
  slide.addText("Interstice = orchestration layer for wearable hardware.  No one else sits here.", {
    x: 2.2, y: 4.7, w: 5.6, h: 0.65,
    fontSize: 13, fontFace: SANS, color: C.cream, align: "center", valign: "middle", bold: true, margin: 0
  });
})();

// ============================================================
// SLIDE 10 — COMPETITIVE LANDSCAPE
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.charcoal };

  slide.addText("COMPETITIVE LANDSCAPE", {
    x: 0.9, y: 0.5, w: 8, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.sage, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("We win every row.", {
    x: 0.9, y: 0.85, w: 8, h: 0.6,
    fontSize: 28, fontFace: SERIF, color: C.cream, margin: 0
  });

  // Custom table with shapes
  const cols = [
    { label: "", w: 2.2, x: 0.7 },
    { label: "ChatGPT / Copilot", w: 2.1, x: 2.9 },
    { label: "CrewAI / LangChain", w: 2.1, x: 5.0 },
    { label: "Interstice", w: 2.2, x: 7.1 },
  ];

  // Header row
  const headerY = 1.6;
  cols.forEach((c, i) => {
    const bgColor = i === 3 ? C.sage : "2A2A42";
    const textColor = i === 3 ? C.charcoal : C.muted;
    slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: headerY, w: c.w, h: 0.45, fill: { color: bgColor } });
    if (i > 0) {
      slide.addText(c.label, { x: c.x, y: headerY, w: c.w, h: 0.45, fontSize: 10, fontFace: SANS, color: textColor, bold: true, align: "center", valign: "middle", margin: 0 });
    }
  });

  const rows = [
    { feature: "Persistent Memory", vals: ["Session only", "Stateless API", "\u2713 --resume sessions"] },
    { feature: "Inter-Agent Comms", vals: ["Single agent", "Basic handoff", "\u2713 Real-time msg bus"] },
    { feature: "Background Work", vals: ["Tab open required", "Script-based", "\u2713 Heartbeat scheduler"] },
    { feature: "Human-in-the-Loop", vals: ["Always or never", "Manual gates", "\u2713 Approval + voice"] },
    { feature: "Hardware", vals: ["None", "None", "\u2713 OMI wearable"] },
    { feature: "Knowledge", vals: ["Resets", "Resets", "\u2713 Compounds daily"] },
  ];

  rows.forEach((r, ri) => {
    const y = 2.1 + (ri * 0.48);
    const rowBg = ri % 2 === 0 ? "1E1E34" : "232340";

    cols.forEach((c, ci) => {
      const isWin = ci === 3;
      const bg = isWin ? "1A3328" : rowBg;
      slide.addShape(pres.shapes.RECTANGLE, { x: c.x, y: y, w: c.w, h: 0.45, fill: { color: bg } });

      let text = ci === 0 ? r.feature : r.vals[ci - 1];
      let color = ci === 0 ? C.cream : (isWin ? C.sage : C.muted);
      let bold = ci === 0 || isWin;
      let fontSz = ci === 0 ? 11 : 10;

      slide.addText(text, { x: c.x + 0.1, y: y, w: c.w - 0.2, h: 0.45, fontSize: fontSz, fontFace: SANS, color: color, bold: bold, align: ci === 0 ? "left" : "center", valign: "middle", margin: 0 });
    });
  });
})();

// ============================================================
// SLIDE 11 — TEAM
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.cream };

  slide.addText("THE TEAM", {
    x: 0.9, y: 0.5, w: 4, h: 0.3,
    fontSize: 10, fontFace: SANS, color: C.navy, bold: true, charSpacing: 4, margin: 0
  });

  slide.addText("Two people. One AI company\nrunning autonomously.", {
    x: 0.9, y: 0.85, w: 8, h: 1.0,
    fontSize: 34, fontFace: SERIF, color: C.charcoal, margin: 0
  });

  // Veer card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.9, y: 2.15, w: 4.05, h: 2.9,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 0.9, y: 2.15, w: 0.06, h: 2.9, fill: { color: C.sage } });

  slide.addText("Veer Saraf", { x: 1.2, y: 2.3, w: 3.5, h: 0.45, fontSize: 24, fontFace: SERIF, color: C.charcoal, margin: 0 });
  slide.addText("Engineering", { x: 1.2, y: 2.7, w: 3.5, h: 0.3, fontSize: 13, fontFace: SANS, color: C.sage, italic: true, margin: 0 });

  const veerBullets = [
    "Built the entire system in 24 hours",
    "Claude CLI subprocess runner w/ session persistence",
    "Convex real-time backend + heartbeat scheduler",
    "Inter-agent message bus architecture",
    "Perplexity, ElevenLabs, OMI, Twilio integrations",
  ];
  slide.addText(
    veerBullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < veerBullets.length - 1, fontSize: 11, color: C.bodyText } })),
    { x: 1.2, y: 3.1, w: 3.5, h: 1.8, fontFace: SANS, valign: "top", margin: 0, paraSpaceAfter: 5 }
  );

  // Varun card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.15, y: 2.15, w: 4.05, h: 2.9,
    fill: { color: C.white },
    shadow: { type: "outer", blur: 10, offset: 2, color: "000000", opacity: 0.05 }
  });
  slide.addShape(pres.shapes.RECTANGLE, { x: 5.15, y: 2.15, w: 0.06, h: 2.9, fill: { color: C.coral } });

  slide.addText("Varun Kalvakota", { x: 5.45, y: 2.3, w: 3.5, h: 0.45, fontSize: 24, fontFace: SERIF, color: C.charcoal, margin: 0 });
  slide.addText("Strategy & Pitch", { x: 5.45, y: 2.7, w: 3.5, h: 0.3, fontSize: 13, fontFace: SANS, color: C.coral, italic: true, margin: 0 });

  const varunBullets = [
    "Product positioning & market strategy",
    "Competitive analysis & moat identification",
    "Go-to-market & customer segmentation",
    "Pitch design & demo narrative",
    "The voice you\u2019re hearing right now",
  ];
  slide.addText(
    varunBullets.map((b, i) => ({ text: b, options: { bullet: true, breakLine: i < varunBullets.length - 1, fontSize: 11, color: C.bodyText } })),
    { x: 5.45, y: 3.1, w: 3.5, h: 1.8, fontFace: SANS, valign: "top", margin: 0, paraSpaceAfter: 5 }
  );

  slide.addText("That\u2019s the proof of concept \u2014 two people running an AI-powered company.", {
    x: 0.9, y: 5.2, w: 8, h: 0.25,
    fontSize: 12, fontFace: SERIF, color: C.muted, italic: true, margin: 0
  });
})();

// ============================================================
// SLIDE 12 — CLOSE (Cinematic)
// ============================================================
(() => {
  let slide = pres.addSlide();
  slide.background = { color: C.charcoal };

  slide.addText([
    { text: "Inter", options: { fontFace: SERIF, fontSize: 64, color: C.cream } },
    { text: "stice", options: { fontFace: SERIF, fontSize: 64, color: C.coral, italic: true } },
  ], { x: 0, y: 1.0, w: 10, h: 1.2, align: "center", margin: 0 });

  slide.addShape(pres.shapes.LINE, { x: 4.2, y: 2.35, w: 1.6, h: 0, line: { color: C.coral, width: 1 } });

  slide.addText("The space between what you want\nand what gets done.", {
    x: 1.5, y: 2.65, w: 7, h: 0.8,
    fontSize: 20, fontFace: SERIF, color: C.sand, align: "center", italic: true, margin: 0
  });

  slide.addText("We filled it.", {
    x: 0, y: 3.6, w: 10, h: 0.6,
    fontSize: 24, fontFace: SERIF, color: C.cream, align: "center", bold: true, margin: 0
  });

  slide.addText("OMI  \u00B7  Perplexity Agent API  \u00B7  ElevenLabs  \u00B7  Convex  \u00B7  Claude  \u00B7  Twilio", {
    x: 0, y: 4.6, w: 10, h: 0.25,
    fontSize: 10, fontFace: SANS, color: "5A5A6E", align: "center", charSpacing: 1, margin: 0
  });

  slide.addText("Varun Kalvakota  &  Veer Saraf  \u00B7  HackHayward 2026", {
    x: 0, y: 5.0, w: 10, h: 0.25,
    fontSize: 12, fontFace: SANS, color: C.muted, align: "center", margin: 0
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
