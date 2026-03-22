"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { useState, useEffect, useMemo } from "react";

/* ─── Agent Character Config ─────────────────────────────────────── */
const agentCharacters: Record<string, {
  emoji: string;
  color: string;
  bgColor: string;
  idlePos: { x: number; y: number };
  deskLabel: string;
}> = {
  CEO: {
    emoji: "🧑‍💼",
    color: "#d97706",
    bgColor: "bg-amber-50",
    idlePos: { x: 50, y: 20 },
    deskLabel: "CEO Desk",
  },
  Research: {
    emoji: "🔬",
    color: "#2563eb",
    bgColor: "bg-blue-50",
    idlePos: { x: 15, y: 55 },
    deskLabel: "Research Lab",
  },
  Communications: {
    emoji: "✉️",
    color: "#9333ea",
    bgColor: "bg-purple-50",
    idlePos: { x: 85, y: 55 },
    deskLabel: "Comms Hub",
  },
  Developer: {
    emoji: "⌨️",
    color: "#16a34a",
    bgColor: "bg-emerald-50",
    idlePos: { x: 15, y: 85 },
    deskLabel: "Dev Station",
  },
  Call: {
    emoji: "📱",
    color: "#ea580c",
    bgColor: "bg-orange-50",
    idlePos: { x: 85, y: 85 },
    deskLabel: "Call Center",
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

      if (agent.status === "active") {
        // Active agents cluster near CEO for collaboration
        if (agent.role === "CEO") {
          newPositions[agent.role] = { x: 50, y: 35 };
        } else {
          // Group around CEO when active — huddle formation
          const activeIndex = activeAgents.filter(a => a.role !== "CEO").indexOf(agent);
          const total = activeAgents.filter(a => a.role !== "CEO").length;
          const spread = Math.min(total, 4);
          const angleStep = 360 / Math.max(spread, 1);
          const angle = (angleStep * activeIndex - 90) * (Math.PI / 180);
          const radius = 18;
          newPositions[agent.role] = {
            x: 50 + Math.cos(angle) * radius,
            y: 50 + Math.sin(angle) * (radius * 0.6),
          };
        }
      } else {
        // Idle agents stay at their desks
        newPositions[agent.role] = { ...config.idlePos };
      }
    }

    setPositions(newPositions);
  }, [agents?.map(a => a.status).join(",")]);

  return positions;
}

/* ─── Speech Bubble ──────────────────────────────────────────────── */
function SpeechBubble({ text, side = "top" }: { text: string; side?: "top" | "bottom" }) {
  return (
    <div className={cn(
      "absolute left-1/2 z-30 animate-bubble-float pointer-events-none",
      side === "top" ? "bottom-full mb-3 -translate-x-1/2" : "top-full mt-3 -translate-x-1/2"
    )}>
      <div className="relative bg-white text-stone-700 text-[11px] font-medium px-3 py-2 rounded-2xl shadow-md border border-stone-200/80 max-w-[240px] leading-snug">
        {text}
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 w-0 h-0",
          side === "top"
            ? "top-full border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white"
            : "bottom-full border-l-[6px] border-r-[6px] border-b-[6px] border-transparent border-b-white"
        )} />
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

      {/* Character */}
      <div className={cn(
        "relative cursor-pointer group",
        isActive && "animate-bob",
      )}>
        {/* Shadow */}
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-10 h-2 rounded-full bg-stone-900/5 blur-sm" />

        {/* Body */}
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300",
            "border-2 shadow-sm",
            config.bgColor,
            isActive
              ? "border-green-400 shadow-green-200/50 shadow-md scale-110"
              : isError
                ? "border-red-300 shadow-red-200/30 shadow-md"
                : "border-stone-200/80 hover:border-stone-300 hover:shadow-md",
          )}
          style={{ borderColor: isActive ? undefined : undefined }}
        >
          <span className={cn(
            "select-none",
            isActive && "animate-walk",
          )}>
            {config.emoji}
          </span>
        </div>

        {/* Status dot */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white shadow-sm">
            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
          </div>
        )}
        {isError && (
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-400 border-2 border-white shadow-sm" />
        )}
      </div>

      {/* Name tag */}
      <div className={cn(
        "mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide text-center whitespace-nowrap shadow-sm",
        "bg-white border",
        isActive
          ? "text-green-700 border-green-200"
          : isError
            ? "text-red-600 border-red-200"
            : "text-stone-500 border-stone-200",
      )}>
        {agent.role}
      </div>

      {/* Task label when active */}
      {isActive && agent.currentTask && (
        <div className="mt-1 px-2 py-0.5 rounded-md text-[9px] text-stone-400 bg-white/80 max-w-[120px] truncate text-center border border-stone-100">
          {agent.currentTask}
        </div>
      )}
    </div>
  );
}

/* ─── Desk Station (game-style furniture) ────────────────────────── */
const deskEmoji: Record<string, string> = {
  CEO: "🪑",
  Research: "🔬",
  Communications: "📮",
  Developer: "🖥️",
  Call: "☎️",
};

function DeskMarkers() {
  return (
    <>
      {Object.entries(agentCharacters).map(([role, config]) => (
        <div
          key={role}
          className="absolute transform -translate-x-1/2 pointer-events-none flex flex-col items-center"
          style={{ left: `${config.idlePos.x}%`, top: `${config.idlePos.y + 7}%` }}
        >
          <span className="text-lg opacity-40">{deskEmoji[role] ?? "🪑"}</span>
          <div className="text-[8px] text-stone-400 font-bold tracking-wider uppercase text-center whitespace-nowrap mt-0.5 bg-white/60 px-1.5 py-0.5 rounded-full">
            {config.deskLabel}
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── Connection Lines (show when agents are collaborating) ──────── */
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
          <stop offset="0%" stopColor="rgba(232, 115, 74, 0.3)" />
          <stop offset="50%" stopColor="rgba(232, 115, 74, 0.5)" />
          <stop offset="100%" stopColor="rgba(232, 115, 74, 0.3)" />
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
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-2xl border border-stone-200/80 shadow-sm"
      style={{
        background: "linear-gradient(180deg, #fef3c7 0%, #fef9ee 25%, #fffbf5 50%, #f5f0e8 100%)",
      }}
    >
      {/* Retro tile floor pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(168,162,158,0.04) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(168,162,158,0.04) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(168,162,158,0.04) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(168,162,158,0.04) 75%)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
        }}
      />

      {/* Warm ambient glow in center (where agents huddle) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-200/15 blur-3xl pointer-events-none" />

      {/* Floating sparkles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float-dot pointer-events-none"
          style={{
            left: `${8 + (i * 13) % 84}%`,
            top: `${15 + (i * 11) % 65}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${3 + (i % 4)}s`,
            fontSize: "8px",
          }}
        >
          ✦
        </div>
      ))}

      {/* Header — retro nameplate style */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🏢</span>
          <span className="text-[11px] font-bold text-stone-500 tracking-widest uppercase">
            Interstice HQ
          </span>
        </div>
        <div className="flex items-center gap-2">
          {inProgressTasks > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-sm">
              ⚡ {inProgressTasks} running
            </span>
          )}
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50/80 px-2.5 py-1 rounded-full border border-green-200/60 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {activeCount} active
            </span>
          )}
        </div>
      </div>

      {/* Desk markers */}
      <DeskMarkers />

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

      {/* Bottom status bar — retro game HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 py-2 flex items-center justify-center bg-gradient-to-t from-stone-100/60 to-transparent">
        <div className="flex items-center gap-3 bg-white/70 px-3 py-1 rounded-full border border-stone-200/60 shadow-sm">
          <span className="text-[10px] text-stone-500 font-bold">
            👥 {agents.length} agents
          </span>
          <span className="text-stone-300">•</span>
          <span className="text-[10px] text-stone-400 font-medium">
            {activeCount > 0 ? `${activeCount} working` : "All idle"}
          </span>
        </div>
      </div>
    </div>
  );
}
