"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const actionColors: Record<string, string> = {
  command_received: "text-white",
  task_started: "text-blue-400",
  agent_output: "text-gray-300",
  task_completed: "text-green-400",
  task_error: "text-red-400",
  delegated: "text-yellow-400",
};

const actionIcons: Record<string, string> = {
  command_received: "→",
  task_started: "▶",
  agent_output: "│",
  task_completed: "✓",
  task_error: "✗",
  delegated: "↓",
};

export function ActivityFeed() {
  const activities = useQuery(api.activity.list, { limit: 30 });
  const agents = useQuery(api.agents.list);

  if (!activities || !agents) return <div className="animate-pulse h-64 bg-gray-800/50 rounded-xl" />;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col h-full">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Activity Feed
      </h2>

      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
        {activities.length === 0 ? (
          <div className="text-gray-600 text-center py-8">
            Waiting for commands...
          </div>
        ) : (
          activities.map((activity) => {
            const agent = activity.agentId
              ? agentMap.get(activity.agentId)
              : null;
            const color = actionColors[activity.action] || "text-gray-400";
            const icon = actionIcons[activity.action] || "·";

            return (
              <div key={activity._id} className={`${color} flex gap-2 py-0.5`}>
                <span className="opacity-50 w-4 text-center shrink-0">{icon}</span>
                {agent && (
                  <span className="font-semibold shrink-0 w-16 text-right opacity-75">
                    [{agent.name}]
                  </span>
                )}
                <span className="break-words">{activity.content}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
