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
import { models } from "./model-data";
import { nsfwTokens, type NSFWToken } from "./prompt-data";

export type GeneratorConfig = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number;
  safeMode: boolean;
  allowedSpecies: string[];
  theme: ThemeKey;
  style: string;
  selectedModelId: string;
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

function pickCameraLogic(style: string, pose: PoseItem, rng: RNG) {
  // Only apply camera hints for photorealistic style
  if (style !== "photorealistic") return { shotType: undefined, cameraAngle: undefined, lens: undefined };
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

// Logic Sanitizer: prevent physical contradictions
function sanitizePrompt(prompt: string, activeTags: string[]): string {
  const hasElfTag = activeTags.some((t) => /(^|\s)(dark\s+elf|elf)(\s|$)/i.test(t));
  const mentionsPointyEars = /pointy ears/i.test(prompt);
  const mentionsHeadphones = /(headphones?|headset|cans)/i.test(prompt);

  const rules: Array<{ when: (p: string) => boolean; apply: (p: string) => string }> = [
    {
      when: (p) => (hasElfTag || mentionsPointyEars) && mentionsHeadphones,
      apply: (p) => p.replace(/headphones?|headset|cans/gi, "earbuds"),
    },
  ];

  let sanitized = prompt;
  for (const rule of rules) {
    if (rule.when(sanitized)) {
      sanitized = rule.apply(sanitized);
    }
  }
  return sanitized;
}

// NSFW selection (Safe Mode OFF): one-per-group with simple conflict resolution
function selectNSFWTokens(params: {
  safeMode: boolean;
  style: string;
  theme: ThemeKey;
  basePoseLabel: string;
}): NSFWToken[] {
  if (params.safeMode) return [];
  const byCategory = {
    intent: nsfwTokens.filter((t) => t.category === "intent"),
    coverage: nsfwTokens.filter((t) => t.category === "coverage"),
    pose: nsfwTokens.filter((t) => t.category === "pose"),
    location: nsfwTokens.filter((t) => t.category === "location"),
    lighting: nsfwTokens.filter((t) => t.category === "lighting"),
  };

  const chosen: NSFWToken[] = [];
  // Pick one per group (simple pickOne)
  const intent = byCategory.intent.length ? pickOne(mulberry32(randomInt(mulberry32(Date.now()), 1, 1e9)), byCategory.intent) : undefined;
  if (intent) chosen.push(intent);

  const coverage = byCategory.coverage.length ? pickOne(mulberry32(randomInt(mulberry32(Date.now() + 1), 1, 1e9)), byCategory.coverage) : undefined;
  if (coverage) chosen.push(coverage);

  const location = byCategory.location.length ? pickOne(mulberry32(randomInt(mulberry32(Date.now() + 2), 1, 1e9)), byCategory.location) : undefined;
  if (location) chosen.push(location);

  const lighting = byCategory.lighting.length ? pickOne(mulberry32(randomInt(mulberry32(Date.now() + 3), 1, 1e9)), byCategory.lighting) : undefined;
  if (lighting) chosen.push(lighting);

  // Pose: avoid contradictions with the base pose (no sitting while walking, etc.)
  const basePose = (params.basePoseLabel || "").toLowerCase();
  let nsfwPose = byCategory.pose.length ? pickOne(mulberry32(randomInt(mulberry32(Date.now() + 4), 1, 1e9)), byCategory.pose) : undefined;
  if (nsfwPose) {
    const lp = nsfwPose.label.toLowerCase();
    const conflicting = lp !== "" && (
      (lp.includes("sitting") && basePose.includes("walking")) ||
      (lp.includes("walking") && basePose.includes("sitting")) ||
      (lp.includes("lying") && basePose.includes("standing")) ||
      (lp.includes("kneeling") && basePose.includes("walking"))
    );
    if (!conflicting) {
      // Prefer base pose: if nsfw pose differs, we drop it to avoid double-pose
      // (You can enable overlay by replacing this with chosen.push(nsfwPose) if desired.)
    } else {
      nsfwPose = undefined;
    }
  }

  // Coverage coherence: ensure only one coverage by removing conflicts
  const coveragePriority = ["lingerie", "revealing outfit", "modest wear", "fully clothed"];
  const coverageLabels = chosen.filter((t) => t.category === "coverage").map((t) => t.label);
  if (coverageLabels.length > 1) {
    const best = coveragePriority.find((label) => coverageLabels.includes(label));
    const pruned = chosen.filter(
      (t) => t.category !== "coverage" || t.label === best
    );
    return pruned;
  }

  return chosen;
}

// Species conflict resolution and hybrid handling
const BASE_SPECIES = ["elf", "dark elf", "orc", "kitsune", "catgirl", "demon"];
const MODIFIER_SPECIES = ["android", "cyborg", "vampire", "angel"];

function resolveSpeciesConflicts(selectedRaw: string[] | undefined) {
  const selected = (selectedRaw ?? []).map((s) => s.toLowerCase().trim());
  const bases = selected.filter((s) => BASE_SPECIES.includes(s));
  const modifiers = selected.filter((s) => MODIFIER_SPECIES.includes(s));
  const hasHuman = selected.includes("human");

  // Human Rule: drop 'human' if any exotic base exists
  let base = bases.length > 0 ? bases[0] : (hasHuman ? "human" : "human");

  // Double Species Rule: keep only the first non-human base (already applied by bases[0])
  // (Future: consider explicit 'hybrid' composition; for now, drop extras.)

  return { base, modifiers };
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

  const style = config.style ?? "photorealistic";
  const theme = config.theme ?? ("any" as ThemeKey);

  // Resolve species and modifiers from user selections before generation
  const { base: baseSpecies, modifiers } = resolveSpeciesConflicts(config.allowedSpecies);

  // Scenario first
  const scenario = pickScenario(rng);

  // Theme-filtered backgrounds + constraints
  let bgPool = filterByTheme(backgrounds, theme).filter((b) => matchesScenario(b, scenario));
  if (theme === "fantasy") {
    bgPool = banLabels(bgPool, [/skyscraper/i]);
  } else if (theme === "school_life") {
    bgPool = prioritize(bgPool, [/classroom/i]);
  } else if (theme === "cyberpunk") {
    bgPool = prioritize(bgPool, [/neon/i, /rain/i]);
  }
  const bg = bgPool.length ? pickOne(rng, bgPool) : pickOne(rng, filterByTheme(backgrounds, theme));
  const lighting = deriveLighting(bg, rng);

  // Base selections
  let quality = applyStyleTags(style).join(", ");
  const model = models.find((m) => m.id === config.selectedModelId);
  if (model?.triggerPrefix) {
    quality = `${model.triggerPrefix}, ${quality}`;
  }

  const hair = pickOne(rng, hairStyles);
  const eyes = pickOne(rng, eyeColors);
  const body = pickOne(rng, bodyTypes);
  const expression = pickExpression(scenario, rng);

  // Theme-filtered outfits + constraints
  let outfitPool = filterByTheme(outfits, theme).filter((o) => o.contextsAllowed.includes(scenario));
  if (theme === "fantasy") {
    outfitPool = banLabels(outfitPool, [/hoodie/i]);
  } else if (theme === "school_life") {
    outfitPool = prioritize(outfitPool, [/uniform/i]);
  } else if (theme === "cyberpunk") {
    outfitPool = prioritize(outfitPool, [/techwear/i]);
  }
  let outfit = outfitPool.length ? pickOne(rng, outfitPool) : pickOne(rng, filterByTheme(outfits, theme));

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

  // Accessories pool
  const accPool = accessories.filter((a) => {
    if (config.safeMode && a.nsfwSensitive) return false;
    if (pose.usesHandsInPocket && a.handOccupied) return false;
    if (a.contextsAllowed && !a.contextsAllowed.includes(scenario)) return false;
    if (a.allowedTimes && bg.timeOfDay && !a.allowedTimes.includes(bg.timeOfDay)) return false;
    return true;
  });
  const accCount = randomInt(rng, 1, 2);
  const acc = pickMany(rng, accPool, accCount);

  // Tech terms based on style
  let tech = style === "photorealistic" ? pickOne(rng, photoTech) : pickOne(rng, renderTech);

  // CAMERA LOGIC (Only for photorealistic)
  const { shotType, cameraAngle, lens } = pickCameraLogic(style, pose, rng);
  if (shotType && cameraAngle && lens) {
    tech = `${tech}, ${shotType}, ${cameraAngle}, ${lens}`;
  }

  // Identity with species logic (base + hybrid modifiers)
  let speciesTags = "";
  switch (baseSpecies) {
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
      speciesTags = "";
      break;
    case "orc":
      speciesTags = "green skin, tusks";
      break;
    case "kitsune":
      speciesTags = "fox ears, multiple fox tails";
      break;
    case "catgirl":
      speciesTags = "cat ears, tail, nekomimi";
      break;
    default:
      speciesTags = ""; // human or unspecified
  }

  // Hybrid modifiers overlay (android/cyborg)
  if (modifiers.includes("android") || modifiers.includes("cyborg")) {
    if (baseSpecies === "elf" || baseSpecies === "dark elf") {
      speciesTags = speciesTags
        ? `${speciesTags}, mechanical elf, robotic joints, cybernetic ears`
        : "mechanical elf, robotic joints, cybernetic ears";
    } else if (baseSpecies === "orc") {
      speciesTags = speciesTags ? `${speciesTags}, cyber-orc, metal plating` : "cyber-orc, metal plating";
    } else {
      speciesTags = speciesTags
        ? `${speciesTags}, android, artificial skin, mechanical parts, gynoid`
        : "android, artificial skin, mechanical parts, gynoid";
    }
  }

  const identity = `1girl, solo${speciesTags ? ", " + speciesTags : ""}, ${body}, ${hair}, ${eyes}, ${expression}, ${pose.label}`;

  // NSFW tokens if Safe Mode is OFF
  const selectedNSFW = selectNSFWTokens({
    safeMode: config.safeMode,
    style,
    theme,
    basePoseLabel: pose.label || "",
  });

  // Fashion composition
  const fashionParts: string[] = [outfit.label];
  if (layeredOuterwear) fashionParts.push(layeredOuterwear);
  if (layeredFootwear) fashionParts.push(layeredFootwear);
  if (acc.length) fashionParts.push(...acc.map((a) => a.label));
  // coverage tokens integrate with fashion
  selectedNSFW
    .filter((t) => t.category === "coverage")
    .forEach((t) => fashionParts.push(t.label));
  const fashion = fashionParts.join(", ");

  // Scene (append optional nsfw location/lighting descriptors)
  const nsfwLocation = selectedNSFW.find((t) => t.category === "location")?.label;
  const nsfwLight = selectedNSFW.find((t) => t.category === "lighting")?.label;
  const scene = `${bg.label}${nsfwLocation ? ", " + nsfwLocation : ""}, ${lighting}${nsfwLight ? ", " + nsfwLight : ""}`;

  // Compose positive and sanitize with active tags (base + modifiers)
  const nsfwIntent = selectedNSFW.find((t) => t.category === "intent")?.label;
  let positive = `${nsfwIntent ? nsfwIntent + ", " : ""}${quality}, ${identity}, ${fashion}, ${scene}, ${tech}`;
  positive = sanitizePrompt(positive, [baseSpecies, ...modifiers]);

  // Negative
  let negative: string | undefined;
  if (config.includeNegative) {
    if (model?.id === "pony-v6" && model.negativeDefault) {
      negative = model.negativeDefault;
    } else {
      const mediumForContext =
        style === "photorealistic" ? "photo" :
        style === "3d_render" ? "render" :
        undefined;
      negative = generateNegativePrompt(
        config.negativeIntensity,
        undefined,
        config.seed,
        { medium: mediumForContext as Medium | undefined, scenario }
      );
    }
  }

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