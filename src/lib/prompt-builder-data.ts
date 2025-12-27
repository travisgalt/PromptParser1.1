export type PromptCategoryDef = {
  name: string;
  tags: string[];
};

export const defaultCategories: PromptCategoryDef[] = [
  // --- PRIORITY 1: QUALITY ---
  {
    name: "Quality Boosters",
    tags: [
      "masterpiece", "best quality", "absurdres", "8k", "highly detailed", "sharp focus", "HDR", "intricate details", "hyperdetailed", "perfect anatomy", "distinct features",
      "photorealistic", "hyperrealistic", "sfumato", "tenebrism", "impasto", "fine art", "cinematic composition", "rule of thirds", "golden ratio"
    ]
  },

  // --- PRIORITY 2: SUBJECT CORE ---
  {
    name: "Species & Race",
    tags: ["human", "elf", "dark elf", "half-elf", "demon", "succubus", "angel", "android", "cyborg", "mecha musume", "vampire", "kitsune", "catgirl", "wolf girl", "rabbit girl", "dragon girl", "orc", "goblin", "fairy", "ghost"]
  },
  {
    name: "Body Type",
    tags: ["athletic", "muscular", "toned", "curvy", "voluptuous", "plump", "thick thighs", "petite", "slender", "lanky", "tall", "short", "giantess", "chibi"]
  },
  {
    name: "Skin & Details",
    tags: ["pale skin", "fair skin", "tan skin", "dark skin", "brown skin", "freckles", "scars", "facial mark", "beauty mark", "mole under eye", "tattoos", "tribal tattoos", "bioluminescent skin", "glistening skin", "oiled skin", "sweaty", "blush", "stickers on face", "bandaid on nose"]
  },

  // --- PRIORITY 3: APPEARANCE ---
  {
    name: "Hair Style",
    tags: ["long hair", "very long hair", "short hair", "medium hair", "bob cut", "pixie cut", "hime cut", "blunt bangs", "ponytail", "high ponytail", "side ponytail", "twintails", "low twintails", "braids", "french braid", "crown braid", "messy hair", "wavy hair", "curly hair", "drill hair", "ahoge", "hair bun", "double bun", "hair over one eye", "bald"]
  },
  {
    name: "Hair Color",
    tags: ["blonde", "platinum blonde", "black hair", "brown hair", "light brown hair", "red hair", "ginger hair", "white hair", "silver hair", "grey hair", "pastel pink hair", "blue hair", "purple hair", "green hair", "multicolored hair", "two-tone hair", "gradient hair", "streaked hair"]
  },
  {
    name: "Eyes",
    tags: ["blue eyes", "red eyes", "green eyes", "amber eyes", "purple eyes", "yellow eyes", "pink eyes", "heterochromia", "glowing eyes", "tsurime", "tareme", "sanpaku", "heart-shaped pupils", "star-shaped pupils", "slit pupils", "no pupils", "closed eyes", "wink"]
  },
  {
    name: "Expression",
    tags: ["smiling", "grin", "smug", "laughing", "embarrassed", "angry", "frowning", "pout", "expressionless", "yandere", "crazy", "ahegao", "blushing", "crying", "tearing up", "surprised", "scared", "nervous", "parted lips", "tongue out"]
  },

  // --- PRIORITY 4: APPAREL ---
  // 1. NEW CATEGORY: Full Body Outfits (Dresses, Robes, One-Piece Swimsuits)
  {
    name: "Outfit - Full Body / Dresses",
    tags: [
      "sundress", "summer dress", "evening gown", "cocktail dress", "wedding dress", "strapless dress", "off-shoulder dress", "halter dress", "backless dress", "sweater dress", "slip dress", "china dress", "cheongsam", "dirndl", "gothic lolita dress", "maid dress", "nurse uniform", "nun habit",
      "one-piece swimsuit", "school swimsuit", "competitive swimsuit", "sling swimsuit", "monokini", "bodysuit", "leotard", "plugsuit", "wetsuit", "latex suit"
    ]
  },

  // 2. UPDATE: Outfit - Top (Add Bikini Tops)
  {
    name: "Outfit - Top",
    tags: ["bikini top", "micro bikini top", "bandeau", "triangle bikini", "halter top", "hoodie", "oversized hoodie", "t-shirt", "graphic tee", "crop top", "tube top", "sweater", "turtle neck", "tank top", "camisole", "dress shirt", "blouse", "corset", "sports bra", "armored plate", "kimono", "yukata", "school uniform", "serafuku", "blazer", "leather jacket", "denim jacket", "coat", "lab coat"]
  },

  // 3. UPDATE: Outfit - Bottom (Add Bikini Bottoms & Skirts)
  {
    name: "Outfit - Bottom",
    tags: ["bikini bottom", "side-tie bikini bottom", "micro bikini bottom", "sarong", "pareo", "jeans", "skinny jeans", "ripped jeans", "pleated skirt", "miniskirt", "pencil skirt", "long skirt", "bubble skirt", "leggings", "yoga pants", "shorts", "dolphin shorts", "cargo pants", "track pants", "sweatpants", "panties", "thong", "no pants"]
  },
  {
    name: "Legwear & Footwear",
    tags: ["thighhighs", "kneehighs", "pantyhose", "fishnets", "white socks", "black socks", "bobby socks", "loose socks", "sneakers", "high heels", "boots", "combat boots", "knee boots", "loafers", "barefoot"]
  },
  {
    name: "Accessories",
    tags: ["glasses", "sunglasses", "monocle", "goggles", "eyepatch", "choker", "collar", "necklace", "pendant", "earrings", "piercings", "navel piercing", "cat ears", "animal ears", "halo", "horns", "demon horns", "mechanical wings", "angel wings", "bat wings", "headphones", "jewelry", "mask", "gas mask", "fox mask", "ribbon", "hair flower", "hair ornament", "hat", "cap", "beret", "beanie", "witch hat"]
  },

  // --- PRIORITY 5: POSE & CAMERA ---
  {
    name: "Pose (Mutually Exclusive)",
    tags: [
      "standing", "sitting", "squatting", "kneeling", "lying down", "on stomach", "on back", "running", "walking", "jumping", "flying", "floating", "fighting stance", "reaching out", "arms crossed", "hands on hips", "peace sign", "selfie pose", "looking back", "looking over shoulder",
      "contrapposto", "dynamic pose", "action pose", "foreshortening", "gesture drawing pose", "relaxed pose", "tension"
    ]
  },
  {
    name: "Camera & Framing",
    tags: [
      "cowboy shot", "upper body", "full body", "close-up", "portrait", "face focus", "dutch angle", "from below", "from above", "overhead shot", "wide angle", "fisheye", "depth of field", "bokeh",
      "foreshortening", "shallow depth of field", "negative space", "leading lines", "low angle shot", "high angle shot", "dutch tilt"
    ]
  },

  // --- PRIORITY 6: ENVIRONMENT ---
  {
    name: "Location - Detailed",
    tags: ["cyberpunk city", "neon city", "fantasy forest", "enchanted forest", "bedroom", "messy bedroom", "cafe", "classroom", "ruins", "castle", "beach", "ocean", "outer space", "spaceship", "dungeon", "library", "street corner", "alleyway", "rooftop", "bar", "nightclub", "onsen", "simple background"]
  },
  {
    name: "Background - Simple",
    tags: ["white background", "black background", "grey background", "solid color", "two-tone background", "gradient background", "abstract background", "geometric pattern", "polka dots", "speed lines"]
  },
  {
    name: "Lighting",
    tags: [
      "cinematic lighting", "natural light", "volumetric lighting", "neon lights", "rim lighting", "backlighting", "sunset", "golden hour", "dark and moody", "god rays", "studio lighting", "soft lighting", "hard shadows", "bioluminescent light",
      "chiaroscuro", "Rembrandt lighting", "butterfly lighting", "split lighting", "harsh shadows", "dramatic contrast", "silhouette", "bioluminescent"
    ]
  }
];