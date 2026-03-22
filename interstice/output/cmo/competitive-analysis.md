# Interstice — Competitive Analysis

## Executive Summary

Interstice occupies a unique position at the intersection of three categories: multi-agent AI orchestration, voice-first AI hardware, and business automation. No existing product combines all three. Our closest architectural peer (Paperclip AI) has no voice or hardware integration. Our closest hardware peers (Humane, Rabbit) are dead or dying with single-agent architectures. Our AI framework peers (CrewAI, LangGraph) are developer tools, not end-user products.

---

## Multi-Agent Orchestration Frameworks

| Framework | What They Do | How We Differ | Our Edge |
|-----------|-------------|---------------|----------|
| **CrewAI** | Role-based agents with "job posting" delegation model | Text-only, developer-facing, no hardware | Voice-first, end-user product, real action execution |
| **AutoGen** (Microsoft) | Conversational multi-agent for code/research | No real-world actions, no wearable, sequential | Parallel execution, inter-agent data sharing, approval gates |
| **LangGraph** | Graph-based state machines for agent workflows | Most technical control, but code-only, no UI | Full dashboard, voice input, real-time visualization |
| **MetaGPT** | Pre-defined software dev agent workflows | Narrow to code generation | General business orchestration across domains |
| **Paperclip AI** | Business orchestration with org charts, budgets, governance | No voice, no wearable, no inter-agent comms bus, no action execution | Voice-native, OMI integration, real-time findings sharing, phone calls + emails |

**Key insight:** All frameworks are tools for developers to build agent systems. Interstice IS the agent system. You don't code it — you speak to it.

---

## AI Wearable Hardware

| Device | Price | Status | Agent Architecture | Our Edge |
|--------|-------|--------|-------------------|----------|
| **Humane AI Pin** | $700 | **Dead** — discontinued Feb 2025, sold to HP | Single agent | Multi-agent. Also: their hardware failed. We use OMI ($89, working). |
| **Rabbit R1** | $199 | Struggling — RabbitOS 2 with limited "Rabbit Intern" agent | Single agent | Multi-agent orchestration. Their "intern" can do one task. Our CEO delegates to 5 specialists. |
| **Ray-Ban Meta Gen 2** | $379 | Working but limited AI | Single Meta AI assistant | Full orchestration, not a Q&A assistant. Real business actions. |
| **OMI Wearable** | $89 | Growing — 250+ apps, open-source, CES 2025 debut | **No orchestration layer** | We ARE the orchestration layer. Not competing with OMI — completing it. |

**Key insight:** The wearable AI market proved that single-agent devices don't work (Humane raised $230M and died). Multi-agent orchestration is the architectural answer.

---

## OMI Ecosystem Gap

**OMI's 250+ apps include:**
- Note-taking and summarization
- Single AI persona chat (Echo Chamber)
- Coding assistants (Soweto)
- Calendar and CRM integrations
- Memory and journaling

**OMI's 250+ apps do NOT include:**
- Multi-agent orchestration
- Agent-to-agent communication
- Business task decomposition and delegation
- Approval-gated real-world actions
- Persistent agent sessions with memory

**Interstice is the first multi-agent orchestration layer for any AI wearable.**

---

## Voice-First AI Assistants (Software)

| Product | What They Do | How We Differ |
|---------|-------------|---------------|
| **Siri / Google Assistant / Alexa** | Single-agent voice commands | No multi-agent, no inter-agent comms, no complex task decomposition |
| **ChatGPT Voice** | Conversational AI with voice | Single agent, no delegation, no real-world actions beyond browsing |
| **Perplexity Voice** | Voice-activated web search | Single purpose (research only), no orchestration |

**Key insight:** Existing voice assistants are single-agent. Interstice is the first voice interface to a multi-agent system.

---

## Market Size

| Metric | Value | Source |
|--------|-------|--------|
| Global wearable AI market (2025) | $32.2B | Grand View Research |
| Projected wearable AI market (2035) | $368.4B | Fact.MR |
| CAGR | 27.6% | Fact.MR |
| AI glasses shipment growth (2025) | +322% YoY | TechNewsWorld |
| OMI developer payouts | $10M+ | BasedHardware |
| OMI platform apps | 250+ | OMI marketplace |

**TAM:** $32B+ (wearable AI infrastructure and applications)
**SAM:** Voice-first AI orchestration for wearables (~$2B, growing with device adoption)
**SOM:** OMI ecosystem orchestration layer (first mover in a 250+ app marketplace with zero orchestration competitors)

---

## Positioning Map

```
                    Multi-Agent
                        │
          Interstice ●  │  ● Paperclip AI
                        │
    Hardware ───────────┼─────────── Software-Only
                        │
     OMI (no orch) ●    │  ● CrewAI
     Humane (dead) ●    │  ● AutoGen
     Rabbit (dying) ●   │  ● LangGraph
                        │
                   Single-Agent
```

**Interstice is alone in the top-left quadrant:** Multi-agent AND hardware-native. No one else is here.

---

## Defensibility

1. **First-mover on OMI orchestration** — 250+ apps, we're the first to do multi-agent
2. **Architectural superiority** — Inter-agent communication (not just parallel execution) is hard to replicate
3. **Approval gate pattern** — Trust framework that enables real-world actions others won't attempt
4. **Session persistence** — Agents remember context across interactions via Claude `--resume`
5. **Skill extensibility** — Drop-in TypeScript skills mean the system grows without rebuilding core
