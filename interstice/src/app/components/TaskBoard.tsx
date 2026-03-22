"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: "Queued", color: "bg-gray-700 text-gray-300", icon: "⏳" },
  in_progress: { label: "Running", color: "bg-blue-900/50 text-blue-300 border-blue-700", icon: "⚡" },
  pending_approval: { label: "Needs Approval", color: "bg-yellow-900/50 text-yellow-300 border-yellow-700", icon: "⚠️" },
  done: { label: "Done", color: "bg-green-900/50 text-green-300 border-green-700", icon: "✓" },
  cancelled: { label: "Cancelled", color: "bg-red-900/50 text-red-300 border-red-700", icon: "✗" },
};

export function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!tasks || !agents)
    return <div className="animate-pulse h-64 bg-gray-800/50 m-4 rounded-lg" />;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  // Group tasks by parent (top-level commands and their subtasks)
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);
  const childTaskMap = new Map<string, typeof tasks>();
  for (const task of tasks) {
    if (task.parentTaskId) {
      const existing = childTaskMap.get(task.parentTaskId) || [];
      existing.push(task);
      childTaskMap.set(task.parentTaskId, existing);
    }
  }

  // Only show recent tasks (last 5 top-level)
  const recentTopLevel = topLevelTasks.slice(0, 5);

  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Task Board
      </h2>

      {recentTopLevel.length === 0 ? (
        <div className="text-gray-600 text-xs text-center py-8">
          No tasks yet — send a command above
        </div>
      ) : (
        <div className="space-y-3">
          {recentTopLevel.map((task) => {
            const agent = task.agentId ? agentMap.get(task.agentId) : null;
            const children = childTaskMap.get(task._id) || [];
            const config = statusConfig[task.status] || statusConfig.pending;

            // Clean display input (remove system tags)
            const displayInput = task.input
              .replace(/\[OMI_UID:[^\]]+\]/g, "")
              .replace(/\[SYNTHESIS\]/g, "")
              .trim();

            const isSynthesis = task.input.includes("[SYNTHESIS]");
            if (isSynthesis) return null; // Don't show synthesis tasks as top-level

            return (
              <div
                key={task._id}
                className="border border-gray-800 rounded-lg overflow-hidden"
              >
                {/* Parent task header */}
                <div className={`p-3 ${config.color} border-b border-gray-800`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
                        {agent?.role || "Command"} {config.icon}
                      </div>
                      <div className="text-xs font-medium line-clamp-2">
                        {displayInput}
                      </div>
                    </div>
                    <span className="text-[10px] shrink-0 opacity-60">
                      {config.label}
                    </span>
                  </div>
                </div>

                {/* Child tasks (delegated subtasks) */}
                {children.length > 0 && (
                  <div className="divide-y divide-gray-800/50">
                    {children.filter(c => !c.input.includes("[SYNTHESIS]")).map((child) => {
                      const childAgent = child.agentId
                        ? agentMap.get(child.agentId)
                        : null;
                      const childConfig =
                        statusConfig[child.status] || statusConfig.pending;

                      return (
                        <div
                          key={child._id}
                          className={`p-2.5 pl-5 ${childConfig.color} flex items-center gap-2`}
                        >
                          <span className="text-gray-600 text-[10px]">└</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-semibold mr-1.5">
                              {childAgent?.role || "Agent"}
                            </span>
                            <span className="text-[10px] line-clamp-1 opacity-75">
                              {child.input.substring(0, 80)}
                            </span>
                          </div>
                          <span className="text-[10px] shrink-0">
                            {childConfig.icon} {childConfig.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Task output preview */}
                {task.output && !children.length && (
                  <div className="p-2.5 text-[10px] text-gray-500 bg-gray-900/30 line-clamp-2">
                    {task.output.substring(0, 150)}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
