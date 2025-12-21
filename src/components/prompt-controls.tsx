import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type Props = {
  seed: number;
  pack: "goth" | "lounge" | "casual";
  includeNegative: boolean;
  safeMode: boolean;
  onChange: (next: { seed?: number; pack?: Props["pack"]; includeNegative?: boolean; safeMode?: boolean }) => void;
  onRandomizeSeed: () => void;
};

export const PromptControls = ({
  seed,
  pack,
  includeNegative,
  safeMode,
  onChange,
  onRandomizeSeed,
}: Props) => {
  const [seedInput, setSeedInput] = useState<string>(String(seed));

  const applySeed = () => {
    const n = Number(seedInput);
    if (!Number.isFinite(n)) return;
    onChange({ seed: Math.floor(n) });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Prompt Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="seed">Seed</Label>
          <div className="flex items-center gap-2">
            <Input
              id="seed"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="flex-1"
              placeholder="Enter a number"
            />
            <Button variant="secondary" onClick={applySeed}>
              Set
            </Button>
            <Button onClick={onRandomizeSeed}>Randomize</Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Style Pack</Label>
          <Select
            value={pack}
            onValueChange={(v) => onChange({ pack: v as Props["pack"] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pack" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="goth">Goth</SelectItem>
              <SelectItem value="lounge">Lounge</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="neg">Include Negative Prompt</Label>
            <p className="text-xs text-muted-foreground">Adds curated negatives with emphasis.</p>
          </div>
          <Switch id="neg" checked={includeNegative} onCheckedChange={(v) => onChange({ includeNegative: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="safe">Safe Mode</Label>
            <p className="text-xs text-muted-foreground">Filters sensitive accessories or outfits.</p>
          </div>
          <Switch id="safe" checked={safeMode} onCheckedChange={(v) => onChange({ safeMode: v })} />
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptControls;