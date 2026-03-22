"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Zap, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

const roleConfig: Record<string, { initials: string; color: string; dimBg: string; ring: string }> = {
  CEO:            { initials: "CEO", color: "text-amber-700",   dimBg: "bg-amber-50",   ring: "ring-amber-300" },
  Research:       { initials: "RES", color: "text-blue-700",    dimBg: "bg-blue-50",    ring: "ring-blue-300" },
  Communications: { initials: "COM", color: "text-purple-700",  dimBg: "bg-purple-50",  ring: "ring-purple-300" },
  Developer:      { initials: "DEV", color: "text-emerald-700", dimBg: "bg-emerald-50", ring: "ring-emerald-300" },
  Call:           { initials: "CAL", color: "text-orange-700",  dimBg: "bg-orange-50",  ring: "ring-orange-300" },
};

export function OrgChart() {
  const agents = useQuery(api.agents.list);

  if (!agents) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const ceo = agents.find((a) => a.role === "CEO");
  const specialists = agents.filter((a) => a.role !== "CEO");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4">
        {/* CEO */}
        {ceo && (
          <div className="mb-3">
            <AgentNode agent={ceo} size="lg" />
          </div>
        )}

        {/* Delegation line */}
        <div className="flex items-center gap-0 mb-3 px-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-muted-foreground px-2.5 font-medium">delegates to</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Specialists */}
        <div className="grid grid-cols-2 gap-2">
          {specialists.map((agent) => (
            <AgentNode key={agent._id} agent={agent} size="sm" />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function AgentNode({
  agent,
  size,
}: {
  agent: { _id: string; name: string; role: string; title: string; status: string; currentTask?: string };
  size: "lg" | "sm";
}) {
  const cfg = roleConfig[agent.role] ?? { initials: "??", color: "text-stone-500", dimBg: "bg-stone-50", ring: "ring-stone-300" };
  const isActive = agent.status === "active";
  const isError = agent.status === "error";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "rounded-lg p-3 transition-all duration-300 relative border",
            cfg.dimBg,
            isActive
              ? "border-emerald-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
              : isError
                ? "border-red-500/30"
                : "border-border",
            isActive && "agent-active"
          )}
        >
          {/* Status indicator */}
          <div className="absolute -top-1 -right-1">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full ring-2 ring-card",
                isActive ? "bg-emerald-400 animate-pulse"
                : isError ? "bg-red-400"
                : "bg-zinc-700"
              )}
            />
          </div>

          <div className="flex items-center gap-2.5 mb-1">
            {/* Avatar circle */}
            <div className={cn(
              "rounded-full flex items-center justify-center shrink-0 ring-1",
              cfg.dimBg, cfg.ring,
              size === "lg" ? "w-9 h-9" : "w-7 h-7",
            )}>
              <span className={cn(cfg.color, "font-bold select-none", size === "lg" ? "text-xs" : "text-[9px]")}>
                {cfg.initials}
              </span>
            </div>
            <div className="min-w-0">
              <div className={cn("font-semibold truncate", cfg.color, size === "lg" ? "text-sm" : "text-xs")}>
                {agent.role}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{agent.title}</div>
            </div>
          </div>

          {isActive && agent.currentTask && (
            <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2 italic leading-tight">
              {agent.currentTask}
            </p>
          )}

          {isError && (
            <div className="flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 text-red-600" />
              <p className="text-[10px] text-red-600 font-medium">error state</p>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="text-xs">
          <p className="font-semibold">{agent.name}</p>
          <p className="text-muted-foreground">{agent.title} — {agent.status}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
