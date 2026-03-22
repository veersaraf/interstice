"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  ShieldCheck,
  Users,
  Target,
  Contact2,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import type { LucideIcon } from "lucide-react";

const agentAvatar: Record<string, string> = {
  CEO: "/avatars/ceo.png", Research: "/avatars/research.png", Communications: "/avatars/communications.png", Developer: "/avatars/developer.png", Call: "/avatars/call.png",
};

const navSections: { label: string | null; items: { id: string; label: string; icon: LucideIcon; hasSubmenu?: boolean }[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
      { id: "tasks",     label: "Tasks",          icon: Zap },
      { id: "findings",  label: "Outputs",        icon: BarChart3 },
      { id: "approvals", label: "Approvals",      icon: ShieldCheck },
    ],
  },
  {
    label: "Team",
    items: [
      { id: "agents",    label: "Your Team",      icon: Users },
    ],
  },
  {
    label: "Company",
    items: [
      { id: "goals",     label: "Goals",          icon: Target },
      { id: "contacts",  label: "Contacts",       icon: Contact2 },
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

  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const pendingApprovals = approvals?.length ?? 0;

  const getBadge = (id: string): number | null => {
    if (id === "approvals" && pendingApprovals > 0) return pendingApprovals;
    return null;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-60 h-full flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="h-14 px-4 flex items-center gap-3 shrink-0 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight leading-none">
              Interstice
            </span>
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Agent Orchestration
            </span>
          </div>
          {activeAgents.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 tabular-nums">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {activeAgents.length}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                {activeAgents.length} agent{activeAgents.length !== 1 ? "s" : ""} running
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav sections */}
        <ScrollArea className="flex-1">
          <nav className="py-3 px-3 flex flex-col gap-5">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    {section.label}
                  </p>
                )}
                <div className="flex flex-col gap-0.5">
                  {section.items.map(({ id, label, icon: Icon, hasSubmenu }) => {
                    const isActive = activeSection === id;
                    const badge = getBadge(id);

                    return (
                      <button
                        key={id}
                        onClick={() => onNavigate(id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left group",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-[18px] h-[18px] shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate flex-1">{label}</span>
                        {badge && (
                          <span className="flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold px-1.5 rounded-full bg-red-500 text-white tabular-nums">
                            {badge}
                          </span>
                        )}
                        {hasSubmenu && (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Settings */}
        <div className="px-3 py-2 shrink-0">
          <button
            onClick={() => {}}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-all text-left group"
          >
            <Settings className="w-[18px] h-[18px] shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span>Settings</span>
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Agents status footer */}
        <div className="px-3 py-3 shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Your Team
          </p>
          <div className="space-y-1">
            {agents?.slice(0, 5).map((agent) => (
              <button
                key={agent._id}
                onClick={() => onNavigate("agents")}
                className="w-full flex items-center gap-2.5 px-1.5 py-1 rounded-md hover:bg-sidebar-accent transition-colors group"
              >
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                  {agentAvatar[agent.role] ? (
                    <img src={agentAvatar[agent.role]} alt={agent.role} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-shadow",
                      agent.status === "active"
                        ? "bg-green-500 shadow-[0_0_6px_rgba(22,163,74,0.4)]"
                        : agent.status === "error"
                          ? "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.3)]"
                          : "bg-stone-400 border border-stone-500/30"
                    )}
                  />
                  {agent.status === "active" && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-30" />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground group-hover:text-foreground truncate flex-1 text-left capitalize">
                  {agent.role}
                </span>
                {agent.status === "active" && (
                  <span className="text-[9px] text-green-600 font-bold tracking-wide">
                    LIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 shrink-0 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/60 text-center">
            &copy; 2026 Interstice
          </p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
