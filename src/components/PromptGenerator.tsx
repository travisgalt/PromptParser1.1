"use client";

import * as React from "react";
import { PromptControls, ControlsState } from "./generator/PromptControls";
import { PromptDisplay } from "./generator/PromptDisplay";
import { generateNegativePrompt } from "@/lib/prompt-engine";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import type { HistoryItem } from "./generator/HistoryList";
import { buildShareUrl } from "@/lib/url-state";
import { useSession } from "@/components/auth/SessionProvider";
import usePromptGenerator from "@/hooks/usePromptGenerator";

function randomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

type PromptGeneratorProps = {
  hideHistory?: boolean;
};

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ hideHistory = false }) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  // Use the new hook to manage generation state and logic
  const { controls, setControls, output, generate, randomize } = usePromptGenerator({ userId });

  const [history, setHistory] = React.useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("generator:history");
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  });
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
          window.dispatchEvent(new CustomEvent("generator:history_update"));
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
      window.dispatchEvent(new CustomEvent("generator:history_update"));
    } catch {}
  };

  const handleGenerate = React.useCallback(() => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }

    // Save current output to local history before generating a new one
    if (output.positive.trim().length > 0) {
      const prevItem: HistoryItem = {
        id: `${controls.seed}-${Date.now()}`,
        positive: output.positive,
        negative: output.negative,
        seed: controls.seed,
        timestamp: Date.now(),
        favorite: favoritesIndex.has(favKey({ positive: output.positive, seed: controls.seed })),
      };
      const prevNext = [prevItem, ...history].slice(0, 40);
      saveHistory(prevNext);

      // Cloud history for previous prompt (keeps existing behavior)
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

    // Generate new prompt via hook (also saves to generated_prompts if logged in)
    generate();
    showSuccess("Prompt updated");
  }, [isBanned, output.positive, output.negative, controls.seed, favoritesIndex, history, saveHistory, userId, controls.medium, controls.includeNegative, controls.negativeIntensity, controls.safeMode, generate]);

  const onShuffleNegative = () => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }
    const nextNeg = generateNegativePrompt(controls.negativeIntensity, negPool || undefined, undefined, output.lastContext);
    output.setNegative(nextNeg);
    showSuccess("Negative updated");
  };

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
    randomize();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PromptDisplay
          positive={output.positive}
          negative={output.negative}
          seed={controls.seed}
          onShuffle={handleGenerate}
          onShare={onShare}
          onPositiveChange={output.setPositive}
          onClearPositive={output.clearPositive}
          onClearNegative={output.clearNegative}
          onShuffleNegative={onShuffleNegative}
          disabledActions={isBanned}
          bannerMessage={isBanned ? "Your account is banned. Prompt generation is currently disabled." : undefined}
        />
        <PromptControls
          state={controls}
          onChange={setControls}
          onRandomizeSeed={randomizeSeed}
          onGenerate={handleGenerate}
        />
      </div>

      {/* History list is now handled by the sidebar, so we keep it hidden here */}
      {hideHistory ? null : null}
    </div>
  );
};