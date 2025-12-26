"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { stylesList, themesList, speciesList, hairColors, eyeColors } from "@/lib/prompt-data";
import { models } from "@/lib/model-data";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { Sparkles } from "lucide-react";

export default function GeneratorDefaults() {
  const { session } = useSession();
  const userId = session?.user?.id;

  const [prefs, setPrefs] = React.useState({
    selectedModelId: "standard",
    width: 1024,
    height: 1024,
    selectedStyle: "photorealistic",
    selectedTheme: "any",
    safeMode: true,
    selectedSpecies: ["human"] as string[],
    hairColor: "Random",
    eyeColor: "Random",
  });

  const setField = (key: keyof typeof prefs, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  const toggleSpecies = (name: string) => {
    setPrefs((p) => {
      const next = new Set(p.selectedSpecies);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...p, selectedSpecies: Array.from(next) };
    });
  };

  React.useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("default_settings")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        const d = data?.default_settings;
        if (d) {
          setPrefs((p) => ({
            ...p,
            selectedModelId: d.selectedModelId ?? p.selectedModelId,
            width: d.width ?? p.width,
            height: d.height ?? p.height,
            selectedStyle: d.selectedStyle ?? p.selectedStyle,
            selectedTheme: d.selectedTheme ?? p.selectedTheme,
            safeMode: typeof d.safeMode === "boolean" ? d.safeMode : p.safeMode,
            selectedSpecies: Array.isArray(d.selectedSpecies) ? d.selectedSpecies : p.selectedSpecies,
            hairColor: d.hairColor ?? p.hairColor,
            eyeColor: d.eyeColor ?? p.eyeColor,
          }));
        }
      });
  }, [userId]);

  const onSave = async () => {
    if (!userId) {
      showError("Please log in to save preferences.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ default_settings: prefs })
      .eq("id", userId);
    if (error) {
      showError("Failed to save preferences.");
      return;
    }
    showSuccess("Default settings saved.");
  };

  if (!userId) {
    return <div className="text-sm text-muted-foreground">Please log in to manage your generator preferences.</div>;
  }

  // No internal scrollbar; let modal body handle scrolling
  return (
    <div className="space-y-6">
      {/* Info Card - full width */}
      <div className="w-full bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600/15 border border-violet-600/30">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Design Your Starting Point</h3>
            <p className="text-slate-300 leading-relaxed">
              Tired of adjusting sliders every time you log in? Configure your perfect workspace below. We will automatically load these settings as your default 'Zero State' whenever you start a new session.
            </p>
          </div>
        </div>
      </div>

      {/* Model Checkpoint */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-400">Model Checkpoint</Label>
        <Select value={prefs.selectedModelId} onValueChange={(v) => setField("selectedModelId", v)}>
          <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Select a Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width" className="text-sm font-medium text-slate-400">Width</Label>
          <div className="flex items-center gap-3">
            <Slider min={512} max={2048} step={8} value={[prefs.width]} onValueChange={(arr) => setField("width", arr[0] ?? prefs.width)} className="flex-1" />
            <Input id="width" type="number" value={prefs.width} onChange={(e) => setField("width", Number(e.target.value || prefs.width))} className="w-24 bg-slate-900 border-slate-700 text-white rounded-md focus-visible:ring-2 focus-visible:ring-purple-500" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium text-slate-400">Height</Label>
          <div className="flex items-center gap-3">
            <Slider min={512} max={2048} step={8} value={[prefs.height]} onValueChange={(arr) => setField("height", arr[0] ?? prefs.height)} className="flex-1" />
            <Input id="height" type="number" value={prefs.height} onChange={(e) => setField("height", Number(e.target.value || prefs.height))} className="w-24 bg-slate-900 border-slate-700 text-white rounded-md focus-visible:ring-2 focus-visible:ring-purple-500" />
          </div>
        </div>
      </div>

      {/* Style & Theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-400">Style</Label>
          <Select value={prefs.selectedStyle} onValueChange={(v) => setField("selectedStyle", v)}>
            <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select Style" />
            </SelectTrigger>
            <SelectContent>
              {stylesList.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-400">Theme</Label>
          <Select value={prefs.selectedTheme} onValueChange={(v) => setField("selectedTheme", v)}>
            <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Select Theme" />
            </SelectTrigger>
            <SelectContent>
              {themesList.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Safe Mode */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-slate-400">Safe Mode</Label>
          <Switch checked={prefs.safeMode} onCheckedChange={(c) => setField("safeMode", c)} />
        </div>
      </div>

      {/* Character Settings */}
      <div className="space-y-4">
        <Label className="text-base text-slate-300">Character Settings</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {speciesList.map((sp) => {
            const id = `species-${sp.replace(/\s+/g, "-")}`;
            const checked = prefs.selectedSpecies.includes(sp);
            return (
              <div key={sp} className="flex items-center space-x-2">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggleSpecies(sp)}
                  className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 focus-visible:ring-violet-600"
                />
                <Label htmlFor={id} className="capitalize text-sm font-medium text-slate-400">{sp}</Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-4">
        <Label className="text-base text-slate-300">Appearance</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-400">Hair Color</Label>
            <Select value={prefs.hairColor} onValueChange={(v) => setField("hairColor", v)}>
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select Hair Color" />
              </SelectTrigger>
              <SelectContent>
                {hairColors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-400">Eye Color</Label>
            <Select value={prefs.eyeColor} onValueChange={(v) => setField("eyeColor", v)}>
              <SelectTrigger className="w-full bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Select Eye Color" />
              </SelectTrigger>
              <SelectContent>
                {eyeColors.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          These defaults will be applied automatically when you log in.
        </p>
      </div>

      <Button className="w-full bg-violet-600 text-white" onClick={onSave}>
        Save Defaults
      </Button>
    </div>
  );
}