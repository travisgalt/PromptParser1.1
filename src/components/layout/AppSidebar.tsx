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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/components/auth/SessionProvider";
import HistorySidebar from "@/components/history/HistorySidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

const AppSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [openSettings, setOpenSettings] = React.useState(false);

  const email = session?.user?.email || null;
  const initials = (email || "U").slice(0, 2).toUpperCase();

  const onSignOut = async () => {
    await supabase.auth.signOut();
    setOpenSettings(false);
    navigate("/");
  };

  return (
    <SidebarProvider>
      <Sidebar side="left" collapsible="offcanvas" className="bg-slate-900/50 backdrop-blur-md border-r border-white/10">
        <SidebarHeader>
          <Link to="/" className="font-semibold text-sm md:text-base hover:opacity-80">
            Prompt Generator
          </Link>
        </SidebarHeader>

        <SidebarContent>
          {/* History group */}
          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarGroupContent>
              <HistorySidebar />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        {/* Identity controls at the bottom */}
        <SidebarFooter>
          {session ? (
            <>
              <div
                className="flex items-center justify-between px-2 py-2 rounded-md border border-white/10 bg-slate-900/40 cursor-pointer"
                onClick={() => setOpenSettings(true)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} alt={email || "User"} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium truncate">{email}</div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Profile & Settings</DialogTitle>
                    <DialogDescription>Manage your account and preferences.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={undefined} alt={email || "User"} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{email}</div>
                        <div className="text-muted-foreground">Signed in</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-white/10 p-2 bg-slate-900/40">
                      <ThemeToggle />
                    </div>
                  </div>
                  <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => { setOpenSettings(false); navigate("/profile"); }}>
                      View Profile
                    </Button>
                    <Button variant="destructive" onClick={onSignOut}>
                      Sign out
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
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
        </SidebarFooter>
      </Sidebar>

      {/* Right side content */}
      {children}
    </SidebarProvider>
  );
};

export default AppSidebar;