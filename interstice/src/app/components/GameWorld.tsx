"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";

/* ─── Agent Character Config ─────────────────────────────────────── */
const agentCharacters: Record<string, {
  avatar: string;
  color: string;
  idlePos: { x: number; y: number };
}> = {
  CEO: {
    avatar: "/avatars/ceo.png",
    color: "#d97706",
    idlePos: { x: 50, y: 18 },
  },
  Research: {
    avatar: "/avatars/research.png",
    color: "#2563eb",
    idlePos: { x: 22, y: 48 },
  },
  Communications: {
    avatar: "/avatars/communications.png",
    color: "#9333ea",
    idlePos: { x: 68, y: 78 },
  },
  Developer: {
    avatar: "/avatars/developer.png",
    color: "#16a34a",
    idlePos: { x: 30, y: 78 },
  },
  Call: {
    avatar: "/avatars/call.png",
    color: "#ea580c",
    idlePos: { x: 75, y: 48 },
  },
};

/* ─── Compute agent positions based on state ─────────────────────── */
function useAgentPositions(agents: Array<{ _id: string; role: string; status: string }> | undefined) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!agents) return;

    const activeAgents = agents.filter(a => a.status === "active");
    const newPositions: Record<string, { x: number; y: number }> = {};

    for (const agent of agents) {
      const config = agentCharacters[agent.role];
      if (!config) continue;

      if (agent.status === "active" && activeAgents.length > 1) {
        // Multiple active agents → gather around the central meeting table
        const meetingSeats: Record<string, { x: number; y: number }> = {
          CEO:            { x: 50, y: 35 },
          Research:       { x: 38, y: 45 },
          Call:           { x: 62, y: 45 },
          Developer:      { x: 38, y: 55 },
          Communications: { x: 62, y: 55 },
        };
        newPositions[agent.role] = meetingSeats[agent.role] ?? { x: 50, y: 48 };
      } else if (agent.status === "active") {
        // Single active agent stays at desk
        newPositions[agent.role] = { ...config.idlePos };
      } else {
        newPositions[agent.role] = { ...config.idlePos };
      }
    }

    setPositions(newPositions);
  }, [agents?.map(a => a.status).join(",")]);

  return positions;
}

/* ─── Speech Bubble ──────────────────────────────────────────────── */
function SpeechBubble({ text }: { text: string }) {
  return (
    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-30 animate-bubble-float pointer-events-none">
      <div className="relative bg-white/95 text-stone-700 text-[11px] font-medium px-3 py-2 rounded-2xl shadow-lg border border-stone-200/60 max-w-[220px] leading-snug backdrop-blur-sm">
        {text}
        <div className="absolute left-1/2 -translate-x-1/2 top-full border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white/95" />
      </div>
    </div>
  );
}

/* ─── Agent Character ────────────────────────────────────────────── */
function AgentCharacter({
  agent,
  position,
  recentMessage,
}: {
  agent: { _id: string; name: string; role: string; title: string; status: string; currentTask?: string };
  position: { x: number; y: number };
  recentMessage?: string;
}) {
  const config = agentCharacters[agent.role];
  if (!config) return null;

  const isActive = agent.status === "active";
  const isError = agent.status === "error";

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transition: "left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), top 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isActive ? 20 : 10,
      }}
    >
      {/* Speech bubble */}
      {recentMessage && (
        <SpeechBubble text={recentMessage.substring(0, 120) + (recentMessage.length > 120 ? "…" : "")} />
      )}

      {/* Character — large avatar, no container/ring/bg */}
      <div className={cn(
        "relative cursor-pointer group",
        isActive && "animate-bob",
      )}>
        {/* Soft floor shadow */}
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black/15 blur-md" />

        {/* Avatar image — big, clean, no ring or circle */}
        <img
          src={config.avatar}
          alt={agent.role}
          className={cn(
            "w-24 h-24 object-contain select-none drop-shadow-lg transition-all duration-300",
            isActive && "animate-walk scale-110",
            isError && "opacity-70 grayscale-[30%]",
            !isActive && !isError && "hover:scale-105",
          )}
        />

        {/* Status dot — always visible */}
        <div className={cn(
          "absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-sm",
          isActive ? "bg-green-400" : isError ? "bg-red-400" : "bg-stone-400"
        )}>
          {isActive && (
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Connection Lines ────────────────────────────────────────────── */
function CollaborationLines({
  agents,
  positions,
}: {
  agents: { _id: string; role: string; status: string }[];
  positions: Record<string, { x: number; y: number }>;
}) {
  const ceo = agents.find(a => a.role === "CEO");
  const activeSpecialists = agents.filter(a => a.role !== "CEO" && a.status === "active");

  if (!ceo || ceo.status !== "active" || activeSpecialists.length === 0) return null;

  const ceoPos = positions["CEO"] ?? agentCharacters.CEO.idlePos;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <linearGradient id="collab-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(232, 115, 74, 0.2)" />
          <stop offset="50%" stopColor="rgba(232, 115, 74, 0.5)" />
          <stop offset="100%" stopColor="rgba(232, 115, 74, 0.2)" />
        </linearGradient>
      </defs>
      {activeSpecialists.map((agent) => {
        const pos = positions[agent.role] ?? agentCharacters[agent.role]?.idlePos;
        if (!pos) return null;

        return (
          <line
            key={agent._id}
            x1={`${ceoPos.x}%`}
            y1={`${ceoPos.y}%`}
            x2={`${pos.x}%`}
            y2={`${pos.y}%`}
            stroke="url(#collab-line)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="animate-pulse"
          />
        );
      })}
    </svg>
  );
}

/* ─── Game World ──────────────────────────────────────────────────── */
export function GameWorld() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const messages = useQuery(api.messages.list);
  const activities = useQuery(api.activity.list, { limit: 20 });
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, string>>({});

  const positions = useAgentPositions(agents);

  // Show recent messages as speech bubbles
  useEffect(() => {
    if (!messages || messages.length === 0 || !agents) return;

    const agentMap = new Map(agents.map(a => [a._id, a]));
    const recentMessages = messages.slice(0, 3);
    const bubbles: Record<string, string> = {};

    for (const msg of recentMessages) {
      const fromAgent = agentMap.get(msg.from);
      if (fromAgent) {
        bubbles[fromAgent.role] = msg.content.length > 100
          ? msg.content.substring(0, 100) + "…"
          : msg.content;
      }
    }

    setSpeechBubbles(bubbles);
    const timer = setTimeout(() => setSpeechBubbles({}), 8000);
    return () => clearTimeout(timer);
  }, [messages?.length, agents]);

  // Show recent agent output as speech bubbles
  useEffect(() => {
    if (!activities || !agents) return;

    const agentMap = new Map(agents.map(a => [a._id, a]));
    const recentOutputs = activities
      .filter(a => a.action === "agent_output" && a.agentId)
      .slice(0, 2);

    if (recentOutputs.length > 0) {
      const newBubbles: Record<string, string> = {};
      for (const output of recentOutputs) {
        const agent = agentMap.get(output.agentId!);
        if (agent) {
          newBubbles[agent.role] = output.content.length > 100
            ? output.content.substring(0, 100) + "…"
            : output.content;
        }
      }
      setSpeechBubbles(prev => ({ ...prev, ...newBubbles }));
    }
  }, [activities?.length, agents]);

  if (!agents) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-stone-400 text-sm animate-pulse">Loading agents…</div>
      </div>
    );
  }

  const activeCount = agents.filter(a => a.status === "active").length;
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress").length ?? 0;

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-stone-200/80 shadow-sm">
      {/* Background image */}
      <img
        src="/avatars/bg.png"
        alt="Interstice HQ"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm border border-stone-200/40">
          <span className="text-sm">🏢</span>
          <span className="text-[11px] font-bold text-stone-600 tracking-wide">
            Interstice HQ
          </span>
        </div>
        <div className="flex items-center gap-2">
          {inProgressTasks > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-sm backdrop-blur-sm">
              ⚡ {inProgressTasks} running
            </span>
          )}
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50/90 px-2.5 py-1 rounded-full border border-green-200/60 shadow-sm backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {activeCount} active
            </span>
          )}
        </div>
      </div>

      {/* Collaboration lines */}
      <CollaborationLines agents={agents} positions={positions} />

      {/* Agent characters */}
      {agents.map((agent) => {
        const pos = positions[agent.role] ?? agentCharacters[agent.role]?.idlePos ?? { x: 50, y: 50 };
        return (
          <AgentCharacter
            key={agent._id}
            agent={agent}
            position={pos}
            recentMessage={speechBubbles[agent.role]}
          />
        );
      })}

      {/* Bottom status bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-2 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white/70 px-3 py-1 rounded-full border border-stone-200/40 shadow-sm backdrop-blur-sm">
          <span className="text-[10px] text-stone-600 font-bold">
            👥 {agents.length} agents
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[10px] text-stone-500 font-medium">
            {activeCount > 0 ? `${activeCount} working` : "All idle"}
          </span>
        </div>
      </div>
    </div>
  );
}
