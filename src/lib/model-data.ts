export type ModelPreset = {
  id: string;
  name: string;
  triggerPrefix?: string;
  negativeDefault?: string;
  filename: string; // The EXACT filename in ForgeUI models folder
  defaultStyle: string; // Auto-selected style for this model
  allowedStyles?: string[]; // Optional: restrict styles to this set
  defaultWidth?: number; // Optional default width
  defaultHeight?: number; // Optional default height
};

export const models: ModelPreset[] = [
  {
    id: 'standard',
    name: 'Standard SDXL',
    filename: 'sd_xl_base_1.0.safetensors',
    defaultStyle: 'photorealistic',
    allowedStyles: undefined,
    defaultWidth: 1024,
    defaultHeight: 1024,
  },
  {
    id: 'pony-v6',
    name: 'Pony Diffusion V6 XL',
    triggerPrefix: 'score_9, score_8_up, score_7_up, score_6_up, source_anime',
    negativeDefault: 'score_1, score_2, score_3',
    filename: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors',
    defaultStyle: 'anime',
    // mapped to our style keys
    allowedStyles: ['anime', 'digital_painting', '3d_render', 'pixel_art', 'comic_book'],
    defaultWidth: 832,
    defaultHeight: 1216,
  },
  {
    id: 'plant-milk',
    name: 'PlantMilk Walnut',
    filename: 'plantMilkModelSuite_walnut.safetensors',
    defaultStyle: 'anime',
    // requested: ['anime', 'digital-art', 'painting', 'sketch'] -> mapped
    allowedStyles: ['anime', 'digital_painting', 'oil_painting', 'line_art'],
    defaultWidth: 1080,
    defaultHeight: 1350,
  },
  {
    id: 'kokio-illu',
    name: 'Kokio Illu v20',
    filename: 'kokioIllu_v20.safetensors',
    defaultStyle: 'anime',
    // requested: ['anime', 'digital-art', 'comic-book'] -> mapped
    allowedStyles: ['anime', 'digital_painting', 'comic_book'],
    defaultWidth: 1080,
    defaultHeight: 1350,
  }
];