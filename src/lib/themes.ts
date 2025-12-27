"use client";

import { supabase } from "@/integrations/supabase/client";

export type ThemeTags = {
  positive: string[];
  negative?: string[];
};

export type ThemeRow = {
  id: string;
  slug: string;
  label: string;
  enabled: boolean;
  sort_order?: number;
  compatible_models: string[];
  tag_mapping: Record<string, unknown> | null;
};

const cache = new Map<string, ThemeTags | null>();

function normalizeTags(list: unknown): string[] {
  if (!list) return [];
  if (Array.isArray(list)) {
    return list.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Returns enabled themes compatible with the given model.
 * Note: does not require tag_mapping to be present; we let admins curate progressively.
 */
export async function fetchThemesForModel(modelId: string): Promise<ThemeRow[]> {
  const { data, error } = await supabase
    .from("themes")
    .select("id, slug, label, enabled, sort_order, compatible_models, tag_mapping")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  const rows = (data as any[]).filter((row) => {
    const list: string[] = Array.isArray(row.compatible_models) ? row.compatible_models : [];
    return list.includes(modelId);
  });

  return rows as ThemeRow[];
}

/**
 * Resolve theme tags for a given theme slug and model.
 * Supports either per-model mapping or a root-level default:
 * {
 *   "model-id": { positive: [...], negative: [...] },
 *   "positive": [...],
 *   "negative": [...]
 * }
 */
export async function getThemeTagsForModel(slug: string, modelId: string): Promise<ThemeTags | null> {
  const key = `${slug}:${modelId}`;
  if (cache.has(key)) return cache.get(key)!;

  const { data, error } = await supabase
    .from("themes")
    .select("tag_mapping")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    cache.set(key, null);
    return null;
  }

  const mapping = data?.tag_mapping as Record<string, unknown> | null;
  if (!mapping) {
    cache.set(key, null);
    return null;
  }

  // Try per-model first
  const perModel = (mapping[modelId] ?? null) as Record<string, unknown> | null;
  if (perModel && typeof perModel === "object") {
    const positive = normalizeTags(perModel["positive"]);
    const negative = normalizeTags(perModel["negative"]);
    const resolved = positive.length || negative.length ? { positive, negative } : null;
    cache.set(key, resolved);
    return resolved;
  }

  // Fallback to root-level positive/negative
  const positive = normalizeTags(mapping["positive"]);
  const negative = normalizeTags(mapping["negative"]);
  const resolved = positive.length || negative.length ? { positive, negative } : null;
  cache.set(key, resolved);
  return resolved;
}

/** Optional: clear cache when needed (e.g., after admin edits) */
export function clearThemeTagsCache() {
  cache.clear();
}