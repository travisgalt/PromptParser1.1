"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  imageData: string | null;
  isLoading: boolean;
};

const ImageResult: React.FC<Props> = ({ imageData, isLoading }) => {
  const [open, setOpen] = React.useState(false);

  const handleDownload = () => {
    if (!imageData) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${imageData}`;
    a.download = `generated-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const preview = (
    <div className="relative w-full max-h-[500px] h-96 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
      {isLoading ? (
        <div className="w-full h-full relative">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="px-3 py-1.5 rounded-md bg-white/10 text-xs text-white">Generating...</div>
          </div>
        </div>
      ) : imageData ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative w-full h-full flex items-center justify-center"
          aria-label="Expand image"
        >
          <img
            src={`data:image/png;base64,${imageData}`}
            alt="Generated result"
            className="h-full w-auto object-contain rounded-lg shadow-md"
          />
          <div className="absolute top-2 left-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-3.5 w-3.5" /> Click to expand
                </span>
              </TooltipTrigger>
              <TooltipContent>View full-size</TooltipContent>
            </Tooltip>
          </div>
          <div className="absolute top-2 right-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </button>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
          No image yet. Generate one to preview here.
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card className="relative w-full rounded-lg shadow-lg border border-white/10 bg-slate-900/40 overflow-hidden">
        {preview}
      </Card>

      {/* Expand / Lightbox */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-black/80 border border-white/10">
          <div className="w-full h-full flex items-center justify-center">
            {imageData ? (
              <img
                src={`data:image/png;base64,${imageData}`}
                alt="Generated result full"
                className="max-h-[85vh] w-auto object-contain rounded-lg shadow-lg"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageResult;