"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/components/auth/SessionProvider";

type ProfileData = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  themePreference?: "system" | "light" | "dark";
};

const STORAGE_KEY = "app:userProfile";

function loadLocalProfile(): ProfileData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw) as ProfileData;
  return {
    displayName: "",
    avatarUrl: "",
    bio: "",
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [profile, setProfile] = React.useState<ProfileData>(loadLocalProfile());
  const userId = session?.user?.id;

  React.useEffect(() => {
    if (!userId) return;
    // Load profile from Supabase
    supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, theme_preference")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }
        if (data) {
          const next: ProfileData = {
            displayName: data.display_name ?? "",
            avatarUrl: data.avatar_url ?? "",
            bio: data.bio ?? "",
            themePreference: (data.theme_preference as "system" | "light" | "dark") ?? "system",
          };
          setProfile(next);
        }
      });
  }, [userId]);

  const save = () => {
    if (userId) {
      // Save to Supabase
      const payload = {
        id: userId,
        display_name: profile.displayName || null,
        avatar_url: profile.avatarUrl || null,
        bio: profile.bio || null,
        theme_preference: profile.themePreference ?? "system",
        updated_at: new Date().toISOString(),
      };
      supabase.from("profiles").upsert(payload).then(({ error }) => {
        if (error) throw error;
        showSuccess("Profile saved to cloud");
      });
    } else {
      // Fallback: local storage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      showSuccess("Profile saved locally");
    }
  };

  const isAuthed = !!userId;

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Your Profile</CardTitle>
          <div className="flex gap-2">
            {!isAuthed ? (
              <Button variant="outline" onClick={() => navigate("/login")}>Login</Button>
            ) : null}
            <Button variant="secondary" onClick={() => navigate("/")}>Back</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.displayName || "Avatar"} />
              ) : null}
              <AvatarFallback>{(profile.displayName || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  value={profile.avatarUrl}
                  onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us a bit about you"
              className="min-h-[120px]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setProfile(loadLocalProfile())}>
              Reset (Local)
            </Button>
          </div>

          {!isAuthed && (
            <p className="text-xs text-muted-foreground">
              Not logged in—changes are saved in your browser only. Login to sync to the cloud.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}