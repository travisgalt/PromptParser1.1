// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithDyad } from "@/components/made-with-dyad";
import { PromptGenerator } from "@/components/PromptGenerator";

const Index = () => {
  return (
    <div className="min-h-screen relative bg-slate-950 overflow-hidden">
      {/* subtle blurred radial orb */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="pb-12">
        <PromptGenerator />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;