"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: string | null;
  is_admin?: boolean | null;
};

export default function Admin() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);

  React.useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, theme_preference, is_admin")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data as ProfileRow);
        setIsAdmin(!!(data as ProfileRow)?.is_admin);
        setLoading(false);
      });
  }, [session?.user?.id]);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You must be logged in to access the admin panel.
            </p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent>Loading...</CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account does not have admin privileges.
            </p>
            <p className="text-sm text-muted-foreground">
              Ask an existing admin to grant you access, or update your profiles table with an is_admin flag.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate("/")}>Back Home</Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>View Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Badge variant="default">Admin</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Users Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Total users: —</p>
            <p>New signups (7d): —</p>
            <p>Admins: —</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generator Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Prompts generated: —</p>
            <p>Favorites: —</p>
            <p>Presets: —</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button disabled>Grant Admin (coming soon)</Button>
            <Button disabled>Revoke Admin (coming soon)</Button>
            <Button disabled>Ban User (coming soon)</Button>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This is a scaffold. To fully enable admin features, add an is_admin boolean column to public.profiles
            and use server-side functions to manage privileges securely.
          </p>
          <p>
            For cloud-backed actions, you’ll use Supabase Edge Functions to verify admin status and write audit logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}