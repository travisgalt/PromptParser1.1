"use client";

import * as React from "react";
import { PromptControls, ControlsState } from "./generator/PromptControls";
import { PromptDisplay } from "./generator/PromptDisplay";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { showSuccess } from "@/utils/toast";

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export const PromptGenerator: React.FC = () => {
  const [controls, setControls] = React.useState<ControlsState>({
    seed: randomSeed(),
    includeNegative: true,
    negativeIntensity: 1.1,
    medium: "photo",
    safeMode: true,
  });

  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);

  const shuffle = React.useCallback(() => {
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
    showSuccess("Prompt generated");
  }, [controls]);

  React.useEffect(() => {
    // Generate initial prompt
    shuffle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomizeSeed = () => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  };

  const onShuffleClick = () => {
    shuffle();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptDisplay positive={positive} negative={negative} seed={controls.seed} onShuffle={onShuffleClick} />
        <PromptControls
          state={controls}
          onChange={setControls}
          onShuffle={onShuffleClick}
          onRandomizeSeed={randomizeSeed}
        />
      </div>
    </div>
  );
};