"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Network, Zap, AlertCircle, Clock, FileText, Cpu, Settings } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";

const roleConfig: Record<string, { color: string; bg: string; border: string }> = {
  CEO:            { color: "text-yellow-400", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.15)" },
  Research:       { color: "text-blue-400",   bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.15)" },
  Communications: { color: "text-purple-400", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.15)" },
  Developer:      { color: "text-green-400",  bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.15)" },
  Call:           { color: "text-orange-400", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.15)" },
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
        className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
      >
        <Settings className="w-3 h-3" />
        <Cpu className="w-3 h-3" />
        <span className="font-medium">
          {adapter === "codex" ? "Codex" : "Claude"}
          {currentModel && <span className="text-gray-600 ml-1">({models.find(m => m.id === currentModel)?.label || currentModel})</span>}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Adapter toggle */}
          <div className="flex gap-1">
            {(["claude", "codex"] as const).map((a) => (
              <button
                key={a}
                onClick={() => handleAdapterChange(a)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-semibold transition-all",
                  adapter === a
                    ? a === "claude"
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-gray-600 hover:text-gray-400 border border-transparent"
                )}
              >
                {a === "claude" ? "Claude" : "Codex"}
              </button>
            ))}
          </div>

          {/* Model selector */}
          <select
            value={currentModel || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full text-[10px] bg-black/30 text-gray-300 border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500/50"
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
          <div key={i} className="h-24 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
        ))}
      </div>
    );
  }

  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Network className="w-4 h-4 text-gray-500" />
        <h1 className="text-sm font-semibold text-white">Agents</h1>
        <span className="text-[11px] text-gray-500 font-medium">{agents.length} total</span>
        {activeCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
            {activeCount} active
          </span>
        )}
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const cfg = roleConfig[agent.role] ?? { color: "text-gray-400", bg: "rgba(156,163,175,0.08)", border: "rgba(156,163,175,0.15)" };
          const isActive = agent.status === "active";
          const isError = agent.status === "error";
          const agentTasks = tasks?.filter((t) => t.agentId === agent._id) ?? [];
          const doneTasks = agentTasks.filter((t) => t.status === "done").length;
          const activeTasks = agentTasks.filter((t) => ["in_progress", "pending"].includes(t.status)).length;

          const recentOutput = activities
            ?.filter((a) => a.agentId === agent._id && a.action === "agent_output")
            ?.slice(0, 1)[0];

          return (
            <div
              key={agent._id}
              className={cn("rounded-lg overflow-hidden transition-all", isActive && "agent-active")}
              style={{
                background: "var(--surface-2)",
                border: `1px solid ${isActive ? cfg.color.replace("text-", "").replace("-400", "") + "30" : "var(--border)"}`,
              }}
            >
              {/* Agent header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0",
                    isActive ? "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : isError ? "bg-red-400"
                    : "bg-gray-700"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", cfg.color)}>{agent.role}</div>
                  <div className="text-[11px] text-gray-500 truncate">{agent.title}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  {activeTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-400" />
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
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Working on</div>
                  <p className="text-xs text-gray-400 line-clamp-2 italic">{agent.currentTask}</p>
                </div>
              )}

              {/* Recent output */}
              {recentOutput && (
                <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1">Latest output</div>
                  <p className="text-[11px] text-gray-500 line-clamp-3 font-mono leading-relaxed">
                    {recentOutput.content.substring(0, 200)}
                    {recentOutput.content.length > 200 && "…"}
                  </p>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-red-400">Agent in error state</span>
                </div>
              )}

              {/* Adapter / Model selector */}
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                <AdapterSelector
                  agentId={agent._id}
                  currentAdapter={agent.adapterType as "claude" | "codex" | undefined}
                  currentModel={agent.model}
                />
              </div>

              {/* Status bar */}
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{ borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.15)" }}
              >
                <span className={cn("text-[10px] font-medium", isActive ? "text-green-400" : isError ? "text-red-400" : "text-gray-600")}>
                  {isActive ? "Active" : isError ? "Error" : "Idle"}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-400">
                    <Clock className="w-3 h-3" />
                    Running
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
