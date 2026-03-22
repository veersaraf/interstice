"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BreadcrumbBar } from "./BreadcrumbBar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <BreadcrumbBar section={activeSection} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
