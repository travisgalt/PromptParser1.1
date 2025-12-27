import { showError } from "@/utils/toast";

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

  try {
    const resp = await fetch("/api/forge/txt2img", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("Forge API error:", resp.status, errText);

      // Safeguard: if error mentions ADetailer/script, retry without ADetailer
      if (useADetailer && /ADetailer|adetailer|script/i.test(errText)) {
        showError("ADetailer failed, generating without it");
        // Remove ADetailer and retry once
        delete payload.alwayson_scripts;
        const retryResp = await fetch("/api/forge/txt2img", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text().catch(() => "");
          console.error("Forge API retry error:", retryResp.status, retryText);
          return null;
        }

        const retryData = await retryResp.json().catch(() => null);
        return retryData?.image ?? null;
      }

      return null;
    }

    const data = await resp.json().catch(() => null);
    return data?.image ?? null;
  } catch (error: any) {
    console.error("API Error:", error);

    // Safeguard in catch: retry without ADetailer if error mentions script
    const msg = typeof error?.message === "string" ? error.message : String(error ?? "");
    if (useADetailer && /ADetailer|adetailer|script/i.test(msg)) {
      showError("ADetailer failed, generating without it");
      delete payload.alwayson_scripts;
      try {
        const retryResp = await fetch("/api/forge/txt2img", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!retryResp.ok) {
          const retryText = await retryResp.text().catch(() => "");
          console.error("Forge API retry error:", retryResp.status, retryText);
          return null;
        }

        const retryData = await retryResp.json().catch(() => null);
        return retryData?.image ?? null;
      } catch (e2: any) {
        console.error("Retry Error:", e2);
        return null;
      }
    }

    return null;
  }
}