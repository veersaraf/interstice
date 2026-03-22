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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks",     label: "Tasks",     icon: CircleDot },
  { id: "agents",    label: "Agents",    icon: Network },
  { id: "activity",  label: "Activity",  icon: History },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "messages",  label: "Messages",  icon: MessageSquare },
  { id: "goals",     label: "Goals",     icon: BookOpen },
];

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const agents = useQuery(api.agents.list);
  const approvals = useQuery(api.approvals.listPending);
  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const pendingApprovals = approvals?.length ?? 0;

  return (
    <aside
      style={{ backgroundColor: "var(--surface-1)", borderRight: "1px solid var(--border)" }}
      className="w-56 h-full flex flex-col shrink-0"
    >
      {/* Logo / Brand */}
      <div className="px-4 h-12 flex items-center gap-2.5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">Interstice</span>
        {activeAgents.length > 0 && (
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
            {activeAgents.length} live
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          const badge =
            id === "approvals" && pendingApprovals > 0 ? pendingApprovals : null;

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors text-left",
                isActive
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
              {badge && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Agents status footer */}
      <div className="px-3 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
          Agents
        </p>
        <div className="space-y-1">
          {agents?.slice(0, 5).map((agent) => (
            <div key={agent._id} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  agent.status === "active"
                    ? "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                    : agent.status === "error"
                      ? "bg-red-400"
                      : "bg-gray-600"
                )}
              />
              <span className="text-[11px] text-gray-500 truncate">{agent.role}</span>
              {agent.status === "active" && (
                <span className="ml-auto text-[10px] text-green-400">active</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
