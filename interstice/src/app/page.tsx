"use client";

import { OrgChart } from "./components/OrgChart";
import { TaskBoard } from "./components/TaskBoard";
import { ActivityFeed } from "./components/ActivityFeed";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { ResultsPanel } from "./components/ResultsPanel";
import { CommandInput } from "./components/CommandInput";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Interstice
        </h1>
        <p className="text-sm text-gray-500">
          AI Agent Orchestration — Real-time Dashboard
        </p>
      </div>

      {/* Command Input */}
      <div className="mb-6">
        <CommandInput />
      </div>

      {/* Approval Queue (shows only when there are pending approvals) */}
      <div className="mb-6">
        <ApprovalQueue />
      </div>

      {/* Main Layout: Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Org Chart + Task Board */}
        <div className="lg:col-span-2 space-y-6">
          <OrgChart />
          <TaskBoard />
          <ResultsPanel />
        </div>

        {/* Right column: Activity Feed */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
