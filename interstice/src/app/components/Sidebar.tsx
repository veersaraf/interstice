"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  CircleDot,
  Network,
  History,
  ShieldCheck,
  MessageSquare,
  Zap,
  BookOpen,
  Users,
  FileText,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navSections = [
  {
    label: null,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Work",
    items: [
      { id: "tasks",     label: "Tasks",     icon: CircleDot },
      { id: "findings",  label: "Output",    icon: FileText },
      { id: "approvals", label: "Approvals", icon: ShieldCheck },
    ],
  },
  {
    label: "Monitor",
    items: [
      { id: "agents",    label: "Agents",    icon: Network },
      { id: "activity",  label: "Activity",  icon: History },
      { id: "messages",  label: "Messages",  icon: MessageSquare },
    ],
  },
  {
    label: "Company",
    items: [
      { id: "goals",     label: "Goals",     icon: BookOpen },
      { id: "contacts",  label: "Contacts",  icon: Users },
    ],
  },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const agents = useQuery(api.agents.list);
  const approvals = useQuery(api.approvals.listPending);
  const findings = useQuery(api.findings.list);
  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const pendingApprovals = approvals?.length ?? 0;
  const findingsCount = findings?.length ?? 0;

  const getBadge = (id: string): { value: number; color: string } | null => {
    if (id === "approvals" && pendingApprovals > 0) return { value: pendingApprovals, color: "bg-yellow-500/20 text-yellow-400" };
    if (id === "findings" && findingsCount > 0) return { value: findingsCount, color: "bg-cyan-500/20 text-cyan-400" };
    return null;
  };

  return (
    <aside
      style={{ backgroundColor: "var(--surface-1)", borderRight: "1px solid var(--border)" }}
      className="w-56 h-full flex flex-col shrink-0"
    >
      {/* Logo */}
      <div className="px-4 h-12 flex items-center gap-2.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">Interstice</span>
        {activeAgents.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {activeAgents.length}
          </span>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-3">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider px-3 mb-1">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                const badge = getBadge(id);

                return (
                  <button
                    key={id}
                    onClick={() => onNavigate(id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left",
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-blue-400" : "")} />
                    <span className="truncate">{label}</span>
                    {badge && (
                      <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full", badge.color)}>
                        {badge.value}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Agents status footer */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Agents
        </p>
        <div className="space-y-1.5">
          {agents?.slice(0, 5).map((agent) => (
            <div key={agent._id} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  agent.status === "active"
                    ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                    : agent.status === "error"
                      ? "bg-red-400"
                      : "bg-gray-700"
                )}
              />
              <span className="text-[11px] text-gray-500 truncate flex-1">{agent.role}</span>
              {agent.status === "active" && (
                <span className="text-[9px] text-green-500 font-medium">LIVE</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
