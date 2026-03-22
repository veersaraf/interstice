"use client";

import { useState } from "react";
import { Send, Mic } from "lucide-react";
import { cn } from "../../lib/utils";

export function CommandInput() {
  const [command, setCommand]   = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      if (res.ok) {
        setCommand("");
      } else {
        setError("Failed to send — check the server is running");
      }
    } catch {
      setError("Could not reach server");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Give your AI team a command… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className={cn(
              "w-full resize-none rounded-lg px-4 py-3 pr-10 text-sm text-white",
              "placeholder-gray-600 focus:outline-none transition-colors",
              "leading-relaxed",
            )}
            style={{
              background: "var(--surface-3)",
              border: "1px solid var(--border)",
              minHeight: "44px",
              maxHeight: "120px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            disabled={sending}
          />
          {/* OMI indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Mic className="w-3.5 h-3.5 text-gray-700" />
          </div>
        </div>

        <button
          type="submit"
          disabled={!command.trim() || sending}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          )}
          style={{
            background: command.trim() && !sending ? "#2563eb" : "var(--surface-3)",
            border: "1px solid var(--border)",
            color: command.trim() && !sending ? "white" : "var(--text-muted)",
          }}
        >
          <Send className="w-3.5 h-3.5" />
          <span>{sending ? "Sending…" : "Send"}</span>
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
