"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Zap } from "lucide-react";

const sectionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  tasks:     "Tasks",
  agents:    "Agents",
  activity:  "Activity",
  approvals: "Approvals",
  messages:  "Messages",
  goals:     "Goals",
};

interface BreadcrumbBarProps {
  section: string;
}

export function BreadcrumbBar({ section }: BreadcrumbBarProps) {
  const agents = useQuery(api.agents.list);
  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const runningTask = agents?.find((a) => a.status === "active")?.currentTask;

  return (
    <div
      className="h-12 px-6 flex items-center justify-between shrink-0"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Interstice</span>
        <span className="text-gray-700">/</span>
        <span className="text-gray-200 font-medium">{sectionLabels[section] ?? section}</span>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4">
        {activeAgents.length > 0 ? (
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">
              {activeAgents.length} agent{activeAgents.length > 1 ? "s" : ""} running
            </span>
            {runningTask && (
              <span className="text-xs text-gray-500 max-w-xs truncate hidden lg:block">
                — {runningTask}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="text-xs text-gray-600">All agents idle</span>
          </div>
        )}
      </div>
    </div>
  );
}
