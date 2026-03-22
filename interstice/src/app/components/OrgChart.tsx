"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const roleColors: Record<string, { border: string; bg: string; glow: string }> = {
  CEO: { border: "border-yellow-500", bg: "bg-yellow-500/10", glow: "shadow-yellow-500/50" },
  Research: { border: "border-blue-500", bg: "bg-blue-500/10", glow: "shadow-blue-500/50" },
  Communications: { border: "border-purple-500", bg: "bg-purple-500/10", glow: "shadow-purple-500/50" },
  Developer: { border: "border-green-500", bg: "bg-green-500/10", glow: "shadow-green-500/50" },
  Call: { border: "border-orange-500", bg: "bg-orange-500/10", glow: "shadow-orange-500/50" },
};

const roleIcons: Record<string, string> = {
  CEO: "👔",
  Research: "🔍",
  Communications: "📧",
  Developer: "💻",
  Call: "📞",
};

export function OrgChart() {
  const agents = useQuery(api.agents.list);

  if (!agents) return <div className="animate-pulse h-48 bg-gray-800/50 m-4 rounded-lg" />;

  const ceo = agents.find((a) => a.name === "ceo");
  const specialists = agents.filter((a) => a.name !== "ceo");

  return (
    <div className="p-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Organization
      </h2>

      {/* CEO */}
      {ceo && (
        <div className="flex justify-center mb-3">
          <AgentNode agent={ceo} />
        </div>
      )}

      {/* Delegation lines */}
      <div className="flex justify-center mb-1">
        <div className="w-px h-4 bg-gray-700" />
      </div>
      <div className="flex justify-center mb-3">
        <div className="h-px bg-gray-700" style={{ width: "90%" }} />
      </div>

      {/* Specialists */}
      <div className="grid grid-cols-2 gap-2">
        {specialists.map((agent) => (
          <AgentNode key={agent._id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentNode({ agent }: { agent: { _id: string; name: string; role: string; title: string; status: string; currentTask?: string } }) {
  const isActive = agent.status === "active";
  const colors = roleColors[agent.role] || { border: "border-gray-600", bg: "bg-gray-800/50", glow: "" };

  return (
    <div
      className={`
        relative border rounded-lg p-2.5 text-center transition-all duration-300
        ${colors.border} ${colors.bg}
        ${isActive ? `shadow-lg ${colors.glow} border-2 scale-105` : "opacity-60 border"}
      `}
    >
      {/* Status indicator */}
      <div className="absolute -top-1 -right-1">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            isActive
              ? "bg-green-400 animate-pulse"
              : agent.status === "error"
                ? "bg-red-500"
                : "bg-gray-600"
          }`}
        />
      </div>

      <div className="text-lg">{roleIcons[agent.role] || "🤖"}</div>
      <div className="text-xs font-semibold">{agent.role}</div>
      {isActive && agent.currentTask && (
        <div className="text-[10px] text-gray-400 mt-1 line-clamp-2 italic">
          {agent.currentTask}
        </div>
      )}
    </div>
  );
}
