import { useEffect, useMemo, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import PromptControls from "@/components/prompt-controls";
import PromptDisplay from "@/components/prompt-display";
import { generatePrompt, type GeneratorConfig } from "@/lib/prompt-engine";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

const Index = () => {
  const isMobile = useIsMobile();

  const [seed, setSeed] = useState<number>(() => Math.floor(Math.random() * 1_000_000));
  const [config, setConfig] = useState<GeneratorConfig>({
    pack: "goth",
    includeNegative: true,
    negativeIntensity: 0.3,
    safeMode: true,
  });

  const result = useMemo(() => generatePrompt(seed, config), [seed, config]);

  const onRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 2_147_483_647));
  };

  const onShuffle = () => {
    // Shuffle using the current seed (deterministic re-run)
    setSeed((s) => s);
  };

  const onCopyPositive = async () => {
    await navigator.clipboard.writeText(result.positive);
  };

  const onCopyNegative = async () => {
    if (result.negative) {
      await navigator.clipboard.writeText(result.negative);
    }
  };

  useEffect(() => {
    // First render generates based on initial seed/config
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Stable Diffusion Prompt Generator</h1>
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Settings</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Prompt Settings</DrawerTitle>
                </DrawerHeader>
                <div className="p-4">
                  <PromptControls
                    seed={seed}
                    pack={config.pack}
                    includeNegative={config.includeNegative}
                    safeMode={config.safeMode}
                    onChange={(next) => {
                      if (next.seed !== undefined) setSeed(next.seed);
                      setConfig((prev) => ({ ...prev, ...next }));
                    }}
                    onRandomizeSeed={onRandomizeSeed}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <div className="w-[320px]">
              <PromptControls
                seed={seed}
                pack={config.pack}
                includeNegative={config.includeNegative}
                safeMode={config.safeMode}
                onChange={(next) => {
                  if (next.seed !== undefined) setSeed(next.seed);
                  setConfig((prev) => ({ ...prev, ...next }));
                }}
                onRandomizeSeed={onRandomizeSeed}
              />
            </div>
          )}
        </div>

        <div className={`grid gap-4 ${isMobile ? "" : "grid-cols-12"}`}>
          {!isMobile && <div className="col-span-4" />}
          <div className={!isMobile ? "col-span-8" : ""}>
            <PromptDisplay
              positive={result.positive}
              negative={result.negative}
              seed={result.metadata.seed}
              onShuffle={onShuffle}
              onCopyPositive={onCopyPositive}
              onCopyNegative={onCopyNegative}
            />
          </div>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;