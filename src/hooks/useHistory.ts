"use client";

import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { HistoryItem } from "@/components/generator/HistoryList";

type SavePayload = {
  positive: string;
  negative?: string;
  seed: number;
  settings: any;
};

export function useHistory(userId?: string | null) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      if (userId) {
        const { data, error } = await supabase
          .from("generated_prompts")
          .select("id, positive_prompt, negative_prompt, settings, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!mounted) return;

        if (error || !data) {
          setHistory([]);
          setIsLoading(false);
          return;
        }

        const items: HistoryItem[] = data.map((row: any) => ({
          id: row.id,
          positive: row.positive_prompt,
          negative: row.negative_prompt || undefined,
          seed: (row.settings && typeof row.settings.seed === "number") ? row.settings.seed : 0,
          timestamp: new Date(row.created_at).getTime(),
          favorite: false,
        }));
        setHistory(items);
        setIsLoading(false);
      } else {
        try {
          const raw = localStorage.getItem("generator:history");
          const parsed: HistoryItem[] = raw ? JSON.parse(raw) : [];
          setHistory(parsed.slice(0, 10));
        } catch {
          setHistory([]);
        }
        setIsLoading(false);
      }
    }
    load();

    // Listen for global history updates and reload
    const handleUpdate = () => {
      if (userId) {
        supabase
          .from("generated_prompts")
          .select("id, positive_prompt, negative_prompt, settings, created_at")
          .order("created_at", { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (!data) return;
            const items: HistoryItem[] = data.map((row: any) => ({
              id: row.id,
              positive: row.positive_prompt,
              negative: row.negative_prompt || undefined,
              seed: (row.settings && typeof row.settings.seed === "number") ? row.settings.seed : 0,
              timestamp: new Date(row.created_at).getTime(),
              favorite: false,
            }));
            setHistory(items);
          });
      } else {
        try {
          const raw = localStorage.getItem("generator:history");
          const parsed: HistoryItem[] = raw ? JSON.parse(raw) : [];
          setHistory(parsed.slice(0, 10));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("generator:history_update", handleUpdate as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("generator:history_update", handleUpdate as EventListener);
    };
  }, [userId]);

  const saveItem = React.useCallback(
    async ({ positive, negative, seed, settings }: SavePayload) => {
      if (userId) {
        const { data, error } = await supabase
          .from("generated_prompts")
          .insert({
            positive_prompt: positive,
            negative_prompt: negative ?? null,
            settings,
          })
          .select("id, positive_prompt, negative_prompt, settings, created_at");

        if (!error && data && data.length > 0) {
          const row = data[0];
          const newItem: HistoryItem = {
            id: row.id,
            positive: row.positive_prompt,
            negative: row.negative_prompt || undefined,
            seed: (row.settings && typeof row.settings.seed === "number") ? row.settings.seed : seed,
            timestamp: new Date(row.created_at).getTime(),
            favorite: false,
          };
          setHistory((prev) => [newItem, ...prev].slice(0, 10));
          // Broadcast update so other listeners (e.g., sidebar) refresh
          window.dispatchEvent(new CustomEvent("generator:history_update"));
        }
      } else {
        const newItem: HistoryItem = {
          id: `${seed}-${Date.now()}`,
          positive,
          negative,
          seed,
          timestamp: Date.now(),
          favorite: false,
        };
        const next = [newItem, ...history].slice(0, 10);
        setHistory(next);
        try {
          localStorage.setItem("generator:history", JSON.stringify(next));
          window.dispatchEvent(new CustomEvent("generator:history_update"));
        } catch {}
      }
    },
    [userId, history],
  );

  return { history, saveItem, isLoading };
}

export default useHistory;