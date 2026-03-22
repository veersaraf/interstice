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
  Target,
  Users,
  FileText,
  Search,
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
      { id: "goals",     label: "Goals",     icon: Target },
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

  const activeAgents = agents?.filter((a) => a.status === "active") ?? [];
  const pendingApprovals = approvals?.length ?? 0;

  const getBadge = (id: string): { value: number; variant: string } | null => {
    if (id === "approvals" && pendingApprovals > 0) return { value: pendingApprovals, variant: "warning" };
    return null;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="w-60 h-full flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="h-12 px-4 flex items-center gap-2.5 shrink-0 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
            <Zap className="w-3.5 h-3.5 text-white" />
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

        {/* Search bar area */}
        <div className="px-3 py-2 shrink-0">
          <button
            className="w-full flex items-center gap-2 h-8 px-2.5 rounded-md text-xs text-muted-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
            onClick={() => {}}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-sidebar border border-sidebar-border px-1.5 py-0.5 rounded">
              /
            </kbd>
          </button>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav sections */}
        <ScrollArea className="flex-1">
          <nav className="py-2 px-2 flex flex-col gap-4">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
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
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all text-left group",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-sidebar-foreground"
                          )}
                        />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 tabular-nums">
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
        </ScrollArea>

        <Separator className="bg-sidebar-border" />

        {/* Agents status footer */}
        <div className="px-3 py-3 shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 px-0.5">
            Agents
          </p>
          <div className="space-y-1">
            {agents?.slice(0, 5).map((agent) => (
              <button
                key={agent._id}
                onClick={() => onNavigate("agents")}
                className="w-full flex items-center gap-2.5 px-1.5 py-1 rounded-md hover:bg-sidebar-accent transition-colors group"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-shadow",
                    agent.status === "active"
                      ? "bg-green-500 shadow-[0_0_6px_rgba(22,163,74,0.4)]"
                      : agent.status === "error"
                        ? "bg-red-500 shadow-[0_0_6px_rgba(220,38,38,0.3)]"
                        : "bg-stone-300"
                  )}
                />
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
      </aside>
    </TooltipProvider>
  );
}
