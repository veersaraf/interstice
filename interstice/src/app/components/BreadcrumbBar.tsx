"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Zap } from "lucide-react";

const sectionLabels: Record<string, string> = {
  dashboard:  "Dashboard",
  tasks:      "Tasks",
  agents:     "Agents",
  activity:   "Activity",
  approvals:  "Approvals",
  messages:   "Messages",
  findings:   "Output & Findings",
  goals:      "Goals",
  contacts:   "Contacts",
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
        <span className="text-gray-600 text-xs">Interstice</span>
        <span className="text-gray-700">/</span>
        <span className="text-gray-200 font-medium text-xs">{sectionLabels[section] ?? section}</span>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4">
        {activeAgents.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-xs text-green-400 font-medium">
                {activeAgents.length} agent{activeAgents.length > 1 ? "s" : ""} running
              </span>
            </div>
            {runningTask && (
              <span className="text-[11px] text-gray-500 max-w-xs truncate hidden lg:block">
                — {runningTask}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
            <span className="text-xs text-gray-600">Idle</span>
          </div>
        )}
      </div>
    </div>
  );
}
