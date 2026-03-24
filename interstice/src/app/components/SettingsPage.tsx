"use client";

import { Settings, Zap, Bell, Shield, Palette } from "lucide-react";
import { Card } from "../../components/ui/card";

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Configure your Interstice workspace</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40">
          <SettingRow
            icon={Zap}
            title="Agent Orchestration"
            description="Heartbeat interval, max concurrent agents, task timeout"
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
          <SettingRow
            icon={Bell}
            title="Notifications"
            description="OMI wearable alerts, approval notifications, task completion"
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <SettingRow
            icon={Shield}
            title="Approval Gates"
            description="Configure which actions require human approval"
            iconColor="text-red-600"
            iconBg="bg-red-50"
          />
          <SettingRow
            icon={Palette}
            title="Appearance"
            description="Theme, layout preferences, dashboard customization"
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
        </div>
      </Card>

      <p className="text-xs text-muted-foreground/60 text-center pt-4">
        Settings are stored locally. Agent configuration is managed via Convex.
      </p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  iconColor,
  iconBg,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left group">
      <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">Coming soon</span>
    </button>
  );
}
