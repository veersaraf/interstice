"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowRight } from "lucide-react";

const roleColors: Record<string, string> = {
  CEO:            "text-yellow-400",
  Research:       "text-blue-400",
  Communications: "text-purple-400",
  Developer:      "text-green-400",
  Call:           "text-orange-400",
};

export function MessageBus() {
  const messages = useQuery(api.messages.list);
  const agents   = useQuery(api.agents.list);

  if (!messages || !agents || messages.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-700">No inter-agent messages yet</p>
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a._id, a]));
  const recent   = messages.slice(0, 8);

  return (
    <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
      {recent.map((msg) => {
        const from = agentMap.get(msg.from);
        const to   = agentMap.get(msg.to);

        return (
          <div key={msg._id} className="flex items-start gap-2 text-[11px]">
            <span className={`font-semibold shrink-0 ${roleColors[from?.role ?? ""] ?? "text-gray-400"}`}>
              {from?.role ?? "?"}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-700 shrink-0 mt-0.5" />
            <span className={`font-semibold shrink-0 ${roleColors[to?.role ?? ""] ?? "text-gray-400"}`}>
              {to?.role ?? "?"}
            </span>
            <span className="text-gray-600 truncate">
              {msg.content.substring(0, 70)}{msg.content.length > 70 ? "…" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}
