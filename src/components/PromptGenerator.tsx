"use client";

import * as React from "react";
import { PromptControls, ControlsState } from "./generator/PromptControls";
import { PromptDisplay } from "./generator/PromptDisplay";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { generateNegativePrompt } from "@/lib/prompt-engine";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { HistoryList, type HistoryItem } from "./generator/HistoryList";
import { buildShareUrl, parseControlsFromQuery } from "@/lib/url-state";
import { useSession } from "@/components/auth/SessionProvider";

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export const PromptGenerator: React.FC = () => {
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

  const { session } = useSession();
  const userId = session?.user?.id;

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
  const [lastContext, setLastContext] = React.useState<{ medium?: any; scenario?: any } | undefined>(undefined);
  const [negPool, setNegPool] = React.useState<string[] | null>(null);
  const [isBanned, setIsBanned] = React.useState<boolean>(false);
  const [favoritesIndex, setFavoritesIndex] = React.useState<Set<string>>(new Set());

  const favKey = (p: { positive: string; seed: number | undefined }) => `${p.seed ?? 0}::${p.positive}`;

  React.useEffect(() => {
    supabase
      .from("negative_keywords")
      .select("keyword, active, weight")
      .eq("active", true)
      .then(({ data }) => {
        if (data && Array.isArray(data)) {
          setNegPool(data.map((d: any) => d.keyword));
        }
      });
  }, []);

  // One-time sync: upload local history to cloud when first signing in
  React.useEffect(() => {
    async function syncLocalHistoryToCloud() {
      if (!userId) return;
      const syncedFlag = localStorage.getItem("generator:history_synced");
      if (syncedFlag === "1") return;

      const localHistRaw = localStorage.getItem("generator:history");
      const localHist: HistoryItem[] = localHistRaw ? JSON.parse(localHistRaw) : [];
      if (!localHist.length) {
        localStorage.setItem("generator:history_synced", "1");
        return;
      }

      const rows = localHist.slice(0, 40).map((h) => ({
        user_id: userId,
        positive_text: h.positive,
        negative_text: h.negative ?? null,
        seed: h.seed ?? null,
        config_json: {
          medium: controls.medium,
          includeNegative: controls.includeNegative,
          negativeIntensity: controls.negativeIntensity,
          safeMode: controls.safeMode,
        },
      }));

      const { error } = await supabase.from("prompt_history").insert(rows);
      if (!error) {
        localStorage.setItem("generator:history_synced", "1");
        showSuccess("Synced your local history to the cloud");
      }
    }
    syncLocalHistoryToCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  React.useEffect(() => {
    async function loadUserData() {
      if (!userId) return;

      // Ban status
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .single();
      setIsBanned(!!prof?.is_banned);

      // Favorites
      const { data: favs } = await supabase
        .from("favorites")
        .select("positive_text, seed")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (favs) {
        const set = new Set<string>(favs.map((f: any) => favKey({ positive: f.positive_text, seed: f.seed })));
        setFavoritesIndex(set);
      }

      // History
      const { data: hist } = await supabase
        .from("prompt_history")
        .select("id, positive_text, negative_text, seed, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40);
      if (hist) {
        const items = hist.map((row: any) => ({
          id: row.id,
          positive: row.positive_text,
          negative: row.negative_text || undefined,
          seed: row.seed ?? 0,
          timestamp: new Date(row.created_at).getTime(),
          favorite: false,
        })) as HistoryItem[];

        const marked = items.map((it) => ({
          ...it,
          favorite: favoritesIndex.has(favKey({ positive: it.positive, seed: it.seed })),
        }));
        setHistory(marked);
        try {
          localStorage.setItem("generator:history", JSON.stringify(marked));
        } catch {}
      }
    }
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const saveHistory = (next: HistoryItem[]) => {
    setHistory(next);
    try {
      localStorage.setItem("generator:history", JSON.stringify(next));
    } catch {}
  };

  const shuffle = React.useCallback(() => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }

    if (positive.trim().length > 0) {
      const prevItem: HistoryItem = {
        id: `${(lastSeed ?? controls.seed)}-${Date.now()}`,
        positive,
        negative,
        seed: lastSeed ?? controls.seed,
        timestamp: Date.now(),
        favorite: favoritesIndex.has(favKey({ positive, seed: lastSeed ?? controls.seed })),
      };
      const prevNext = [prevItem, ...history].slice(0, 40);
      saveHistory(prevNext);

      if (userId) {
        const configJson = {
          medium: controls.medium,
          includeNegative: controls.includeNegative,
          negativeIntensity: controls.negativeIntensity,
          safeMode: controls.safeMode,
        };
        supabase.from("prompt_history").insert({
          user_id: userId,
          positive_text: prevItem.positive,
          negative_text: prevItem.negative ?? null,
          seed: prevItem.seed,
          config_json: configJson,
        });
      }
    }

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

    // NEW: Save generated prompt to Supabase when logged in
    if (userId) {
      const settings = {
        seed: newSeed,
        medium: controls.medium,
        includeNegative: controls.includeNegative,
        negativeIntensity: controls.negativeIntensity,
        safeMode: controls.safeMode,
      };
      supabase.from("generated_prompts").insert({
        user_id: userId,
        positive_prompt: result.positive,
        negative_prompt: result.negative ?? null,
        settings,
      });
    }

    showSuccess("Prompt updated");
  }, [controls.includeNegative, controls.medium, controls.negativeIntensity, controls.safeMode, history, lastSeed, positive, negative, userId, isBanned, favoritesIndex]);

  const onShuffleNegative = () => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }
    const nextNeg = generateNegativePrompt(controls.negativeIntensity, negPool || undefined, undefined, lastContext);
    setNegative(nextNeg);
    showSuccess("Negative updated");
  };

  React.useEffect(() => {
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
    setLastContext({ medium: controls.medium, scenario: result.selections.scenario });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onShare = () => {
    const url = buildShareUrl(controls);
    navigator.clipboard.writeText(url);
    showSuccess("Shareable link copied");
  };

  const onCopyPositive = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (item) navigator.clipboard.writeText(item.positive);
  };

  const onCopyNegative = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (item && item.negative) navigator.clipboard.writeText(item.negative);
  };

  const onToggleFavorite = async (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;

    const key = favKey({ positive: item.positive, seed: item.seed });
    const nextFav = !item.favorite;

    const next = history.map((h) => (h.id === id ? { ...h, favorite: nextFav } : h));
    saveHistory(next);

    setFavoritesIndex((prev) => {
      const copy = new Set(prev);
      if (nextFav) copy.add(key);
      else copy.delete(key);
      return copy;
    });

    if (userId) {
      if (nextFav) {
        const { error } = await supabase.from("favorites").insert({
          user_id: userId,
          positive_text: item.positive,
          negative_text: item.negative ?? null,
          seed: item.seed,
          config_json: {
            medium: controls.medium,
            includeNegative: controls.includeNegative,
            negativeIntensity: controls.negativeIntensity,
            safeMode: controls.safeMode,
          },
        });
        if (error) showError("Failed to save favorite");
        else showSuccess("Saved to favorites");
      } else {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("positive_text", item.positive)
          .eq("seed", item.seed ?? 0);
        if (error) showError("Failed to remove favorite");
        else showSuccess("Removed from favorites");
      }
    }
  };

  const onClearHistory = () => {
    saveHistory([]);
    showSuccess("History cleared");
  };

  const randomizeSeed = () => {
    setControls((c) => ({ ...c, seed: randomSeed() }));
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptDisplay
          positive={positive}
          negative={negative}
          seed={controls.seed}
          onShuffle={shuffle}
          onShare={onShare}
          onPositiveChange={setPositive}
          onClearPositive={() => setPositive("")}
          onClearNegative={() => setNegative("")}
          onShuffleNegative={onShuffleNegative}
          disabledActions={isBanned}
          bannerMessage={isBanned ? "Your account is banned. Prompt generation is currently disabled." : undefined}
        />
        <PromptControls
          state={controls}
          onChange={setControls}
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