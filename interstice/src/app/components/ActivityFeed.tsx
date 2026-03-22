"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const actionConfig: Record<string, { color: string; icon: string; label?: string }> = {
  command_received: { color: "text-white", icon: "→", label: "COMMAND" },
  task_started: { color: "text-blue-400", icon: "▶", label: "START" },
  agent_output: { color: "text-gray-400", icon: "│" },
  task_completed: { color: "text-green-400", icon: "✓", label: "DONE" },
  task_error: { color: "text-red-400", icon: "✗", label: "ERROR" },
  delegated: { color: "text-yellow-400", icon: "↓", label: "DELEGATE" },
  delegation_complete: { color: "text-yellow-300", icon: "✦", label: "DELEGATED" },
  findings_posted: { color: "text-cyan-400", icon: "📡", label: "SHARED" },
  synthesis_triggered: { color: "text-purple-400", icon: "🔄", label: "SYNTHESIZE" },
  synthesis: { color: "text-purple-300", icon: "✅", label: "RESULT" },
  approval_requested: { color: "text-yellow-300", icon: "⚠️", label: "APPROVAL" },
};

export function ActivityFeed() {
  const activities = useQuery(api.activity.list, { limit: 50 });
  const agents = useQuery(api.agents.list);

  if (!activities || !agents)
    return <div className="animate-pulse h-64 bg-gray-800/50 m-4 rounded-lg" />;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Activity Feed
      </h2>

      <div className="flex-1 overflow-y-auto space-y-0.5 font-mono text-[11px]">
        {activities.length === 0 ? (
          <div className="text-gray-600 text-center py-8">
            Waiting for commands...
          </div>
        ) : (
          activities.map((activity) => {
            const agent = activity.agentId
              ? agentMap.get(activity.agentId)
              : null;
            const config = actionConfig[activity.action] || {
              color: "text-gray-500",
              icon: "·",
            };

            // Collapse long agent_output entries
            const isOutput = activity.action === "agent_output";
            const displayContent = isOutput
              ? activity.content.substring(0, 200) + (activity.content.length > 200 ? "..." : "")
              : activity.content;

            return (
              <div
                key={activity._id}
                className={`${config.color} flex gap-1.5 py-0.5 leading-tight`}
              >
                <span className="w-4 text-center shrink-0 opacity-60">
                  {config.icon}
                </span>
                {config.label && (
                  <span className="text-[9px] font-bold shrink-0 opacity-50 w-16 text-right">
                    {config.label}
                  </span>
                )}
                {agent && (
                  <span className="font-bold shrink-0 text-[10px] opacity-75">
                    [{agent.name}]
                  </span>
                )}
                <span className={`break-words ${isOutput ? "text-gray-500" : ""}`}>
                  {displayContent}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
