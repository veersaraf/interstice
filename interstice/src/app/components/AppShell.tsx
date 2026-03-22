"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { BreadcrumbBar } from "./BreadcrumbBar";
import { ContactsPage } from "./ContactsPage";
import { GoalsPage } from "./GoalsPage";
import { TasksPage } from "./TasksPage";
import { AgentsPage } from "./AgentsPage";
import { ActivityPage } from "./ActivityPage";
import { ApprovalsPage } from "./ApprovalsPage";
import { MessagesPage } from "./MessagesPage";
import { FindingsPage } from "./FindingsPage";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [activeSection, setActiveSection] = useState("dashboard");

  const pageContent = (() => {
    switch (activeSection) {
      case "tasks":
        return <TasksPage />;
      case "agents":
        return <AgentsPage />;
      case "activity":
        return <ActivityPage />;
      case "approvals":
        return <ApprovalsPage />;
      case "messages":
        return <MessagesPage />;
      case "findings":
        return <FindingsPage />;
      case "contacts":
        return <ContactsPage />;
      case "goals":
        return <GoalsPage />;
      default:
        return children;
    }
  })();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <BreadcrumbBar section={activeSection} />
        <main className="flex-1 overflow-auto p-6">
          {pageContent}
        </main>
      </div>
    </div>
  );
}
