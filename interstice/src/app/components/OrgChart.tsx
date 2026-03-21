"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const roleColors: Record<string, string> = {
  CEO: "border-yellow-500 bg-yellow-500/10",
  Research: "border-blue-500 bg-blue-500/10",
  Communications: "border-purple-500 bg-purple-500/10",
  Developer: "border-green-500 bg-green-500/10",
  Call: "border-orange-500 bg-orange-500/10",
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

  if (!agents) return <div className="animate-pulse h-48 bg-gray-800/50 rounded-xl" />;

  const ceo = agents.find((a) => a.name === "ceo");
  const specialists = agents.filter((a) => a.name !== "ceo");

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Organization
      </h2>

      {/* CEO */}
      {ceo && (
        <div className="flex justify-center mb-6">
          <AgentNode agent={ceo} />
        </div>
      )}

      {/* Delegation lines */}
      <div className="flex justify-center mb-2">
        <div className="w-px h-6 bg-gray-700" />
      </div>
      <div className="flex justify-center mb-6">
        <div className="h-px bg-gray-700" style={{ width: "80%" }} />
      </div>

      {/* Specialists */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {specialists.map((agent) => (
          <AgentNode key={agent._id} agent={agent} />
        ))}
      </div>
    </div>
  );
}

function AgentNode({ agent }: { agent: { _id: string; name: string; role: string; title: string; status: string } }) {
  const isActive = agent.status === "active";
  const colorClass = roleColors[agent.role] || "border-gray-600 bg-gray-800/50";

  return (
    <div
      className={`
        relative border-2 rounded-lg p-3 text-center transition-all
        ${colorClass}
        ${isActive ? "agent-active" : "opacity-70"}
      `}
    >
      {/* Status indicator */}
      <div className="absolute -top-1.5 -right-1.5">
        <div
          className={`w-3 h-3 rounded-full ${
            isActive
              ? "bg-green-500"
              : agent.status === "error"
                ? "bg-red-500"
                : "bg-gray-600"
          }`}
        />
      </div>

      <div className="text-xl mb-1">{roleIcons[agent.role] || "🤖"}</div>
      <div className="text-sm font-semibold">{agent.role}</div>
      <div className="text-xs text-gray-400">{agent.title}</div>
    </div>
  );
}
