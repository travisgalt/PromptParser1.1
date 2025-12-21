export type Medium = "photo" | "render";

export type ScenarioKey =
  | "indoor_private"
  | "outdoor_public_day"
  | "outdoor_public_night"
  | "studio";

export type OutfitItem = {
  label: string;
  hasPockets: boolean;
  contextsAllowed: ScenarioKey[];
};

export type PoseItem = {
  label: string;
  requiresPockets?: boolean;
  usesHandsInPocket?: boolean;
  publicFriendly?: boolean;
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
};

export type ExtraWearItem = {
  label: string;
  hasPockets: boolean;
  contextsAllowed: ScenarioKey[];
};

export const qualityTags: string[] = [
  "(masterpiece, best quality:1.2), aesthetic, 8k, raw photo",
  "(absurdres, highres:1.2), super detailed, intricate details",
  "score_9, score_8_up, source_anime, perfect anatomy, (sharp focus:1.1)",
];

export const hairStyles: string[] = [
  "messy bun, loose strands",
  "multicolored hair, dyed tips, streaks",
  "asymmetrical bob cut",
  "long wavy hair, side swept",
  "twin tails, ribbon",
  "undercut, pixie cut, edgy hair",
];

export const eyeColors: string[] = [
  "red eyes, heavy eyeliner",
  "ice blue eyes, glossy eyes",
  "emerald green eyes, eyeshadow",
  "golden eyes, sharp gaze",
];

export const outfits: OutfitItem[] = [
  { label: "shiny latex bodysuit, high collar, chains", hasPockets: false, contextsAllowed: ["studio", "indoor_private"] },
  { label: "distressed black denim jacket, torn fishnet tights, band t-shirt", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "plaid punk skirt, safety pins, leather combat boots, studded belt", hasPockets: false, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "gothic lolita dress, velvet texture, white lace trim", hasPockets: false, contextsAllowed: ["studio", "indoor_private", "outdoor_public_night"] },
  { label: "mesh top, see-through, black bra, leather mini skirt", hasPockets: false, contextsAllowed: ["studio", "indoor_private"] },
  { label: "vinyl pants, reflective fabric, cropped hoodie", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "black satin slip dress, smooth texture, lace hem", hasPockets: false, contextsAllowed: ["studio", "indoor_private"] },
  { label: "white cotton oversized shirt, no pants, comfy", hasPockets: false, contextsAllowed: ["indoor_private"] },
  { label: "silk pajamas, glossy fabric", hasPockets: false, contextsAllowed: ["indoor_private"] },
  { label: "sports bra, yoga pants, spandex, athleisure", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "knitted off-shoulder sweater, soft texture, collarbone", hasPockets: false, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "tight denim jeans, stone wash, white tank top", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
  { label: "sundress, floral pattern, light cotton fabric", hasPockets: false, contextsAllowed: ["outdoor_public_day", "indoor_private", "studio"] },
  { label: "leather biker jacket, hoodie underneath, leggings", hasPockets: true, contextsAllowed: ["outdoor_public_day", "outdoor_public_night", "indoor_private", "studio"] },
];

export const poses: PoseItem[] = [
  { label: "sitting, legs crossed, looking at viewer", publicFriendly: true },
  { label: "selfie pose, peace sign, close up, dutch angle", publicFriendly: true },
  { label: "looking back over shoulder, dynamic angle", publicFriendly: true },
  { label: "squatting, knees to chest" },
  { label: "upper body, cowboy shot, arms crossed", publicFriendly: true },
  { label: "standing, hand on hip", publicFriendly: true },
  { label: "standing, hand in pocket, hip cocked", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true },
  { label: "walking, hands in pockets, looking away", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true },
  { label: "leaning against wall, hand in pocket", requiresPockets: true, usesHandsInPocket: true, publicFriendly: true },
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

export const backgrounds: BackgroundItem[] = [
  { label: "messy bedroom, unmade bed, indoors, clutter", environment: "indoor" },
  { label: "luxury hotel room, dim lighting", environment: "indoor" },
  { label: "minimalist living room, sofa", environment: "indoor" },
  { label: "neon lit city street, bokeh city lights, cyberpunk vibe", environment: "outdoor", timeOfDay: "night" },
  { label: "dark alleyway, wet ground, reflections", environment: "outdoor", timeOfDay: "night" },
  { label: "rooftop at night, city skyline", environment: "outdoor", timeOfDay: "night" },
  { label: "coffee shop window, daylight, sunny", environment: "outdoor", timeOfDay: "day" },
  { label: "park bench, greenery, soft sunlight", environment: "outdoor", timeOfDay: "day" },
  { label: "busy street, crowd blur, daylight", environment: "outdoor", timeOfDay: "day" },
  { label: "simple background, white background, studio", environment: "studio" },
  { label: "dark gradient background, abstract", environment: "studio" },
  { label: "professional studio, rim lighting", environment: "studio" },
];

export const lightingByContext: Record<string, string[]> = {
  "indoor": ["soft indoor lighting", "dim moody lighting", "lamp light"],
  "outdoor-day": ["natural sunlight", "soft shadows", "warm daylight"],
  "outdoor-night": ["neon lighting, cyan and magenta", "cinematic street lighting", "dramatic shadows"],
  "studio": ["studio lighting", "flash photography", "hard rim lighting"],
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
  "jpeg artifacts",
  "bad anatomy",
  "extra limbs",
  "overexposure",
  "watermark",
  "text artifacts",
];