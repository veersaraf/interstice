import { spawn } from "child_process";
import path from "path";

export interface CodexEvent {
  type: string; // thread.started, item.completed, turn.completed, turn.failed, error
  thread_id?: string;
  item?: {
    type: string;
    text?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cached_input_tokens?: number;
  };
  message?: string;
  error?: { message?: string };
}

export interface CodexRunResult {
  output: string;
  sessionId: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  } | null;
  events: CodexEvent[];
}

// Path to codex CLI
const CODEX_BIN =
  process.env.CODEX_BIN ||
  (process.platform === "win32"
    ? path.join(process.env.APPDATA || "", "npm", "codex.cmd")
    : "codex");

const PROCESS_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Run a Codex CLI subprocess for an agent.
 * Mirrors claude-runner.ts but uses `codex exec --json` with JSONL output.
 */
export async function runCodexAgent(opts: {
  prompt: string;
  sessionId?: string | null;
  cwd?: string;
  model?: string;
  maxTurns?: number;
  onEvent?: (event: CodexEvent) => void;
}): Promise<CodexRunResult> {
  const {
    prompt,
    sessionId,
    cwd,
    model,
    onEvent,
  } = opts;

  const args = ["exec", "--json"];

  // Bypass sandbox for non-interactive agent execution
  args.push("--dangerously-bypass-approvals-and-sandbox");

  // Model selection
  if (model) {
    args.push("--model", model);
  }

  // Session resume or fresh
  if (sessionId) {
    args.push("resume", sessionId, "-");
  } else {
    args.push("-");
  }

  console.log(`[codex-runner] Spawning: codex ${args.join(" ")}`);
  console.log(`[codex-runner] Prompt: ${prompt.substring(0, 100)}...`);

  return new Promise((resolve, reject) => {
    const proc = spawn(CODEX_BIN, args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PATH: getFixedPath() },
      shell: process.platform === "win32",
    });

    let outputText = "";
    let capturedSessionId: string | null = null;
    let usage: CodexRunResult["usage"] = null;
    const events: CodexEvent[] = [];
    let stderrOutput = "";
    let settled = false;

    const killTimer = setTimeout(() => {
      if (!settled) {
        console.error(`[codex-runner] Process timed out after ${PROCESS_TIMEOUT_MS / 1000}s — killing`);
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
          const event: CodexEvent = JSON.parse(trimmed);
          events.push(event);

          // thread.started → session ID
          if (event.type === "thread.started") {
            capturedSessionId = event.thread_id || null;
            console.log(`[codex-runner] Session: ${capturedSessionId}`);
          }

          // item.completed with agent_message → text output
          if (event.type === "item.completed" && event.item) {
            if (event.item.type === "agent_message" && event.item.text) {
              outputText += event.item.text;
            }
          }

          // turn.completed → usage stats
          if (event.type === "turn.completed" && event.usage) {
            usage = {
              inputTokens: event.usage.input_tokens || 0,
              outputTokens: event.usage.output_tokens || 0,
              costUsd: 0, // Codex JSONL doesn't include cost
            };
            console.log(`[codex-runner] Turn completed. Output length: ${outputText.length}`);
          }

          // error / turn.failed
          if (event.type === "error" && event.message) {
            console.error(`[codex-runner] Error: ${event.message}`);
          }
          if (event.type === "turn.failed" && event.error?.message) {
            console.error(`[codex-runner] Turn failed: ${event.error.message}`);
          }

          if (onEvent) {
            onEvent(event);
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

      console.log(`[codex-runner] Process exited with code ${code}. Output: ${outputText.length} chars`);
      if (stderrOutput) {
        console.log(`[codex-runner] stderr: ${stderrOutput.substring(0, 500)}`);
      }

      // Retry with fresh session if session expired
      if (code !== 0 && isCodexUnknownSessionError(stderrOutput) && sessionId) {
        console.log(`[codex-runner] Session ${sessionId} expired, retrying fresh...`);
        runCodexAgent({ ...opts, sessionId: null, onEvent })
          .then(resolve)
          .catch(reject);
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

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function isCodexUnknownSessionError(stderr: string): boolean {
  return /unknown (session|thread)|session .* not found|thread .* not found|conversation .* not found/i.test(stderr);
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
