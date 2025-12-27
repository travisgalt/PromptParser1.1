"use client";

import * as React from "react";
import { PromptControls } from "./generator/PromptControls";
import { PromptDisplay } from "./generator/PromptDisplay";
import { generateNegativePrompt } from "@/lib/prompt-engine";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { buildShareUrl } from "@/lib/url-state";
import { useSession } from "@/components/auth/SessionProvider";
import usePromptGenerator from "@/hooks/usePromptGenerator";
import useHistory from "@/hooks/useHistory";
import { generateImage } from "@/lib/forge-api";
import { models } from "@/lib/model-data";
import ImageResult from "@/components/ImageResult";

type PromptGeneratorProps = {
  hideHistory?: boolean;
};

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ hideHistory = false }) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  // Generation hook: manages controls and output
  const { controls, setControls, output, generate, randomize } = usePromptGenerator({ userId });

  // History hook: handles persistence and loading based on auth state
  const { saveItem, history, isLoading } = useHistory(userId);

  const [negPool, setNegPool] = React.useState<string[] | null>(null);
  const [isBanned, setIsBanned] = React.useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = React.useState(false);

  React.useEffect(() => {
    supabase
      .from("negative_keywords")
      .select("keyword, active, weight")
      .eq("active", true)
      .then(({ data }) => {
        if (data && Array.isArray(data)) {
          setNegPool(data.map((d: any) => d.keyword));
        }
      });
  }, []);

  React.useEffect(() => {
    async function loadUserData() {
      if (!userId) return;
      // ... existing favorites load ...
      // History load unchanged
    }
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  React.useEffect(() => {
    async function loadBanStatus() {
      if (!userId) {
        setIsBanned(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", userId)
        .single();
      setIsBanned(!!prof?.is_banned);
    }
    loadBanStatus();
  }, [userId]);

  // NEW: Restore last session once history is loaded
  React.useEffect(() => {
    if (isLoading) return;
    if (history && history.length > 0) {
      const last = history[0];
      // Restore controls from saved settings and seed
      setControls((c) => ({
        ...c,
        seed: last.seed,
        selectedStyle: last.settings?.style ?? c.selectedStyle,
        selectedTheme: last.settings?.theme ?? c.selectedTheme,
        selectedModelId: last.settings?.model ?? c.selectedModelId,
        includeNegative: last.settings?.includeNegative ?? c.includeNegative,
        negativeIntensity: last.settings?.negativeIntensity ?? c.negativeIntensity,
        safeMode: last.settings?.safeMode ?? c.safeMode,
        selectedSpecies: last.settings?.selectedSpecies ?? c.selectedSpecies,
        // ADDED restore
        hairColor: last.settings?.hairColor ?? c.hairColor,
        eyeColor: last.settings?.eyeColor ?? c.eyeColor,
      }));
      // Restore output text
      output.setPositive(last.positive);
      output.setNegative(last.negative);
      // Clear any previous image preview
      setGeneratedImage(null);
    } else {
      // Optional: generate one initial prompt for brand-new users
      runGeneration(controls);
    }
    // run only when initial load finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleGenerateImage = async () => {
    setIsGeneratingImg(true);
    const model = models.find((m) => m.id === controls.selectedModelId) ?? models[0];
    const imageData = await generateImage(
      output.positive,
      output.negative ?? "",
      model.filename,
      controls.width,
      controls.height,
      controls.useADetailer
    );
    setGeneratedImage(imageData || null);
    setIsGeneratingImg(false);
    if (imageData) {
      showSuccess("Image generated");
      // Auto-save images to history if preference is enabled
      const autoSave = localStorage.getItem("generator:auto_save_images") === "true";
      if (autoSave) {
        await saveItem({
          positive: output.positive,
          negative: output.negative,
          seed: controls.seed,
          settings: {
            ...controls,
            imageData,
          },
        });
      }
    }
  };

  // NEW: Unified generation handler that also saves history
  const runGeneration = React.useCallback(
    async (overrideControls?: any) => {
      if (isBanned) {
        showError("Your account is banned. Prompt generation is disabled.");
        return;
      }

      const cfg = overrideControls ?? controls;

      // 1) Generate text/seed from the provided config
      const result = generate(cfg);

      // 2) Clear any old images in the result zone
      setGeneratedImage(null);

      // 2.5) Apply Global Negative Prompt preference
      const baseNeg = (typeof window !== "undefined" ? localStorage.getItem("generator:global_negative") : "") || "";
      const combinedNegative =
        baseNeg && result.negative ? `${baseNeg}, ${result.negative}` :
        baseNeg && !result.negative ? baseNeg :
        result.negative;

      // 3) Save to history (DB/local) with the fresh seed in settings
      const settings = {
        seed: result.seed,
        style: cfg.selectedStyle,
        theme: cfg.selectedTheme,
        model: cfg.selectedModelId,
        includeNegative: cfg.includeNegative,
        negativeIntensity: cfg.negativeIntensity,
        safeMode: cfg.safeMode,
        selectedSpecies: cfg.selectedSpecies,
        hairColor: cfg.hairColor,
        eyeColor: cfg.eyeColor,
      };

      await saveItem({
        positive: result.positive,
        negative: combinedNegative,
        seed: result.seed,
        settings,
      });

      // Update output with combined negative
      output.setPositive(result.positive);
      output.setNegative(combinedNegative);
      showSuccess("Prompt updated");
    },
    [isBanned, controls, generate, saveItem, setGeneratedImage, output]
  );

  // Generate Prompt button uses the unified flow
  const handleGenerate = React.useCallback(async () => {
    await runGeneration(controls);
  }, [runGeneration, controls]);

  // Shuffle in the prompt box also uses the same unified flow
  const handleShuffle = React.useCallback(async () => {
    await runGeneration(controls);
  }, [runGeneration, controls]);

  const onShuffleNegative = () => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }
    // Map style to legacy medium hint for negatives
    const style = output.lastContext?.style as string | undefined;
    const mediumForContext = style === "photorealistic" ? "photo" : style === "3d_render" ? "render" : undefined;
    const nextNeg = generateNegativePrompt(controls.negativeIntensity, undefined, undefined, { medium: mediumForContext, scenario: output.lastContext?.scenario });
    output.setNegative(nextNeg);
    showSuccess("Negative updated");
  };

  const onShare = () => {
    const url = buildShareUrl(controls);
    navigator.clipboard.writeText(url);
    showSuccess("Shareable link copied");
  };

  const randomizeSeed = () => {
    randomize();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <ImageResult imageData={generatedImage} isLoading={isGeneratingImg} />
          <PromptDisplay
            positive={output.positive}
            negative={output.negative}
            seed={controls.seed}
            onShuffle={handleShuffle}
            onShare={onShare}
            onPositiveChange={output.setPositive}
            onClearPositive={output.clearPositive}
            onClearNegative={output.clearNegative}
            onShuffleNegative={onShuffleNegative}
            disabledActions={isBanned}
            bannerMessage={isBanned ? "Your account is banned. Prompt generation is currently disabled." : undefined}
          />
        </div>

        <PromptControls
          state={controls}
          onChange={setControls}
          onRandomizeSeed={randomizeSeed}
          onGenerate={handleGenerate}
          onGenerateImage={handleGenerateImage}
          generatingImage={isGeneratingImg}
        />
      </div>

      {/* History UI is handled by the sidebar; not rendered here */}
      {hideHistory ? null : null}
    </div>
  );
};