"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { useSession } from "@/components/auth/SessionProvider";
import useHistory from "@/hooks/useHistory";

const HistorySidebar: React.FC = () => {
  const { session } = useSession();
  const userId = session?.user?.id ?? null;
  const { history, isLoading } = useHistory(userId);

  const [privacyBlur, setPrivacyBlur] = React.useState<boolean>(false);
  React.useEffect(() => {
    setPrivacyBlur(localStorage.getItem("generator:privacy_blur") === "true");
    const handle = () => setPrivacyBlur(localStorage.getItem("generator:privacy_blur") === "true");
    window.addEventListener("generator:history_update", handle as EventListener);
    return () => window.removeEventListener("generator:history_update", handle as EventListener);
  }, []);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied");
  };

  return (
    <Card className="w-full bg-slate-900/50 backdrop-blur-md border border-white/10">
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Recent History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-xs text-muted-foreground">No history yet.</div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 p-2 bg-slate-900/40">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={item.favorite ? "default" : "secondary"}>Seed: {item.seed}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className={`relative rounded bg-slate-900/60 border border-white/10 p-2 ${privacyBlur ? "blur-sm" : ""}`}>
                    <p className="text-xs font-mono whitespace-pre-wrap break-words pr-10">
                      {item.positive}
                    </p>
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-white/10"
                        onClick={() => copyText(item.positive)}
                        aria-label="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {item.negative && (
                    <div className="mt-2 text-[11px] text-muted-foreground line-clamp-3">
                      Neg: {item.negative}
                    </div>
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

export default HistorySidebar;