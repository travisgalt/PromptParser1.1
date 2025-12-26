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

type PromptGeneratorProps = {
  hideHistory?: boolean;
};

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ hideHistory = false }) => {
  const { session } = useSession();
  const userId = session?.user?.id;

  // Generation hook: manages controls and output
  const { controls, setControls, output, generate, randomize } = usePromptGenerator({ userId });

  // History hook: handles persistence and loading based on auth state
  const { saveItem } = useHistory(userId);

  const [negPool, setNegPool] = React.useState<string[] | null>(null);
  const [isBanned, setIsBanned] = React.useState<boolean>(false);

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

    const result = generate();
    const settings = {
      seed: result.seed,
      medium: controls.medium,
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
  }, [isBanned, generate, controls.medium, controls.includeNegative, controls.negativeIntensity, controls.safeMode, saveItem]);

  const onShuffleNegative = () => {
    if (isBanned) {
      showError("Your account is banned. Prompt generation is disabled.");
      return;
    }
    const nextNeg = generateNegativePrompt(controls.negativeIntensity, negPool || undefined, undefined, output.lastContext);
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
        <PromptControls
          state={controls}
          onChange={setControls}
          onRandomizeSeed={randomizeSeed}
          onGenerate={handleGenerate}
        />
      </div>

      {/* History UI is handled by the sidebar; not rendered here */}
      {hideHistory ? null : null}
    </div>
  );
};