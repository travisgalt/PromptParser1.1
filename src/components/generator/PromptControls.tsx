"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/components/auth/SessionProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { speciesList, stylesList, themesList } from "@/lib/prompt-data";
import { models } from "@/lib/model-data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export type ControlsState = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number;
  safeMode: boolean;
  selectedSpecies: string[];
  selectedTheme: "any" | "fantasy" | "modern" | "scifi" | "cyberpunk" | "steampunk" | "post_apocalyptic" | "horror_gothic" | "noir" | "school_life";
  selectedStyle: string;
  selectedModelId: string; // NEW: model checkpoint id
};

type Props = {
  state: ControlsState;
  onChange: (next: ControlsState) => void;
  onRandomizeSeed: () => void;
  onGenerate: () => void;
  onGenerateImage: () => void; // NEW
  generatingImage?: boolean; // NEW
};

export const PromptControls: React.FC<Props> = ({
  state,
  onChange,
  onRandomizeSeed,
  onGenerate,
  onGenerateImage,
  generatingImage = false,
}) => {
  const setField = <K extends keyof ControlsState>(key: K, value: ControlsState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const toggleSpecies = (name: string) => {
    const next = new Set(state.selectedSpecies || []);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setField("selectedSpecies", Array.from(next));
  };

  // NEW: detect login status
  const { session } = useSession();
  const userId = session?.user?.id;
  const isLoggedIn = !!userId;

  // NEW: ensure value is 1.0 when not logged in
  React.useEffect(() => {
    if (!isLoggedIn && state.negativeIntensity !== 1.0) {
      onChange({ ...state, negativeIntensity: 1.0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <Card className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10">
      <CardHeader>
        <CardTitle className="text-xl">Prompt Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Checkpoint at the very top */}
        <div className="space-y-2">
          <Label>Model Checkpoint</Label>
          <Select
            value={state.selectedModelId}
            onValueChange={(v) => setField("selectedModelId", v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a Model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Top row: Style and Theme side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Style Select */}
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={state.selectedStyle} onValueChange={(v) => setField("selectedStyle", v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Style" />
              </SelectTrigger>
              <SelectContent>
                {stylesList.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Select */}
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={state.selectedTheme} onValueChange={(v) => setField("selectedTheme", v as ControlsState["selectedTheme"])}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Theme" />
              </SelectTrigger>
              <SelectContent>
                {themesList.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Seed & Safe Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seed">Seed</Label>
            <div className="flex gap-2">
              <Input
                id="seed"
                type="number"
                value={state.seed}
                onChange={(e) => setField("seed", Number(e.target.value || 0))}
              />
              <Button variant="secondary" onClick={onRandomizeSeed}>
                Randomize
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="safe">Safe Mode</Label>
              <Switch
                id="safe"
                checked={state.safeMode}
                onCheckedChange={(c) => setField("safeMode", c)}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Filters sensitive accessories and tokens
            </span>
          </div>
        </div>

        {/* Character Settings */}
        <div className="space-y-4">
          <Label className="text-base">Character Settings</Label>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {speciesList.map((sp) => {
                const checked = (state.selectedSpecies || []).includes(sp);
                const id = `species-${sp.replace(/\s+/g, "-")}`;
                return (
                  <div key={sp} className="flex items-center space-x-2">
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggleSpecies(sp)}
                      className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 focus-visible:ring-violet-600"
                    />
                    <Label htmlFor={id} className="capitalize">
                      {sp}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Negative controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label htmlFor="neg">Include Negative</Label>
              <span className="text-xs text-muted-foreground">
                Curated negatives to reduce artifacts
              </span>
            </div>
            <Switch
              id="neg"
              checked={state.includeNegative}
              onCheckedChange={(c) => setField("includeNegative", c)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Negative Intensity</Label>
              {!isLoggedIn && (
                <span className="text-xs text-muted-foreground">Login to unlock</span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Controls the strength of negative prompts. Higher values (e.g. 1.3) tell the AI to avoid these concepts more aggressively.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Slider
              min={0.8}
              max={1.4}
              step={0.05}
              value={[isLoggedIn ? state.negativeIntensity : 1.0]}
              onValueChange={(v) => {
                if (isLoggedIn) setField("negativeIntensity", v[0] ?? 1.0);
              }}
              disabled={!isLoggedIn}
            />
            <div className="text-xs text-muted-foreground">
              {(isLoggedIn ? state.negativeIntensity : 1.0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Primary & Forge actions */}
        <div className="pt-2 space-y-2">
          <Button
            size="lg"
            onClick={onGenerate}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-600/40"
          >
            Generate Prompt ✨
          </Button>

          <Button
            variant="ghost"
            onClick={onGenerateImage}
            disabled={generatingImage}
            className="w-full hover:bg-white/10"
          >
            {generatingImage ? "Generating..." : "Generate Image (Local Forge)"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};