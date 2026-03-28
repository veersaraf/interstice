"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  ShieldCheck,
  Users,
  Brain,
  Contact2,
  Settings,
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

const navSections: { label: string | null; items: { id: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard },
      { id: "tasks",     label: "Tasks",       icon: Zap },
      { id: "findings",  label: "Outputs",     icon: BarChart3 },
      { id: "approvals", label: "Approvals",   icon: ShieldCheck },
    ],
  },
  {
    label: "Team",
    items: [
      { id: "agents", label: "Your Team", icon: Users },
    ],
  },
  {
    label: "Company",
    items: [
      { id: "memory",   label: "Memory",   icon: Brain },
      { id: "contacts", label: "Contacts", icon: Contact2 },
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
      <aside className="w-56 h-full flex flex-col shrink-0 bg-sidebar border-r border-sidebar-border">
        {/* Brand */}
        <div className="h-14 px-4 flex items-center shrink-0 border-b border-sidebar-border">
          <img
            src="/avatars/logo.png"
            alt="Interstice"
            className="h-7 w-auto object-contain rounded-lg"
          />
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

        {/* Nav */}
        <ScrollArea className="flex-1">
          <nav className="py-3 px-2 flex flex-col gap-5">
            {navSections.map((section, si) => (
              <div key={si}>
                {section.label && (
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-1.5">
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
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left group",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className="truncate flex-1">{label}</span>
                        {badge && (
                          <span className="flex items-center justify-center min-w-[18px] h-[18px] text-[9px] font-bold px-1 rounded-full bg-red-500 text-white tabular-nums">
                            {badge}
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

        {/* Settings */}
        <div className="px-2 py-1.5 shrink-0">
          <button
            onClick={() => onNavigate("settings")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left group",
              activeSection === "settings"
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <Settings className={cn(
              "w-4 h-4 shrink-0 transition-colors",
              activeSection === "settings" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span>Settings</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 shrink-0 border-t border-sidebar-border">
          <p className="text-[9px] text-muted-foreground/50 text-center">
            Interstice v1.0
          </p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
