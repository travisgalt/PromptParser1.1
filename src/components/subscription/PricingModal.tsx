"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";

type PricingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const onUpgrade = () => {
    // Mock upgrade action; wire to Stripe later
    showSuccess("Upgrade flow coming soon");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl backdrop-blur-md bg-slate-900/80 border border-white/10">
        <DialogHeader>
          <DialogTitle>Unlock Pro Generation</DialogTitle>
          <DialogDescription>
            Tired of Copy-Pasting? Connect directly to your local GPU.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Badge>Pro</Badge> One-Click Generation
            </li>
            <li className="flex items-center gap-2">
              <Badge>Pro</Badge> PonyXL Support
            </li>
            <li className="flex items-center gap-2">
              <Badge>Pro</Badge> Save History to Cloud
            </li>
          </ul>

          <Button
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:from-violet-500 hover:to-indigo-500"
            onClick={onUpgrade}
          >
            Upgrade to Pro ($9/mo)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingModal;