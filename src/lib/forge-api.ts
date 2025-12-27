import { showError } from "@/utils/toast";

// Environment-based API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:7860/sdapi/v1/txt2img";

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

  // Include ADetailer block when enabled (simplified args format)
  if (useADetailer) {
    payload.alwayson_scripts = {
      ADetailer: {
        args: [
          {
            ad_model: "face_yolov8n.pt",
            ad_confidence: 0.3,
          },
        ],
      },
    };
  }

  // Log the full URL being hit for debugging
  console.log(`Connecting to API: ${API_URL}`);

  try {
    const resp = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error(`Forge API error: ${resp.status} ${errText}`);

      // Safeguard: if error mentions ADetailer/script, retry without ADetailer
      if (useADetailer && /ADetailer|adetailer|script/i.test(errText)) {
        showError("ADetailer failed, generating without it");
        // Remove ADetailer and retry once
        delete payload.alwayson_scripts;

        console.log(`Connecting to API (retry without ADetailer): ${API_URL}`);
        const retryResp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text().catch(() => "");
          console.error(`Forge API retry error: ${retryResp.status} ${retryText}`);
          return null;
        }

        const retryData = await retryResp.json().catch(() => null);
        if (retryData && Array.isArray(retryData.images) && retryData.images.length > 0) {
          const img = retryData.images[0] as string;
          return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
        }
        if (retryData && typeof retryData.image === "string") {
          const img = retryData.image as string;
          return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
        }
        return null;
      }

      return null;
    }

    const data = await resp.json().catch(() => null);
    if (data && Array.isArray(data.images) && data.images.length > 0) {
      const img = data.images[0] as string;
      return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
    }
    if (data && typeof data.image === "string") {
      const img = data.image as string;
      return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
    }
    return null;
  } catch (error: any) {
    console.error(`API Error: ${error}`);

    // Safeguard in catch: retry without ADetailer if error mentions script
    const msg = typeof error?.message === "string" ? error.message : String(error ?? "");
    if (useADetailer && /ADetailer|adetailer|script/i.test(msg)) {
      showError("ADetailer failed, generating without it");
      delete payload.alwayson_scripts;

      console.log(`Connecting to API (catch retry): ${API_URL}`);
      try {
        const retryResp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text().catch(() => "");
          console.error(`Forge API retry error: ${retryResp.status} ${retryText}`);
          return null;
        }

        const retryData = await retryResp.json().catch(() => null);
        if (retryData && Array.isArray(retryData.images) && retryData.images.length > 0) {
          const img = retryData.images[0] as string;
          return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
        }
        if (retryData && typeof retryData.image === "string") {
          const img = retryData.image as string;
          return img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
        }
        return null;
      } catch (e2: any) {
        console.error(`Retry Error: ${e2}`);
        return null;
      }
    }

    return null;
  }
}