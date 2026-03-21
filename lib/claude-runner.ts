import { spawn } from "child_process";
import path from "path";

export interface ClaudeEvent {
  type: "system" | "assistant" | "result";
  subtype?: string;
  session_id?: string;
  model?: string;
  message?: {
    content: Array<{ type: string; text?: string }>;
  };
  result?: string;
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

// Path to claude CLI — adjust if needed
const CLAUDE_BIN =
  process.env.CLAUDE_BIN ||
  (process.platform === "win32"
    ? path.join(
        process.env.APPDATA || "",
        "npm",
        "claude.cmd"
      )
    : "claude");

/**
 * Run a Claude CLI subprocess for an agent.
 *
 * Replicates Paperclip's claude-local adapter:
 * - Spawns `claude --print - --output-format stream-json`
 * - Pipes prompt to stdin
 * - Parses streaming JSON line-by-line
 * - Captures session_id for --resume on next run
 * - Handles session recovery on failure
 */
export async function runAgent(opts: {
  prompt: string;
  systemPromptPath: string;
  sessionId?: string | null;
  cwd?: string;
  skillsDir?: string;
  onEvent?: (event: ClaudeEvent) => void;
}): Promise<RunResult> {
  const { prompt, systemPromptPath, sessionId, cwd, skillsDir, onEvent } = opts;

  const args = [
    "--print",
    "-",
    "--output-format",
    "stream-json",
    "--verbose",
  ];

  // Resume session if we have one
  if (sessionId) {
    args.push("--resume", sessionId);
  }

  // Inject system prompt
  args.push("--append-system-prompt-file", systemPromptPath);

  // Inject skills directory if provided
  if (skillsDir) {
    args.push("--add-dir", skillsDir);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, args, {
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

    proc.stdout.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const event: ClaudeEvent = JSON.parse(line);
          events.push(event);

          // Capture session_id from system init event
          if (event.type === "system" && event.subtype === "init") {
            capturedSessionId = event.session_id || null;
          }

          // Capture assistant text output
          if (event.type === "assistant" && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === "text" && block.text) {
                outputText += block.text;
              }
            }
          }

          // Capture result (final event)
          if (event.type === "result") {
            capturedSessionId = event.session_id || capturedSessionId;
            if (event.usage) {
              usage = {
                inputTokens: event.usage.input_tokens,
                outputTokens: event.usage.output_tokens,
                costUsd: event.cost_usd || 0,
              };
            }
            if (event.result) {
              outputText = event.result;
            }
          }

          // Fire callback for real-time streaming
          if (onEvent) {
            onEvent(event);
          }
        } catch {
          // Not JSON — might be raw text, ignore
        }
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderrOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0 && isUnknownSessionError(stderrOutput) && sessionId) {
        // Session recovery: retry without --resume
        console.log(
          `[claude-runner] Session ${sessionId} expired, retrying fresh...`
        );
        runAgent({
          ...opts,
          sessionId: null,
          onEvent,
        })
          .then(resolve)
          .catch(reject);
        return;
      }

      if (code !== 0 && !outputText) {
        reject(
          new Error(
            `Claude CLI exited with code ${code}: ${stderrOutput}`
          )
        );
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
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
    });

    // Pipe the prompt to stdin
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

/**
 * Check if the error indicates an unknown/expired session.
 * Mirrors Paperclip's isClaudeUnknownSessionError().
 */
function isUnknownSessionError(stderr: string): boolean {
  return (
    stderr.includes("Unknown session") ||
    stderr.includes("session not found") ||
    stderr.includes("Session expired")
  );
}

/**
 * Ensure node and npm are in PATH on Windows.
 */
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
