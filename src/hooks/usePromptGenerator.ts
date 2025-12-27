"use client";

import * as React from "react";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { parseControlsFromQuery } from "@/lib/url-state";
import type { ControlsState } from "@/components/generator/PromptControls";
import { supabase } from "@/integrations/supabase/client";
import { defaultCategories } from "@/lib/prompt-builder-data";
import { getThemeTagsForModel } from "@/lib/themes";

// Define the RecentState type used by the recency memory
type RecentState = {
  hairStyle?: string[];
  body?: string[];
  expression?: string[];
  outfit?: string[];
  background?: string[];
  lighting?: string[];
  pose?: string[];
  accessories?: string[];
};

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

type OutputState = {
  positive: string;
  negative?: string;
  seed: number;
  lastContext?: { style?: string; scenario?: any };
  setPositive: (text: string) => void;
  setNegative: (text: string | undefined) => void;
  clearPositive: () => void;
  clearNegative: () => void;
};

export function usePromptGenerator(opts?: { userId?: string }) {
  const initialControls = React.useMemo<ControlsState>(() => {
    const parsed = parseControlsFromQuery(window.location.search);
    const prefSafeRaw = typeof window !== "undefined" ? localStorage.getItem("pref_default_safemode") : null;
    const prefSafe =
      prefSafeRaw === "true" ? true :
      prefSafeRaw === "false" ? false :
      undefined;

    return {
      seed: parsed.seed ?? randomSeed(),
      includeNegative: parsed.includeNegative ?? true,
      negativeIntensity: parsed.negativeIntensity ?? 1.1,
      safeMode: (typeof parsed.safeMode === "boolean" ? parsed.safeMode : (prefSafe ?? true)),
      selectedSpecies: ["human", "elf"],
      selectedTheme: "any",
      selectedStyle: "photorealistic",
      selectedModelId: "standard",
      width: 1024,
      height: 1024,
      hairColor: "Random",
      eyeColor: "Random",
      useADetailer: true,
      // ADDED: initialize categories with empty selection
      promptBuilderCategories: defaultCategories.map((c) => ({ ...c, selected: [] })),
    };
  }, []);

  const [controls, setControls] = React.useState<ControlsState>(initialControls);
  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);
  const [lastSeed, setLastSeed] = React.useState<number>(initialControls.seed);
  const [lastContext, setLastContext] = React.useState<{ medium?: any; scenario?: any } | undefined>(undefined);

  // ADDED: recent memory to reduce repetition (recency window = 2)
  const [recent, setRecent] = React.useState<RecentState>({});

  // NEW: resolved theme tags for current selection
  const [themeTags, setThemeTags] = React.useState<{ positive: string[]; negative?: string[] } | null>(null);

  // Define as a function (hoisted) to ensure availability across effects
  function pushRecent(key: keyof RecentState, value: string | string[]) {
    setRecent((prev) => {
      const arr = Array.isArray(value) ? value : [value];
      const merged = [...(prev[key] ?? []), ...arr];
      const uniq: string[] = [];
      for (const v of merged) {
        if (!uniq.includes(v)) uniq.push(v);
      }
      return { ...prev, [key]: uniq.slice(-2) };
    });
  }

  // Fetch theme tags when theme or model changes
  React.useEffect(() => {
    let active = true;
    (async () => {
      const tags = await getThemeTagsForModel(controls.selectedTheme, controls.selectedModelId);
      if (active) setThemeTags(tags);
    })();
    return () => { active = false; };
  }, [controls.selectedTheme, controls.selectedModelId]);

  // NEW: Load Prompt Builder defaults from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user_default_builder") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setControls((c) => ({ ...c, promptBuilderCategories: parsed }));
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // NEW: Gate initial generation until theme tags have resolved (ensures modifiers apply)
  const generatedOnceRef = React.useRef(false);
  React.useEffect(() => {
    if (generatedOnceRef.current) return;

    const extraTags = (controls.promptBuilderCategories || []).flatMap((c) => c.selected || []);
    const config: GeneratorConfig = {
      seed: controls.seed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      safeMode: controls.safeMode,
      allowedSpecies: controls.selectedSpecies,
      theme: controls.selectedTheme,
      style: controls.selectedStyle,
      selectedModelId: controls.selectedModelId,
      hairColor: controls.hairColor,
      eyeColor: controls.eyeColor,
      extraTags,
      variety: { recent },
      themeTags: themeTags ?? undefined,
    };
    const result = generatePrompt(config);
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(controls.seed);
    setLastContext({ style: controls.selectedStyle, scenario: result.selections.scenario });

    // Update recent memory from selections
    pushRecent("hairStyle", result.selections.hair);
    pushRecent("body", result.selections.body);
    pushRecent("expression", result.selections.expression);
    pushRecent("outfit", result.selections.outfit.label);
    pushRecent("background", result.selections.background.label);
    pushRecent("lighting", result.selections.lighting);
    pushRecent("pose", result.selections.pose.label);
    if (result.selections.accessories.length) {
      pushRecent("accessories", result.selections.accessories.map((a) => a.label));
    }

    generatedOnceRef.current = true;
  }, [themeTags]);

  // NEW: When user logs in, load profile defaults and set human-only if none found
  React.useEffect(() => {
    const userId = opts?.userId;
    if (!userId) return;

    (async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("default_settings")
        .eq("id", userId)
        .single();

      const defaults = prof?.default_settings as Partial<ControlsState> | undefined;

      setControls((c) => {
        // Start with human-only by default on login
        let next: ControlsState = { ...c, selectedSpecies: ["human"] };

        // Apply saved defaults if present
        if (defaults) {
          next = {
            ...next,
            selectedModelId: defaults.selectedModelId ?? next.selectedModelId,
            width: defaults.width ?? next.width,
            height: defaults.height ?? next.height,
            selectedStyle: defaults.selectedStyle ?? next.selectedStyle,
            selectedTheme: (defaults.selectedTheme as ControlsState["selectedTheme"]) ?? next.selectedTheme,
            safeMode: defaults.safeMode ?? next.safeMode,
            selectedSpecies: Array.isArray(defaults.selectedSpecies) ? defaults.selectedSpecies as string[] : next.selectedSpecies,
            hairColor: defaults.hairColor ?? next.hairColor,
            eyeColor: defaults.eyeColor ?? next.eyeColor,
          };
        }

        return next;
      });
    })();
  }, [opts?.userId]);

  const randomize = React.useCallback(() => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  }, []);

  const generate = React.useCallback((next?: ControlsState) => {
    const cur = next ?? controls;
    const newSeed = randomSeed();
    const extraTags = (cur.promptBuilderCategories || []).flatMap((c) => c.selected || []);
    const config: GeneratorConfig = {
      seed: newSeed,
      includeNegative: cur.includeNegative,
      negativeIntensity: cur.negativeIntensity,
      safeMode: cur.safeMode,
      allowedSpecies: cur.selectedSpecies,
      theme: cur.selectedTheme,
      style: cur.selectedStyle,
      selectedModelId: cur.selectedModelId,
      hairColor: cur.hairColor,
      eyeColor: cur.eyeColor,
      extraTags,
      variety: { recent },
      // NEW: carry currently resolved theme tags
      themeTags: themeTags ?? undefined,
    };
    const result = generatePrompt(config);

    setControls((c) => ({ ...c, seed: newSeed }));
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(newSeed);
    setLastContext({ style: cur.selectedStyle, scenario: result.selections.scenario });

    // Update recent memory from selections
    pushRecent("hairStyle", result.selections.hair);
    pushRecent("body", result.selections.body);
    pushRecent("expression", result.selections.expression);
    pushRecent("outfit", result.selections.outfit.label);
    pushRecent("background", result.selections.background.label);
    pushRecent("lighting", result.selections.lighting);
    pushRecent("pose", result.selections.pose.label);
    if (result.selections.accessories.length) {
      pushRecent("accessories", result.selections.accessories.map((a) => a.label));
    }

    return { positive: result.positive, negative: result.negative, seed: newSeed };
  }, [controls, recent, themeTags]);

  const output: OutputState = React.useMemo(
    () => ({
      positive,
      negative,
      seed: lastSeed,
      lastContext,
      setPositive: (text: string) => setPositive(text),
      setNegative: (text: string | undefined) => setNegative(text),
      clearPositive: () => setPositive(""),
      clearNegative: () => setNegative(""),
    }),
    [positive, negative, lastSeed, lastContext],
  );

  return { controls, setControls, output, generate, randomize };
}

export default usePromptGenerator;