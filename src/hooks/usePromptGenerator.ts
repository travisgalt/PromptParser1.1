"use client";

import * as React from "react";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { parseControlsFromQuery } from "@/lib/url-state";
import type { ControlsState } from "@/components/generator/PromptControls";

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

type OutputState = {
  positive: string;
  negative?: string;
  seed: number;
  lastContext?: { medium?: any; scenario?: any };
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
    };
  }, []);

  const [controls, setControls] = React.useState<ControlsState>(initialControls);
  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);
  const [lastSeed, setLastSeed] = React.useState<number>(initialControls.seed);
  const [lastContext, setLastContext] = React.useState<{ medium?: any; scenario?: any } | undefined>(undefined);

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

  const generate = React.useCallback(() => {
    const newSeed = randomSeed();
    const config = {
      seed: newSeed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      safeMode: controls.safeMode,
      allowedSpecies: controls.selectedSpecies,
      theme: controls.selectedTheme,
      style: controls.selectedStyle,
      selectedModelId: controls.selectedModelId,
    };
    const result = generatePrompt(config);

    setControls((c) => ({ ...c, seed: newSeed }));
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(newSeed);
    setLastContext({ style: controls.selectedStyle, scenario: result.selections.scenario });

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