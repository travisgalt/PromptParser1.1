"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Moon, Sun, Laptop } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {current === "dark" ? <Moon className="h-4 w-4" /> : current === "light" ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
        <Label htmlFor="theme-select">Theme</Label>
      </div>
      <Select value={current} onValueChange={(v) => setTheme(v)}>
        <SelectTrigger id="theme-select" className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">
            <div className="flex items-center gap-2"><Laptop className="h-4 w-4" /> System</div>
          </SelectItem>
          <SelectItem value="light">
            <div className="flex items-center gap-2"><Sun className="h-4 w-4" /> Light</div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2"><Moon className="h-4 w-4" /> Dark</div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};