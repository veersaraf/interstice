"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

const roleConfig: Record<
  string,
  { color: string; bg: string; activeBg: string; label: string; avatar: string }
> = {
  CEO: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200/60",
    activeBg: "bg-amber-100 border-amber-300 shadow-amber-200/40",
    label: "CEO",
    avatar: "/avatars/ceo.png",
  },
  Research: {
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200/60",
    activeBg: "bg-blue-100 border-blue-300 shadow-blue-200/40",
    label: "Research",
    avatar: "/avatars/research.png",
  },
  Content: {
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-200/60",
    activeBg: "bg-purple-100 border-purple-300 shadow-purple-200/40",
    label: "Content",
    avatar: "/avatars/content.png",
  },
  Outreach: {
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200/60",
    activeBg: "bg-orange-100 border-orange-300 shadow-orange-200/40",
    label: "Outreach",
    avatar: "/avatars/outreach.png",
  },
  Analytics: {
    color: "text-cyan-700",
    bg: "bg-cyan-50 border-cyan-200/60",
    activeBg: "bg-cyan-100 border-cyan-300 shadow-cyan-200/40",
    label: "Analytics",
    avatar: "/avatars/analytics.png",
  },
};

export function AgentStatusBar() {
  const agents = useQuery(api.agents.list);

  if (!agents) {
    return (
      <div className="flex items-center gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-full bg-stone-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {agents.map((agent) => {
        const cfg = roleConfig[agent.role];
        if (!cfg) return null;

        const isActive = agent.status === "active";
        const isError = agent.status === "error";
        const isDone = agent.currentTask === null && agent.status === "idle";

        return (
          <div
            key={agent._id}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
              isActive
                ? cn(cfg.activeBg, "shadow-sm")
                : isError
                  ? "bg-red-50 border-red-200/60 text-red-700"
                  : cn(cfg.bg, "opacity-60")
            )}
          >
            {/* Avatar */}
            <img
              src={cfg.avatar}
              alt={cfg.label}
              className="w-5 h-5 rounded-full object-cover"
            />

            {/* Label */}
            <span className={cn(isActive ? cfg.color : isError ? "text-red-700" : "text-stone-500")}>
              {cfg.label}
            </span>

            {/* Status indicator */}
            {isActive && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
            {isError && (
              <span className="inline-flex rounded-full h-2 w-2 bg-red-500" />
            )}
            {isDone && !isActive && !isError && (
              <Check className="w-3 h-3 text-stone-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
