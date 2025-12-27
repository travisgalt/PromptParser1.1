"use client";

import { themesList, stylesList } from "@/lib/prompt-data";

/**
 * Single source of truth for Theme and Style catalogs used by Prompt Builder.
 * These are slugs; display labels can be derived by replacing underscores with spaces.
 */
export const ALL_THEMES: string[] = [...themesList];

/**
 * All style slugs (e.g., 'unreal_engine_5', 'watercolor', etc.)
 */
export const ALL_STYLES: string[] = [...stylesList];

/**
 * Safe subset for restricted anime-focused models.
 * Use slugs to keep generator state consistent.
 */
export const SAFE_STYLES: string[] = ["anime", "digital_painting", "oil_painting", "line_art"];

/**
 * Set of restricted model IDs that should use SAFE_STYLES.
 * These must match ids in src/lib/model-data.ts.
 */
export const RESTRICTED_MODEL_IDS = new Set<string>(["plant-milk", "pony-v6", "kokio-illu"]);