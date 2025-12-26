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
  type ThemeKey,
} from "./prompt-data";

export type GeneratorConfig = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number; // e.g. 1.0..1.4
  medium: Medium; // photo or render
  safeMode: boolean;
  allowedSpecies: string[]; // e.g., ['human','elf']
  theme: ThemeKey; // 'any' | 'fantasy' | 'modern' | ...
  style: string; // 'photorealistic' | 'anime' | '3d_render' | ...
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
  if (bg.environment === "studio") return pickOne(rng, lightingByContext["studio"]);
  if (bg.environment === "indoor") return pickOne(rng, lightingByContext["indoor"]);
  const key = bg.timeOfDay === "day" ? "outdoor-day" : "outdoor-night";
  return pickOne(rng, lightingByContext[key]);
}

function pickScenario(rng: RNG): ScenarioKey {
  const choices: ScenarioKey[] = ["indoor_private", "outdoor_public_day", "outdoor_public_night", "studio"];
  return pickOne(rng, choices);
}

function matchesScenario(bg: BackgroundItem, scenario: ScenarioKey): boolean {
  if (scenario === "indoor_private") return bg.environment === "indoor";
  if (scenario === "studio") return bg.environment === "studio";
  if (scenario === "outdoor_public_day") return bg.environment === "outdoor" && bg.timeOfDay === "day";
  if (scenario === "outdoor_public_night") return bg.environment === "outdoor" && bg.timeOfDay === "night";
  return true;
}

function pickExpression(scenario: ScenarioKey, rng: RNG): string {
  if (scenario === "outdoor_public_day") return pickOne(rng, [...expressions.positive, ...expressions.neutral]);
  if (scenario === "outdoor_public_night" || scenario === "indoor_private")
    return pickOne(rng, [...expressions.neutral, ...expressions.moody]);
  return pickOne(rng, [...expressions.positive, ...expressions.neutral, ...expressions.moody]);
}

function pickCameraLogic(medium: Medium, pose: PoseItem, rng: RNG) {
  if (medium !== "photo") return { shotType: undefined, cameraAngle: undefined, lens: undefined };
  const shotType = pose.forcedShotType ?? pickOne(rng, shotTypes);
  const cameraAngle = pickOne(rng, cameraAngles);
  let lens = "";
  if (shotType === "close-up" || shotType === "portrait") lens = "85mm lens";
  else if (shotType === "wide shot") lens = "24mm lens, wide angle";
  else if (shotType === "full body") lens = "50mm lens";
  else lens = "35mm lens";
  return { shotType, cameraAngle, lens };
}

function applyStyleTags(style: string): string[] {
  const universal = ["(masterpiece)", "(best quality)", "(highly detailed)", "8k"];
  let styleTags: string[] = [];
  switch (style) {
    case "photorealistic":
      styleTags = ["raw photo", "photorealistic", "realistic texture", "skin texture", "film grain"];
      break;
    case "anime":
      styleTags = ["source_anime", "flat color", "2d", "illustration"];
      break;
    case "3d_render":
      styleTags = ["3d", "octane render", "cgi", "unreal engine 5", "raytracing"];
      break;
    case "digital_painting":
      styleTags = ["digital art", "concept art", "matte painting"];
      break;
    case "oil_painting":
      styleTags = ["oil painting", "brush strokes", "canvas texture"];
      break;
    case "pixel_art":
      styleTags = ["pixel art", "16-bit", "retro game style"];
      break;
    case "comic_book":
      styleTags = ["comic book", "halftone shading", "graphic novel style"];
      break;
    case "line_art":
      styleTags = ["line art", "ink", "black and white", "manga"];
      break;
    default:
      styleTags = [];
  }
  return [...universal, ...styleTags];
}

function filterByTheme<T extends { themes: ThemeKey[] }>(items: T[], theme: ThemeKey): T[] {
  if (theme === "any") return items;
  return items.filter((i) => i.themes.includes("any") || i.themes.includes(theme));
}

function prioritize<T extends { label: string }>(items: T[], matchers: RegExp[]): T[] {
  const preferred = items.filter((i) => matchers.some((m) => m.test(i.label)));
  return preferred.length ? preferred : items;
}

function banLabels<T extends { label: string }>(items: T[], matchers: RegExp[]): T[] {
  return items.filter((i) => !matchers.some((m) => m.test(i.label)));
}

export function generatePrompt(config: GeneratorConfig): GeneratedPrompt {
  const rng = mulberry32(config.seed);

  // Scenario first
  const scenario = pickScenario(rng);

  // Theme-filtered backgrounds + constraints
  let bgPool = filterByTheme(backgrounds, config.theme).filter((b) => matchesScenario(b, scenario));

  if (config.theme === "fantasy") {
    bgPool = banLabels(bgPool, [/skyscraper/i]);
  } else if (config.theme === "school_life") {
    bgPool = prioritize(bgPool, [/classroom/i]);
  } else if (config.theme === "cyberpunk") {
    bgPool = prioritize(bgPool, [/neon/i, /rain/i]);
  }

  const bg = bgPool.length ? pickOne(rng, bgPool) : pickOne(rng, filterByTheme(backgrounds, config.theme));
  const lighting = deriveLighting(bg, rng);

  // Base selections
  const quality = applyStyleTags(config.style).join(", ");
  const hair = pickOne(rng, hairStyles);
  const eyes = pickOne(rng, eyeColors);
  const body = pickOne(rng, bodyTypes);
  const expression = pickExpression(scenario, rng);

  // Theme-filtered outfits + constraints
  let outfitPool = filterByTheme(outfits, config.theme).filter((o) => o.contextsAllowed.includes(scenario));
  if (config.theme === "fantasy") {
    outfitPool = banLabels(outfitPool, [/hoodie/i]);
  } else if (config.theme === "school_life") {
    outfitPool = prioritize(outfitPool, [/uniform/i]);
  } else if (config.theme === "cyberpunk") {
    outfitPool = prioritize(outfitPool, [/techwear/i]);
  }

  let outfit = outfitPool.length ? pickOne(rng, outfitPool) : pickOne(rng, filterByTheme(outfits, config.theme));

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

  // CAMERA LOGIC (Only for Photo)
  const { shotType, cameraAngle, lens } = pickCameraLogic(config.medium, pose, rng);
  if (shotType && cameraAngle && lens) {
    tech = `${tech}, ${shotType}, ${cameraAngle}, ${lens}`;
  }

  // Identity with species logic
  const speciesPool = Array.isArray(config.allowedSpecies) && config.allowedSpecies.length ? config.allowedSpecies : ["human"];
  const species = pickOne(rng, speciesPool);
  let speciesTags = "";
  switch (species) {
    case "elf":
      speciesTags = "(elf:1.2), pointy ears";
      break;
    case "dark elf":
      speciesTags = "(dark elf:1.2), pointy ears, dark skin, white hair";
      break;
    case "demon":
      speciesTags = "horns, tail";
      break;
    case "angel":
      speciesTags = "wings, halo";
      break;
    case "android":
      speciesTags = "mechanical joints, robotic";
      break;
    case "cyborg":
      speciesTags = "cybernetic implants, mechanical arm";
      break;
    case "vampire":
      speciesTags = "pale skin, red eyes, fangs";
      break;
    case "kitsune":
      speciesTags = "fox ears, multiple fox tails";
      break;
    case "catgirl":
      speciesTags = "cat ears, tail, nekomimi";
      break;
    case "orc":
      speciesTags = "green skin, tusks";
      break;
    default:
      speciesTags = ""; // human or unknown
  }

  const identity = `1girl, solo${speciesTags ? ", " + speciesTags : ""}, ${body}, ${hair}, ${eyes}, ${expression}, ${pose.label}`;

  // Fashion composition (outfit + optional layering + accessories)
  const fashionParts: string[] = [outfit.label];
  if (layeredOuterwear) fashionParts.push(layeredOuterwear);
  if (layeredFootwear) fashionParts.push(layeredFootwear);
  if (acc.length) fashionParts.push(...acc.map((a) => a.label));
  const fashion = fashionParts.join(", ");

  // Scene
  const scene = `${bg.label}, ${lighting}`;

  // Positive composition
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
  const core = ["low quality", "worst quality", "bad anatomy", "bad hands", "missing fingers", "extra digit", "jpeg artifacts", "signature", "watermark", "username", "blurry"];
  const contextual: string[] = [];

  if (context?.medium === "photo") {
    contextual.push("3d render", "cartoon", "anime", "painting", "drawing", "illustration", "sketch");
  } else if (context?.medium === "render") {
    // Optionally avoid photo-like look; leaving minimal to keep variety
  }

  const sourcePool = poolOverride && poolOverride.length ? poolOverride : negativesBase;
  const existingSet = new Set([...core, ...contextual]);
  const pool = sourcePool.filter((n) => !existingSet.has(n));

  const count = randomInt(rng, 5, 10);
  const picked = pickMany(rng, pool, count);

  const all = [...core, ...contextual, ...picked];
  return all.map((n) => `(${n}:${intensity.toFixed(2)})`).join(", ");
}