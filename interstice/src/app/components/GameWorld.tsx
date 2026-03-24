"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Building2, Zap, Users } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/* ─── Types ─────────────────────────────────────────────────────── */
type AgentData = { _id: string; name: string; role: string; title: string; status: string; currentTask?: string };

/* ─── Agent Character Config ─────────────────────────────────────── */
const agentCharacters: Record<string, {
  avatar: string;
  color: string;
  idlePos: { x: number; y: number };
  meetingPos: { x: number; y: number };
}> = {
  CEO: {
    avatar: "/avatars/ceo.png",
    color: "#d97706",
    idlePos: { x: 50, y: 18 },
    meetingPos: { x: 50, y: 35 },
  },
  Research: {
    avatar: "/avatars/research.png",
    color: "#2563eb",
    idlePos: { x: 22, y: 48 },
    meetingPos: { x: 38, y: 45 },
  },
  Communications: {
    avatar: "/avatars/communications.png",
    color: "#9333ea",
    idlePos: { x: 68, y: 78 },
    meetingPos: { x: 62, y: 55 },
  },
  Developer: {
    avatar: "/avatars/developer.png",
    color: "#16a34a",
    idlePos: { x: 30, y: 78 },
    meetingPos: { x: 38, y: 55 },
  },
  Call: {
    avatar: "/avatars/call.png",
    color: "#ea580c",
    idlePos: { x: 75, y: 48 },
    meetingPos: { x: 62, y: 45 },
  },
};

/* ─── Extract clean speech bubble text ──────────────────────────── */
function extractBubbleText(content: string): string | null {
  if (/^\s*[{[]/.test(content)) return null;
  if (content.length < 5) return null;

  const firstLine = content.split("\n")[0].trim();
  const firstSentence = firstLine.match(/^[^.!?]+[.!?]?/)?.[0] ?? firstLine;

  const text = firstSentence.length > 70
    ? firstSentence.substring(0, 67) + "…"
    : firstSentence;

  if (/^(task_|delegation|{"|\[{)/.test(text)) return null;
  return text;
}

/* ─── Compute agent positions + communicating pairs ────────────── */
interface CommPair {
  from: string;
  to: string;
  fromColor: string;
  toColor: string;
}

function useAgentState(
  agents: AgentData[] | undefined,
  messages: Array<{ from: string; to: string; _creationTime: number }> | undefined,
) {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [commPairs, setCommPairs] = useState<CommPair[]>([]);
  const [communicatingRoles, setCommunicatingRoles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!agents) return;

    const agentIdToRole = new Map(agents.map(a => [a._id, a.role]));
    const activeRoles = new Set(agents.filter(a => a.status === "active").map(a => a.role));

    // Find recent communicating pairs (last 30s)
    const recentCutoff = Date.now() - 30_000;
    const commRoles = new Set<string>();
    const pairs: CommPair[] = [];

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

        commRoles.add(fromRole);
        commRoles.add(toRole);

        pairs.push({
          from: fromRole,
          to: toRole,
          fromColor: agentCharacters[fromRole]?.color ?? "#e8734a",
          toColor: agentCharacters[toRole]?.color ?? "#e8734a",
        });
      }
    }

    // Determine positions
    const newPositions: Record<string, { x: number; y: number }> = {};

    for (const agent of agents) {
      const config = agentCharacters[agent.role];
      if (!config) continue;

      const isCommunicating = commRoles.has(agent.role);
      const isActive = agent.status === "active";
      const multipleActive = activeRoles.size > 1;

      if (isCommunicating || (isActive && multipleActive)) {
        newPositions[agent.role] = { ...config.meetingPos };
      } else {
        newPositions[agent.role] = { ...config.idlePos };
      }
    }

    // Add delegation lines from CEO to active specialists (if CEO is active and no direct comm pair exists)
    if (activeRoles.size > 1 && activeRoles.has("CEO")) {
      const seenPairKeys = new Set(pairs.map(p => [p.from, p.to].sort().join("-")));
      for (const role of activeRoles) {
        if (role === "CEO") continue;
        const pairKey = ["CEO", role].sort().join("-");
        if (!seenPairKeys.has(pairKey)) {
          pairs.push({
            from: "CEO",
            to: role,
            fromColor: agentCharacters.CEO.color,
            toColor: agentCharacters[role]?.color ?? "#e8734a",
          });
        }
      }
    }

    setPositions(newPositions);
    setCommPairs(pairs);
    setCommunicatingRoles(commRoles);
  }, [
    agents?.map(a => `${a.role}:${a.status}`).join(","),
    messages?.length,
  ]);

  return { positions, commPairs, communicatingRoles };
}

/* ─── Speech Bubble ──────────────────────────────────────────────── */
function SpeechBubble({ text, color }: { text: string; color?: string }) {
  return (
    <div className="absolute left-1/2 bottom-full mb-3 -translate-x-1/2 z-30 animate-bubble-float pointer-events-none">
      <div
        className="relative text-stone-700 text-[10px] font-medium px-2.5 py-1.5 rounded-xl shadow-md border max-w-[180px] leading-snug backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.93)",
          borderColor: color ? `${color}30` : "rgba(0,0,0,0.08)",
        }}
      >
        {text}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full"
          style={{
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(255,255,255,0.93)",
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
  isCommunicating,
}: {
  agent: AgentData;
  position: { x: number; y: number };
  recentMessage?: string;
  isCommunicating: boolean;
}) {
  const config = agentCharacters[agent.role];
  if (!config) return null;

  const isActive = agent.status === "active";
  const isError = agent.status === "error";
  const isEngaged = isActive || isCommunicating;

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transition: "left 1.4s cubic-bezier(0.34, 1.56, 0.64, 1), top 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isEngaged ? 20 : 10,
      }}
    >
      {/* Speech bubble */}
      {recentMessage && (
        <SpeechBubble text={recentMessage} color={config.color} />
      )}

      {/* Character */}
      <div className={cn(
        "relative cursor-pointer group",
        isEngaged && "animate-bob",
      )}>
        {/* Floor shadow */}
        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/15 blur-md" />

        {/* Communication glow ring */}
        {isCommunicating && (
          <div
            className="absolute -inset-2 rounded-full animate-comm-glow"
            style={{
              background: `radial-gradient(circle, ${config.color}18 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Avatar */}
        <img
          src={config.avatar}
          alt={agent.role}
          className={cn(
            "w-32 h-32 object-contain select-none drop-shadow-lg transition-all duration-500",
            isEngaged && "animate-walk scale-110",
            isError && "opacity-70 grayscale-[30%]",
            !isEngaged && !isError && "hover:scale-105",
          )}
        />

        {/* Status dot */}
        <div className={cn(
          "absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-sm",
          isCommunicating ? "bg-blue-400" : isActive ? "bg-green-400" : isError ? "bg-red-400" : "bg-stone-400"
        )}>
          {isEngaged && (
            <div className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-40",
              isCommunicating ? "bg-blue-400" : "bg-green-400"
            )} />
          )}
        </div>

        {/* Role label when communicating */}
        {isCommunicating && (
          <div
            className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap animate-fade-in"
            style={{
              backgroundColor: `${config.color}12`,
              color: config.color,
              border: `1px solid ${config.color}20`,
            }}
          >
            {agent.role}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Communication Lines (SVG with viewBox for proper animation) ── */
function CommunicationLines({
  pairs,
  positions,
}: {
  pairs: CommPair[];
  positions: Record<string, { x: number; y: number }>;
}) {
  if (pairs.length === 0) return null;

  // Use viewBox 0 0 1000 1000 so percentage positions map cleanly (x% → x*10)
  const scale = 10;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      <defs>
        {pairs.map((pair, i) => {
          const midColor = blendColors(pair.fromColor, pair.toColor);
          return (
            <linearGradient key={`grad-${i}`} id={`comm-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={pair.fromColor} stopOpacity="0.5" />
              <stop offset="50%" stopColor={midColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={pair.toColor} stopOpacity="0.5" />
            </linearGradient>
          );
        })}
        {/* Glow filter */}
        <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {pairs.map((pair, i) => {
        const fromPos = positions[pair.from] ?? agentCharacters[pair.from]?.meetingPos;
        const toPos = positions[pair.to] ?? agentCharacters[pair.to]?.meetingPos;
        if (!fromPos || !toPos) return null;

        const x1 = fromPos.x * scale;
        const y1 = fromPos.y * scale;
        const x2 = toPos.x * scale;
        const y2 = toPos.y * scale;

        // Curved path — perpendicular offset for visual interest
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const curveStrength = 20;
        const cx = mx + (-dy / len) * curveStrength;
        const cy = my + (dx / len) * curveStrength;

        const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        return (
          <g key={`${pair.from}-${pair.to}`} filter="url(#line-glow)">
            {/* Main line */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#comm-grad-${i})`}
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              {/* Line draw-in animation */}
              <animate
                attributeName="stroke-dasharray"
                from={`0 ${len * 2}`}
                to={`${len * 2} 0`}
                dur="0.8s"
                fill="freeze"
              />
            </path>

            {/* Flowing dot — forward direction */}
            <circle r="5" fill={pair.fromColor} opacity="0.85">
              <animateMotion
                dur={`${1.8 + i * 0.2}s`}
                repeatCount="indefinite"
                path={pathD}
              />
              <animate
                attributeName="r"
                values="3;5;3"
                dur={`${1.8 + i * 0.2}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Flowing dot — return direction */}
            <circle r="4" fill={pair.toColor} opacity="0.65">
              <animateMotion
                dur={`${2.2 + i * 0.2}s`}
                repeatCount="indefinite"
                path={pathD}
                keyPoints="1;0"
                keyTimes="0;1"
                calcMode="linear"
              />
            </circle>

            {/* Midpoint sparkle */}
            <circle cx={cx} cy={cy} r="3" fill="white" opacity="0.4">
              <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Color blend helper ─────────────────────────────────────────── */
function blendColors(a: string, b: string): string {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (v1: number, v2: number) => Math.round((v1 + v2) / 2).toString(16).padStart(2, "0");
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
}

/* ─── Meeting Table Glow ─────────────────────────────────────────── */
function MeetingTableGlow({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 animate-fade-in"
      style={{ zIndex: 1 }}
    >
      <div className="w-28 h-28 rounded-full bg-amber-400/6 border border-amber-300/10 shadow-inner animate-pulse" />
    </div>
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

  const { positions, commPairs, communicatingRoles } = useAgentState(agents, messages);

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
  const hasActiveComms = commPairs.length > 0;

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
          {hasActiveComms && (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 bg-purple-50/90 px-2.5 py-1 rounded-full border border-purple-200/60 shadow-sm backdrop-blur-sm animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              {communicatingRoles.size} in meeting
            </span>
          )}
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

      {/* Meeting table glow when agents gather */}
      <MeetingTableGlow visible={hasActiveComms} />

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
            isCommunicating={communicatingRoles.has(agent.role)}
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
            {hasActiveComms
              ? `${communicatingRoles.size} in meeting`
              : activeCount > 0
                ? `${activeCount} working`
                : "All idle"}
          </span>
        </div>
      </div>
    </div>
  );
}
