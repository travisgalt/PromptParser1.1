"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/auth/SessionProvider";
import { LogIn } from "lucide-react";
import AppHeader from "@/components/AppHeader";
// import { ThemeToggle } from "@/components/ThemeToggle";

export const AppHeader: React.FC = () => {
  const { session } = useSession();
  const navigate = useNavigate();

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
          <div className="text-sm text-muted-foreground">
            {/* All user actions are available in the sidebar panel */}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;