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

type ProfileData = {
  displayName: string;
  avatarUrl: string;
  bio: string;
};

const STORAGE_KEY = "app:userProfile";

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ProfileData;
  } catch {}
  return {
    displayName: "",
    avatarUrl: "",
    bio: "",
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<ProfileData>(() => loadProfile());

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      showSuccess("Profile saved");
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">Your Profile</CardTitle>
          <Button variant="secondary" onClick={() => navigate("/")}>Back</Button>
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
            <Button variant="outline" onClick={() => setProfile(loadProfile())}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}