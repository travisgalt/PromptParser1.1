"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Props = {
  imageData: string | null;
  isLoading: boolean;
};

const ImageResult: React.FC<Props> = ({ imageData, isLoading }) => {
  const handleDownload = () => {
    if (!imageData) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${imageData}`;
    a.download = `generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="relative w-full rounded-lg shadow-lg border border-white/10 bg-slate-900/40 overflow-hidden">
      <AspectRatio ratio={2 / 3}>
        <div className="w-full h-full">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-3 py-1.5 rounded-md bg-white/10 text-xs text-white">
                  Generating...
                </div>
              </div>
            </div>
          ) : imageData ? (
            <div className="relative w-full h-full">
              <img
                src={`data:image/png;base64,${imageData}`}
                alt="Generated result"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-white/10"
                  onClick={handleDownload}
                  aria-label="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              No image yet. Generate one to preview here.
            </div>
          )}
        </div>
      </AspectRatio>
    </Card>
  );
};

export default ImageResult;