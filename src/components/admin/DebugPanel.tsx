"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Bug, Settings, RefreshCw } from "lucide-react";
import { useDebug } from "@/contexts/DebugContext";

const DebugPanel: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { overridePro, simulateDelay, maintenanceMode, setOverridePro, setSimulateDelay, setMaintenanceMode, resetAll } = useDebug();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <button
          className="rounded-full p-3 bg-slate-900/80 border border-red-500/60 shadow-md hover:opacity-90 opacity-60"
          onClick={() => setOpen(true)}
          aria-label="Open Debug Panel"
        >
          <Bug className="h-5 w-5 text-red-400" />
        </button>
      ) : (
        <Card className="w-80 bg-slate-900/95 border-2 border-red-500/60 shadow-xl rounded-lg">
          <div className="flex items-center justify-between p-3 border-b border-red-500/30">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-red-400" />
              <span className="text-sm font-semibold text-red-300">Debug Tools</span>
            </div>
            <Button variant="ghost" size="sm" className="hover:bg-white/10" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <div className="p-3 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-200">Force Pro Mode</Label>
                <Switch checked={overridePro} onCheckedChange={setOverridePro} />
              </div>
              <div className="text-[11px] text-muted-foreground">
                Overrides subscription checks for testing Pro-only features.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-200">Simulate API Latency</Label>
                <Switch checked={simulateDelay} onCheckedChange={setSimulateDelay} />
              </div>
              <div className="text-[11px] text-muted-foreground">
                Fakes slow network responses to test loading states.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-200">Maintenance Mode</Label>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <div className="text-[11px] text-muted-foreground">
                Locks the app UX for maintenance testing (hook up in UI later).
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={resetAll}
              >
                <RefreshCw className="h-4 w-4" /> Reset All
              </Button>
              <div className="text-[10px] text-muted-foreground">Dev Panel • Always on top</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DebugPanel;