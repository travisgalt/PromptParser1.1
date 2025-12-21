// Update this page (the content is just a fallback if you fail to update the page)

import { MadeWithDyad } from "@/components/made-with-dyad";
import { PromptGenerator } from "@/components/PromptGenerator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="pb-12">
        <PromptGenerator />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;