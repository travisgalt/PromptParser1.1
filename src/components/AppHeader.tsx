"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, LogOut, Shield, User as UserIcon } from "lucide-react";

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
  is_admin?: boolean | null;
};

export const AppHeader: React.FC = () => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);

  React.useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url, is_admin")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setProfile(data as ProfileRow);
      });
  }, [session?.user?.id]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const initials =
    (profile?.display_name || session?.user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container mx-auto h-14 px-4 flex items-center justify-between">
        <Link to="/" className="font-semibold text-sm md:text-base hover:opacity-80">
          Prompt Generator
        </Link>

        {!session ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/signup")}>
              Sign up
            </Button>
            <Button onClick={() => navigate("/login")}>
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.display_name || "Avatar"} />
                  ) : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {profile?.display_name || session.user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              {profile?.is_admin ? (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" /> Admin
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <ThemeToggle />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default AppHeader;