"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { cn } from "../../lib/utils";
import { Network, Zap, AlertCircle, Clock, FileText, Cpu, Settings, Users, Bot, UserPlus, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";

const roleConfig: Record<string, { avatar: string; color: string; dimBg: string; ring: string }> = {
  CEO:            { avatar: "/avatars/ceo.png",            color: "text-amber-700",   dimBg: "bg-amber-50",   ring: "ring-amber-300" },
  Research:       { avatar: "/avatars/research.png",       color: "text-blue-700",    dimBg: "bg-blue-50",    ring: "ring-blue-300" },
  Content:        { avatar: "/avatars/content.png",        color: "text-purple-700",  dimBg: "bg-purple-50",  ring: "ring-purple-300" },
  Outreach:       { avatar: "/avatars/outreach.png",       color: "text-orange-700",  dimBg: "bg-orange-50",  ring: "ring-orange-300" },
  Analytics:      { avatar: "/avatars/analytics.png",      color: "text-cyan-700",    dimBg: "bg-cyan-50",    ring: "ring-cyan-300" },
};

const claudeModels = [
  { id: "claude-opus-4-6", label: "Opus 4.6" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
];

const codexModels = [
  { id: "", label: "Default (GPT-5.3 Codex)" },
  { id: "gpt-5.3-codex", label: "GPT-5.3 Codex" },
  { id: "o3", label: "o3" },
  { id: "o4-mini", label: "o4-mini" },
  { id: "gpt-5-mini", label: "GPT-5 Mini" },
];

function AdapterSelector({ agentId, currentAdapter, currentModel }: {
  agentId: Id<"agents">;
  currentAdapter?: "claude" | "codex";
  currentModel?: string;
}) {
  const setAdapter = useMutation(api.agents.setAdapter);
  const [expanded, setExpanded] = useState(false);
  const adapter = currentAdapter || "codex";
  const models = adapter === "codex" ? codexModels : claudeModels;

  const handleAdapterChange = async (newAdapter: "claude" | "codex") => {
    // Don't set a default model — let each backend use its own default
    await setAdapter({ id: agentId, adapterType: newAdapter, model: "" });
  };

  const handleModelChange = async (model: string) => {
    await setAdapter({ id: agentId, model });
  };

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="w-3 h-3" />
        <Cpu className="w-3 h-3" />
        <span className="font-medium">
          {adapter === "codex" ? "Codex" : "Claude"}
          {currentModel && <span className="text-muted-foreground/60 ml-1">({models.find(m => m.id === currentModel)?.label || currentModel})</span>}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1">
            {(["claude", "codex"] as const).map((a) => (
              <button
                key={a}
                onClick={() => handleAdapterChange(a)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all border",
                  adapter === a
                    ? a === "claude"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-green-50 text-green-700 border-green-200"
                    : "text-muted-foreground hover:text-foreground border-transparent"
                )}
              >
                {a === "claude" ? "Claude" : "Codex"}
              </button>
            ))}
          </div>

          <select
            value={currentModel || ""}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full text-[10px] bg-muted text-foreground border border-border rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Default model</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.label} ({m.id})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

interface DummyAgent {
  id: string;
  role: string;
  title: string;
  skills: string[];
  status: "idle";
}

const skillSuggestions = [
  "Web Search", "Data Analysis", "Email Drafting", "Code Generation",
  "Social Media", "Phone Calls", "Report Writing", "Lead Generation",
  "SEO Optimization", "Content Creation", "Market Research", "Customer Support",
];

const randomColors = [
  { color: "text-pink-700", dimBg: "bg-pink-50", ring: "ring-pink-300" },
  { color: "text-indigo-700", dimBg: "bg-indigo-50", ring: "ring-indigo-300" },
  { color: "text-teal-700", dimBg: "bg-teal-50", ring: "ring-teal-300" },
  { color: "text-rose-700", dimBg: "bg-rose-50", ring: "ring-rose-300" },
  { color: "text-violet-700", dimBg: "bg-violet-50", ring: "ring-violet-300" },
];

function HireModal({ open, onClose, onHire }: {
  open: boolean;
  onClose: () => void;
  onHire: (agent: DummyAgent) => void;
}) {
  const [role, setRole] = useState("");
  const [title, setTitle] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
    }
  };

  const handleHire = () => {
    if (!role.trim()) return;
    onHire({
      id: `dummy-${Date.now()}`,
      role: role.trim(),
      title: title.trim() || `${role.trim()} Agent`,
      skills: selectedSkills,
      status: "idle",
    });
    setRole("");
    setTitle("");
    setSelectedSkills([]);
    setCustomSkill("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Hire a new team member
          </DialogTitle>
          <DialogDescription>
            Define their role and skills. They&apos;ll join your team instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Role name */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Role Name
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Marketing, Sales, Designer"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>

          {/* Title / description */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              What should they do?
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Handle social media campaigns and track engagement metrics"
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Skills
            </label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {skillSuggestions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all",
                    selectedSkills.includes(skill)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {selectedSkills.includes(skill) && <span className="mr-1">✓</span>}
                  {skill}
                </button>
              ))}
            </div>
            {/* Custom skill input */}
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSkill()}
                placeholder="Add custom skill..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <button
                onClick={addCustomSkill}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all"
              >
                Add
              </button>
            </div>
            {/* Show custom skills that were added */}
            {selectedSkills.filter((s) => !skillSuggestions.includes(s)).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedSkills.filter((s) => !skillSuggestions.includes(s)).map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/30 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {skill}
                    <button onClick={() => toggleSkill(skill)} className="ml-0.5 hover:text-primary/70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleHire}
            disabled={!role.trim()}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-semibold transition-all",
              role.trim()
                ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Hire
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AgentsPage() {
  const agents = useQuery(api.agents.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activity.list, { limit: 100 });
  const [hireOpen, setHireOpen] = useState(false);
  const [dummyAgents, setDummyAgents] = useState<DummyAgent[]>([]);

  if (!agents) {
    return (
      <div className="max-w-[1100px] space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg animate-pulse bg-secondary" />
        ))}
      </div>
    );
  }

  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-amber-600" />
          <h1 className="text-sm font-semibold text-foreground">Your Team</h1>
          <span className="text-[11px] text-muted-foreground font-medium">{agents.length + dummyAgents.length} total</span>
          {activeCount > 0 && (
            <Badge variant="success">{activeCount} active</Badge>
          )}
        </div>
        <button
          onClick={() => setHireOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add team member
        </button>
      </div>

      {/* Hire modal */}
      <HireModal
        open={hireOpen}
        onClose={() => setHireOpen(false)}
        onHire={(agent) => setDummyAgents((prev) => [...prev, agent])}
      />

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent) => {
          const cfg = roleConfig[agent.role] ?? { avatar: "", color: "text-stone-500", dimBg: "bg-stone-50", ring: "ring-stone-300" };
          const isActive = agent.status === "active";
          const isError = agent.status === "error";
          const agentTasks = tasks?.filter((t) => t.agentId === agent._id) ?? [];
          const doneTasks = agentTasks.filter((t) => t.status === "done").length;
          const activeTasks = agentTasks.filter((t) => ["in_progress", "pending"].includes(t.status)).length;

          const recentOutput = activities
            ?.filter((a) => a.agentId === agent._id && a.action === "agent_output")
            ?.slice(0, 1)[0];

          return (
            <Card
              key={agent._id}
              className={cn(
                "overflow-hidden transition-all",
                isActive && "agent-active border-green-300",
                isError && "border-red-300"
              )}
            >
              {/* Agent header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-14 h-14 rounded-full overflow-hidden ring-2",
                    cfg.dimBg, cfg.ring,
                  )}>
                    {cfg.avatar ? (
                      <img src={cfg.avatar} alt={agent.role} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Bot className="w-5 h-5 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    isActive ? "bg-green-500" : isError ? "bg-red-500" : "bg-stone-300"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", cfg.color)}>{agent.role}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{agent.title}</div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {activeTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      {activeTasks}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doneTasks}
                  </span>
                </div>
              </div>

              {/* Current task */}
              {isActive && agent.currentTask && (
                <div className="px-4 pb-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Working on</div>
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">{agent.currentTask}</p>
                </div>
              )}

              {/* Recent output */}
              {recentOutput && (
                <div className="px-4 py-2.5 border-t border-border">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Latest output</div>
                  <p className="text-[11px] text-muted-foreground line-clamp-3 font-mono leading-relaxed">
                    {recentOutput.content.substring(0, 200)}
                    {recentOutput.content.length > 200 && "..."}
                  </p>
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="px-4 py-2.5 flex items-center gap-2 border-t border-border">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs text-red-600">Agent in error state</span>
                </div>
              )}

              {/* Adapter selector */}
              <div className="px-4 py-2.5 border-t border-border">
                <AdapterSelector
                  agentId={agent._id}
                  currentAdapter={agent.adapterType as "claude" | "codex" | undefined}
                  currentModel={agent.model}
                />
              </div>

              {/* Status bar */}
              <div className="px-4 py-2 flex items-center justify-between border-t border-border bg-muted/30">
                <span className={cn("text-[10px] font-medium",
                  isActive ? "text-green-600" : isError ? "text-red-600" : "text-muted-foreground"
                )}>
                  {isActive ? "Active" : isError ? "Error" : "Idle"}
                </span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] text-blue-600">
                    <Clock className="w-3 h-3" />
                    Running
                  </span>
                )}
              </div>
            </Card>
          );
        })}

        {/* Dummy hired agents */}
        {dummyAgents.map((dummy, idx) => {
          const colorSet = randomColors[idx % randomColors.length];
          return (
            <Card key={dummy.id} className="overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Agent header */}
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-14 h-14 rounded-full overflow-hidden ring-2 flex items-center justify-center",
                    colorSet.dimBg, colorSet.ring,
                  )}>
                    <Bot className={cn("w-6 h-6", colorSet.color)} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-stone-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-semibold", colorSet.color)}>{dummy.role}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{dummy.title}</div>
                </div>
                <Badge variant="outline" className="text-[9px]">New</Badge>
              </div>

              {/* Skills */}
              {dummy.skills.length > 0 && (
                <div className="px-4 pb-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Skills</div>
                  <div className="flex flex-wrap gap-1">
                    {dummy.skills.map((skill) => (
                      <span
                        key={skill}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium border",
                          colorSet.dimBg, colorSet.color, "border-current/10"
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status bar */}
              <div className="px-4 py-2 flex items-center justify-between border-t border-border bg-muted/30">
                <span className="text-[10px] font-medium text-muted-foreground">Idle</span>
                <span className="text-[10px] text-muted-foreground/60">Just hired</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
