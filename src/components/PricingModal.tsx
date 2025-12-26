"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { showSuccess } from "@/utils/toast";

type PricingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const onUpgrade = () => {
    // TODO: Replace with real Stripe checkout link/integration
    showSuccess("Upgrade flow coming soon");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900/80 border border-white/10">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>Unlock image generation, advanced negatives, and more.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
            <CardHeader>
              <CardTitle className="text-sm">Free</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Badge variant="secondary">Basic</Badge> Prompt generation</div>
              <div className="flex items-center gap-2"><Badge variant="secondary">Basic</Badge> Local history</div>
              <div className="flex items-center gap-2"><Lock className="h-4 w-4" /> Image generation</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
            <CardHeader>
              <CardTitle className="text-sm">Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Badge>Unlocked</Badge> Image generation</div>
              <div className="flex items-center gap-2"><Badge>Unlocked</Badge> One‑Click Local Generation</div>
              <div className="flex items-center gap-2"><Badge>Unlocked</Badge> Advanced negatives</div>
              <div className="flex items-center gap-2"><Badge>Unlocked</Badge> Cloud sync</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Not now</Button>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500" onClick={onUpgrade}>
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;