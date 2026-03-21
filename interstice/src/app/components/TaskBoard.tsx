"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  pending_approval: "Awaiting Approval",
  done: "Done",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  pending: "bg-gray-700 text-gray-300",
  in_progress: "bg-blue-900/50 text-blue-300 border-blue-700",
  pending_approval: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  done: "bg-green-900/50 text-green-300 border-green-700",
  cancelled: "bg-red-900/50 text-red-300 border-red-700",
};

const columns = ["pending", "in_progress", "pending_approval", "done"] as const;

export function TaskBoard() {
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);

  if (!tasks || !agents) return <div className="animate-pulse h-64 bg-gray-800/50 rounded-xl" />;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Task Board
      </h2>

      <div className="grid grid-cols-4 gap-3">
        {columns.map((status) => {
          const columnTasks = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                {statusLabels[status]}
                {columnTasks.length > 0 && (
                  <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full text-[10px]">
                    {columnTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-2 min-h-[100px]">
                {columnTasks.map((task) => {
                  const agent = task.agentId ? agentMap.get(task.agentId) : null;
                  return (
                    <div
                      key={task._id}
                      className={`task-card border rounded-lg p-3 text-xs ${statusColors[task.status]}`}
                    >
                      {agent && (
                        <div className="font-semibold mb-1 text-[11px] opacity-75">
                          {agent.role}
                        </div>
                      )}
                      <div className="line-clamp-3">{task.input}</div>
                      {task.output && (
                        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] opacity-60 line-clamp-2">
                          {task.output.substring(0, 100)}...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
