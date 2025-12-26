export type ModelPreset = {
  id: string;
  name: string;
  triggerPrefix?: string;
  negativeDefault?: string;
  filename: string; // The EXACT filename in ForgeUI models folder
  defaultStyle: string; // Auto-selected style for this model
  allowedStyles?: string[]; // Optional: restrict styles to this set
};

export const models: ModelPreset[] = [
  {
    id: 'standard',
    name: 'Standard SDXL',
    filename: 'sd_xl_base_1.0.safetensors',
    defaultStyle: 'photorealistic',
    allowedStyles: undefined,
  },
  {
    id: 'pony-v6',
    name: 'Pony Diffusion V6 XL',
    triggerPrefix: 'score_9, score_8_up, score_7_up, score_6_up, source_anime',
    negativeDefault: 'score_1, score_2, score_3',
    filename: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors',
    defaultStyle: 'anime',
    // Allow anime-centric styles only; mapped to existing stylesList keys
    allowedStyles: ['anime', 'digital_painting', '3d_render', 'pixel_art', 'comic_book'],
  }
];