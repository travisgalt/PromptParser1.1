export type MediumType = "photo" | "render";
export type BackgroundType = "indoor_private" | "outdoor_night" | "outdoor_day" | "studio";

export interface QualityTag {
  label: string;
  medium: MediumType;
  weight?: number;
}

export interface HairStyle {
  label: string;
}

export interface EyeColor {
  label: string;
}

export interface Pose {
  label: string;
  requiresPockets?: boolean;
}

export interface Outfit {
  label: string;
  hasPockets: boolean;
  pack: "goth" | "lounge" | "casual";
}

export interface Accessory {
  label: string;
  handOccupied?: boolean;
  nsfwSensitive?: boolean;
}

export interface Background {
  label: string;
  type: BackgroundType;
}

export const qualityTags: QualityTag[] = [
  { label: "(masterpiece, best quality:1.2), aesthetic, 8k, raw photo", medium: "photo", weight: 1.2 },
  { label: "(absurdres, highres:1.2), super detailed, intricate details", medium: "render", weight: 1.0 },
  { label: "score_9, score_8_up, source_anime, perfect anatomy, (sharp focus:1.1)", medium: "render", weight: 1.0 },
];

export const hairStyles: HairStyle[] = [
  { label: "messy bun, loose strands" },
  { label: "multicolored hair, dyed tips, streaks" },
  { label: "asymmetrical bob cut" },
  { label: "long wavy hair, side swept" },
  { label: "twin tails, ribbon" },
  { label: "undercut, pixie cut, edgy hair" },
];

export const eyeColors: EyeColor[] = [
  { label: "red eyes, heavy eyeliner" },
  { label: "ice blue eyes, glossy eyes" },
  { label: "emerald green eyes, eyeshadow" },
  { label: "golden eyes, sharp gaze" },
];

export const posesSafe: Pose[] = [
  { label: "sitting, legs crossed, looking at viewer" },
  { label: "selfie pose, peace sign, close up, dutch angle" },
  { label: "looking back over shoulder, dynamic angle" },
  { label: "squatting, knees to chest" },
  { label: "upper body, cowboy shot, arms crossed" },
  { label: "standing, hand on hip" },
];

export const posesPockets: Pose[] = [
  { label: "standing, hand in pocket, hip cocked", requiresPockets: true },
  { label: "walking, hands in pockets, looking away", requiresPockets: true },
  { label: "leaning against wall, hand in pocket", requiresPockets: true },
];

export const outfits: Outfit[] = [
  { label: "shiny latex bodysuit, high collar, chains", hasPockets: false, pack: "goth" },
  { label: "distressed black denim jacket, torn fishnet tights, band t-shirt", hasPockets: true, pack: "goth" },
  { label: "plaid punk skirt, safety pins, leather combat boots, studded belt", hasPockets: false, pack: "goth" },
  { label: "gothic lolita dress, velvet texture, white lace trim", hasPockets: false, pack: "goth" },
  { label: "mesh top, see-through, black bra, leather mini skirt", hasPockets: false, pack: "goth" },
  { label: "vinyl pants, reflective fabric, cropped hoodie", hasPockets: true, pack: "goth" },

  { label: "black satin slip dress, smooth texture, lace hem", hasPockets: false, pack: "lounge" },
  { label: "sheer babydoll, translucent fabric, thighhighs", hasPockets: false, pack: "lounge" },
  { label: "white cotton oversized shirt, no pants, comfy", hasPockets: false, pack: "lounge" },
  { label: "silk pajamas, unbuttoned, glossy fabric", hasPockets: false, pack: "lounge" },
  { label: "latex lingerie, strappy, garter belt, stockings", hasPockets: false, pack: "lounge" },
  { label: "sports bra, yoga pants, spandex, athleisure", hasPockets: true, pack: "lounge" },

  { label: "knitted off-shoulder sweater, soft texture, collarbone", hasPockets: false, pack: "casual" },
  { label: "tight denim jeans, stone wash, white tank top", hasPockets: true, pack: "casual" },
  { label: "sundress, floral pattern, light cotton fabric", hasPockets: false, pack: "casual" },
  { label: "leather biker jacket, hoodie underneath, leggings", hasPockets: true, pack: "casual" },
];

export const accessoriesNeutral: Accessory[] = [
  { label: "choker with bell, collar" },
  { label: "black rimmed glasses" },
  { label: "sunglasses on head" },
  { label: "large headphones" },
  { label: "earbuds" },
  { label: "nose piercing, septum ring" },
  { label: "beanie, knitted cap" },
  { label: "backpack, tote bag" },
];

export const accessoriesHand: Accessory[] = [
  { label: "holding smartphone, coffee cup", handOccupied: true },
];

export const backgrounds: Background[] = [
  { label: "messy bedroom, unmade bed, indoors, clutter", type: "indoor_private" },
  { label: "luxury hotel room, dim lighting", type: "indoor_private" },
  { label: "minimalist living room, sofa", type: "indoor_private" },

  { label: "neon lit city street, night, bokeh city lights, cyberpunk vibe", type: "outdoor_night" },
  { label: "dark alleyway, wet ground, reflections", type: "outdoor_night" },
  { label: "rooftop at night, city skyline", type: "outdoor_night" },

  { label: "coffee shop window, daylight, sunny", type: "outdoor_day" },
  { label: "park bench, greenery, soft sunlight", type: "outdoor_day" },
  { label: "busy street, crowd blur, daylight", type: "outdoor_day" },

  { label: "simple background, white background, studio", type: "studio" },
  { label: "dark gradient background, abstract", type: "studio" },
  { label: "professional studio, rim lighting", type: "studio" },
];

export const lightingMap: Record<BackgroundType, string[]> = {
  indoor_private: ["soft indoor lighting", "dim moody lighting", "lamp light"],
  outdoor_night: ["neon lighting, cyan and magenta", "cinematic street lighting", "dramatic shadows"],
  outdoor_day: ["natural sunlight", "soft shadows", "warm daylight"],
  studio: ["studio lighting", "flash photography", "hard rim lighting"],
};

export const techPhoto: string[] = [
  "depth of field, f/1.8, bokeh",
  "film grain, iso 800",
  "sharp focus, highly detailed face",
  "polaroid style, vintage filter",
];

export const techRender: string[] = [
  "unreal engine 5, ray tracing, photorealistic",
  "physically based rendering, detailed materials",
  "global illumination, subsurface scattering",
];

export const negativeBase: string[] = [
  "low quality",
  "blurry",
  "bad anatomy",
  "extra fingers",
  "poorly drawn face",
  "watermark",
  "jpeg artifacts",
  "overexposed",
  "lowres",
];

export const styleBackgroundBias: Record<Outfit["pack"], BackgroundType[]> = {
  lounge: ["indoor_private", "studio"],
  goth: ["outdoor_night", "studio", "indoor_private"],
  casual: ["outdoor_day", "indoor_private", "studio"],
};