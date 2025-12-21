import {
  qualityTags,
  hairStyles,
  eyeColors,
  posesSafe,
  posesPockets,
  outfits,
  accessoriesNeutral,
  accessoriesHand,
  backgrounds,
  lightingMap,
  techPhoto,
  techRender,
  negativeBase,
  styleBackgroundBias,
  type MediumType,
  type BackgroundType,
  type Outfit,
} from "./prompt-data";

export type StylePack = Outfit["pack"];

export interface GeneratorConfig {
  pack: StylePack;
  includeNegative: boolean;
  negativeIntensity: number; // 0..2 scales emphasis
  safeMode: boolean;
}

export interface GeneratedPrompt {
  positive: string;
  negative?: string;
  metadata: {
    seed: number;
    pack: StylePack;
    backgroundType: BackgroundType;
    medium: MediumType;
    selections: Record<string, string>;
    timestamp: number;
  };
}

// Mulberry32 seeded PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  const idx = Math.floor(rng() * arr.length);
  return arr[idx];
}

function pickWeighted<T extends { weight?: number }>(rng: () => number, arr: T[]): T {
  const weights = arr.map((a) => a.weight ?? 1);
  const total = weights.reduce((s, w) => s + w, 0);
  const r = rng() * total;
  let acc = 0;
  for (let i = 0; i < arr.length; i++) {
    acc += weights[i];
    if (r <= acc) return arr[i];
  }
  return arr[arr.length - 1];
}

function sample<T>(rng: () => number, arr: T[], k: number): T[] {
  const copy = [...arr];
  const res: T[] = [];
  for (let i = 0; i < k && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    res.push(copy.splice(idx, 1)[0]);
  }
  return res;
}

export function generatePrompt(seed: number, config: GeneratorConfig): GeneratedPrompt {
  const rng = mulberry32(seed);

  // Outfit first (drives pockets & pack)
  const availableOutfits = outfits.filter((o) => o.pack === config.pack);
  const outfit = pick(rng, availableOutfits);

  // Pose logic: if outfit has pockets, allow pockets poses; else safe-only
  const pose = outfit.hasPockets ? pick(rng, [...posesSafe, ...posesPockets]) : pick(rng, posesSafe);

  // Accessories: avoid hand-occupied if pose requires pockets (hands must be in pockets)
  const baseAccPool = [...accessoriesNeutral];
  const allowHandItem = outfit.hasPockets && !pose.requiresPockets; // if outfit has pockets but pose doesn't require, we may allow one hand item
  if (!allowHandItem) {
    // exclude hand-occupied
  } else {
    baseAccPool.push(...accessoriesHand);
  }
  const accCount = 1 + Math.floor(rng() * 2); // 1..2 accessories
  const accessories = sample(rng, baseAccPool, accCount);

  // Identity
  const hair = pick(rng, hairStyles).label;
  const eye = pick(rng, eyeColors).label;
  const identity = `1girl, solo, (elf:1.2), pointy ears, ${hair}, ${eye}, ${pose.label}`;

  // Quality & medium coherence
  const quality = pickWeighted(rng, qualityTags);
  const medium: MediumType = quality.medium;

  // Background selection with style bias
  const bgTypes = styleBackgroundBias[config.pack];
  const backgroundType = pick(rng, bgTypes);
  const bgPool = backgrounds.filter((b) => b.type === backgroundType);
  const bg = pick(rng, bgPool).label;
  const lighting = pick(rng, lightingMap[backgroundType]);

  // Tech terms: align to medium
  const tech = medium === "photo" ? pick(rng, techPhoto) : pick(rng, techRender);

  // Fashion block
  const fashion = `${outfit.label}, ${accessories.map((a) => a.label).join(", ")}`;

  // Negative prompt
  const negative = config.includeNegative
    ? negativeBase
        .map((n) => `(${n}:${(1 + config.negativeIntensity).toFixed(2)})`)
        .join(", ")
    : undefined;

  // Assemble positive prompt
  const positive = `${quality.label}, ${identity}, ${fashion}, ${bg}, ${lighting}, ${tech}`;

  return {
    positive,
    negative,
    metadata: {
      seed,
      pack: config.pack,
      backgroundType,
      medium,
      selections: {
        outfit: outfit.label,
        pose: pose.label,
        accessories: accessories.map((a) => a.label).join(" | "),
        hair,
        eye,
        quality: quality.label,
        background: bg,
        lighting,
        tech,
      },
      timestamp: Date.now(),
    },
  };
}