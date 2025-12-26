"use client";

import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/components/auth/SessionProvider";
import HistorySidebar from "@/components/history/HistorySidebar";

const AppSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const navigate = useNavigate();
  const email = session?.user?.email || null;
  const initials = (email || "U").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas" className="bg-slate-900/50 backdrop-blur-md border-r border-white/10">
        <SidebarHeader>
          <Link to="/" className="font-semibold text-sm md:text-base hover:opacity-80">
            Prompt Generator
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Profile</SidebarGroupLabel>
            <SidebarGroupContent>
              {session ? (
                <div className="flex items-center gap-3 px-2 py-2 rounded-md border border-white/10 bg-slate-900/40">
                  <Avatar className="h-8 w-8">
                    {/* If you have avatar_url in profile, you can set it here */}
                    <AvatarImage src={undefined} alt={email || "User"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="text-sm font-medium truncate">{email}</div>
                    <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => navigate("/profile")}>
                      View Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-2 py-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate("/signup")}>
                    Sign up
                  </Button>
                  <Button size="sm" onClick={() => navigate("/login")}>
                    Login
                  </Button>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarGroupContent>
              <HistorySidebar />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Right side content */}
      {children}
    </SidebarProvider>
  );
};

export default AppSidebar;