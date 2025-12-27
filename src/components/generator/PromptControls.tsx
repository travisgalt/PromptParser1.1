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
import { speciesList, stylesList, themesList } from "@/lib/prompt-data";
import { models } from "@/lib/model-data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import useSubscription from "@/hooks/useSubscription";
import PricingModal from "@/components/subscription/PricingModal";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { defaultCategories } from "@/lib/prompt-builder-data";
import { cn } from "@/lib/utils";

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

  // NEW: toggle a builder tag within a category with conflict resolution
  const toggleBuilderTag = (catIndex: number, tag: string) => {
    const categories = state.promptBuilderCategories || defaultCategories.map((c) => ({ ...c, selected: [] }));
    const current = categories[catIndex];
    const wasSelected = (current.selected || []).includes(tag);

    const findCat = (name: string) => categories.find((c) => c.name === name);
    const setCatSelected = (name: string, next: string[]) => {
      const idx = categories.findIndex((c) => c.name === name);
      if (idx >= 0) categories[idx] = { ...categories[idx], selected: next };
    };
    const removeTagInCategory = (name: string, tagsToRemove: string[] | string) => {
      const arr = Array.isArray(tagsToRemove) ? tagsToRemove : [tagsToRemove];
      const cat = findCat(name);
      if (!cat) return;
      const sel = new Set(cat.selected || []);
      arr.forEach((t) => sel.delete(t));
      setCatSelected(name, Array.from(sel));
    };
    const clearCategory = (name: string) => setCatSelected(name, []);

    let nextSel = new Set(current.selected || []);
    if (wasSelected) {
      nextSel.delete(tag);
    } else {
      nextSel.add(tag);

      // Pose exclusivity + movement/static rules
      if (current.name === "Pose (Mutually Exclusive)") {
        nextSel = new Set([tag]);
        const movement = new Set(["running", "walking", "jumping", "flying"]);
        const staticSet = new Set(["sitting", "kneeling", "lying down", "on stomach", "on back"]);
        if (movement.has(tag)) {
          nextSel = new Set([tag]);
        }
        if (tag === "sitting") {
          nextSel = new Set([tag]);
        }
      }

      // Hair logic: bald vs hair
      if (current.name === "Hair Style" && tag.toLowerCase() === "bald") {
        clearCategory("Hair Color");
      } else if (current.name === "Hair Style" && tag.toLowerCase() !== "bald") {
        removeTagInCategory("Hair Style", "bald");
      }
      if (current.name === "Hair Color") {
        removeTagInCategory("Hair Style", "bald");
      }

      // Background vs Location clarity
      const isSimpleBackgroundTag =
        (current.name === "Location - Detailed" && tag.toLowerCase() === "simple background") ||
        current.name === "Background - Simple";
      if (isSimpleBackgroundTag) {
        clearCategory("Location - Detailed");
      }
      if (current.name === "Location - Detailed" && tag.toLowerCase() !== "simple background") {
        clearCategory("Background - Simple");
        removeTagInCategory("Location - Detailed", "simple background");
      }

      // Eyes: closed vs colors
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

      // NEW: Full Body vs Parts conflict resolution
      if (current.name === "Outfit - Full Body / Dresses") {
        // Selecting any full-body outfit clears separate tops and bottoms
        clearCategory("Outfit - Top");
        clearCategory("Outfit - Bottom");
      } else if (current.name === "Outfit - Top" || current.name === "Outfit - Bottom") {
        // Selecting a top or bottom clears full-body outfits
        clearCategory("Outfit - Full Body / Dresses");
      }
    }

    categories[catIndex] = { ...current, selected: Array.from(nextSel) };
    setField("promptBuilderCategories", categories);
  };

  // Track open accordion categories to style headers with an accent
  const [openCats, setOpenCats] = React.useState<string[]>([]);

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

  const categoriesWithState = state.promptBuilderCategories || defaultCategories.map((c) => ({ ...c, selected: [] }));

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

        {/* Prompt Builder Categories - Styled */}
        <div className="space-y-2">
          <Label className="text-base">Prompt Builder</Label>
          <Accordion
            type="multiple"
            value={openCats}
            onValueChange={(vals: string | string[]) => setOpenCats(Array.isArray(vals) ? vals : [vals])}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {categoriesWithState.map((cat, idx) => {
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
            className="mt-4 w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 hover:shadow-indigo-600/40"
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