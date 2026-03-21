"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ResultsPanel() {
  const findings = useQuery(api.findings.getRecent, { limit: 10 });
  const agents = useQuery(api.agents.list);

  if (!findings || !agents) return <div className="animate-pulse h-32 bg-gray-800/50 rounded-xl" />;
  if (findings.length === 0) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Results
      </h2>

      <div className="space-y-3">
        {findings.map((finding) => {
          const agent = agentMap.get(finding.agentId);
          return (
            <div
              key={finding._id}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400">
                  {agent?.role || "Agent"}
                </span>
              </div>
              <div className="text-xs text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {finding.content.substring(0, 500)}
                {finding.content.length > 500 && "..."}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
