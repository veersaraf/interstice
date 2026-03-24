import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export interface ClaudeEvent {
  type: string;
  subtype?: string;
  session_id?: string;
  model?: string;
  message?: {
    content: Array<{ type: string; text?: string }>;
  };
  result?: string;
  total_cost_usd?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
  };
  cost_usd?: number;
}

export interface RunResult {
  output: string;
  sessionId: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  } | null;
  events: ClaudeEvent[];
}

// ============================================================
// ALL AGENTS NOW USE CODEX CLI WITH GPT-5.3-CODEX
// This file kept for interface compatibility — it spawns codex, not claude.
// ============================================================
const CODEX_BIN =
  process.env.CODEX_BIN ||
  (process.platform === "win32"
    ? path.join(process.env.APPDATA || "", "npm", "codex.cmd")
    : "codex");

const DEFAULT_MODEL = "gpt-5.3-codex";
const PROCESS_TIMEOUT_MS = 5 * 60 * 1000;

export async function runAgent(opts: {
  prompt: string;
  systemPromptPath: string;
  sessionId?: string | null;
  cwd?: string;
  skillsDir?: string;
  maxTurns?: number;
  allowedTools?: string[];
  disableTools?: boolean;
  onEvent?: (event: ClaudeEvent) => void;
}): Promise<RunResult> {
  const { prompt, systemPromptPath, cwd, onEvent } = opts;

  // Prepend system prompt to the user prompt (Codex doesn't have --append-system-prompt-file)
  let fullPrompt = prompt;
  try {
    const sysPrompt = fs.readFileSync(systemPromptPath, "utf-8");
    fullPrompt = `<system>\n${sysPrompt}\n</system>\n\n${prompt}`;
  } catch {
    // System prompt file not found — use raw prompt
  }

  const args = ["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", DEFAULT_MODEL, "-"];

  console.log(`[claude-runner→codex] Spawning: codex ${args.join(" ")}`);
  console.log(`[claude-runner→codex] Prompt: ${fullPrompt.substring(0, 100)}...`);

  return new Promise((resolve, reject) => {
    const proc = spawn(CODEX_BIN, args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PATH: getFixedPath() },
      shell: process.platform === "win32",
    });

    let outputText = "";
    let capturedSessionId: string | null = null;
    let usage: RunResult["usage"] = null;
    const events: ClaudeEvent[] = [];
    let stderrOutput = "";
    let settled = false;

    const killTimer = setTimeout(() => {
      if (!settled) {
        console.error(`[claude-runner→codex] Timed out after ${PROCESS_TIMEOUT_MS / 1000}s — killing`);
        proc.kill("SIGKILL");
        settled = true;
        reject(new Error(`Codex CLI timed out after ${PROCESS_TIMEOUT_MS / 1000}s`));
      }
    }, PROCESS_TIMEOUT_MS);

    let buffer = "";

    proc.stdout.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event = JSON.parse(trimmed);

          // Map Codex events to ClaudeEvent-compatible shape
          if (event.type === "thread.started") {
            capturedSessionId = event.thread_id || null;
            console.log(`[claude-runner→codex] Session: ${capturedSessionId}`);
          }

          if (event.type === "item.completed" && event.item?.type === "agent_message" && event.item.text) {
            outputText += event.item.text;
            // Fire callback for real-time streaming
            if (onEvent) {
              onEvent({
                type: "assistant",
                message: { content: [{ type: "text", text: event.item.text }] },
              });
            }
          }

          if (event.type === "turn.completed" && event.usage) {
            usage = {
              inputTokens: event.usage.input_tokens || 0,
              outputTokens: event.usage.output_tokens || 0,
              costUsd: 0,
            };
            console.log(`[claude-runner→codex] Turn completed. Output: ${outputText.length} chars`);
          }

          if (event.type === "error" && event.message) {
            console.error(`[claude-runner→codex] Error: ${event.message}`);
          }
        } catch {
          // Not JSON — ignore
        }
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);

      console.log(`[claude-runner→codex] Exited code ${code}. Output: ${outputText.length} chars`);
      if (stderrOutput) {
        console.log(`[claude-runner→codex] stderr: ${stderrOutput.substring(0, 500)}`);
      }

      // Windows DLL init crash — retry or fail with clear message
      if (code !== null && isWindowsCrashCode(code)) {
        reject(new Error(
          `Codex CLI crashed (Windows code ${code}). Too many processes or system resources exhausted.`
        ));
        return;
      }

      if (code !== 0 && !outputText) {
        reject(new Error(`Codex CLI exited with code ${code}: ${stderrOutput}`));
        return;
      }

      resolve({
        output: outputText,
        sessionId: capturedSessionId,
        usage,
        events,
      });
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      reject(new Error(`Failed to spawn Codex CLI: ${err.message}`));
    });

    proc.stdin.write(fullPrompt);
    proc.stdin.end();
  });
}

function isWindowsCrashCode(code: number): boolean {
  const WINDOWS_CRASH_CODES = [3221225794, 3221225477];
  return WINDOWS_CRASH_CODES.includes(code);
}

function getFixedPath(): string {
  const currentPath = process.env.PATH || "";
  if (process.platform === "win32") {
    const nodePath = "C:\\Program Files\\nodejs";
    const npmPath = path.join(process.env.APPDATA || "", "npm");
    if (!currentPath.includes(nodePath)) {
      return `${nodePath};${npmPath};${currentPath}`;
    }
  }
  return currentPath;
}
