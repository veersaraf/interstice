"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";

const roleConfig: Record<string, { color: string; bg: string; glow: string; emoji: string }> = {
  CEO:            { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  glow: "rgba(251,191,36,0.4)",  emoji: "👔" },
  Research:       { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  glow: "rgba(96,165,250,0.4)",  emoji: "🔍" },
  Communications: { color: "#c084fc", bg: "rgba(192,132,252,0.1)", glow: "rgba(192,132,252,0.4)", emoji: "📧" },
  Developer:      { color: "#34d399", bg: "rgba(52,211,153,0.1)",  glow: "rgba(52,211,153,0.4)",  emoji: "💻" },
  Call:           { color: "#fb923c", bg: "rgba(251,146,60,0.1)",  glow: "rgba(251,146,60,0.4)",  emoji: "📞" },
};

export function OrgChart() {
  const agents = useQuery(api.agents.list);

  if (!agents) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse" style={{ background: "var(--surface-3)" }} />
        ))}
      </div>
    );
  }

  const ceo = agents.find((a) => a.role === "CEO");
  const specialists = agents.filter((a) => a.role !== "CEO");

  return (
    <div className="p-4">
      {/* CEO */}
      {ceo && (
        <div className="mb-3">
          <AgentCard agent={ceo} size="lg" />
        </div>
      )}

      {/* Delegation lines */}
      <div className="flex items-center gap-0 mb-3 px-2">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <div className="text-[10px] text-gray-700 px-2">delegates to</div>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Specialists */}
      <div className="grid grid-cols-2 gap-2">
        {specialists.map((agent) => (
          <AgentCard key={agent._id} agent={agent} size="sm" />
        ))}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  size,
}: {
  agent: { _id: string; name: string; role: string; title: string; status: string; currentTask?: string };
  size: "lg" | "sm";
}) {
  const cfg = roleConfig[agent.role] ?? { color: "#9ca3af", bg: "rgba(156,163,175,0.1)", glow: "rgba(156,163,175,0.3)", emoji: "🤖" };
  const isActive = agent.status === "active";
  const isError  = agent.status === "error";

  return (
    <div
      className={cn(
        "rounded-lg p-3 transition-all duration-300 relative",
        isActive && "agent-active",
      )}
      style={{
        background: cfg.bg,
        border: `1px solid ${isActive ? cfg.color + "60" : isError ? "#ef444440" : "var(--border)"}`,
        boxShadow: isActive ? `0 0 12px ${cfg.glow}` : "none",
      }}
    >
      {/* Status dot */}
      <div className="absolute -top-1 -right-1">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full border-2",
            isActive  ? "bg-green-400 animate-pulse"
            : isError ? "bg-red-400"
            :            "bg-gray-700"
          )}
          style={{ borderColor: "var(--surface-2)" }}
        />
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className={size === "lg" ? "text-xl" : "text-base"}>{cfg.emoji}</span>
        <div className="min-w-0">
          <div
            className={cn("font-semibold truncate", size === "lg" ? "text-sm" : "text-xs")}
            style={{ color: cfg.color }}
          >
            {agent.role}
          </div>
          <div className="text-[10px] text-gray-600 truncate">{agent.title}</div>
        </div>
      </div>

      {isActive && agent.currentTask && (
        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 italic leading-tight">
          {agent.currentTask}
        </p>
      )}

      {isError && (
        <p className="text-[10px] text-red-400 mt-1">error state</p>
      )}
    </div>
  );
}
