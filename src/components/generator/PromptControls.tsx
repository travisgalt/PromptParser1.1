"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { User, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ControlsState = {
  seed: number;
  includeNegative: boolean;
  negativeIntensity: number;
  medium: "photo" | "render";
  safeMode: boolean;
};

type Props = {
  state: ControlsState;
  onChange: (next: ControlsState) => void;
  onRandomizeSeed: () => void;
};

export const PromptControls: React.FC<Props> = ({
  state,
  onChange,
  onRandomizeSeed,
}) => {
  const setField = <K extends keyof ControlsState>(key: K, value: ControlsState[K]) => {
    onChange({ ...state, [key]: value });
  };
  const navigate = useNavigate();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Prompt Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seed">Seed</Label>
            <div className="flex gap-2">
              <Input
                id="seed"
                type="number"
                value={state.seed}
                onChange={(e) => setField("seed", Number(e.target.value || 0))}
              />
              <Button variant="secondary" onClick={onRandomizeSeed}>
                Randomize
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Medium</Label>
            <RadioGroup
              value={state.medium}
              onValueChange={(v) => setField("medium", v as "photo" | "render")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="photo" id="medium-photo" />
                <Label htmlFor="medium-photo">Photo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="render" id="medium-render" />
                <Label htmlFor="medium-render">Render</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Label htmlFor="neg">Include Negative</Label>
                <span className="text-xs text-muted-foreground">
                  Curated negatives to reduce artifacts
                </span>
              </div>
              <Switch
                id="neg"
                checked={state.includeNegative}
                onCheckedChange={(c) => setField("includeNegative", c)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Negative Intensity</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Controls the strength of negative prompts. Higher values (e.g. 1.3) tell the AI to avoid these concepts more aggressively.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                min={0.8}
                max={1.4}
                step={0.05}
                value={[state.negativeIntensity]}
                onValueChange={(v) => setField("negativeIntensity", v[0] ?? 1.0)}
              />
              <div className="text-xs text-muted-foreground">
                {state.negativeIntensity.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="safe">Safe Mode</Label>
              <Switch
                id="safe"
                checked={state.safeMode}
                onCheckedChange={(c) => setField("safeMode", c)}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Filters sensitive accessories and tokens
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" /> Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};