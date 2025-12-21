import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess } from "@/utils/toast";
import { Clipboard, Shuffle } from "lucide-react";

type Props = {
  positive: string;
  negative?: string;
  seed: number;
  onShuffle: () => void;
  onCopyPositive: () => void;
  onCopyNegative: () => void;
};

export const PromptDisplay = ({ positive, negative, seed, onShuffle, onCopyPositive, onCopyNegative }: Props) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Generated Prompt</span>
          <span className="text-sm text-muted-foreground">Seed: {seed}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Positive</label>
          <Textarea readOnly value={positive} className="min-h-[140px]" />
          <div className="flex gap-2">
            <Button onClick={() => { onCopyPositive(); showSuccess("Positive prompt copied"); }}>
              <Clipboard className="mr-2 h-4 w-4" /> Copy Positive
            </Button>
          </div>
        </div>

        {negative !== undefined && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Negative</label>
            <Textarea readOnly value={negative} className="min-h-[100px]" />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { onCopyNegative(); showSuccess("Negative prompt copied"); }}>
                <Clipboard className="mr-2 h-4 w-4" /> Copy Negative
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onShuffle}>
          <Shuffle className="mr-2 h-4 w-4" /> Shuffle
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PromptDisplay;