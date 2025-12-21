import { mulberry32, pickOne, pickMany, RNG, randomInt } from "./prng";
import {
  qualityTags,
  hairStyles,
  eyeColors,
  outfits,
  poses,
  accessories,
  backgrounds,
  lightingByContext,
  photoTech,
  renderTech,
  type Medium,
  type OutfitItem,
  type PoseItem,
  type AccessoryItem,
  type BackgroundItem,
  negativesBase,
  outerwearItems,
  footwearItems,
  type ScenarioKey,
} from "./prompt-data";

export type GeneratorConfig = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number; // e.g. 1.0..1.4
  medium: Medium; // photo or render
  safeMode: boolean;
};

export type GeneratedPrompt = {
  positive: string;
  negative?: string;
  seed: number;
  selections: {
    scenario: ScenarioKey;
    quality: string;
    hair: string;
    eyes: string;
    outfit: OutfitItem;
    pose: PoseItem;
    accessories: AccessoryItem[];
    background: BackgroundItem;
    lighting: string;
    tech: string;
    layeredOuterwear?: string;
    layeredFootwear?: string;
  };
};

function deriveLighting(bg: BackgroundItem, rng: RNG): string {
  if (bg.environment === "studio") {
    return pickOne(rng, lightingByContext["studio"]);
  }
  if (bg.environment === "indoor") {
    return pickOne(rng, lightingByContext["indoor"]);
  }
  const key = bg.timeOfDay === "day" ? "outdoor-day" : "outdoor-night";
  return pickOne(rng, lightingByContext[key]);
}

function pickScenario(rng: RNG): ScenarioKey {
  const choices: ScenarioKey[] = [
    "indoor_private",
    "outdoor_public_day",
    "outdoor_public_night",
    "studio",
  ];
  return pickOne(rng, choices);
}

function matchesScenario(bg: BackgroundItem, scenario: ScenarioKey): boolean {
  if (scenario === "indoor_private") return bg.environment === "indoor";
  if (scenario === "studio") return bg.environment === "studio";
  if (scenario === "outdoor_public_day")
    return bg.environment === "outdoor" && bg.timeOfDay === "day";
  if (scenario === "outdoor_public_night")
    return bg.environment === "outdoor" && bg.timeOfDay === "night";
  return true;
}

export function generatePrompt(config: GeneratorConfig): GeneratedPrompt {
  const rng = mulberry32(config.seed);

  // Scenario first
  const scenario = pickScenario(rng);

  // Background according to scenario
  const bgCandidates = backgrounds.filter((b) => matchesScenario(b, scenario));
  const bg = bgCandidates.length ? pickOne(rng, bgCandidates) : pickOne(rng, backgrounds);
  const lighting = deriveLighting(bg, rng);

  // Base selections
  const quality = pickOne(rng, qualityTags);
  const hair = pickOne(rng, hairStyles);
  const eyes = pickOne(rng, eyeColors);

  // Outfit gated by scenario
  const validOutfits = outfits.filter((o) => o.contextsAllowed.includes(scenario));
  let outfit = validOutfits.length ? pickOne(rng, validOutfits) : pickOne(rng, outfits);

  // Layering adaptation if outfit doesn't fit scenario
  let layeredOuterwear: string | undefined;
  let layeredFootwear: string | undefined;
  let hasPocketsEffective = outfit.hasPockets;

  if (!outfit.contextsAllowed.includes(scenario)) {
    const owPool = outerwearItems.filter((ow) => ow.contextsAllowed.includes(scenario));
    const fwPool = footwearItems.filter((fw) => fw.contextsAllowed.includes(scenario));
    const selectedOw = owPool.length ? pickOne(rng, owPool) : undefined;
    const selectedFw = fwPool.length ? pickOne(rng, fwPool) : undefined;
    layeredOuterwear = selectedOw?.label;
    layeredFootwear = selectedFw?.label;
    hasPocketsEffective = hasPocketsEffective || !!selectedOw?.hasPockets;
  }

  // Pose selection respects pockets
  const poseCandidates = poses.filter((p) => !p.requiresPockets || hasPocketsEffective);
  const pose = pickOne(rng, poseCandidates);

  // Accessories: context + time + pose constraints
  const accPool = accessories.filter((a) => {
    if (config.safeMode && a.nsfwSensitive) return false;
    if (pose.usesHandsInPocket && a.handOccupied) return false;
    if (a.contextsAllowed && !a.contextsAllowed.includes(scenario)) return false;
    if (a.allowedTimes && bg.timeOfDay && !a.allowedTimes.includes(bg.timeOfDay)) return false;
    return true;
  });
  const accCount = randomInt(rng, 1, 2);
  const acc = pickMany(rng, accPool, accCount);

  // Tech terms based on medium (photo vs render)
  const tech = config.medium === "photo" ? pickOne(rng, photoTech) : pickOne(rng, renderTech);

  // Identity
  const identity = `1girl, solo, (elf:1.2), pointy ears, ${hair}, ${eyes}, ${pose.label}`;

  // Fashion composition (outfit + optional layering + accessories)
  const fashionParts: string[] = [outfit.label];
  if (layeredOuterwear) fashionParts.push(layeredOuterwear);
  if (layeredFootwear) fashionParts.push(layeredFootwear);
  if (acc.length) fashionParts.push(...acc.map((a) => a.label));
  const fashion = fashionParts.join(", ");

  // Scene
  const scene = `${bg.label}, ${lighting}`;

  // Compose positive
  const positive = `${quality}, ${identity}, ${fashion}, ${scene}, ${tech}`;

  // Negative
  const negative =
    config.includeNegative
      ? negativesBase.map((n) => `(${n}:${config.negativeIntensity.toFixed(2)})`).join(", ")
      : undefined;

  return {
    positive,
    negative,
    seed: config.seed,
    selections: {
      scenario,
      quality,
      hair,
      eyes,
      outfit,
      pose,
      accessories: acc,
      background: bg,
      lighting,
      tech,
      layeredOuterwear,
      layeredFootwear,
    },
  };
}