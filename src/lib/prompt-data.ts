export type Medium = "photo" | "render";

export type OutfitItem = {
  label: string;
  hasPockets: boolean;
};

export type PoseItem = {
  label: string;
  requiresPockets?: boolean;
  usesHandsInPocket?: boolean;
};

export type AccessoryItem = {
  label: string;
  handOccupied?: boolean; // requires holding in hand
  nsfwSensitive?: boolean;
};

export type BackgroundItem = {
  label: string;
  environment: "indoor" | "outdoor" | "studio";
  timeOfDay?: "day" | "night";
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
  { label: "shiny latex bodysuit, high collar, chains", hasPockets: false },
  { label: "distressed black denim jacket, torn fishnet tights, band t-shirt", hasPockets: true },
  { label: "plaid punk skirt, safety pins, leather combat boots, studded belt", hasPockets: false },
  { label: "gothic lolita dress, velvet texture, white lace trim", hasPockets: false },
  { label: "mesh top, see-through, black bra, leather mini skirt", hasPockets: false },
  { label: "vinyl pants, reflective fabric, cropped hoodie", hasPockets: true },
  { label: "black satin slip dress, smooth texture, lace hem", hasPockets: false },
  { label: "white cotton oversized shirt, no pants, comfy", hasPockets: false },
  { label: "silk pajamas, glossy fabric", hasPockets: false },
  { label: "sports bra, yoga pants, spandex, athleisure", hasPockets: true },
  { label: "knitted off-shoulder sweater, soft texture, collarbone", hasPockets: false },
  { label: "tight denim jeans, stone wash, white tank top", hasPockets: true },
  { label: "sundress, floral pattern, light cotton fabric", hasPockets: false },
  { label: "leather biker jacket, hoodie underneath, leggings", hasPockets: true },
];

export const poses: PoseItem[] = [
  { label: "sitting, legs crossed, looking at viewer" },
  { label: "selfie pose, peace sign, close up, dutch angle" },
  { label: "looking back over shoulder, dynamic angle" },
  { label: "squatting, knees to chest" },
  { label: "upper body, cowboy shot, arms crossed" },
  { label: "standing, hand on hip" },
  { label: "standing, hand in pocket, hip cocked", requiresPockets: true, usesHandsInPocket: true },
  { label: "walking, hands in pockets, looking away", requiresPockets: true, usesHandsInPocket: true },
  { label: "leaning against wall, hand in pocket", requiresPockets: true, usesHandsInPocket: true },
];

export const accessories: AccessoryItem[] = [
  { label: "choker with bell, collar" },
  { label: "black rimmed glasses" },
  { label: "sunglasses on head" },
  { label: "large headphones" },
  { label: "earbuds" },
  { label: "nose piercing, septum ring" },
  { label: "beanie, knitted cap" },
  { label: "backpack, tote bag" },
  { label: "holding smartphone", handOccupied: true },
  { label: "holding coffee cup", handOccupied: true },
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
  "sharp focus, highly detailed face, 8k render",
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