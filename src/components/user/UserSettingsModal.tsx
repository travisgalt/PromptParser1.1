"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountSettings from "@/components/profile/AccountSettings";
import GeneratorDefaults from "@/components/profile/GeneratorDefaults";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Sliders, Crown } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
};

export default function UserSettingsModal({ open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = React.useState<"account" | "generator" | "subscription">("account");
  const { session } = useSession();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";
  const memberSince = session?.user?.created_at ? new Date(session.user.created_at) : undefined;
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);

  React.useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data as ProfileRow);
      });
  }, [userId]);

  const initials = (profile?.display_name || email || "U").slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>Manage your account, generator defaults, and subscription.</DialogDescription>
        </DialogHeader>

        {/* Modal body: scrollable area */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="account" className="inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="generator" className="inline-flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Generator
              </TabsTrigger>
              <TabsTrigger value="subscription" className="inline-flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Subscription
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* User Info Card */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.display_name || "Avatar"} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm text-white">{profile?.display_name || email}</div>
                    <div className="text-xs text-slate-300">
                      {email}
                      {memberSince ? (
                        <span className="ml-2">
                          • Member since {memberSince.toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Settings (no theme toggle, no profile navigation) */}
              <AccountSettings />
            </TabsContent>

            {/* Generator Tab */}
            <TabsContent value="generator">
              <GeneratorDefaults />
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Subscription</h3>
                <p className="text-slate-300 leading-relaxed">
                  Manage your plan and benefits here. More details and upgrade options coming soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}