"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn, timeAgo } from "../../lib/utils";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Card } from "../../components/ui/card";

const roleColors: Record<string, string> = {
  CEO:            "text-amber-700",
  Research:       "text-blue-700",
  Content:        "text-purple-700",
  Outreach:       "text-orange-700",
  Analytics:      "text-cyan-700",
};

export function MessagesPage() {
  const messages = useQuery(api.messages.list);
  const agents = useQuery(api.agents.list);
  const [expandedMsg, setExpandedMsg] = useState<Set<string>>(new Set());

  if (!messages || !agents) {
    return (
      <div className="max-w-[1000px] space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  const toggleExpand = (id: string) => {
    setExpandedMsg((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-[1000px] space-y-4">
      <div className="flex items-center gap-2.5">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Inter-Agent Messages</h1>
        <span className="text-[11px] text-muted-foreground font-medium">{messages.length} messages</span>
      </div>

      <Card className="overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No inter-agent messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Agents communicate here during task execution</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {messages.map((msg) => {
              const from = agentMap.get(msg.from);
              const to = agentMap.get(msg.to);
              const isExpanded = expandedMsg.has(msg._id);
              const isLong = msg.content.length > 150;

              return (
                <div
                  key={msg._id}
                  className={cn("px-4 py-3 hover:bg-accent/20 transition-colors", isLong && "cursor-pointer")}
                  onClick={() => isLong && toggleExpand(msg._id)}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={cn("text-xs font-bold", roleColors[from?.role ?? ""] ?? "text-stone-500")}>
                      {from?.role ?? "Unknown"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <span className={cn("text-xs font-bold", roleColors[to?.role ?? ""] ?? "text-stone-500")}>
                      {to?.role ?? "Unknown"}
                    </span>
                    {msg.channel && (
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-accent">
                        #{msg.channel}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/40 ml-auto tabular-nums">
                      {timeAgo(msg._creationTime)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {isExpanded || !isLong
                      ? msg.content
                      : msg.content.substring(0, 150) + "..."
                    }
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
