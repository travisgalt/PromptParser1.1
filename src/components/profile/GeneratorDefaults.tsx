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
import { stylesList, themesList } from "@/lib/prompt-data";
import { Sparkles } from "lucide-react";

// ADDED imports for Prompt Builder UI
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { defaultCategories } from "@/lib/prompt-builder-data";
import { cn } from "@/lib/utils";
// Add catalogs for display or validation
import { ALL_STYLES, SAFE_STYLES } from "@/lib/style-catalogs";

export default function GeneratorDefaults() {
  const { session } = useSession();
  const userId = session?.user?.id;

  const [prefs, setPrefs] = React.useState({
    selectedStyle: "photorealistic",
    selectedTheme: "any",
    safeMode: true,
  });

  const setField = (key: keyof typeof prefs, value: any) => {
    setPrefs((p) => ({ ...p, [key]: value }));
  };

  // ADDED: local Prompt Builder defaults state
  const [builder, setBuilder] = React.useState<{ name: string; tags: string[]; selected: string[] }[]>(
    defaultCategories.map((c) => ({ ...c, selected: [] }))
  );

  // ADDED: accordion open state
  const [openCats, setOpenCats] = React.useState<string[]>([]);

  // ADDED: guardrail-aware tag toggle copied from main controls
  const toggleBuilderTag = (catIndex: number, tag: string) => {
    const categories = [...builder];
    const current = categories[catIndex];
    const wasSelected = (current.selected || []).includes(tag);

    const findCat = (name: string) => categories.find((c) => c.name === name);
    const setCatSelected = (name: string, next: string[]) => {
      const idx = categories.findIndex((c) => c.name === name);
      if (idx >= 0) categories[idx] = { ...categories[idx], selected: next };
    };
    const clearCategory = (name: string) => setCatSelected(name, []);
    const removeTagInCategory = (name: string, tagsToRemove: string[] | string) => {
      const arr = Array.isArray(tagsToRemove) ? tagsToRemove : [tagsToRemove];
      const cat = findCat(name);
      if (!cat) return;
      const sel = new Set(cat.selected || []);
      arr.forEach((t) => sel.delete(t));
      setCatSelected(name, Array.from(sel));
    };

    let nextSel = new Set(current.selected || []);
    if (wasSelected) {
      nextSel.delete(tag);
      // If deselecting theme/style, clear prefs when applicable
      if (current.name === "Theme") setPrefs((p) => ({ ...p, selectedTheme: "any" }));
      if (current.name === "Art Style") setPrefs((p) => ({ ...p, selectedStyle: "photorealistic" }));
    } else {
      nextSel.add(tag);

      // NEW: Single-select for Theme and Art Style; sync top-level prefs for defaults
      if (current.name === "Theme") {
        nextSel = new Set([tag]);
        setPrefs((p) => ({ ...p, selectedTheme: tag }));
      }
      if (current.name === "Art Style") {
        nextSel = new Set([tag]);
        setPrefs((p) => ({ ...p, selectedStyle: tag }));
      }

      // Rule A: Full Body vs Parts
      if (current.name === "Outfit - Full Body / Dresses") {
        clearCategory("Outfit - Top");
        clearCategory("Outfit - Bottom");
      }

      // Rule B: Parts vs Full Body
      if (current.name === "Outfit - Top" || current.name === "Outfit - Bottom") {
        clearCategory("Outfit - Full Body / Dresses");
      }

      // Rule C: Pose Conflict (Dynamic vs Static)
      if (current.name === "Pose") {
        nextSel = new Set([tag]);
        const tl = tag.toLowerCase();
        const dynamic = new Set(["running", "jumping", "flying", "action pose", "dynamic pose", "walking"]);
        const staticSet = new Set(["sitting", "kneeling", "lying down", "on stomach", "on back", "sleeping"]);
        if (dynamic.has(tl)) {
          removeTagInCategory("Pose", Array.from(staticSet));
        } else if (staticSet.has(tl)) {
          removeTagInCategory("Pose", Array.from(dynamic));
        }
      }

      // Rule D: Background Conflict (Simple vs Detailed)
      if (current.name === "Background - Simple") {
        clearCategory("Location - Detailed");
      } else if (current.name === "Location - Detailed") {
        clearCategory("Background - Simple");
      }

      // Rule E: Hair Logic (bald clears Hair Color)
      if (current.name === "Hair Style" && tag.toLowerCase() === "bald") {
        clearCategory("Hair Color");
      } else if (current.name === "Hair Style" && tag.toLowerCase() !== "bald") {
        removeTagInCategory("Hair Style", "bald");
      }
      if (current.name === "Hair Color") {
        removeTagInCategory("Hair Style", "bald");
      }

      // Rule F: Eyes logic
      if (current.name === "Eyes") {
        const tl = tag.toLowerCase();
        const eyeColors = ["blue eyes","red eyes","green eyes","amber eyes","purple eyes","yellow eyes","pink eyes"];
        if (tl === "closed eyes") {
          const cat = findCat("Eyes");
          if (cat) {
            const filtered = (cat.selected || []).filter((t) => !eyeColors.includes(t.toLowerCase()));
            nextSel = new Set(filtered.concat(["closed eyes"]));
          }
        } else if (eyeColors.includes(tl)) {
          nextSel.delete("closed eyes");
        }
      }
    }

    categories[catIndex] = { ...current, selected: Array.from(nextSel) };
    setBuilder(categories);
  };

  // REPLACED: Load top-level defaults from profile; remove legacy flags/species/hair/eye/dimensions/model
  React.useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("default_settings")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        const d = data?.default_settings;
        if (d) {
          setPrefs((p) => ({
            ...p,
            selectedStyle: d.selectedStyle ?? p.selectedStyle,
            selectedTheme: d.selectedTheme ?? p.selectedTheme,
            safeMode: typeof d.safeMode === "boolean" ? d.safeMode : p.safeMode,
          }));
        }
      });
  }, [userId]);

  // ADDED: Load builder defaults from localStorage when modal tab renders
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user_default_builder");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Basic shape check: has name, tags, selected
          setBuilder(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const onSave = async () => {
    if (!userId) {
      showError("Please log in to save preferences.");
      return;
    }

    // 1) Save Prompt Builder defaults to localStorage
    try {
      localStorage.setItem("user_default_builder", JSON.stringify(builder));
    } catch {
      showError("Failed to save local defaults.");
      return;
    }

    // 2) Persist top-level prefs (style/theme/safe mode) to profile
    const { error } = await supabase
      .from("profiles")
      .update({ default_settings: prefs })
      .eq("id", userId);

    if (error) {
      showError("Failed to save preferences.");
      return;
    }
    showSuccess("Defaults saved. Your Prompt Builder selections will preload next time.");
  };

  if (!userId) {
    return <div className="text-sm text-muted-foreground">Please log in to manage your generator preferences.</div>;
  }

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
              Pre-select tags like "Masterpiece", "Elf", "Blue Eyes", or "Cyberpunk City" and save them as your permanent starting state.
            </p>
          </div>
        </div>
      </div>

      {/* Top-level Style & Theme */}
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
        <p className="text-xs text-muted-foreground">
          Filters sensitive accessories and tokens in generation.
        </p>
      </div>

      {/* Mini Prompt Builder */}
      <div className="space-y-2">
        <Label className="text-base text-slate-300">Prompt Builder</Label>
        <Accordion
          type="multiple"
          value={openCats}
          onValueChange={(vals: string | string[]) => setOpenCats(Array.isArray(vals) ? vals : [vals])}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {builder.map((cat, idx) => {
            const count = (cat.selected || []).length;
            const isOpen = openCats.includes(cat.name);
            const isActive = isOpen || count > 0;

            return (
              <AccordionItem key={cat.name} value={cat.name} className="rounded-lg">
                <AccordionTrigger
                  className={cn(
                    "px-3 py-2 rounded-md border bg-slate-800/60 text-slate-200 text-sm",
                    "hover:bg-slate-800/80",
                    isActive ? "border-violet-600/50 shadow-[0_0_0_1px_rgba(139,92,246,0.35)]" : "border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="whitespace-normal break-words text-sm leading-tight">
                      {cat.name}
                    </span>
                    <Badge className="bg-slate-800/40 text-slate-400 border border-slate-700">
                      {count}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border border-white/10 rounded-md bg-white/5">
                  <div className="p-3 flex flex-wrap gap-2">
                    {cat.tags.map((tag) => {
                      const pressed = (cat.selected || []).includes(tag);
                      const display = tag.replace(/_/g, " ");
                      return (
                        <Toggle
                          key={tag}
                          pressed={pressed}
                          onPressedChange={() => toggleBuilderTag(idx, tag)}
                          className={cn(
                            "px-3 py-1.5 rounded-full border text-xs md:text-sm cursor-pointer transition-colors",
                            pressed
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-slate-800/50 text-slate-300 border-white/10 hover:bg-gray-700"
                          )}
                          aria-label={display}
                        >
                          {display}
                        </Toggle>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Button className="w-full bg-violet-600 text-white" onClick={onSave}>
        Save Defaults
      </Button>
    </div>
  );
}