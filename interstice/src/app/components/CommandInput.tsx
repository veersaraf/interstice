"use client";

import { useState } from "react";
import { Send, Mic, Link2 } from "lucide-react";
import { cn } from "../../lib/utils";

export function CommandInput() {
  const [command, setCommand] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = command.trim();
    if (!text || sending) return;

    const payload: { command: string; url?: string } = { command: text };
    if (url.trim()) payload.url = url.trim();

    setSending(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCommand("");
        setUrl("");
        setShowUrl(false);
      }
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Main input row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="What do you need?"
              className={cn(
                "w-full h-12 px-4 pr-10 rounded-xl text-sm",
                "bg-white border border-stone-200 text-foreground",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
                "transition-all shadow-sm"
              )}
              disabled={sending}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowUrl(!showUrl)}
                className={cn(
                  "p-1 rounded-md transition-colors",
                  showUrl
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground/30 hover:text-muted-foreground/60"
                )}
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <Mic className="w-3.5 h-3.5 text-muted-foreground/25" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!command.trim() || sending}
            className={cn(
              "h-12 px-5 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shrink-0",
              command.trim() && !sending
                ? "bg-primary text-white hover:bg-primary/90 shadow-sm btn-retro"
                : "bg-stone-100 text-stone-300 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>

        {/* URL input (collapsible) */}
        {showUrl && (
          <div className="animate-slide-up">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a product URL to analyze..."
              className={cn(
                "w-full h-10 px-4 rounded-lg text-xs",
                "bg-stone-50 border border-stone-200/80 text-foreground",
                "placeholder:text-muted-foreground/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30",
                "transition-all"
              )}
            />
          </div>
        )}
      </form>
    </div>
  );
}
