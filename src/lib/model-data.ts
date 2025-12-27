export type ModelPreset = {
  id: string;
  name: string;
  triggerPrefix?: string;
  negativeDefault?: string;
  filename: string;
  defaultStyle: string;
  allowedStyles?: string[];
  defaultWidth?: number;
  defaultHeight?: number;
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
    // Expanded anime-compatible styles
    allowedStyles: [
      'anime','manga','manhwa','cel_shaded','line_art',
      'digital_painting','oil_painting','watercolor','ink_wash','gouache','pastel','pencil_sketch',
      'pixel_art','voxel_art','vector_art','flat_design',
      '3d_render','unreal_engine_5','comic_book'
    ],
    defaultWidth: 832,
    defaultHeight: 1216,
  },
  {
    id: 'plant-milk',
    name: 'PlantMilk Walnut',
    filename: 'plantMilkModelSuite_walnut.safetensors',
    defaultStyle: 'anime',
    // Expanded anime-friendly set
    allowedStyles: [
      'anime','manga','manhwa','cel_shaded','line_art',
      'digital_painting','oil_painting','watercolor','ink_wash','gouache','pastel','pencil_sketch',
      'pixel_art','voxel_art','vector_art','flat_design',
      'comic_book','3d_render'
    ],
    defaultWidth: 1080,
    defaultHeight: 1350,
  },
  {
    id: 'kokio-illu',
    name: 'Kokio Illu v20',
    filename: 'kokioIllu_v20.safetensors',
    defaultStyle: 'anime',
    allowedStyles: [
      'anime','manga','manhwa','cel_shaded','line_art',
      'digital_painting','watercolor','ink_wash','gouache','pastel','pencil_sketch',
      'pixel_art','vector_art','flat_design','comic_book'
    ],
    defaultWidth: 1080,
    defaultHeight: 1350,
  }
];