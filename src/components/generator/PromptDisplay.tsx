"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { Copy, Shuffle } from "lucide-react";

type Props = {
  positive: string;
  negative?: string;
  seed: number;
  onShuffle: () => void;
};

export const PromptDisplay: React.FC<Props> = ({ positive, negative, seed, onShuffle }) => {
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
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Positive</p>
          <div className="rounded-md bg-muted p-3 text-sm">{positive}</div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => copyText(positive, "Positive prompt")}>
              <Copy className="mr-2 h-4 w-4" /> Copy Positive
            </Button>
            <Button size="sm" onClick={onShuffle}>
              <Shuffle className="mr-2 h-4 w-4" /> Shuffle
            </Button>
          </div>
        </div>

        {negative && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Negative</p>
            <div className="rounded-md bg-muted p-3 text-sm">{negative}</div>
            <Button variant="secondary" size="sm" onClick={() => copyText(negative, "Negative prompt")}>
              <Copy className="mr-2 h-4 w-4" /> Copy Negative
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};