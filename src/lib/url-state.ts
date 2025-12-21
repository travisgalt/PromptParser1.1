import { ControlsState } from "@/components/generator/PromptControls";

function boolToNum(b: boolean): string {
  return b ? "1" : "0";
}

function numToBool(n: string | null): boolean {
  return n === "1";
}

export function encodeControlsToQuery(state: ControlsState): string {
  const params = new URLSearchParams();
  params.set("seed", String(state.seed));
  params.set("medium", state.medium);
  params.set("neg", boolToNum(state.includeNegative));
  params.set("negInt", String(state.negativeIntensity));
  params.set("safe", boolToNum(state.safeMode));
  return params.toString();
}

export function parseControlsFromQuery(search: string): Partial<ControlsState> {
  const params = new URLSearchParams(search);
  const seedStr = params.get("seed");
  const medium = params.get("medium");
  const neg = params.get("neg");
  const negInt = params.get("negInt");
  const safe = params.get("safe");

  const parsed: Partial<ControlsState> = {};
  if (seedStr && !Number.isNaN(Number(seedStr))) parsed.seed = Number(seedStr);
  if (medium === "photo" || medium === "render") parsed.medium = medium;
  if (neg !== null) parsed.includeNegative = numToBool(neg);
  if (negInt && !Number.isNaN(Number(negInt))) parsed.negativeIntensity = Number(negInt);
  if (safe !== null) parsed.safeMode = numToBool(safe);

  return parsed;
}

export function buildShareUrl(state: ControlsState): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  const qs = encodeControlsToQuery(state);
  return `${base}?${qs}`;
}