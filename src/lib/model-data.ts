export type ModelPreset = {
  id: string;
  name: string;
  triggerPrefix?: string;
  negativeDefault?: string;
  filename: string; // The EXACT filename in ForgeUI models folder
};

export const models: ModelPreset[] = [
  {
    id: 'standard',
    name: 'Standard SDXL',
    filename: 'sd_xl_base_1.0.safetensors',
  },
  {
    id: 'pony-v6',
    name: 'Pony Diffusion V6 XL',
    triggerPrefix: 'score_9, score_8_up, score_7_up, score_6_up, source_anime',
    negativeDefault: 'score_1, score_2, score_3',
    filename: 'ponyDiffusionV6XL_v6StartWithThisOne.safetensors',
  }
];