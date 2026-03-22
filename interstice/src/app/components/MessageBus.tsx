"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function MessageBus() {
  const messages = useQuery(api.messages.list);
  const agents = useQuery(api.agents.list);

  if (!messages || !agents) return null;
  if (messages.length === 0) return null;

  const agentMap = new Map(agents.map((a) => [a._id, a]));

  // Show only recent delegation/communication messages
  const recentMessages = messages.slice(0, 10);

  return (
    <div className="p-4 border-t border-gray-800">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Agent Communications
      </h2>

      <div className="space-y-1.5">
        {recentMessages.map((msg) => {
          const from = agentMap.get(msg.from);
          const to = agentMap.get(msg.to);
          return (
            <div
              key={msg._id}
              className="text-[10px] flex items-start gap-1.5 text-gray-400"
            >
              <span className="text-yellow-400 shrink-0">→</span>
              <span>
                <span className="font-semibold text-gray-300">
                  {from?.role || "?"}
                </span>
                {" → "}
                <span className="font-semibold text-gray-300">
                  {to?.role || "?"}
                </span>
                {": "}
                <span className="text-gray-500">
                  {msg.content.substring(0, 80)}
                  {msg.content.length > 80 ? "..." : ""}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
