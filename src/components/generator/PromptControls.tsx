"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/components/auth/SessionProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { speciesList, stylesList, themesList, hairColors, eyeColors } from "@/lib/prompt-data";
import { models } from "@/lib/model-data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import useSubscription from "@/hooks/useSubscription";
import PricingModal from "@/components/subscription/PricingModal";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { defaultCategories } from "@/lib/prompt-builder-data";

export type ControlsState = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number;
  safeMode: boolean;
  selectedSpecies: string[];
  selectedTheme: "any" | "fantasy" | "modern" | "scifi" | "cyberpunk" | "steampunk" | "post_apocalyptic" | "horror_gothic" | "noir" | "school_life";
  selectedStyle: string;
  selectedModelId: string; // model checkpoint id
  width: number; // NEW
  height: number; // NEW
  hairColor: string; // already added earlier
  eyeColor: string;  // already added earlier
  // ADDED: ADetailer toggle
  useADetailer: boolean;
  // ADDED: prompt builder categories with selection state
  promptBuilderCategories: { name: string; tags: string[]; selected: string[] }[];
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

  // NEW: toggle a builder tag within a category
  const toggleBuilderTag = (catIndex: number, tag: string) => {
    const categories = state.promptBuilderCategories || defaultCategories.map((c) => ({ ...c, selected: [] }));
    const nextCategories = categories.map((c, idx) => {
      if (idx !== catIndex) return c;
      const sel = new Set(c.selected || []);
      if (sel.has(tag)) sel.delete(tag);
      else sel.add(tag);
      return { ...c, selected: Array.from(sel) };
    });
    setField("promptBuilderCategories", nextCategories);
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

  const { isPro, isLoading: subLoading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  // Derived: selected model and filtered styles based on allowedStyles
  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === state.selectedModelId),
    [state.selectedModelId]
  );
  const filteredStyles = React.useMemo(() => {
    if (selectedModel?.allowedStyles && selectedModel.allowedStyles.length > 0) {
      return stylesList.filter((s) => selectedModel.allowedStyles!.includes(s));
    }
    return stylesList;
  }, [selectedModel?.allowedStyles]);

  // Auto-switch style and dimensions when model changes
  React.useEffect(() => {
    if (!selectedModel) return;
    const nextStyle = selectedModel.defaultStyle;
    if (state.selectedStyle !== nextStyle) {
      setField("selectedStyle", nextStyle);
    }
    if (selectedModel.defaultWidth && selectedModel.defaultHeight) {
      if (state.width !== selectedModel.defaultWidth) setField("width", selectedModel.defaultWidth);
      if (state.height !== selectedModel.defaultHeight) setField("height", selectedModel.defaultHeight);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedModelId]);

  // helpers to sync dimension inputs
  const clampDim = (v: number) => Math.max(512, Math.min(2048, v));
  const setWidth = (v: number) => setField("width", clampDim(v));
  const setHeight = (v: number) => setField("height", clampDim(v));

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

        {/* Dimensions */}
        <div className="space-y-3">
          <Label className="text-base">Dimensions</Label>
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <div className="flex items-center gap-3">
              <Slider
                min={512}
                max={2048}
                step={8}
                value={[state.width]}
                onValueChange={(arr) => setWidth(arr[0] ?? state.width)}
                className="flex-1"
              />
              <Input
                id="width"
                type="number"
                value={state.width}
                onChange={(e) => setWidth(Number(e.target.value || state.width))}
                className="w-24"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex items-center gap-3">
              <Slider
                min={512}
                max={2048}
                step={8}
                value={[state.height]}
                onValueChange={(arr) => setHeight(arr[0] ?? state.height)}
                className="flex-1"
              />
              <Input
                id="height"
                type="number"
                value={state.height}
                onChange={(e) => setHeight(Number(e.target.value || state.height))}
                className="w-24"
              />
            </div>
          </div>
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
                {filteredStyles.map((s) => (
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

        {/* ADDED: ADetailer Toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="adetailer">Fix Faces (ADetailer)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Automatically detects and repairs faces using the YOLO model.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="adetailer"
              checked={state.useADetailer}
              onCheckedChange={(c) => setField("useADetailer", c)}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Improves face quality; safe to disable if not installed.
          </span>
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

        {/* ADDED: Appearance Section */}
        <div className="space-y-4">
          <Label className="text-base">Appearance</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hair Color */}
            <div className="space-y-2">
              <Label>Hair Color</Label>
              <Select
                value={state.hairColor}
                onValueChange={(v) => setField("hairColor", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Hair Color" />
                </SelectTrigger>
                <SelectContent>
                  {hairColors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Eye Color */}
            <div className="space-y-2">
              <Label>Eye Color</Label>
              <Select
                value={state.eyeColor}
                onValueChange={(v) => setField("eyeColor", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Eye Color" />
                </SelectTrigger>
                <SelectContent>
                  {eyeColors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Random picks realistic hair colors in Photorealistic style; Anime allows all colors.
          </p>
        </div>

        {/* ADDED: Prompt Builder Categories */}
        <div className="space-y-3">
          <Label className="text-base">Prompt Builder</Label>
          <Accordion type="multiple" className="w-full">
            {(state.promptBuilderCategories || defaultCategories.map((c) => ({ ...c, selected: [] }))).map((cat, idx) => {
              const count = (cat.selected || []).length;
              return (
                <AccordionItem key={cat.name} value={cat.name}>
                  <AccordionTrigger className="flex items-center justify-between">
                    <span className="text-sm">{cat.name}</span>
                    <Badge className="bg-white/10 text-white border border-white/10">{count}</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {cat.tags.map((tag) => {
                        const pressed = (cat.selected || []).includes(tag);
                        return (
                          <Toggle
                            key={tag}
                            pressed={pressed}
                            onPressedChange={() => toggleBuilderTag(idx, tag)}
                            className={`px-3 py-1.5 rounded-md border text-sm ${
                              pressed
                                ? "bg-violet-600/30 border-violet-600 text-white"
                                : "bg-white/5 border-white/10 text-slate-300"
                            }`}
                            aria-label={tag}
                          >
                            {tag}
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

          {isPro ? (
            <Button
              onClick={onGenerateImage}
              disabled={generatingImage || subLoading}
              className="w-full text-white bg-gradient-to-r from-violet-600 to-indigo-600 border border-white/10 shadow-[0_0_18px_rgba(139,92,246,0.25),0_0_10px_rgba(234,179,8,0.15)] hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_24px_rgba(139,92,246,0.35),0_0_12px_rgba(234,179,8,0.22)]"
            >
              {generatingImage ? "Generating..." : "Generate Image (Local Forge)"}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowUpgradeModal(true)}
                className="w-full hover:bg-white/10 text-muted-foreground"
              >
                Generate Image (Pro Only)
              </Button>
              <div className="text-xs text-muted-foreground">
                Free Plan: Copy the prompt above and paste it into your local WebUI manually.
              </div>
            </>
          )}
        </div>

        {!isPro && (
          <PricingModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};