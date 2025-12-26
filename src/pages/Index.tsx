// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithDyad } from "@/components/made-with-dyad";
import { PromptGenerator } from "@/components/PromptGenerator";
import AppSidebar from "@/components/layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen relative bg-slate-950 overflow-hidden">
      {/* subtle blurred radial orb */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <AppSidebar>
        <SidebarInset className="bg-transparent">
          {/* mobile sidebar trigger */}
          <div className="sticky top-0 z-40 flex items-center gap-2 p-3">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Menu</span>
          </div>

          <div className="pb-12">
            {/* Hide built-in history: sidebar will render it */}
            <PromptGenerator hideHistory />
          </div>
          <MadeWithDyad />
        </SidebarInset>
      </AppSidebar>
    </div>
  );
};

export default Index;