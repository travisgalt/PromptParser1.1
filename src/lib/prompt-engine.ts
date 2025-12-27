import { mulberry32, pickOne, pickMany, RNG, randomInt } from "./prng";
import {
  qualityTags,
  hairStyles,
  hairColors,
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
  hairColor?: string;
  eyeColor?: string;
  extraTags?: string[];
  // ADDED: Recency memory for variety
  variety?: {
    recent?: {
      hairStyle?: string[];
      body?: string[];
      expression?: string[];
      outfit?: string[];
      background?: string[];
      lighting?: string[];
      pose?: string[];
      accessories?: string[];
    };
  };
  // NEW: Theme-specific modifiers resolved client-side from DB
  themeTags?: {
    positive: string[];
    negative?: string[];
  };
};

// Helper: normalize tags to lowercase for matching
function norm(s: string) {
  return s.toLowerCase().trim();
}

// ADDED: pick avoiding recent selections with graceful fallback
function pickAvoiding<T extends string | { label: string }>(
  rng: RNG,
  list: T[],
  avoid?: Set<string>,
  getLabel?: (x: T) => string
): T {
  const labeler = getLabel ?? ((x: any) => (typeof x === "string" ? x : x.label));
  const pool = avoid && avoid.size
    ? list.filter((item) => !avoid.has(norm(labeler(item))))
    : list;
  if (pool.length === 0) return pickOne(rng, list);
  return pickOne(rng, pool);
}

// Category sets to recognize user-selected tags
const CORE_BODY_TAGS = new Set(["athletic","curvy","petite","muscular","slender","voluptuous","tall","chibi"]);
const CORE_HAIR_STYLE_TAGS = new Set(["long hair","short hair","bob cut","pixie cut","ponytail","twintails","messy hair","braids","wavy hair","drills","ahoge"]);
const CORE_HAIR_COLOR_TAGS = new Set(["blonde","black hair","brown hair","red hair","white hair","silver hair","pastel pink","blue hair","multicolored hair","gradient hair"]);
const CORE_EYE_TAGS = new Set(["blue eyes","red eyes","green eyes","heterochromia","glowing eyes","tsurime","tareme","closed eyes"]);
const CORE_EXPRESSION_TAGS = new Set(["smiling","smug","embarrassed","angry","expressionless","yandere","blushing","crying","surprised","parted lips"]);

// ADDED: Skin & Details set
const SKIN_TAGS = new Set(["pale skin","tan skin","dark skin","freckles","scars","tattoos","makeup","glistening skin","oiled skin","blush"]);

// ADDED: Apparel sets (tops, bottoms, accessories)
const TOP_TAGS = new Set(["hoodie","oversized hoodie","t-shirt","graphic tee","crop top","tube top","sweater","turtle neck","tank top","camisole","dress shirt","blouse","corset","bikini top","micro bikini top","bandeau","triangle bikini","halter top","sports bra","armored plate","kimono","yukata","school uniform","serafuku","blazer","leather jacket","denim jacket","coat","lab coat"]);
const BOTTOM_TAGS = new Set(["jeans","skinny jeans","ripped jeans","pleated skirt","miniskirt","pencil skirt","long skirt","bubble skirt","leggings","yoga pants","shorts","dolphin shorts","cargo pants","track pants","sweatpants","bikini bottom","side-tie bikini bottom","micro bikini bottom","sarong","pareo","panties","thong","no pants"]);
const ACCESSORY_TAGS = new Set(["glasses","sunglasses","monocle","goggles","eyepatch","choker","collar","necklace","pendant","earrings","piercings","navel piercing","cat ears","animal ears","halo","horns","demon horns","mechanical wings","angel wings","bat wings","headphones","jewelry","mask","gas mask","fox mask","ribbon","hair flower","hair ornament","hat","cap","beret","beanie","witch hat"]);

// NEW: Full-body outfits (dresses, one-piece)
const FULL_BODY_TAGS = new Set([
  "sundress","summer dress","evening gown","cocktail dress","wedding dress","strapless dress","off-shoulder dress","halter dress","backless dress","sweater dress","slip dress","china dress","cheongsam","dirndl","gothic lolita dress","maid dress","nurse uniform","nun habit",
  "one-piece swimsuit","school swimsuit","competitive swimsuit","sling swimsuit","monokini","bodysuit","leotard","plugsuit","wetsuit","latex suit"
]);

const CAMERA_TAGS = new Set(["cowboy shot","upper body","full body","close-up","portrait","dutch angle","from below","from above","wide angle","fisheye"]);
const ART_STYLE_TAGS = new Set(["anime","realistic","semi-realistic","oil painting","sketch","lineart","cel shaded","digital art","pixel art","watercolor","flat color"]);
const QUALITY_TAGS_SET = new Set(["masterpiece","best quality","highres","8k","highly detailed","sharp focus","hdr","absurdres"]);

const LOCATION_TAGS = new Set(["cyberpunk city","fantasy forest","bedroom","cafe","classroom","ruins","beach","outer space","dungeon","library","street corner"]);
const SIMPLE_BG_TAGS = new Set(["simple background","white background","black background","solid color","two-tone background","gradient background","abstract background","geometric pattern","polka dots","blurred background","bokeh","minimalist"]);
const LIGHTING_TAGS = new Set(["cinematic lighting","natural light","volumetric lighting","neon lights","rim lighting","sunset","golden hour","dark and moody","god rays","studio lighting","soft lighting"]);

// Mapping from body tag to internal bodyTypes string
const BODY_MAP: Record<string, string> = {
  athletic: "athletic build, toned",
  muscular: "athletic build, toned",
  curvy: "curvy body, thick thighs",
  petite: "petite figure",
  slender: "slender body",
  voluptuous: "curvy body, thick thighs",
  tall: "tall figure",
  chibi: "petite figure",
};

// Background tag to matching regex for our backgrounds list
const BG_REGEX_MAP: Record<string, RegExp[]> = {
  "cyberpunk city": [/neon/i, /city/i],
  "fantasy forest": [/forest/i, /castle/i], // approximate
  bedroom: [/bedroom/i, /hotel/i],
  cafe: [/coffee shop/i, /cafe/i],
  classroom: [/classroom/i],
  ruins: [/wasteland/i, /ruins/i],
  beach: [/beach/i, /sand/i], // approximate
  "outer space": [/space station/i, /space/i],
  dungeon: [/castle/i, /gothic/i],
  library: [/library/i], // none exact; keep approximate
  "street corner": [/street/i, /alley/i],
};

// Camera overrides helpers
function matchShotOverride(tags: string[]): string | undefined {
  const order = ["close-up","portrait","upper body","cowboy shot","full body","wide angle","fisheye"];
  const sel = new Set(tags.map(norm));
  return order.find((t) => sel.has(t));
}
function matchAngleOverride(tags: string[]): string | undefined {
  const order = ["dutch angle","from below","from above"];
  const sel = new Set(tags.map(norm));
  return order.find((t) => sel.has(t));
}

// Build negatives for opposites (conservative)
function negativesForLocks(lockBody?: string): string[] {
  const negs: string[] = [];
  if (lockBody) {
    const n = norm(lockBody);
    if (n.includes("muscular") || n.includes("athletic")) {
      negs.push("slender body");
    } else if (n.includes("curvy") || n.includes("voluptuous")) {
      negs.push("slender body");
    } else if (n.includes("petite")) {
      negs.push("tall figure");
    } else if (n.includes("tall")) {
      negs.push("petite figure");
    }
  }
  return negs;
}

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
    case "hyperrealistic":
      styleTags = ["hyperrealistic", "extreme detail", "lifelike textures"];
      break;
    case "anime":
      styleTags = ["source_anime", "flat color", "2d", "illustration"];
      break;
    case "manga":
      styleTags = ["manga", "screentone", "black and white"];
      break;
    case "manhwa":
      styleTags = ["manhwa", "webtoon style", "clean line art"];
      break;
    case "cel_shaded":
      styleTags = ["cel shaded", "toon shading", "flat color"];
      break;
    case "3d_render":
      styleTags = ["3d", "octane render", "cgi", "unreal engine 5", "raytracing"];
      break;
    case "octane_render":
      styleTags = ["octane render", "physically based rendering"];
      break;
    case "unreal_engine_5":
      styleTags = ["unreal engine 5", "high fidelity", "global illumination"];
      break;
    case "digital_painting":
      styleTags = ["digital art", "concept art", "matte painting"];
      break;
    case "oil_painting":
      styleTags = ["oil painting", "brush strokes", "canvas texture"];
      break;
    case "watercolor":
      styleTags = ["watercolor", "paper texture", "washed pigments"];
      break;
    case "ink_wash":
      styleTags = ["ink wash", "sumi-e", "monochrome ink"];
      break;
    case "charcoal_sketch":
      styleTags = ["charcoal sketch", "grainy shading"];
      break;
    case "impasto_style":
      styleTags = ["impasto", "thick paint", "visible strokes"];
      break;
    case "ukiyo_e":
      styleTags = ["ukiyo-e", "woodblock print", "flat color"];
      break;
    case "gouache":
      styleTags = ["gouache", "opaque watercolor"];
      break;
    case "pastel":
      styleTags = ["pastel", "soft color palette", "chalk texture"];
      break;
    case "pencil_sketch":
      styleTags = ["pencil sketch", "hand-drawn", "graphite lines"];
      break;
    case "pixel_art":
      styleTags = ["pixel art", "16-bit", "retro game style"];
      break;
    case "game_boy_style":
      styleTags = ["game boy style", "green monochrome", "low-bit graphics"];
      break;
    case "voxel_art":
      styleTags = ["voxel art", "3d pixels", "cube style"];
      break;
    case "low_poly":
      styleTags = ["low poly", "flat shading", "minimal geometry"];
      break;
    case "vector_art":
      styleTags = ["vector art", "clean lines", "scalable graphics"];
      break;
    case "flat_design":
      styleTags = ["flat design", "minimal shading", "bold shapes"];
      break;
    case "isometric":
      styleTags = ["isometric", "axonometric projection"];
      break;
    case "analog_film":
      styleTags = ["analog film", "grain", "vintage"];
      break;
    case "polaroid_style":
      styleTags = ["polaroid", "instant film", "white border"];
      break;
    case "cinematic":
      styleTags = ["cinematic", "film still", "anamorphic look"];
      break;
    case "macro_photography":
      styleTags = ["macro", "extreme close-up", "shallow depth of field"];
      break;
    case "fisheye_lens":
      styleTags = ["fisheye lens", "distorted perspective"];
      break;
    case "double_exposure":
      styleTags = ["double exposure", "overlay silhouettes"];
      break;
    case "comic_book":
      styleTags = ["comic book", "halftone shading", "graphic novel style"];
      break;
    case "line_art":
      styleTags = ["line art", "ink", "black and white"];
      break;
    case "surrealism":
      styleTags = ["surreal", "dreamlike", "symbolic composition"];
      break;
    case "pop_art":
      styleTags = ["pop art", "bold colors", "comic halftone"];
      break;
    case "art_deco":
      styleTags = ["art deco", "geometric motifs", "ornate"];
      break;
    case "art_nouveau":
      styleTags = ["art nouveau", "organic curves", "ornamentation"];
      break;
    case "stained_glass":
      styleTags = ["stained glass", "lead lines", "translucent color"];
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
  const filtered = items.filter((i) => i.themes.includes("any") || i.themes.includes(theme));
  // ADDED: If no items match the new theme, gracefully fall back to all items
  return filtered.length ? filtered : items;
}

function prioritize<T extends { label: string }>(items: T[], matchers: RegExp[]): T[] {
  const preferred = items.filter((i) => matchers.some((m) => m.test(i.label)));
  return preferred.length ? preferred : items;
}

function banLabels<T extends { label: string }>(items: T[], matchers: RegExp[]): T[] {
  return items.filter((i) => !matchers.some((m) => m.test(i.label)));
}

// ADDED: Resolve hair color tag with Random and style-aware filtering
function resolveHairColorTag(style: string, selected: string | undefined, rng: RNG): string {
  const sel = (selected ?? "Random");
  const isRandom = sel === "Random";
  const candidates = hairColors.filter((c) => c !== "Random");
  let pool = candidates;

  if (style === "photorealistic" && isRandom) {
    // Filter out unnatural colors for photorealistic when Random
    const block = new Set(["Pink", "Blue", "Green"]);
    pool = candidates.filter((c) => !block.has(c));
  }

  const choice = isRandom ? pickOne(rng, pool) : sel;

  if (choice === "Multicolor") {
    return "multicolored hair, gradient hair";
  }
  return `${choice.toLowerCase()} hair`;
}

// ADDED: Resolve eye color tag with Random and special heterochromia
function resolveEyeColorTag(style: string, selected: string | undefined, rng: RNG): string {
  const sel = (selected ?? "Random");
  const isRandom = sel === "Random";
  const candidates = eyeColors.filter((c) => c !== "Random");
  const choice = isRandom ? pickOne(rng, candidates) : sel;

  if (choice === "Heterochromia") {
    return "heterochromia, mismatching pupils";
  }
  return `${choice.toLowerCase()} eyes`;
}

export function generatePrompt(config: GeneratorConfig): GeneratedPrompt {
  const rng = mulberry32(config.seed);
  const recent = config.variety?.recent ?? {};

  const style = config.style ?? "photorealistic";
  const theme = config.theme ?? ("any" as ThemeKey);

  // MERGED: include theme positive tags with user extra tags
  const extra = [...(config.extraTags ?? []).map(norm), ...(config.themeTags?.positive ?? []).map(norm)];

  const { base: baseSpecies, modifiers } = resolveSpeciesConflicts(config.allowedSpecies);

  const scenario = pickScenario(rng);

  let bgPool = filterByTheme(backgrounds, theme).filter((b) => matchesScenario(b, scenario));
  if (theme === "fantasy") {
    bgPool = banLabels(bgPool, [/skyscraper/i]);
  } else if (theme === "school_life") {
    bgPool = prioritize(bgPool, [/classroom/i]);
  } else if (theme === "cyberpunk") {
    bgPool = prioritize(bgPool, [/neon/i, /rain/i]);
  }

  const userBgTag = extra.find((t) => LOCATION_TAGS.has(t) || SIMPLE_BG_TAGS.has(t));
  let bg: BackgroundItem;
  if (userBgTag && LOCATION_TAGS.has(userBgTag)) {
    const regexes = BG_REGEX_MAP[userBgTag] ?? [];
    const matches = bgPool.filter((b) => regexes.some((re) => re.test(b.label)));
    bg = matches.length ? pickOne(rng, matches) : (bgPool.length ? pickOne(rng, bgPool) : pickOne(rng, filterByTheme(backgrounds, theme)));
  } else {
    const avoidBg = new Set((recent.background ?? []).map(norm));
    const candidates = bgPool.length ? bgPool : filterByTheme(backgrounds, theme);
    bg = pickAvoiding(rng, candidates, avoidBg, (x) => x.label);
  }

  let lighting = deriveLighting(bg, rng);
  const userLightTag = extra.find((t) => LIGHTING_TAGS.has(t));
  if (userLightTag) {
    lighting = userLightTag;
  } else {
    const avoidLight = new Set((recent.lighting ?? []).map(norm));
    const lightChoices =
      bg.environment === "studio" ? lightingByContext["studio"] :
      bg.environment === "indoor" ? lightingByContext["indoor"] :
      lightingByContext[bg.timeOfDay === "day" ? "outdoor-day" : "outdoor-night"];
    lighting = pickAvoiding(rng, lightChoices, avoidLight);
  }

  let quality = applyStyleTags(style).join(", ");
  const qualityBoosters = extra.filter((t) => QUALITY_TAGS_SET.has(t));
  if (qualityBoosters.length) {
    quality = `${qualityBoosters.join(", ")}, ${quality}`;
  }

  const model = models.find((m) => m.id === config.selectedModelId);
  if (model?.triggerPrefix) {
    quality = `${model.triggerPrefix}, ${quality}`;
  }

  // CORE OVERRIDES: Body, Hair Style, Hair/Eye colors, Expression
  const userBodyTag = extra.find((t) => CORE_BODY_TAGS.has(t));
  const avoidBody = new Set((recent.body ?? []).map(norm));
  const body = userBodyTag ? (BODY_MAP[userBodyTag] ?? userBodyTag) : pickAvoiding(rng, bodyTypes, avoidBody);

  const userHairStyle = extra.find((t) => CORE_HAIR_STYLE_TAGS.has(t));
  const avoidHairStyle = new Set((recent.hairStyle ?? []).map(norm));
  const hairStyle = userHairStyle ? userHairStyle : pickAvoiding(rng, hairStyles, avoidHairStyle);

  const userHairColor = extra.find((t) => CORE_HAIR_COLOR_TAGS.has(t));
  const hairColorTag = userHairColor
    ? `${userHairColor.includes("hair") ? userHairColor : userHairColor + " hair"}`
    : resolveHairColorTag(style, config.hairColor, rng);

  const userEyes = extra.find((t) => CORE_EYE_TAGS.has(t));
  const eyeColorTag = userEyes
    ? (userEyes === "heterochromia" ? "heterochromia, mismatching pupils" : userEyes)
    : resolveEyeColorTag(style, config.eyeColor, rng);

  const userExpr = extra.find((t) => CORE_EXPRESSION_TAGS.has(t));
  const avoidExpr = new Set((recent.expression ?? []).map(norm));
  const expression = userExpr ? userExpr : pickAvoiding(rng, pickOne(rng, [expressions.positive, expressions.neutral, expressions.moody]), avoidExpr);

  const selectedNSFW = selectNSFWTokens({
    safeMode: config.safeMode,
    style,
    theme,
    basePoseLabel: "",
  });

  let outfitPool = filterByTheme(outfits, theme).filter((o) => o.contextsAllowed.includes(scenario));
  if (theme === "fantasy") {
    outfitPool = banLabels(outfitPool, [/hoodie/i]);
  } else if (theme === "school_life") {
    outfitPool = prioritize(outfitPool, [/uniform/i]);
  } else if (theme === "cyberpunk") {
    outfitPool = prioritize(outfitPool, [/techwear/i]);
  }
  const avoidOutfit = new Set((recent.outfit ?? []).map(norm));
  let outfit = outfitPool.length ? pickAvoiding(rng, outfitPool, avoidOutfit, (x) => x.label) : pickAvoiding(rng, filterByTheme(outfits, theme), avoidOutfit, (x) => x.label);

  let layeredOuterwear: string | undefined;
  let layeredFootwear: string | undefined;
  let hasPocketsEffective = outfit.hasPockets;
  if (!outfit.contextsAllowed.includes(scenario)) {
    const owPool = outerwearItems.filter((ow) => ow.contextsAllowed.includes(scenario));
    const fwPool = footwearItems.filter((fw) => fw.contextsAllowed.includes(scenario));
    const selectedOw = owPool.length ? pickAvoiding(rng, owPool, undefined, (x) => x.label) : undefined;
    const selectedFw = fwPool.length ? pickAvoiding(rng, fwPool, undefined, (x) => x.label) : undefined;
    layeredOuterwear = selectedOw?.label;
    layeredFootwear = selectedFw?.label;
    hasPocketsEffective = hasPocketsEffective || !!selectedOw?.hasPockets;
  }

  const noPocketCoverage = new Set(["lingerie","negligee","bikini","sheer fabric","lace lingerie","silk robe"]);
  const nsfwCoverageLabels = selectedNSFW.filter((t) => t.category === "coverage").map((t) => t.label.toLowerCase());
  if (nsfwCoverageLabels.some((lbl) => noPocketCoverage.has(lbl))) {
    hasPocketsEffective = false;
  }

  const poseCandidates = poses.filter((p) => !p.requiresPockets || hasPocketsEffective);
  const avoidPose = new Set((recent.pose ?? []).map(norm));
  const pose = pickAvoiding(rng, poseCandidates, avoidPose, (x) => x.label);

  const accPool = accessories.filter((a) => {
    if (config.safeMode && a.nsfwSensitive) return false;
    if (pose.usesHandsInPocket && a.handOccupied) return false;
    if (a.contextsAllowed && !a.contextsAllowed.includes(scenario)) return false;
    if (a.allowedTimes && bg.timeOfDay && !a.allowedTimes.includes(bg.timeOfDay)) return false;
    return true;
  });
  const accCount = randomInt(rng, 1, 2);
  const recentAccSet = new Set((recent.accessories ?? []).map(norm));
  const accFiltered = accPool.filter((a) => !recentAccSet.has(norm(a.label)));
  const accPickPool = accFiltered.length >= accCount ? accFiltered : accPool;
  const acc = pickMany(rng, accPickPool, accCount);

  let tech = style === "photorealistic" ? pickOne(rng, photoTech) : pickOne(rng, renderTech);

  let { shotType, cameraAngle, lens } = pickCameraLogic(style, pose, rng);
  const shotOverride = matchShotOverride(extra.filter((t) => CAMERA_TAGS.has(t)));
  const angleOverride = matchAngleOverride(extra.filter((t) => CAMERA_TAGS.has(t)));
  if (shotOverride) shotType = shotOverride;
  if (angleOverride) cameraAngle = angleOverride;
  if (shotType && cameraAngle && lens) {
    tech = `${tech}, ${shotType}, ${cameraAngle}, ${lens}`;
  }

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
      speciesTags = "";
  }

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

  const identity = `1girl, solo${speciesTags ? ", " + speciesTags : ""}${hairColorTag ? ", " + hairColorTag : ""}${eyeColorTag ? ", " + eyeColorTag : ""}, ${body}, ${hairStyle}, ${expression}, ${pose.label}`;

  const fashionParts: string[] = [outfit.label];
  if (layeredOuterwear) fashionParts.push(layeredOuterwear);
  if (layeredFootwear) fashionParts.push(layeredFootwear);
  if (acc.length) fashionParts.push(...acc.map((a) => a.label));
  selectedNSFW.filter((t) => t.category === "coverage").forEach((t) => fashionParts.push(t.label));

  const coreUsed = new Set<string>([
    norm(body),
    norm(hairStyle),
    norm(hairColorTag),
    norm(eyeColorTag),
    norm(expression),
  ]);
  const extraClean = extra.filter((t) => !coreUsed.has(t));
  const userTagsStr = extraClean.length ? extraClean.join(", ") : "";

  const nsfwLocation = selectedNSFW.find((t) => t.category === "location")?.label;
  const nsfwLight = selectedNSFW.find((t) => t.category === "lighting")?.label;
  const scene = `${bg.label}${nsfwLocation ? ", " + nsfwLocation : ""}, ${lighting}${nsfwLight ? ", " + nsfwLight : ""}`;

  const nsfwIntent = selectedNSFW.find((t) => t.category === "intent")?.label;
  let positive = `${nsfwIntent ? nsfwIntent + ", " : ""}${quality}, ${identity}${userTagsStr ? ", " + userTagsStr : ""}, ${fashionParts.join(", ")}, ${scene}, ${tech}`;
  positive = sanitizePrompt(positive, [baseSpecies, ...modifiers]);

  let negative: string | undefined;
  const extraNegatives = negativesForLocks(userBodyTag);
  if (config.includeNegative) {
    if (model?.id === "pony-v6" && model.negativeDefault) {
      negative = model.negativeDefault;
    } else {
      const mediumForContext =
        style === "photorealistic" ? "photo" :
        style === "3d_render" ? "render" :
        undefined;
      const baseNeg = generateNegativePrompt(
        config.negativeIntensity,
        undefined,
        config.seed,
        { medium: mediumForContext as Medium | undefined, scenario }
      );
      // NEW: add theme-provided negative tags, weighted by intensity
      const themeNegExtras = (config.themeTags?.negative ?? []).map((n) => `(${n}:${config.negativeIntensity.toFixed(2)})`);
      const bodyLockExtras = extraNegatives.map((n) => `(${n}:${config.negativeIntensity.toFixed(2)})`);

      const extrasStr = [...bodyLockExtras, ...themeNegExtras].join(", ");
      if (extrasStr.length) {
        negative = `${baseNeg}, ${extrasStr}`;
      } else {
        negative = baseNeg;
      }
    }
  }

  return {
    positive,
    negative,
    seed: config.seed,
    selections: {
      scenario,
      quality,
      hair: hairColorTag,
      eyes: eyeColorTag,
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