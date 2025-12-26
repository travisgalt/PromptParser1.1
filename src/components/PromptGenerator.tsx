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
  const { saveItem, history, favoritesIndex, saveHistory } = useHistory(userId);

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

  const handleGenerate = React.useCallback(() => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }

    if (output.positive.trim().length > 0) {
      const prevItem = {
        id: `${controls.seed}-${Date.now()}`,
        positive: output.positive,
        negative: output.negative,
        seed: controls.seed,
        timestamp: Date.now(),
        favorite: favoritesIndex.has(favKey({ positive: output.positive, seed: controls.seed })),
      };
      const prevNext = [prevItem, ...history].slice(0, 40);
      saveHistory(prevNext);

      if (userId) {
        const configJson = {
          style: controls.selectedStyle,
          includeNegative: controls.includeNegative,
          negativeIntensity: controls.negativeIntensity,
          safeMode: controls.safeMode,
        };
        supabase.from("prompt_history").insert({
          user_id: userId,
          positive_text: prevItem.positive,
          negative_text: prevItem.negative ?? null,
          seed: prevItem.seed,
          config_json: configJson,
        });
      }
    }

    // UPDATED: pass current controls to generate() to avoid staleness
    const result = generate(controls);
    const settings = {
      seed: result.seed,
      style: controls.selectedStyle,
      includeNegative: controls.includeNegative,
      negativeIntensity: controls.negativeIntensity,
      safeMode: controls.safeMode,
    };

    saveItem({
      positive: result.positive,
      negative: result.negative,
      seed: result.seed,
      settings,
    });

    showSuccess("Prompt updated");
  }, [isBanned, output.positive, output.negative, controls, favoritesIndex, history, saveHistory, userId, generate, saveItem]);

  const handleGenerateImage = async () => {
    setIsGeneratingImg(true);
    const model = models.find((m) => m.id === controls.selectedModelId) ?? models[0];
    const imageData = await generateImage(output.positive, output.negative ?? "", model.filename);
    setGeneratedImage(imageData || null);
    setIsGeneratingImg(false);
    if (imageData) {
      showSuccess("Image generated");
    }
  };

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
            onShuffle={handleGenerate}
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