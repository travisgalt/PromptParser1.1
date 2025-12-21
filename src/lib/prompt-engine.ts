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
    quality: string;
    hair: string;
    eyes: string;
    outfit: OutfitItem;
    pose: PoseItem;
    accessories: AccessoryItem[];
    background: BackgroundItem;
    lighting: string;
    tech: string;
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

export function generatePrompt(config: GeneratorConfig): GeneratedPrompt {
  // Build a seeded RNG
  const rng = mulberry32(config.seed);

  // Selections
  const quality = pickOne(rng, qualityTags);
  const hair = pickOne(rng, hairStyles);
  const eyes = pickOne(rng, eyeColors);

  const outfit = pickOne(rng, outfits);

  // Pose selection with pocket requirement handling
  const poseCandidates = poses.filter((p) => !p.requiresPockets || outfit.hasPockets);
  const pose = pickOne(rng, poseCandidates);

  // Accessories: choose 1-2, avoid hand-occupied when hands are in pockets
  const accPool = accessories.filter((a) => {
    if (config.safeMode && a.nsfwSensitive) return false;
    if (pose.usesHandsInPocket && a.handOccupied) return false;
    return true;
  });
  const accCount = randomInt(rng, 1, 2);
  const acc = pickMany(rng, accPool, accCount);

  // Background and lighting
  const bg = pickOne(rng, backgrounds);
  const lighting = deriveLighting(bg, rng);

  // Tech terms based on medium
  const tech = config.medium === "photo" ? pickOne(rng, photoTech) : pickOne(rng, renderTech);

  // Identity
  const identity = `1girl, solo, (elf:1.2), pointy ears, ${hair}, ${eyes}, ${pose.label}`;

  // Fashion
  const fashion = `${outfit.label}${acc.length ? ", " + acc.map((a) => a.label).join(", ") : ""}`;

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
      quality,
      hair,
      eyes,
      outfit,
      pose,
      accessories: acc,
      background: bg,
      lighting,
      tech,
    },
  };
}