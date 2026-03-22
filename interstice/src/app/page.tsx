"use client";

import { OrgChart } from "./components/OrgChart";
import { TaskBoard } from "./components/TaskBoard";
import { ActivityFeed } from "./components/ActivityFeed";
import { ApprovalQueue } from "./components/ApprovalQueue";
import { ResultsPanel } from "./components/ResultsPanel";
import { CommandInput } from "./components/CommandInput";
import { MessageBus } from "./components/MessageBus";
import { CompanyMemory } from "./components/CompanyMemory";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Interstice
          </h1>
          <p className="text-xs text-gray-500">
            Multi-Agent Orchestration — Live Dashboard
          </p>
        </div>
        <div className="text-xs text-gray-600">
          HackHayward 2026
        </div>
      </div>

      {/* Command Input */}
      <div className="px-6 py-4 border-b border-gray-800">
        <CommandInput />
      </div>

      {/* Approval Queue — shows at top when there are pending approvals */}
      <ApprovalQueue />

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-[calc(100vh-140px)]">
        {/* Left: Org Chart + Message Bus */}
        <div className="lg:col-span-3 border-r border-gray-800 overflow-y-auto">
          <OrgChart />
          <MessageBus />
          <CompanyMemory />
        </div>

        {/* Center: Task Board + Results */}
        <div className="lg:col-span-5 border-r border-gray-800 overflow-y-auto">
          <TaskBoard />
          <ResultsPanel />
        </div>

        {/* Right: Activity Feed */}
        <div className="lg:col-span-4 overflow-y-auto">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
