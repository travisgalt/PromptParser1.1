"use client";

import * as React from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AccountSettings from "@/components/profile/AccountSettings";
import GeneratorDefaults from "@/components/profile/GeneratorDefaults";
import { User, Shield, Sliders, Wand2 } from "lucide-react";

export default function Profile() {
  const { session } = useSession();
  const userId = session?.user?.id;
  const [activeTab, setActiveTab] = React.useState<"account" | "generator">("account");

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Local tab navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border transition ${
            activeTab === "account"
              ? "bg-white/10 text-white border-white/20"
              : "bg-transparent text-slate-300 hover:bg-white/5 border-white/10"
          }`}
        >
          <User className="h-4 w-4" />
          <Shield className="h-4 w-4" />
          <span>Account & Security</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("generator")}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border transition ${
            activeTab === "generator"
              ? "bg-white/10 text-white border-white/20"
              : "bg-transparent text-slate-300 hover:bg-white/5 border-white/10"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <Wand2 className="h-4 w-4" />
          <span>Generator Preferences</span>
        </button>
      </div>

      {/* Content */}
      <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">
            {activeTab === "account" ? "Account & Security" : "Generator Preferences"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeTab === "account" ? <AccountSettings /> : <GeneratorDefaults />}
        </CardContent>
      </Card>
    </div>
  );
}