"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Heart, Trash2 } from "lucide-react";
import { showSuccess } from "@/utils/toast";

export type HistoryItem = {
  id: string;
  positive: string;
  negative?: string;
  seed: number;
  timestamp: number;
  favorite: boolean;
  settings?: any; // NEW: carry saved settings (style, theme, model, safeMode, etc.)
};

type Props = {
  items: HistoryItem[];
  onCopyPositive: (id: string) => void;
  onCopyNegative: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClear: () => void;
};

export const HistoryList: React.FC<Props> = ({
  items,
  onCopyPositive,
  onCopyNegative,
  onToggleFavorite,
  onClear,
}) => {
  const empty = items.length === 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-xl">History</CardTitle>
        {!empty && (
          <Button variant="destructive" size="sm" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="text-sm text-muted-foreground">
            No history yet. Generate a prompt to see it here.
          </div>
        ) : (
          <ScrollArea className="h-64 pr-4">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-3 flex flex-col gap-2 bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={item.favorite ? "default" : "secondary"}>
                      Seed: {item.seed}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Positive</div>
                  <div className="rounded bg-muted p-2 text-sm">{item.positive}</div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onCopyPositive(item.id);
                        showSuccess("Positive copied");
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy Positive
                    </Button>
                    <Button
                      variant={item.favorite ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleFavorite(item.id)}
                    >
                      <Heart className="mr-2 h-4 w-4" /> {item.favorite ? "Favorited" : "Favorite"}
                    </Button>
                  </div>
                  {item.negative && (
                    <>
                      <div className="text-xs text-muted-foreground">Negative</div>
                      <div className="rounded bg-muted p-2 text-sm">{item.negative}</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onCopyNegative(item.id);
                          showSuccess("Negative copied");
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Negative
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};