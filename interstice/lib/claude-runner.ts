import { spawn } from "child_process";
import path from "path";

export interface ClaudeEvent {
  type: string; // system, assistant, result, rate_limit_event, etc.
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

// Path to claude CLI
const CLAUDE_BIN =
  process.env.CLAUDE_BIN ||
  (process.platform === "win32"
    ? path.join(process.env.APPDATA || "", "npm", "claude.cmd")
    : "claude");

/**
 * Run a Claude CLI subprocess for an agent.
 */
const PROCESS_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — kill hung Claude processes

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
  const {
    prompt,
    systemPromptPath,
    sessionId,
    cwd,
    skillsDir,
    maxTurns = 3,
    allowedTools,
    disableTools,
    onEvent,
  } = opts;

  const args = [
    "--print",
    "-",
    "--output-format",
    "stream-json",
    "--verbose",
    "--max-turns",
    String(maxTurns),
  ];

  // Disable all tools for agents that only need text output (e.g., CEO)
  if (disableTools) {
    args.push("--disallowedTools",
      "Bash", "Read", "Write", "Edit", "Glob", "Grep",
      "WebSearch", "WebFetch", "Agent", "TodoWrite", "NotebookEdit"
    );
  } else if (allowedTools && allowedTools.length > 0) {
    // Pre-approve tools so agents can run without interactive permission prompts
    args.push("--allowedTools", ...allowedTools);
  }

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

  console.log(`[claude-runner] Spawning: claude ${args.join(" ")}`);
  console.log(`[claude-runner] Prompt: ${prompt.substring(0, 100)}...`);

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
    let settled = false;

    // Kill the process if it hangs beyond the timeout
    const killTimer = setTimeout(() => {
      if (!settled) {
        console.error(`[claude-runner] Process timed out after ${PROCESS_TIMEOUT_MS / 1000}s — killing`);
        proc.kill("SIGKILL");
        settled = true;
        reject(new Error(`Claude CLI timed out after ${PROCESS_TIMEOUT_MS / 1000}s`));
      }
    }, PROCESS_TIMEOUT_MS);

    // Buffer for incomplete JSON lines
    let buffer = "";

    proc.stdout.on("data", (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const event: ClaudeEvent = JSON.parse(trimmed);
          events.push(event);

          // Capture session_id from system init event
          if (event.type === "system" && event.subtype === "init") {
            capturedSessionId = event.session_id || null;
            console.log(
              `[claude-runner] Session: ${capturedSessionId}`
            );
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
            // Use event.result if present, otherwise keep accumulated assistant text
            if (event.result && event.result.trim()) {
              outputText = event.result;
            }
            const costUsd =
              event.total_cost_usd || event.cost_usd || 0;
            usage = {
              inputTokens: event.usage?.input_tokens || 0,
              outputTokens: event.usage?.output_tokens || 0,
              costUsd,
            };
            console.log(
              `[claude-runner] Result received. Output length: ${outputText.length}`
            );
          }

          // Fire callback for real-time streaming
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

      console.log(
        `[claude-runner] Process exited with code ${code}. Output: ${outputText.length} chars`
      );
      if (outputText.length < 200) {
        console.log(`[claude-runner] Output text: "${outputText}"`);
      }
      if (stderrOutput) {
        console.log(`[claude-runner] stderr: ${stderrOutput.substring(0, 500)}`);
      }

      // Windows DLL init failure (0xC0000142 = 3221225794) or other Windows crash codes.
      // These happen when too many processes are running or sessions are bloated.
      // If we were using --resume, retry once without it. Otherwise, fail hard.
      if (code !== null && isWindowsCrashCode(code)) {
        if (sessionId) {
          console.log(
            `[claude-runner] Windows crash code ${code} with session — retrying fresh (no --resume)...`
          );
          runAgent({ ...opts, sessionId: null, onEvent })
            .then(resolve)
            .catch(reject);
          return;
        }
        // Already running without session — this is a system resource issue
        reject(
          new Error(
            `Claude CLI crashed (Windows code ${code}). Too many processes or system resources exhausted. ` +
            `Try closing other applications or waiting a moment.`
          )
        );
        return;
      }

      if (code !== 0 && isUnknownSessionError(stderrOutput) && sessionId) {
        console.log(
          `[claude-runner] Session ${sessionId} expired, retrying fresh...`
        );
        runAgent({ ...opts, sessionId: null, onEvent })
          .then(resolve)
          .catch(reject);
        return;
      }

      // Detect API errors returned as output text
      if (outputText.startsWith("API Error:") || outputText.startsWith("Not logged in")) {
        reject(new Error(outputText.trim()));
        return;
      }

      if (code !== 0 && !outputText) {
        console.error(`[claude-runner] stderr: ${stderrOutput}`);
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
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}`));
    });

    // Pipe the prompt to stdin
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function isWindowsCrashCode(code: number): boolean {
  // 0xC0000142 = STATUS_DLL_INIT_FAILED — system can't start the process
  // 0xC0000005 = STATUS_ACCESS_VIOLATION — process crashed
  const WINDOWS_CRASH_CODES = [3221225794, 3221225477];
  return WINDOWS_CRASH_CODES.includes(code);
}

function isUnknownSessionError(stderr: string): boolean {
  return (
    stderr.includes("Unknown session") ||
    stderr.includes("session not found") ||
    stderr.includes("Session expired")
  );
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
