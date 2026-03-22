"use client";

import { useState } from "react";
import { Send, Mic } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell your team what to do..."
            className={cn(
              "w-full h-10 px-4 pr-10 rounded-lg text-sm",
              "bg-secondary/50 border border-border text-foreground",
              "placeholder:text-muted-foreground/40",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40",
              "transition-all"
            )}
            disabled={sending}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Mic className="w-3.5 h-3.5 text-muted-foreground/25" />
          </div>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={!command.trim() || sending}
          className={cn(
            "h-10 px-5 gap-2 text-xs font-medium rounded-lg",
            command.trim() && !sending
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground"
          )}
        >
          <Send className="w-3.5 h-3.5" />
          {sending ? "Sending..." : "Send"}
        </Button>
      </form>

      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  );
}
