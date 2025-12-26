"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { Copy, Shuffle, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Props = {
  positive: string;
  negative?: string;
  seed: number;
  onShuffle: () => void;
  onShare?: () => void;
  onPositiveChange?: (text: string) => void;
  onClearPositive?: () => void;
  onClearNegative?: () => void;
  onShuffleNegative?: () => void;
  disabledActions?: boolean;
  bannerMessage?: string;
};

export const PromptDisplay: React.FC<Props> = ({
  positive,
  negative,
  seed,
  onShuffle,
  onShare,
  onPositiveChange,
  onClearPositive,
  onClearNegative,
  onShuffleNegative,
  disabledActions = false,
  bannerMessage,
}) => {
  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} copied`);
  };

  return (
    <Card className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl">Generated Prompt</CardTitle>
        <Badge variant="secondary">Seed: {seed}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {bannerMessage && (
          <Alert variant="destructive">
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{bannerMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Positive</p>
          <div className="relative">
            <Textarea
              value={positive}
              onChange={(e) => onPositiveChange?.(e.target.value)}
              className="min-h-[140px] text-sm font-mono bg-slate-900/60 border border-white/10 shadow-inner focus-visible:ring-violet-600"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                onClick={() => copyText(positive, "Positive prompt")}
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                onClick={onClearPositive}
                aria-label="Clear"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={onShuffle}
              disabled={disabledActions}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-indigo-600/40 hover:from-violet-500 hover:to-indigo-500"
            >
              Generate Prompt ✨
            </Button>
            {onShare && (
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={onShare} className="border-white/10">
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>

        {negative !== undefined && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Negative</p>
            <div className="rounded-md bg-muted p-3 text-sm">{negative}</div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyText(negative ?? "", "Negative prompt")}
              >
                <Copy className="mr-2 h-4 w-4" /> Copy Negative
              </Button>
              <Button variant="outline" size="sm" onClick={onClearNegative}>
                Clear
              </Button>
              <Button size="sm" onClick={onShuffleNegative} disabled={disabledActions}>
                <Shuffle className="mr-2 h-4 w-4" /> Shuffle Negative
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};