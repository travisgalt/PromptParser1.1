export async function generateImage(
  positive: string,
  negative: string,
  modelFilename: string,
  width: number,
  height: number,
  useADetailer?: boolean
): Promise<string | null> {
  // Construct base payload
  const payload: any = {
    prompt: positive,
    negative_prompt: negative,
    width,
    height,
    model: modelFilename,
  };

  // ADDED: Include ADetailer block when enabled
  if (useADetailer) {
    payload.alwayson_scripts = {
      ADetailer: {
        args: [
          true, // Enabled
          false, // Skip img2img? (Keep false)
          {
            ad_model: "face_yolov8n.pt", // Standard face detection model
            ad_confidence: 0.3,
            ad_denoising_strength: 0.4,
          },
        ],
      },
    };
  }

  const resp = await fetch("/api/forge/txt2img", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.image ?? null;
}