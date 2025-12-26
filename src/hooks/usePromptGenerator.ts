"use client";

import * as React from "react";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { parseControlsFromQuery } from "@/lib/url-state";
import { supabase } from "@/integrations/supabase/client";
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
    return {
      seed: parsed.seed ?? randomSeed(),
      includeNegative: parsed.includeNegative ?? true,
      negativeIntensity: parsed.negativeIntensity ?? 1.1,
      medium: parsed.medium ?? "photo",
      safeMode: parsed.safeMode ?? true,
    };
  }, []);

  const [controls, setControls] = React.useState<ControlsState>(initialControls);
  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);
  const [lastSeed, setLastSeed] = React.useState<number>(initialControls.seed);
  const [lastContext, setLastContext] = React.useState<{ medium?: any; scenario?: any } | undefined>(undefined);

  // Generate initial output once on mount based on initial controls
  React.useEffect(() => {
    const config: GeneratorConfig = {
      seed: controls.seed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      medium: controls.medium,
      safeMode: controls.safeMode,
    };
    const result = generatePrompt(config);
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(controls.seed);
    setLastContext({ medium: controls.medium, scenario: result.selections.scenario });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomize = React.useCallback(() => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  }, []);

  const generate = React.useCallback(() => {
    const newSeed = randomSeed();
    const config: GeneratorConfig = {
      seed: newSeed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      medium: controls.medium,
      safeMode: controls.safeMode,
    };
    const result = generatePrompt(config);

    setControls((c) => ({ ...c, seed: newSeed }));
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(newSeed);
    setLastContext({ medium: controls.medium, scenario: result.selections.scenario });

    // Save the generated prompt to Supabase when logged in (no user_id; DB default uses auth.uid())
    if (opts?.userId) {
      const settings = {
        seed: newSeed,
        medium: controls.medium,
        includeNegative: controls.includeNegative,
        negativeIntensity: controls.negativeIntensity,
        safeMode: controls.safeMode,
      };
      supabase.from("generated_prompts").insert({
        positive_prompt: result.positive,
        negative_prompt: result.negative ?? null,
        settings,
      });
    }
  }, [controls, opts?.userId]);

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