import { mulberry32, pickOne, pickMany, RNG, randomInt } from "./prng";
import {
  qualityTags,
  hairStyles,
  eyeColors,
  bodyTypes,
  expressions,
  outfits,
  poses,
  accessories,
  backgrounds,
  lightingByContext,
  photoTech,
  renderTech,
  shotTypes,
  cameraAngles,
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
    body: string;
    expression: string;
    outfit: OutfitItem;
    pose: PoseItem;
    accessories: AccessoryItem[];
    background: BackgroundItem;
    lighting: string;
    tech: string;
    layeredOuterwear?: string;
    layeredFootwear?: string;
    shotType?: string;
    cameraAngle?: string;
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

function pickExpression(scenario: ScenarioKey, rng: RNG): string {
  // Logic: Happy for day, moody/neutral for night/indoor
  if (scenario === "outdoor_public_day") {
    return pickOne(rng, [...expressions.positive, ...expressions.neutral]);
  } else if (scenario === "outdoor_public_night" || scenario === "indoor_private") {
    return pickOne(rng, [...expressions.neutral, ...expressions.moody]);
  } else {
    // Studio - can be anything
    return pickOne(rng, [...expressions.positive, ...expressions.neutral, ...expressions.moody]);
  }
}

function pickCameraLogic(medium: Medium, pose: PoseItem, rng: RNG) {
  if (medium !== "photo") return { shotType: undefined, cameraAngle: undefined, lens: undefined };

  // If pose forces a shot type (e.g., selfie -> close-up), use it.
  const shotType = pose.forcedShotType ?? pickOne(rng, shotTypes);
  const cameraAngle = pickOne(rng, cameraAngles);

  // Derive simple lens hint based on shot type
  let lens = "";
  if (shotType === "close-up" || shotType === "portrait") lens = "85mm lens";
  else if (shotType === "wide shot") lens = "24mm lens, wide angle";
  else if (shotType === "full body") lens = "50mm lens";
  else lens = "35mm lens";

  return { shotType, cameraAngle, lens };
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
  const body = pickOne(rng, bodyTypes);
  const expression = pickExpression(scenario, rng);

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
  let tech = config.medium === "photo" ? pickOne(rng, photoTech) : pickOne(rng, renderTech);

  // --- CAMERA LOGIC (Only for Photo) ---
  const { shotType, cameraAngle, lens } = pickCameraLogic(config.medium, pose, rng);
  if (shotType && cameraAngle && lens) {
    // Append camera details to tech block or create a new block
    tech = `${tech}, ${shotType}, ${cameraAngle}, ${lens}`;
  }

  // Identity
  const identity = `1girl, solo, (elf:1.2), pointy ears, ${body}, ${hair}, ${eyes}, ${expression}, ${pose.label}`;

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
      ? generateNegativePrompt(config.negativeIntensity, undefined, config.seed, { medium: config.medium, scenario })
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
      body,
      expression,
      outfit,
      pose,
      accessories: acc,
      background: bg,
      lighting,
      tech,
      layeredOuterwear,
      layeredFootwear,
      shotType,
      cameraAngle,
    },
  };
}

export function generateNegativePrompt(
  intensity: number,
  poolOverride?: string[],
  seed?: number,
  context?: { medium?: Medium; scenario?: ScenarioKey }
): string {
  const rng = mulberry32(seed ?? Math.floor(Math.random() * 1_000_000_000));
  
  // 1. Core quality fixes (Universal)
  const core = ["low quality", "worst quality", "bad anatomy", "bad hands", "missing fingers", "extra digit", "jpeg artifacts", "signature", "watermark", "username", "blurry"];

  // 2. Context-Specific Negatives
  const contextual: string[] = [];

  if (context?.medium === "photo") {
    // If we want a photo, avoid artistic/render styles
    contextual.push("3d render", "cartoon", "anime", "painting", "drawing", "illustration", "sketch");
  } else if (context?.medium === "render") {
    // If we want a render, avoid looking like a raw snapshot if that conflicts with the style (optional, but 'photo' can sometimes flatten stylized renders)
    // contextual.push("photo", "photograph"); // This is debatable, sometimes renders want to look like photos. Leaving strictly safe for now.
  }

  // 3. Pick random "flavor" negatives from the pool
  const sourcePool = poolOverride && poolOverride.length ? poolOverride : negativesBase;
  // Filter out what we already have
  const existingSet = new Set([...core, ...contextual]);
  const pool = sourcePool.filter((n) => !existingSet.has(n));

  const count = randomInt(rng, 5, 10);
  const picked = pickMany(rng, pool, count);

  const all = [...core, ...contextual, ...picked];
  return all.map((n) => `(${n}:${intensity.toFixed(2)})`).join(", ");
}