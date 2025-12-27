export type PromptCategoryDef = {
  name: string;
  tags: string[];
};

export const defaultCategories: PromptCategoryDef[] = [
  // ADDED: SPECIES & RACE (first category)
  {
    name: "Species & Race",
    tags: ["Human", "Elf", "Dark Elf", "Demon", "Angel", "Android", "Cyborg", "Vampire", "Kitsune", "Catgirl", "Orc"]
  },

  // --- CHARACTER CORE ---
  {
    name: "Body Type",
    tags: ["athletic", "curvy", "petite", "muscular", "slender", "voluptuous", "tall", "chibi"]
  },
  {
    name: "Skin & Details",
    tags: ["pale skin", "tan skin", "dark skin", "freckles", "scars", "tattoos", "makeup", "glistening skin", "oiled skin", "blush"]
  },
  {
    name: "Hair Style",
    tags: ["long hair", "short hair", "bob cut", "pixie cut", "ponytail", "twintails", "messy hair", "braids", "wavy hair", "drills", "ahoge"]
  },
  {
    name: "Hair Color",
    tags: ["blonde", "black hair", "brown hair", "red hair", "white hair", "silver hair", "pink hair", "blue hair", "purple hair", "green hair", "multicolored hair", "gradient hair"]
  },
  {
    name: "Eyes",
    tags: ["blue eyes", "green eyes", "brown eyes", "red eyes", "purple eyes", "yellow eyes", "amber eyes", "grey eyes", "heterochromia", "glowing eyes", "tsurime", "tareme", "closed eyes"]
  },
  {
    name: "Expression",
    tags: ["smiling", "smug", "embarrassed", "angry", "expressionless", "yandere", "blushing", "crying", "surprised", "parted lips"]
  },

  // --- APPAREL ---
  {
    name: "Outfit - Top",
    tags: ["hoodie", "t-shirt", "oversized shirt", "crop top", "sweater", "tank top", "armored plate", "kimono", "school uniform", "leather jacket"]
  },
  {
    name: "Outfit - Bottom",
    tags: ["jeans", "pleated skirt", "pencil skirt", "leggings", "shorts", "yoga pants", "cargo pants", "thighhighs", "pantyhose"]
  },
  {
    name: "Accessories",
    tags: ["glasses", "sunglasses", "choker", "cat ears", "halo", "horns", "mechanical wings", "headphones", "jewelry", "mask"]
  },

  // --- BACKGROUNDS & ENVIRONMENT ---
  {
    name: "Background - Simple & Abstract",
    tags: ["simple background", "white background", "black background", "solid color", "two-tone background", "gradient background", "abstract background", "geometric pattern", "polka dots", "blurred background", "bokeh", "minimalist"]
  },
  {
    name: "Location - Detailed",
    tags: ["cyberpunk city", "fantasy forest", "bedroom", "cafe", "classroom", "ruins", "beach", "outer space", "dungeon", "library", "street corner"]
  },
  {
    name: "Lighting",
    tags: ["cinematic lighting", "natural light", "volumetric lighting", "neon lights", "rim lighting", "sunset", "golden hour", "dark and moody", "god rays", "studio lighting", "soft lighting"]
  },

  // --- STYLE & QUALITY ---
  {
    name: "Camera & Framing",
    tags: ["cowboy shot", "upper body", "full body", "close-up", "portrait", "dutch angle", "from below", "from above", "wide angle", "fisheye"]
  },
  {
    name: "Art Style",
    tags: ["anime", "realistic", "semi-realistic", "oil painting", "sketch", "lineart", "cel shaded", "digital art", "pixel art", "watercolor", "flat color"]
  },
  {
    name: "Quality Boosters",
    tags: ["masterpiece", "best quality", "highres", "8k", "highly detailed", "sharp focus", "HDR", "absurdres"]
  }
];