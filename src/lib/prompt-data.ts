export type Medium = "photo" | "render";

export type ScenarioKey =
  | "indoor_private"
  | "outdoor_public_day"
  | "outdoor_public_night"
  | "studio";

export type ThemeKey =
  | "any"
  | "modern"
  | "fantasy"
  | "scifi"
  | "cyberpunk"
  | "steampunk"
  | "post_apocalyptic"
  | "horror_gothic"
  | "noir"
  | "school_life";

export type OutfitItem = {
  label: string;
  hasPockets: boolean;
  contextsAllowed: ScenarioKey[];
  themes: ThemeKey[]; // supports multiple themes
};

export type PoseItem = {
  label: string;
  requiresPockets?: boolean;
  usesHandsInPocket?: boolean;
  publicFriendly?: boolean;
  forcedShotType?: string; // e.g. "cowboy shot", "full body"
};

export type AccessoryItem = {
  label: string;
  handOccupied?: boolean; // requires holding in hand
  nsfwSensitive?: boolean;
  contextsAllowed?: ScenarioKey[];
  allowedTimes?: ("day" | "night")[]; // optional time-of-day gating
};

export type BackgroundItem = {
  label: string;
  environment: "indoor" | "outdoor" | "studio";
  timeOfDay?: "day" | "night";
  themes: ThemeKey[]; // supports multiple themes
};

export type ExtraWearItem = {
  label: string;
  hasPockets: boolean;
  contextsAllowed: ScenarioKey[];
};

export type NSFWToken = {
  label: string;
  category: "intent" | "coverage" | "pose" | "location" | "lighting";
  intensity: "light" | "medium" | "strong";
  nsfw: true;
  group?: "intent" | "coverage" | "pose" | "location" | "lighting";
  conflictsWith?: string[]; // token labels that should not co-exist
  requiresOneOf?: string[]; // token labels/groups needed to make sense
  allowedStyles?: string[]; // optional style constraints
  disallowedStyles?: string[]; // optional style constraints
};

export const nsfwTokens: NSFWToken[] = [
  // Rating / Intent (guide model toward mature aesthetics without explicitness)
  { label: "sensual", category: "intent", intensity: "light", nsfw: true, group: "intent" },
  { label: "suggestive", category: "intent", intensity: "light", nsfw: true, group: "intent" },
  { label: "boudoir", category: "intent", intensity: "medium", nsfw: true, group: "intent" },
  { label: "risqué", category: "intent", intensity: "medium", nsfw: true, group: "intent" },
  { label: "provocative", category: "intent", intensity: "medium", nsfw: true, group: "intent" },
  { label: "mature", category: "intent", intensity: "medium", nsfw: true, group: "intent" },
  { label: "adult", category: "intent", intensity: "strong", nsfw: true, group: "intent" },
  { label: "18+", category: "intent", intensity: "strong", nsfw: true, group: "intent" },
  { label: "uncensored", category: "intent", intensity: "strong", nsfw: true, group: "intent" },

  // Wardrobe / Coverage (one per coverage group; conflicts defined)
  { label: "fully clothed", category: "coverage", intensity: "light", nsfw: true, group: "coverage", conflictsWith: ["lingerie", "bikini", "revealing outfit"] },
  { label: "modest wear", category: "coverage", intensity: "light", nsfw: true, group: "coverage", conflictsWith: ["lingerie", "bikini", "revealing outfit"] },
  { label: "revealing outfit", category: "coverage", intensity: "medium", nsfw: true, group: "coverage", conflictsWith: ["fully clothed", "modest wear"] },
  { label: "lingerie", category: "coverage", intensity: "strong", nsfw: true, group: "coverage", conflictsWith: ["fully clothed", "modest wear"] },
  { label: "bikini", category: "coverage", intensity: "strong", nsfw: true, group: "coverage", conflictsWith: ["fully clothed", "modest wear"] },
  { label: "sheer fabric", category: "coverage", intensity: "medium", nsfw: true, group: "coverage" },
  { label: "lace lingerie", category: "coverage", intensity: "strong", nsfw: true, group: "coverage" },
  { label: "stockings", category: "coverage", intensity: "medium", nsfw: true, group: "coverage" },
  { label: "garter belt", category: "coverage", intensity: "medium", nsfw: true, group: "coverage" },
  { label: "silk robe", category: "coverage", intensity: "light", nsfw: true, group: "coverage" },
  { label: "negligee", category: "coverage", intensity: "medium", nsfw: true, group: "coverage" },

  // Pose (one per pose group; enforce no sitting while walking)
  { label: "standing", category: "pose", intensity: "light", nsfw: true, group: "pose", conflictsWith: ["sitting", "walking", "lying", "kneeling"] },
  { label: "sitting", category: "pose", intensity: "light", nsfw: true, group: "pose", conflictsWith: ["standing", "walking", "lying", "kneeling"] },
  { label: "walking", category: "pose", intensity: "light", nsfw: true, group: "pose", conflictsWith: ["standing", "sitting", "lying", "kneeling"] },
  { label: "lying", category: "pose", intensity: "light", nsfw: true, group: "pose", conflictsWith: ["standing", "sitting", "walking", "kneeling"] },
  { label: "kneeling", category: "pose", intensity: "light", nsfw: true, group: "pose", conflictsWith: ["standing", "sitting", "walking", "lying"] },
  { label: "pin-up pose", category: "pose", intensity: "medium", nsfw: true, group: "pose" },

  // Location / Scene (one per location group; adjust for coverage)
  { label: "bedroom", category: "location", intensity: "medium", nsfw: true, group: "location" },
  { label: "boudoir", category: "location", intensity: "medium", nsfw: true, group: "location" },
  { label: "silk sheets", category: "location", intensity: "medium", nsfw: true, group: "location" },
  { label: "intimate setting", category: "location", intensity: "light", nsfw: true, group: "location" },

  // Lighting (one per lighting group)
  { label: "soft lighting", category: "lighting", intensity: "light", nsfw: true, group: "lighting" },
  { label: "warm rim light", category: "lighting", intensity: "light", nsfw: true, group: "lighting" },
  { label: "candlelight", category: "lighting", intensity: "medium", nsfw: true, group: "lighting" },
  { label: "soft focus", category: "lighting", intensity: "light", nsfw: true, group: "lighting" },
];

export const stylesList: string[] = [
  "photorealistic",
  "anime",
  "3d_render",
  "digital_painting",
  "oil_painting",
  "pixel_art",
  "comic_book",
  "line_art",
];

export const themesList: ThemeKey[] = [
  "any",
  "modern",
  "fantasy",
  "scifi",
  "cyberpunk",
  "steampunk",
  "post_apocalyptic",
  "horror_gothic",
  "noir",
  "school_life",
];

export const speciesList: string[] = [
  "human",
  "elf",
  "dark elf",
  "demon",
  "angel",
  "android",
  "cyborg",
  "vampire",
  "kitsune",
  "catgirl",
  "orc",
];

export const qualityTags: string[] = [
  "(masterpiece), (best quality), (highly detailed), 8k",
  "(absurdres, highres:1.2), super detailed, intricate details",
  "score_9, score_8_up, perfect anatomy, (sharp focus:1.1)",
];

export const hairStyles: string[] = [
  "messy bun, loose strands",
  "multicolored hair, dyed tips, streaks",
  "asymmetrical bob cut",
  "long wavy hair, side swept",
  "twin tails, ribbon",
  "undercut, pixie cut, edgy hair",
];

// ADDED: Simple hair color options
export const hairColors: string[] = [
  "Random",
  "Blonde",
  "Brown",
  "Black",
  "Red",
  "White",
  "Silver",
  "Pink",
  "Blue",
  "Purple",
  "Green",
  "Multicolor",
];

// REPLACED: eyeColors with requested simple list
export const eyeColors: string[] = [
  "Random",
  "Blue",
  "Green",
  "Brown",
  "Red",
  "Purple",
  "Yellow",
  "Amber",
  "Grey",
  "Heterochromia",
];

export const bodyTypes: string[] = [
  "slender body",
  "curvy body, thick thighs",
  "athletic build, toned",
  "petite figure",
  "average build",
];

export const expressions: Record<string, string[]> = {
  positive: ["soft smile", "happy", "laughing", "playful smirk", "gentle expression"],
  neutral: ["neutral expression", "calm", "focused", "looking at viewer"],
  moody: ["serious face", "melancholic", "cold gaze", "distant look", "parted lips"],
};

export const shotTypes: string[] = ["close-up", "portrait", "upper body", "cowboy shot", "full body", "wide shot"];

export const cameraAngles: string[] = ["eye level", "from below", "from above", "dutch angle", "dynamic angle"];

// Outfits now support multiple themes
export const outfits: OutfitItem[] = [
  { label: "plate armor", hasPockets: false, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "studio"], themes: ["fantasy"] },
  { label: "hoodie and jeans", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"], themes: ["modern", "cyberpunk"] },
  { label: "techwear jacket, straps and pockets", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "studio"], themes: ["cyberpunk", "scifi"] },
  { label: "school uniform, blazer and pleated skirt", hasPockets: false, contextsAllowed: ["outdoor_public_day", "indoor_private", "studio"], themes: ["school_life"] },
  { label: "suit and tie", hasPockets: true, contextsAllowed: ["indoor_private", "studio", "outdoor_public_night"], themes: ["modern", "noir"] },
  { label: "victorian dress, lace corset", hasPockets: false, contextsAllowed: ["indoor_private", "studio"], themes: ["steampunk", "horror_gothic"] },
  { label: "post-apocalyptic rags, utility belt", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "studio"], themes: ["post_apocalyptic"] },
  { label: "spacesuit, hard-shell armor", hasPockets: false, contextsAllowed: ["studio"], themes: ["scifi"] },
  { label: "gothic lolita dress, velvet texture, white lace trim", hasPockets: false, contextsAllowed: ["studio", "indoor_private", "outdoor_public_night"], themes: ["horror_gothic", "modern"] },
  { label: "leather biker jacket, hoodie underneath, leggings", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"], themes: ["modern", "cyberpunk"] },
  { label: "sundress, floral pattern, light cotton fabric", hasPockets: false, contextsAllowed: ["outdoor_public_day", "indoor_private", "studio"], themes: ["modern"] },
  { label: "tight denim jeans, stone wash, white tank top", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"], themes: ["modern"] },
  { label: "black satin slip dress, smooth texture, lace hem", hasPockets: false, contextsAllowed: ["studio", "indoor_private"], themes: ["modern"] },
  { label: "vinyl pants, reflective fabric, cropped hoodie", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"], themes: ["modern", "cyberpunk"] },
];

export const poses: PoseItem[] = [
  { label: "sitting, legs crossed, looking at viewer", publicFriendly: true, forcedShotType: "full body" },
  { label: "selfie pose, peace sign, close up, dutch angle", publicFriendly: true, forcedShotType: "close-up" },
  { label: "looking back over shoulder, dynamic angle", publicFriendly: true },
  { label: "squatting, knees to chest", forcedShotType: "full body" },
  { label: "upper body, cowboy shot, arms crossed", publicFriendly: true, forcedShotType: "cowboy shot" },
  { label: "standing, hand on hip", publicFriendly: true, forcedShotType: "full body" },
  { label: "standing, hand in pocket, hip cocked", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true, forcedShotType: "full body" },
  { label: "walking, hands in pockets, looking away", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true, forcedShotType: "full body" },
  { label: "leaning against wall, hand in pocket", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true, forcedShotType: "cowboy shot" },
];

export const accessories: AccessoryItem[] = [
  { label: "choker with bell, collar", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "black rimmed glasses", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "sunglasses on head", contextsAllowed: ["outdoor_public_day"], allowedTimes: ["day"] },
  { label: "large headphones", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "earbuds", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "nose piercing, septum ring", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "beanie, knitted cap", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "backpack, tote bag", contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "holding smartphone", handOccupied: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "holding coffee cup", handOccupied: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
];

export const outerwearItems: ExtraWearItem[] = [
  { label: "denim jacket", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "oversized hoodie", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "long trench coat", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
];

export const footwearItems: ExtraWearItem[] = [
  { label: "white sneakers", hasPockets: false, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "leather boots", hasPockets: false, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "black flats", hasPockets: false, contextsAllowed: ["outdoor_public_day", "indoor_private", "studio"] },
  { label: "stiletto heels", hasPockets: false, contextsAllowed: ["outdoor_public_night", "indoor_private", "studio"] },
];

// Backgrounds now support multiple themes
export const backgrounds: BackgroundItem[] = [
  { label: "messy bedroom, unmade bed, indoors, clutter", environment: "indoor", themes: ["modern"] },
  { label: "luxury hotel room, dim lighting", environment: "indoor", themes: ["modern"] },
  { label: "minimalist living room, sofa", environment: "indoor", themes: ["modern"] },
  { label: "neon lit city street, bokeh lights, rain", environment: "outdoor", timeOfDay: "night", themes: ["cyberpunk"] },
  { label: "dark alleyway, wet ground, reflections", environment: "outdoor", timeOfDay: "night", themes: ["modern", "noir", "cyberpunk"] },
  { label: "rooftop at night, city skyline, skyscrapers", environment: "outdoor", timeOfDay: "night", themes: ["modern", "noir"] },
  { label: "coffee shop window, daylight, sunny", environment: "outdoor", timeOfDay: "day", themes: ["modern"] },
  { label: "park bench, greenery, soft sunlight", environment: "outdoor", timeOfDay: "day", themes: ["modern"] },
  { label: "busy street, crowd blur, daylight, skyscrapers", environment: "outdoor", timeOfDay: "day", themes: ["modern"] },
  { label: "classroom, desks and chalkboard", environment: "indoor", themes: ["school_life"] },
  { label: "gothic castle hall, candles", environment: "indoor", themes: ["horror_gothic", "fantasy"] },
  { label: "victorian workshop, brass and gears", environment: "indoor", themes: ["steampunk"] },
  { label: "wasteland ruins, broken buildings", environment: "outdoor", timeOfDay: "day", themes: ["post_apocalyptic"] },
  { label: "space station corridor, metallic walls", environment: "indoor", themes: ["scifi"] },
  { label: "simple background, white background, studio", environment: "studio", themes: ["any"] },
  { label: "dark gradient background, abstract", environment: "studio", themes: ["any"] },
  { label: "professional studio, rim lighting", environment: "studio", themes: ["any"] },
];

export const lightingByContext: Record<string, string[]> = {
  indoor: ["soft indoor lighting", "dim moody lighting", "lamp light"],
  "outdoor-day": ["natural sunlight", "soft shadows", "warm daylight"],
  "outdoor-night": ["neon lighting, cyan and magenta", "cinematic street lighting", "dramatic shadows"],
  studio: ["studio lighting", "flash photography", "hard rim lighting"],
};

export const photoTech: string[] = [
  "depth of field, f/1.8, bokeh",
  "chromatic aberration, film grain, ISO 800",
  "sharp focus, highly detailed face",
  "polaroid style, vintage filter",
];

export const renderTech: string[] = [
  "ray tracing, photorealistic render",
  "Unreal Engine, high fidelity, global illumination",
  "physically based rendering, subsurface scattering",
];

export const negativesBase: string[] = [
  "low quality",
  "worst quality",
  "normal quality",
  "lowres",
  "jpeg artifacts",
  "blurry",
  "noisy",
  "grainy",
  "bad anatomy",
  "bad proportions",
  "malformed limbs",
  "disfigured",
  "deformed",
  "extra limbs",
  "extra fingers",
  "missing fingers",
  "fused fingers",
  "bad hands",
  "long neck",
  "duplicate",
  "cropped",
  "tilted horizon",
  "overexposed",
  "underexposed",
  "oversaturated",
  "undersaturated",
  "watermark",
  "signature",
  "text",
  "text artifacts",
];