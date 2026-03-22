"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Building2, Zap, Users } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";

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

/* ─── Meeting table seats — agents gather here when communicating ── */
const meetingSeats: Record<string, { x: number; y: number }> = {
  CEO:            { x: 50, y: 35 },
  Research:       { x: 38, y: 45 },
  Call:           { x: 62, y: 45 },
  Developer:      { x: 38, y: 55 },
  Communications: { x: 62, y: 55 },
};

/* ─── Extract clean speech bubble text ──────────────────────────── */
function extractBubbleText(content: string): string | null {
  // Skip raw JSON entirely
  if (/^\s*[{[]/.test(content)) return null;

  // Skip very short non-meaningful content
  if (content.length < 5) return null;

  // Take the first sentence or line — whichever is shorter
  const firstLine = content.split("\n")[0].trim();
  const firstSentence = firstLine.match(/^[^.!?]+[.!?]?/)?.[0] ?? firstLine;

  // Cap at 80 chars
  const text = firstSentence.length > 80
    ? firstSentence.substring(0, 77) + "…"
    : firstSentence;

  // Skip if still looks like internal data
  if (/^(task_|delegation|{"|\[{)/.test(text)) return null;

  return text;
}

/* ─── Compute agent positions + communicating pairs ────────────── */
function useAgentState(
  agents: Array<{ _id: string; role: string; status: string }> | undefined,
  messages: Array<{ from: string; to: string; _creationTime: number }> | undefined,
) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [commPairs, setCommPairs] = useState<Array<{ from: string; to: string; color: string }>>([]);

  useEffect(() => {
    if (!agents) return;

    const agentIdToRole = new Map(agents.map(a => [a._id, a.role]));
    const activeRoles = new Set(agents.filter(a => a.status === "active").map(a => a.role));

    // Find recent communicating pairs (last 30s)
    const recentCutoff = Date.now() - 30_000;
    const communicatingRoles = new Set<string>();
    const pairs: Array<{ from: string; to: string; color: string }> = [];

    if (messages) {
      const recentMsgs = messages.filter(m => m._creationTime > recentCutoff);
      const seenPairs = new Set<string>();

      for (const msg of recentMsgs) {
        const fromRole = agentIdToRole.get(msg.from);
        const toRole = agentIdToRole.get(msg.to);
        if (!fromRole || !toRole) continue;

        const pairKey = [fromRole, toRole].sort().join("-");
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        communicatingRoles.add(fromRole);
        communicatingRoles.add(toRole);

        const fromConfig = agentCharacters[fromRole];
        pairs.push({ from: fromRole, to: toRole, color: fromConfig?.color ?? "#e8734a" });
      }
    }

    // Determine positions
    const newPositions: Record<string, { x: number; y: number }> = {};
    const atMeeting = new Set<string>();

    // Agents at meeting table: communicating OR (multiple active agents)
    for (const agent of agents) {
      const config = agentCharacters[agent.role];
      if (!config) continue;

      const isCommunicating = communicatingRoles.has(agent.role);
      const isActive = agent.status === "active";
      const multipleActive = activeRoles.size > 1;

      if (isCommunicating || (isActive && multipleActive)) {
        // Go to meeting table
        newPositions[agent.role] = meetingSeats[agent.role] ?? { x: 50, y: 48 };
        atMeeting.add(agent.role);
      } else {
        // Stay at desk
        newPositions[agent.role] = { ...config.idlePos };
      }
    }

    // For agents at meeting, also draw lines to CEO if active
    if (activeRoles.size > 1 && atMeeting.has("CEO")) {
      const seenPairKeys = new Set(pairs.map(p => [p.from, p.to].sort().join("-")));
      for (const role of atMeeting) {
        if (role === "CEO") continue;
        const pairKey = ["CEO", role].sort().join("-");
        if (!seenPairKeys.has(pairKey)) {
          pairs.push({
            from: "CEO",
            to: role,
            color: agentCharacters[role]?.color ?? "#e8734a",
          });
        }
      }
    }

    setPositions(newPositions);
    setCommPairs(pairs);
  }, [
    agents?.map(a => `${a.role}:${a.status}`).join(","),
    messages?.length,
  ]);

  return { positions, commPairs };
}

/* ─── Speech Bubble ──────────────────────────────────────────────── */
function SpeechBubble({ text, color }: { text: string; color?: string }) {
  return (
    <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-30 animate-bubble-float pointer-events-none">
      <div
        className="relative text-stone-700 text-[11px] font-medium px-3 py-2 rounded-2xl shadow-lg border max-w-[200px] leading-snug backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderColor: color ? `${color}30` : "rgba(0,0,0,0.08)",
        }}
      >
        {text}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid rgba(255,255,255,0.92)",
          }}
        />
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
        <SpeechBubble text={recentMessage} color={config.color} />
      )}

      {/* Character */}
      <div className={cn(
        "relative cursor-pointer group",
        isActive && "animate-bob",
      )}>
        {/* Floor shadow */}
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/15 blur-md" />

        {/* Avatar */}
        <img
          src={config.avatar}
          alt={agent.role}
          className={cn(
            "w-32 h-32 object-contain select-none drop-shadow-lg transition-all duration-300",
            isActive && "animate-walk scale-110",
            isError && "opacity-70 grayscale-[30%]",
            !isActive && !isError && "hover:scale-105",
          )}
        />

        {/* Status dot */}
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

/* ─── Communication Lines (agent to agent) ──────────────────────── */
function CommunicationLines({
  pairs,
  positions,
}: {
  pairs: Array<{ from: string; to: string; color: string }>;
  positions: Record<string, { x: number; y: number }>;
}) {
  if (pairs.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
      <defs>
        {pairs.map((pair, i) => (
          <linearGradient key={`grad-${i}`} id={`comm-line-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={`${pair.color}40`} />
            <stop offset="50%" stopColor={`${pair.color}80`} />
            <stop offset="100%" stopColor={`${pair.color}40`} />
          </linearGradient>
        ))}
      </defs>

      {pairs.map((pair, i) => {
        const fromPos = positions[pair.from] ?? agentCharacters[pair.from]?.idlePos;
        const toPos = positions[pair.to] ?? agentCharacters[pair.to]?.idlePos;
        if (!fromPos || !toPos) return null;

        return (
          <g key={`${pair.from}-${pair.to}`}>
            {/* Connection line */}
            <line
              x1={`${fromPos.x}%`}
              y1={`${fromPos.y}%`}
              x2={`${toPos.x}%`}
              y2={`${toPos.y}%`}
              stroke={`url(#comm-line-${i})`}
              strokeWidth={2}
              strokeDasharray="8 4"
              className="animate-pulse"
            />

            {/* Traveling dot — shows data flowing */}
            <circle r="3" fill={pair.color} opacity="0.8">
              <animateMotion
                dur={`${1.5 + i * 0.3}s`}
                repeatCount="indefinite"
                path={`M ${fromPos.x * 6},${fromPos.y * 4} L ${toPos.x * 6},${toPos.y * 4}`}
              />
            </circle>
          </g>
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
  const prevActivitiesLen = useRef(0);
  const prevMessagesLen = useRef(0);

  const { positions, commPairs } = useAgentState(agents, messages);

  // Show speech bubbles from inter-agent messages
  useEffect(() => {
    if (!messages || !agents || messages.length === prevMessagesLen.current) return;
    prevMessagesLen.current = messages.length;

    const agentMap = new Map(agents.map(a => [a._id, a]));
    const recentMessages = messages.slice(0, 3);
    const bubbles: Record<string, string> = {};

    for (const msg of recentMessages) {
      const fromAgent = agentMap.get(msg.from);
      if (fromAgent) {
        const text = extractBubbleText(msg.content);
        if (text) bubbles[fromAgent.role] = text;
      }
    }

    if (Object.keys(bubbles).length > 0) {
      setSpeechBubbles(prev => ({ ...prev, ...bubbles }));
      const timer = setTimeout(() => {
        setSpeechBubbles(prev => {
          const next = { ...prev };
          for (const key of Object.keys(bubbles)) delete next[key];
          return next;
        });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [messages?.length, agents]);

  // Show speech bubbles from agent activity output
  useEffect(() => {
    if (!activities || !agents || activities.length === prevActivitiesLen.current) return;
    prevActivitiesLen.current = activities.length;

    const agentMap = new Map(agents.map(a => [a._id, a]));
    const recentOutputs = activities
      .filter(a => a.action === "agent_output" && a.agentId)
      .slice(0, 2);

    const newBubbles: Record<string, string> = {};
    for (const output of recentOutputs) {
      const agent = agentMap.get(output.agentId!);
      if (agent) {
        const text = extractBubbleText(output.content);
        if (text) newBubbles[agent.role] = text;
      }
    }

    if (Object.keys(newBubbles).length > 0) {
      setSpeechBubbles(prev => ({ ...prev, ...newBubbles }));
      const timer = setTimeout(() => {
        setSpeechBubbles(prev => {
          const next = { ...prev };
          for (const key of Object.keys(newBubbles)) delete next[key];
          return next;
        });
      }, 6000);
      return () => clearTimeout(timer);
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
          <Building2 className="w-4 h-4 text-stone-500" />
          <span className="text-[11px] font-bold text-stone-600 tracking-wide">
            Interstice HQ
          </span>
        </div>
        <div className="flex items-center gap-2">
          {inProgressTasks > 0 && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-full border border-blue-200/60 shadow-sm backdrop-blur-sm">
              <Zap className="w-3 h-3" /> {inProgressTasks} running
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

      {/* Communication lines between agents */}
      <CommunicationLines pairs={commPairs} positions={positions} />

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
            <Users className="w-3 h-3 inline" /> {agents.length} agents
          </span>
          <span className="text-stone-300">&bull;</span>
          <span className="text-[10px] text-stone-500 font-medium">
            {activeCount > 0 ? `${activeCount} working` : "All idle"}
          </span>
        </div>
      </div>
    </div>
  );
}
