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

        <div className="flex flex-col border border-white/10 rounded-md overflow-hidden">
          <div className="w-full flex items-center justify-between p-2 bg-white/5 border-b border-white/10">
            <p className="text-sm text-muted-foreground">Positive</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                onClick={() => {
                  navigator.clipboard.writeText(positive);
                  showSuccess("Positive prompt copied");
                }}
                aria-label="Copy Positive"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                onClick={onClearPositive}
                aria-label="Clear Positive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 max-h-48 overflow-auto">
            <Textarea
              value={positive}
              onChange={(e) => onPositiveChange?.(e.target.value)}
              className="w-full min-h-[140px] text-sm font-mono bg-slate-900/60 border border-white/10 shadow-inner focus-visible:ring-violet-600"
            />
          </div>
        </div>

        {onShare && (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={onShare} className="border-white/10">
              Share
            </Button>
          </div>
        )}

        {negative !== undefined && (
          <div className="space-y-2">
            <div className="flex flex-col border border-white/10 rounded-md overflow-hidden">
              <div className="w-full flex items-center justify-between p-2 bg-white/5 border-b border-white/10">
                <p className="text-sm text-muted-foreground">Negative</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(negative ?? "");
                      showSuccess("Negative prompt copied");
                    }}
                    aria-label="Copy Negative"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                    onClick={onClearNegative}
                    aria-label="Clear Negative"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 max-h-40 overflow-auto">
                <div className="text-sm font-mono whitespace-pre-wrap">
                  {negative}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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