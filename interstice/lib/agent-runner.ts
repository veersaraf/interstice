/**
 * Unified agent runner — dispatches to Claude or Codex based on adapter type.
 * Provides a common interface so heartbeat.ts doesn't need to know which LLM backend is in use.
 */

import { runAgent as runClaudeAgent, type RunResult, type ClaudeEvent } from "./claude-runner";
import { runCodexAgent, type CodexRunResult, type CodexEvent } from "./codex-runner";

export type AdapterType = "claude" | "codex";

export interface AgentRunOptions {
  /** Which LLM backend to use */
  adapter: AdapterType;
  /** The prompt to send */
  prompt: string;
  /** System prompt markdown file (Claude only — Codex uses prompt directly) */
  systemPromptPath?: string;
  /** Resume a previous session */
  sessionId?: string | null;
  /** Working directory */
  cwd?: string;
  /** Skills directory (Claude only) */
  skillsDir?: string;
  /** Max turns per run */
  maxTurns?: number;
  /** Pre-approved tools (Claude only) */
  allowedTools?: string[];
  /** Disable all tools (Claude only) */
  disableTools?: boolean;
  /** Model override (e.g. "gpt-5.3-codex", "claude-sonnet-4-6") */
  model?: string;
  /** Real-time event callback — normalized to a common shape */
  onOutput?: (text: string) => void;
}

export interface AgentRunResult {
  output: string;
  sessionId: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  } | null;
}

/**
 * Run an agent using the specified adapter (Claude or Codex).
 * Returns a unified result regardless of backend.
 */
export async function runAgentUnified(opts: AgentRunOptions): Promise<AgentRunResult> {
  if (opts.adapter === "codex") {
    return runWithCodex(opts);
  }
  return runWithClaude(opts);
}

async function runWithClaude(opts: AgentRunOptions): Promise<AgentRunResult> {
  if (!opts.systemPromptPath) {
    throw new Error("systemPromptPath is required for Claude adapter");
  }

  const onEvent = opts.onOutput
    ? (event: ClaudeEvent) => {
        if (event.type === "assistant" && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "text" && block.text) {
              opts.onOutput!(block.text);
            }
          }
        }
      }
    : undefined;

  const result: RunResult = await runClaudeAgent({
    prompt: opts.prompt,
    systemPromptPath: opts.systemPromptPath,
    sessionId: opts.sessionId,
    cwd: opts.cwd,
    skillsDir: opts.skillsDir,
    maxTurns: opts.maxTurns,
    allowedTools: opts.allowedTools,
    disableTools: opts.disableTools,
    onEvent,
  });

  return {
    output: result.output,
    sessionId: result.sessionId,
    usage: result.usage,
  };
}

async function runWithCodex(opts: AgentRunOptions): Promise<AgentRunResult> {
  // For Codex, we prepend the system prompt content to the prompt if a path is given
  let fullPrompt = opts.prompt;
  if (opts.systemPromptPath) {
    try {
      const fs = await import("fs/promises");
      const systemPrompt = await fs.readFile(opts.systemPromptPath, "utf-8");
      fullPrompt = `<system>\n${systemPrompt}\n</system>\n\n${opts.prompt}`;
    } catch {
      // System prompt file not found — proceed with just the prompt
      console.warn(`[agent-runner] Could not read system prompt: ${opts.systemPromptPath}`);
    }
  }

  const onEvent = opts.onOutput
    ? (event: CodexEvent) => {
        if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
          opts.onOutput!(event.item.text);
        }
      }
    : undefined;

  const result: CodexRunResult = await runCodexAgent({
    prompt: fullPrompt,
    sessionId: opts.sessionId,
    cwd: opts.cwd,
    model: opts.model,
    onEvent,
  });

  return {
    output: result.output,
    sessionId: result.sessionId,
    usage: result.usage,
  };
}
