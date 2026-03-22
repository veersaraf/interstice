"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/utils";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useState } from "react";

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

export function MessagesPage() {
  const messages = useQuery(api.messages.list);
  const agents = useQuery(api.agents.list);
  const [expandedMsg, setExpandedMsg] = useState<Set<string>>(new Set());

  if (!messages || !agents) {
    return (
      <div className="max-w-[1000px] space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
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
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h1 className="text-sm font-semibold text-white">Inter-Agent Messages</h1>
        <span className="text-[11px] text-gray-500 font-medium">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="w-8 h-8 text-gray-700 mb-3" />
            <p className="text-sm text-gray-500">No inter-agent messages yet</p>
            <p className="text-xs text-gray-600 mt-1">Agents communicate here during task execution</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {messages.map((msg) => {
              const from = agentMap.get(msg.from);
              const to = agentMap.get(msg.to);
              const isExpanded = expandedMsg.has(msg._id);
              const isLong = msg.content.length > 150;

              return (
                <div
                  key={msg._id}
                  className={cn("px-4 py-3 hover:bg-white/[0.015] transition-colors", isLong && "cursor-pointer")}
                  onClick={() => isLong && toggleExpand(msg._id)}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={cn("text-xs font-bold", roleColors[from?.role ?? ""] ?? "text-gray-400")}>
                      {from?.role ?? "Unknown"}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-700" />
                    <span className={cn("text-xs font-bold", roleColors[to?.role ?? ""] ?? "text-gray-400")}>
                      {to?.role ?? "Unknown"}
                    </span>
                    {msg.channel && (
                      <span className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded-full bg-white/5">
                        #{msg.channel}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-700 ml-auto tabular-nums">
                      {timeAgo(msg._creationTime)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                    {isExpanded || !isLong
                      ? msg.content
                      : msg.content.substring(0, 150) + "…"
                    }
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
