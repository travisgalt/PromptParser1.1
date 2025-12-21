"use client";

import * as React from "react";
import { PromptControls, ControlsState } from "./generator/PromptControls";
import { PromptDisplay } from "./generator/PromptDisplay";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { showSuccess } from "@/utils/toast";
import { HistoryList, type HistoryItem } from "./generator/HistoryList";
import { buildShareUrl, parseControlsFromQuery } from "@/lib/url-state";

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export const PromptGenerator: React.FC = () => {
  // Initialize controls from URL if present
  const initialControls = React.useMemo(() => {
    const parsed = parseControlsFromQuery(window.location.search);
    return {
      seed: parsed.seed ?? randomSeed(),
      includeNegative: parsed.includeNegative ?? true,
      negativeIntensity: parsed.negativeIntensity ?? 1.1,
      medium: parsed.medium ?? "photo",
      safeMode: parsed.safeMode ?? true,
    } as ControlsState;
  }, []);

  const [controls, setControls] = React.useState<ControlsState>(initialControls);
  const [positive, setPositive] = React.useState<string>("");
  const [negative, setNegative] = React.useState<string | undefined>(undefined);
  const [history, setHistory] = React.useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("generator:history");
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const [lastSeed, setLastSeed] = React.useState<number | undefined>(undefined);

  const saveHistory = (next: HistoryItem[]) => {
    setHistory(next);
    try {
      localStorage.setItem("generator:history", JSON.stringify(next));
    } catch {
      // let it fail silently
    }
  };

  const shuffle = React.useCallback(() => {
    // 1) Archive the current prompt (the one in the textarea) into history if it exists
    if (positive.trim().length > 0) {
      const prevItem: HistoryItem = {
        id: `${(lastSeed ?? controls.seed)}-${Date.now()}`,
        positive,
        negative,
        seed: lastSeed ?? controls.seed,
        timestamp: Date.now(),
        favorite: false,
      };
      const prevNext = [prevItem, ...history].slice(0, 25);
      saveHistory(prevNext);
    }

    // 2) Randomize seed by default so Shuffle produces a different prompt
    const newSeed = randomSeed();

    // 3) Generate a fresh prompt using the new seed and update the textarea immediately
    const config: GeneratorConfig = {
      seed: newSeed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      medium: controls.medium,
      safeMode: controls.safeMode,
    };
    const result = generatePrompt(config);

    // Update controls.seed to reflect the new generation
    // This ensures the Seed badge in PromptDisplay updates too
    setControls((c) => ({ ...c, seed: newSeed }));

    // Write new prompt into the text area and keep the negative in sync
    setPositive(result.positive);
    setNegative(result.negative);

    // Track lastSeed for archiving correctness on the next shuffle
    setLastSeed(newSeed);

    showSuccess("Prompt updated");
  }, [controls.includeNegative, controls.medium, controls.negativeIntensity, controls.safeMode, history, lastSeed, positive, negative]);

  React.useEffect(() => {
    // Generate an initial prompt so the textarea isn't empty
    const initialSeed = controls.seed;
    const config: GeneratorConfig = {
      seed: initialSeed,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      medium: controls.medium,
      safeMode: controls.safeMode,
    };
    const result = generatePrompt(config);
    setPositive(result.positive);
    setNegative(result.negative);
    setLastSeed(initialSeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when user presses Share; we don't push state on every change
  const onShare = () => {
    const url = buildShareUrl(controls);
    navigator.clipboard.writeText(url);
    showSuccess("Shareable link copied");
  };

  // Actions for History
  const onCopyPositive = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (item) navigator.clipboard.writeText(item.positive);
  };

  const onCopyNegative = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (item && item.negative) navigator.clipboard.writeText(item.negative);
  };

  const onToggleFavorite = (id: string) => {
    const next = history.map((h) => (h.id === id ? { ...h, favorite: !h.favorite } : h));
    saveHistory(next);
  };

  const onClearHistory = () => {
    saveHistory([]);
    showSuccess("History cleared");
  };

  const randomizeSeed = () => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  };

  const onShuffleClick = () => {
    shuffle();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptDisplay
          positive={positive}
          negative={negative}
          seed={controls.seed}
          onShuffle={onShuffleClick}
          onShare={onShare}
          onPositiveChange={setPositive}
        />
        <PromptControls
          state={controls}
          onChange={setControls}
          onShuffle={onShuffleClick}
          onRandomizeSeed={randomizeSeed}
        />
      </div>

      <div className="mt-6">
        <HistoryList
          items={history}
          onCopyPositive={onCopyPositive}
          onCopyNegative={onCopyNegative}
          onToggleFavorite={onToggleFavorite}
          onClear={onClearHistory}
        />
      </div>
    </div>
  );
};