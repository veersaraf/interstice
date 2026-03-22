"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Network, Zap, AlertCircle, Clock, FileText, Cpu, Settings } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const roleConfig: Record<string, { initials: string; color: string; dimBg: string; ring: string }> = {
  CEO:            { initials: "CEO", color: "text-amber-700",   dimBg: "bg-amber-50",   ring: "ring-amber-300" },
  Research:       { initials: "RES", color: "text-blue-700",    dimBg: "bg-blue-50",    ring: "ring-blue-300" },
  Communications: { initials: "COM", color: "text-purple-700",  dimBg: "bg-purple-50",  ring: "ring-purple-300" },
  Developer:      { initials: "DEV", color: "text-emerald-700", dimBg: "bg-emerald-50", ring: "ring-emerald-300" },
  Call:           { initials: "CAL", color: "text-orange-700",  dimBg: "bg-orange-50",  ring: "ring-orange-300" },
};

const claudeModels = [
  { id: "claude-opus-4-6", label: "Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
];

const codexModels = [
  { id: "", label: "Default" },
  { id: "o3", label: "o3" },
  { id: "o4-mini", label: "o4-mini" },
  { id: "gpt-5-mini", label: "GPT-5 Mini" },
];

function AdapterSelector({ agentId, currentAdapter, currentModel }: {
  agentId: Id<"agents">;
  currentAdapter?: "claude" | "codex";
  currentModel?: string;
}) {
  const setAdapter = useMutation(api.agents.setAdapter);
  const [expanded, setExpanded] = useState(false);
  const adapter = currentAdapter || "codex";
  const models = adapter === "codex" ? codexModels : claudeModels;

  const handleAdapterChange = async (newAdapter: "claude" | "codex") => {
    // Don't set a default model — let each backend use its own default
    await setAdapter({ id: agentId, adapterType: newAdapter, model: "" });
  };

  const handleModelChange = async (model: string) => {
    await setAdapter({ id: agentId, model });
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="w-3 h-3" />
        <Cpu className="w-3 h-3" />
        <span className="font-medium">
          {adapter === "codex" ? "Codex" : "Claude"}
          {currentModel && <span className="text-muted-foreground/60 ml-1">({models.find(m => m.id === currentModel)?.label || currentModel})</span>}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1">
            {(["claude", "codex"] as const).map((a) => (
              <button
                key={a}
                onClick={() => handleAdapterChange(a)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border",
                  adapter === a
                    ? a === "claude"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-green-50 text-green-700 border-green-200"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {a === "claude" ? "Claude" : "Codex"}
              </button>
            ))}
          </div>

          <select
            value={currentModel || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full text-[10px] bg-muted text-foreground border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Default model</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.label} ({m.id})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function AgentsPage() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activity.list, { limit: 100 });

  if (!agents) {
    return (
      <div className="max-w-[1100px] space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Network className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold text-foreground">Agents</h1>
        <span className="text-[11px] text-muted-foreground font-medium">{agents.length} total</span>
        {activeCount > 0 && (
          <Badge variant="success">{activeCount} active</Badge>
        )}
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const cfg = roleConfig[agent.role] ?? { initials: "??", color: "text-stone-500", dimBg: "bg-stone-50", ring: "ring-stone-300" };
          const isActive = agent.status === "active";
          const isError = agent.status === "error";
          const agentTasks = tasks?.filter((t) => t.agentId === agent._id) ?? [];
          const doneTasks = agentTasks.filter((t) => t.status === "done").length;
          const activeTasks = agentTasks.filter((t) => ["in_progress", "pending"].includes(t.status)).length;

          const recentOutput = activities
            ?.filter((a) => a.agentId === agent._id && a.action === "agent_output")
            ?.slice(0, 1)[0];

          return (
            <Card
              key={agent._id}
              className={cn(
                "overflow-hidden transition-all",
                isActive && "agent-active border-green-300",
                isError && "border-red-300"
              )}
            >
              {/* Agent header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center ring-1",
                    cfg.dimBg, cfg.ring,
                  )}>
                    <span className={cn(cfg.color, "text-[10px] font-bold select-none")}>{cfg.initials}</span>
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    isActive ? "bg-green-500" : isError ? "bg-red-500" : "bg-stone-300"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", cfg.color)}>{agent.role}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{agent.title}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {activeTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      {activeTasks}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doneTasks}
                  </span>
                </div>
              </div>

              {/* Current task */}
              {isActive && agent.currentTask && (
                <div className="px-4 pb-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Working on</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">{agent.currentTask}</p>
                </div>
              )}

              {/* Recent output */}
              {recentOutput && (
                <div className="px-4 py-2.5 border-t border-border">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Latest output</div>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                    {recentOutput.content.substring(0, 200)}
                    {recentOutput.content.length > 200 && "..."}
                  </p>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="px-4 py-2.5 flex items-center gap-2 border-t border-border">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs text-red-600">Agent in error state</span>
                </div>
              )}

              {/* Adapter selector */}
              <div className="px-4 py-2.5 border-t border-border">
                <AdapterSelector
                  agentId={agent._id}
                  currentAdapter={agent.adapterType as "claude" | "codex" | undefined}
                  currentModel={agent.model}
                />
              </div>

              {/* Status bar */}
              <div className="px-4 py-2 flex items-center justify-between border-t border-border bg-muted/30">
                <span className={cn("text-[10px] font-medium",
                  isActive ? "text-green-600" : isError ? "text-red-600" : "text-muted-foreground"
                )}>
                  {isActive ? "Active" : isError ? "Error" : "Idle"}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-600">
                    <Clock className="w-3 h-3" />
                    Running
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
