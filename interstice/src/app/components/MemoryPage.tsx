"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Brain,
  Target,
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  PauseCircle,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  User2,
  Bot,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

/* ─── Types ─────────────────────────────────────────────── */

type Goal = {
  _id: Id<"goals">;
  _creationTime: number;
  title: string;
  description: string;
  status: "active" | "completed" | "paused";
};

type GoalStatus = Goal["status"];

type ContextDoc = {
  id: string;
  title: string;
  description: string;
  type: "identity" | "positioning" | "contacts" | "learnings" | "decisions" | "custom";
  content: string;
};

/* ─── Graph types ──────────────────────────────────────── */

type NodeKind = "goal" | "agent" | "context" | "contact" | "central";

interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  detail?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

/* ─── Constants ─────────────────────────────────────────── */

const NODE_COLORS: Record<NodeKind, string> = {
  central: "#e8734a",
  goal: "#2563eb",
  agent: "#16a34a",
  context: "#9333ea",
  contact: "#d97706",
};

const NODE_RADII: Record<NodeKind, number> = {
  central: 8,
  goal: 5,
  agent: 6,
  context: 5,
  contact: 4,
};

const statusConfig: Record<GoalStatus, { label: string; icon: typeof Circle; color: string; variant: "success" | "info" | "warning" }> = {
  active:    { label: "Active",    icon: Circle,       color: "text-green-600",  variant: "success" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-blue-600",   variant: "info"    },
  paused:    { label: "Paused",    icon: PauseCircle,  color: "text-amber-600",  variant: "warning" },
};

const typeColors: Record<string, string> = {
  identity: "bg-purple-50 text-purple-700 border-purple-200",
  positioning: "bg-blue-50 text-blue-700 border-blue-200",
  contacts: "bg-green-50 text-green-700 border-green-200",
  learnings: "bg-amber-50 text-amber-700 border-amber-200",
  decisions: "bg-red-50 text-red-700 border-red-200",
  custom: "bg-stone-50 text-stone-700 border-stone-200",
};

const defaultContextDocs: ContextDoc[] = [
  {
    id: "identity",
    title: "Company Identity",
    description: "Who we are and what we do",
    type: "identity",
    content: "Name: Interstice\nTagline: The gap between intent and execution — filled by AI agents.\nWhat we do: AI agent orchestration for solopreneurs.",
  },
  {
    id: "positioning",
    title: "Market Positioning",
    description: "How we fit in the market",
    type: "positioning",
    content: "We sit on top of OMI (hardware wearable) and add the orchestration layer.\nTarget: solopreneurs who want AI agents doing the work.",
  },
  {
    id: "contacts",
    title: "Key Contacts",
    description: "Important people and their info",
    type: "contacts",
    content: "Veer Saraf (founder, builder)\nWarren Kalvakota (co-founder, pitch)",
  },
  {
    id: "decisions",
    title: "Key Decisions",
    description: "Major decisions and their reasoning",
    type: "decisions",
    content: "Claude CLI subprocesses instead of API calls.\nConvex for real-time backend.\nHeartbeat-based execution.",
  },
];

/* ─── Force simulation ─────────────────────────────────── */

function runForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 120
): GraphNode[] {
  const result = nodes.map((n) => ({ ...n }));
  const edgeMap = new Map<string, Set<string>>();

  for (const e of edges) {
    if (!edgeMap.has(e.source)) edgeMap.set(e.source, new Set());
    if (!edgeMap.has(e.target)) edgeMap.set(e.target, new Set());
    edgeMap.get(e.source)!.add(e.target);
    edgeMap.get(e.target)!.add(e.source);
  }

  const cx = width / 2;
  const cy = height / 2;

  // Initialize positions in a circle around center
  const centralIdx = result.findIndex((n) => n.kind === "central");
  if (centralIdx >= 0) {
    result[centralIdx].x = cx;
    result[centralIdx].y = cy;
  }

  const nonCentral = result.filter((n) => n.kind !== "central");
  nonCentral.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nonCentral.length;
    const r = Math.min(width, height) * 0.3;
    n.x = cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40;
    n.y = cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40;
  });

  const idealDist = 120;
  const repulsion = 3000;

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    const damping = 0.85;

    // Repulsive forces between all nodes
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const dx = result[j].x - result[i].x;
        const dy = result[j].y - result[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (repulsion * alpha) / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        result[i].vx -= fx;
        result[i].vy -= fy;
        result[j].vx += fx;
        result[j].vy += fy;
      }
    }

    // Attractive forces along edges
    for (const edge of edges) {
      const a = result.find((n) => n.id === edge.source);
      const b = result.find((n) => n.id === edge.target);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = ((dist - idealDist) * 0.05) * alpha;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // Center gravity
    for (const n of result) {
      n.vx += (cx - n.x) * 0.005 * alpha;
      n.vy += (cy - n.y) * 0.005 * alpha;
    }

    // Apply velocities
    for (const n of result) {
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
      // Clamp to bounds
      const pad = 60;
      n.x = Math.max(pad, Math.min(width - pad, n.x));
      n.y = Math.max(pad, Math.min(height - pad, n.y));
    }
  }

  return result;
}

/* ─── Node Graph Canvas ────────────────────────────────── */

function NodeGraph({
  nodes,
  edges,
  onNodeClick,
  selectedId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (id: string) => void;
  selectedId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [layoutNodes, setLayoutNodes] = useState<GraphNode[]>([]);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Run layout when data or dimensions change
  useEffect(() => {
    if (nodes.length === 0) return;
    const laid = runForceSimulation(nodes, edges, dimensions.width, dimensions.height);
    setLayoutNodes(laid);
  }, [nodes, edges, dimensions.width, dimensions.height]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    for (const n of layoutNodes) m.set(n.id, n);
    return m;
  }, [layoutNodes]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[500px] relative">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ background: "transparent" }}
      >
        {/* Subtle grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.5" fill="#e7e2db" opacity="0.4" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        {edges.map((e, i) => {
          const a = nodeMap.get(e.source);
          const b = nodeMap.get(e.target);
          if (!a || !b) return null;
          const isHighlighted =
            hoveredId === e.source ||
            hoveredId === e.target ||
            selectedId === e.source ||
            selectedId === e.target;
          return (
            <line
              key={`edge-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isHighlighted ? "#78716c" : "#d6d3d1"}
              strokeWidth={isHighlighted ? 1.5 : 0.8}
              opacity={isHighlighted ? 0.7 : 0.35}
              style={{ transition: "all 0.3s ease" }}
            />
          );
        })}

        {/* Nodes */}
        {layoutNodes.map((node) => {
          const isHovered = hoveredId === node.id;
          const isSelected = selectedId === node.id;
          const r = node.radius;

          return (
            <g
              key={node.id}
              style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
              onClick={() => onNodeClick(node.id)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Outer glow ring for selected/hovered */}
              {(isHovered || isSelected) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={1.5}
                  opacity={0.3}
                  style={{ transition: "all 0.3s ease" }}
                />
              )}

              {/* Node dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isHovered || isSelected ? r + 2 : r}
                fill={node.color}
                opacity={isHovered || isSelected ? 1 : 0.85}
                filter={isSelected ? "url(#glow)" : undefined}
                style={{ transition: "all 0.2s ease" }}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 14}
                textAnchor="middle"
                fill="#57534e"
                fontSize={node.kind === "central" ? 12 : 11}
                fontWeight={node.kind === "central" ? 600 : 400}
                fontFamily="system-ui, -apple-system, sans-serif"
                style={{
                  transition: "all 0.2s ease",
                  opacity: isHovered || isSelected ? 1 : 0.7,
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-4 text-[10px] text-muted-foreground">
        {(
          [
            ["central", "Core"],
            ["goal", "Goals"],
            ["agent", "Agents"],
            ["context", "Context"],
            ["contact", "Contacts"],
          ] as [NodeKind, string][]
        ).map(([kind, label]) => (
          <div key={kind} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: NODE_COLORS[kind] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Detail Panel ─────────────────────────────────────── */

interface DetailPanelProps {
  node: GraphNode | null;
  goals: Goal[];
  agents: { _id: string; name: string; role: string; status: string; description: string }[];
  contextDocs: ContextDoc[];
  contacts: { _id: string; name: string; role?: string; company?: string; email?: string; phone?: string }[];
  onClose: () => void;
  onEditGoal: (goal: Goal) => void;
}

function DetailPanel({ node, goals, agents, contextDocs, contacts, onClose, onEditGoal }: DetailPanelProps) {
  if (!node) return null;

  const kindIcons: Record<NodeKind, typeof Brain> = {
    central: Brain,
    goal: Target,
    agent: Bot,
    context: FileText,
    contact: User2,
  };

  const Icon = kindIcons[node.kind];

  let content: React.ReactNode = null;

  if (node.kind === "goal") {
    const goal = goals.find((g) => g._id === node.id);
    if (goal) {
      const cfg = statusConfig[goal.status];
      content = (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {goal.description}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Created {new Date(goal._creationTime).toLocaleDateString()}
          </p>
          <Button size="sm" variant="outline" onClick={() => onEditGoal(goal)}>
            <Pencil className="w-3 h-3" />
            Edit Goal
          </Button>
        </div>
      );
    }
  } else if (node.kind === "agent") {
    const agent = agents.find((a) => a._id === node.id);
    if (agent) {
      content = (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={agent.status === "active" ? "success" : agent.status === "error" ? "destructive" : "info"}
              className="text-[10px]"
            >
              {agent.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{agent.role}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
        </div>
      );
    }
  } else if (node.kind === "context") {
    const doc = contextDocs.find((d) => d.id === node.id);
    if (doc) {
      content = (
        <div className="space-y-3">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", typeColors[doc.type] ?? typeColors.custom)}>
            {doc.type}
          </span>
          {doc.description && <p className="text-[11px] text-muted-foreground">{doc.description}</p>}
          <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {doc.content}
          </pre>
        </div>
      );
    }
  } else if (node.kind === "contact") {
    const contact = contacts.find((c) => c._id === node.id);
    if (contact) {
      content = (
        <div className="space-y-2 text-xs text-muted-foreground">
          {contact.role && <p><span className="font-medium text-foreground">Role:</span> {contact.role}</p>}
          {contact.company && <p><span className="font-medium text-foreground">Company:</span> {contact.company}</p>}
          {contact.email && <p><span className="font-medium text-foreground">Email:</span> {contact.email}</p>}
          {contact.phone && <p><span className="font-medium text-foreground">Phone:</span> {contact.phone}</p>}
        </div>
      );
    }
  } else if (node.kind === "central") {
    content = (
      <p className="text-xs text-muted-foreground leading-relaxed">
        This is the core node of your company knowledge graph. All goals, agents, context documents, and contacts connect through here.
      </p>
    );
  }

  return (
    <Card className="absolute top-4 right-4 w-72 z-10 shadow-lg border-border/60">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: node.color + "18" }}
            >
              <Icon className="w-4 h-4" style={{ color: node.color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{node.label}</h3>
              <span className="text-[10px] text-muted-foreground capitalize">{node.kind}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {content}
      </div>
    </Card>
  );
}

/* ─── Goal Form ─────────────────────────────────────────── */

function GoalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Goal;
  onSave: (data: { title: string; description: string; status?: GoalStatus }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      ...(initial ? { status } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg p-6 space-y-4 bg-card border border-border shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {initial ? "Edit Goal" : "New Goal"}
          </h3>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Title *</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Close seed round by Q2" />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Description *</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does success look like?" rows={3} />
        </div>

        {initial && (
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["active", "completed", "paused"] as GoalStatus[]).map((s) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                      status === s
                        ? cn(cfg.color, "bg-current/10 border-current/25")
                        : "text-muted-foreground border-border hover:border-border/80"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!title.trim() || !description.trim()}>
            {initial ? "Save Changes" : "Create Goal"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Memory Page (exported) ────────────────────────────── */

export function MemoryPage() {
  const goals = useQuery(api.goals.list);
  const agents = useQuery(api.agents.list);
  const contacts = useQuery(api.contacts.list);
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contextDocs] = useState<ContextDoc[]>(defaultContextDocs);

  // Build graph from data
  const { graphNodes, graphEdges } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Central "Interstice" node
    nodes.push({
      id: "central",
      label: "Interstice",
      kind: "central",
      x: 0, y: 0, vx: 0, vy: 0,
      color: NODE_COLORS.central,
      radius: NODE_RADII.central,
    });

    // Goals
    if (goals) {
      for (const g of goals) {
        nodes.push({
          id: g._id,
          label: g.title.length > 24 ? g.title.slice(0, 22) + "…" : g.title,
          kind: "goal",
          x: 0, y: 0, vx: 0, vy: 0,
          color: NODE_COLORS.goal,
          radius: NODE_RADII.goal,
        });
        edges.push({ source: "central", target: g._id });
      }
    }

    // Agents
    if (agents) {
      for (const a of agents) {
        nodes.push({
          id: a._id,
          label: a.name,
          kind: "agent",
          x: 0, y: 0, vx: 0, vy: 0,
          color: NODE_COLORS.agent,
          radius: NODE_RADII.agent,
        });
        edges.push({ source: "central", target: a._id });

        // Connect agents to goals (they all serve the company goals)
        if (goals) {
          for (const g of goals) {
            if (g.status === "active") {
              edges.push({ source: a._id, target: g._id });
            }
          }
        }
      }
    }

    // Context docs
    for (const doc of defaultContextDocs) {
      nodes.push({
        id: doc.id,
        label: doc.title.replace("Company ", ""),
        kind: "context",
        x: 0, y: 0, vx: 0, vy: 0,
        color: NODE_COLORS.context,
        radius: NODE_RADII.context,
      });
      edges.push({ source: "central", target: doc.id });
    }

    // Contacts
    if (contacts) {
      for (const c of contacts) {
        nodes.push({
          id: c._id,
          label: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
          kind: "contact",
          x: 0, y: 0, vx: 0, vy: 0,
          color: NODE_COLORS.contact,
          radius: NODE_RADII.contact,
        });
        // Connect contacts to the contacts context doc
        edges.push({ source: "contacts", target: c._id });
      }
    }

    return { graphNodes: nodes, graphEdges: edges };
  }, [goals, agents, contacts]);

  const selectedNode = useMemo(
    () => graphNodes.find((n) => n.id === selectedNodeId) ?? null,
    [graphNodes, selectedNodeId]
  );

  const handleCreateGoal = async (data: { title: string; description: string }) => {
    await createGoal(data);
    setShowGoalForm(false);
  };

  const handleUpdateGoal = async (data: { title: string; description: string; status?: GoalStatus }) => {
    if (!editingGoal) return;
    await updateGoal({ id: editingGoal._id, ...data });
    setEditingGoal(null);
  };

  const nodeCount = graphNodes.length;
  const edgeCount = graphEdges.length;

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10">
            <Brain className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Knowledge Graph</h1>
            <p className="text-[10px] text-muted-foreground">
              {nodeCount} nodes · {edgeCount} connections
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGoalForm(true)}>
            <Plus className="w-3 h-3" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Graph area */}
      <Card className="flex-1 relative overflow-hidden rounded-2xl border-border/50">
        <NodeGraph
          nodes={graphNodes}
          edges={graphEdges}
          onNodeClick={(id) => setSelectedNodeId(id === selectedNodeId ? null : id)}
          selectedId={selectedNodeId}
        />
        <DetailPanel
          node={selectedNode}
          goals={goals ?? []}
          agents={(agents ?? []) as any}
          contextDocs={contextDocs}
          contacts={(contacts ?? []) as any}
          onClose={() => setSelectedNodeId(null)}
          onEditGoal={setEditingGoal}
        />

        {/* Techy overlay text */}
        <div className="absolute top-3 left-3 text-[10px] font-mono text-muted-foreground/40 select-none pointer-events-none">
          NEURAL MEMORY MAP v1.0
        </div>
      </Card>

      {/* Modals */}
      {showGoalForm && <GoalForm onSave={handleCreateGoal} onCancel={() => setShowGoalForm(false)} />}
      {editingGoal && <GoalForm initial={editingGoal} onSave={handleUpdateGoal} onCancel={() => setEditingGoal(null)} />}
    </div>
  );
}
