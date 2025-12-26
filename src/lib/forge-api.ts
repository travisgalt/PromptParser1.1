export type ForgeResponse = {
  images: string[];
  parameters?: Record<string, unknown>;
  info?: string;
};

export async function generateImage(
  prompt: string,
  negative_prompt: string,
  modelFilename: string
): Promise<ForgeResponse> {
  const res = await fetch("http://127.0.0.1:7860/sdapi/v1/txt2img", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt,
      steps: 25,
      cfg_scale: 7,
      width: 832,
      height: 1216,
      override_settings: {
        sd_model_checkpoint: modelFilename,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Forge API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as ForgeResponse;
  return data;
}