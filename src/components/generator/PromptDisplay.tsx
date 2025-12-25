"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { Copy, Shuffle } from "lucide-react";
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
    <Card className="w-full">
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
          <Textarea
            value={positive}
            onChange={(e) => onPositiveChange?.(e.target.value)}
            className="min-h-[120px] text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyText(positive, "Positive prompt")}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Positive
            </Button>
            <Button variant="outline" size="sm" onClick={onClearPositive}>
              Clear
            </Button>
            <Button size="sm" onClick={onShuffle} disabled={disabledActions}>
              <Shuffle className="mr-2 h-4 w-4" /> Shuffle
            </Button>
            {onShare && (
              <Button size="sm" variant="outline" onClick={onShare}>
                Share
              </Button>
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