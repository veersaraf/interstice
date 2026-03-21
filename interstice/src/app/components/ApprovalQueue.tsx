"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ApprovalQueue() {
  const approvals = useQuery(api.approvals.listPending);
  const agents = useQuery(api.agents.list);
  const approveMutation = useMutation(api.approvals.approve);
  const denyMutation = useMutation(api.approvals.deny);

  if (!approvals || !agents) return null;
  if (approvals.length === 0) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  return (
    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-4">
        Pending Approvals
      </h2>

      <div className="space-y-3">
        {approvals.map((approval) => {
          const agent = agentMap.get(approval.agentId);
          return (
            <div
              key={approval._id}
              className="bg-gray-900/50 border border-yellow-700/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-yellow-300">
                    {agent?.role || "Agent"} wants to: {approval.action}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {approval.details}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approveMutation({ id: approval._id })}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => denyMutation({ id: approval._id })}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
