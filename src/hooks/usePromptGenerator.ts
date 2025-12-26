"use client";

import * as React from "react";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { parseControlsFromQuery } from "@/lib/url-state";
import type { ControlsState } from "@/components/generator/PromptControls";
import { supabase } from "@/integrations/supabase/client";

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
      // ADDED default
      useADetailer: true,
    };
  }, []);

  const [controls, setControls] = React.useState<ControlsState>(initialControls);
  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);
  const [lastSeed, setLastSeed] = React.useState<number>(initialControls.seed);
  const [lastContext, setLastContext] = React.useState<{ medium?: any; scenario?: any } | undefined>(undefined);

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

  // Generate initial output once on mount based on initial controls
  React.useEffect(() => {
    const config = {
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
    };
    const result = generatePrompt(config);
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(controls.seed);
    setLastContext({ style: controls.selectedStyle, scenario: result.selections.scenario });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomize = React.useCallback(() => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  }, []);

  // UPDATED: accept current controls to avoid stale closures
  const generate = React.useCallback((next?: ControlsState) => {
    const cur = next ?? controls;
    const newSeed = randomSeed();
    const config = {
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
    };
    const result = generatePrompt(config);

    setControls((c) => ({ ...c, seed: newSeed }));
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(newSeed);
    setLastContext({ style: cur.selectedStyle, scenario: result.selections.scenario });

    return { positive: result.positive, negative: result.negative, seed: newSeed };
  }, [controls]);

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