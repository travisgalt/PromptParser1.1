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
import { Settings, Lock, Shield, User as UserIcon, LogOut } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader as UICardHeader, CardTitle as UICardTitle, CardContent as UICardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { showSuccess } from "@/utils/toast";

const AppSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const navigate = useNavigate();
  const [openSettings, setOpenSettings] = React.useState(false);

  const userId = session?.user?.id ?? null;
  const email = session?.user?.email || null;
  const initials = (email || "U").slice(0, 2).toUpperCase();
  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString()
    : undefined;

  const [promptCount, setPromptCount] = React.useState<number>(0);
  const [isAdmin, setIsAdmin] = React.useState<boolean>(false);

  // Preferences (local-only for now)
  const [prefMedium, setPrefMedium] = React.useState<"photo" | "render">("photo");
  const [prefSafeMode, setPrefSafeMode] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (!openSettings) return;

    // Load preferences from localStorage when modal opens
    const medium = (localStorage.getItem("pref_default_medium") as "photo" | "render") || "photo";
    const safe = localStorage.getItem("pref_default_safemode");
    setPrefMedium(medium === "render" ? "render" : "photo");
    setPrefSafeMode(safe === "false" ? false : true);

    // Fetch usage stats (total generated prompts) for this user
    if (userId) {
      supabase
        .from("generated_prompts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .then(({ count }) => {
          setPromptCount(typeof count === "number" ? count : 0);
        });

      // Fetch admin flag for this user to show Admin action
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          setIsAdmin(!!data?.is_admin);
        });
    } else {
      setPromptCount(0);
      setIsAdmin(false);
    }
  }, [openSettings, userId]);

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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>User Settings</DialogTitle>
                    <DialogDescription>Manage your account, preferences, and plan.</DialogDescription>
                  </DialogHeader>

                  {/* User header */}
                  <div className="flex items-center gap-4 rounded-md border border-white/10 bg-slate-900/40 p-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={undefined} alt={email || "User"} />
                      <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-base font-semibold">{email}</div>
                      {memberSince && (
                        <div className="text-xs text-muted-foreground">Member Since: {memberSince}</div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="overview" className="mt-4">
                    <TabsList className="w-full flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                        <TabsTrigger value="subscription">Subscription</TabsTrigger>
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => { setOpenSettings(false); navigate("/admin"); }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition bg-transparent text-foreground hover:bg-white/5 border-white/10"
                          >
                            <Shield className="h-4 w-4" />
                            <span>Admin</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setOpenSettings(false); navigate("/profile"); }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition bg-transparent text-foreground hover:bg-white/5 border-white/10"
                        >
                          <UserIcon className="h-4 w-4" />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={onSignOut}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border transition bg-transparent text-foreground hover:bg-white/5 border-white/10"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
                          <UICardHeader>
                            <UICardTitle className="text-sm">Total Prompts Generated</UICardTitle>
                          </UICardHeader>
                          <UICardContent>
                            <div className="text-3xl font-bold">{promptCount}</div>
                            <div className="text-xs text-muted-foreground">Across all sessions</div>
                          </UICardContent>
                        </Card>

                        <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
                          <UICardHeader>
                            <UICardTitle className="text-sm">Theme</UICardTitle>
                          </UICardHeader>
                          <UICardContent>
                            <div className="rounded-md border border-white/10 p-2 bg-slate-900/40">
                              <ThemeToggle />
                            </div>
                          </UICardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4 mt-4">
                      <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
                        <UICardHeader>
                          <UICardTitle className="text-sm">Default Defaults</UICardTitle>
                        </UICardHeader>
                        <UICardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Default Medium</Label>
                            <RadioGroup
                              value={prefMedium}
                              onValueChange={(v) => {
                                const next = (v as "photo" | "render") || "photo";
                                setPrefMedium(next);
                                localStorage.setItem("pref_default_medium", next);
                              }}
                              className="flex gap-6"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="photo" id="pref-medium-photo" />
                                <Label htmlFor="pref-medium-photo">Photo</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="render" id="pref-medium-render" />
                                <Label htmlFor="pref-medium-render">Render</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="pref-safe">Default Safe Mode</Label>
                              <Switch
                                id="pref-safe"
                                checked={prefSafeMode}
                                onCheckedChange={(c) => {
                                  setPrefSafeMode(c);
                                  localStorage.setItem("pref_default_safemode", String(c));
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Safe mode filters sensitive accessories and tokens by default.
                            </span>
                          </div>
                        </UICardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="subscription" className="space-y-4 mt-4">
                      <Card className="bg-slate-900/50 backdrop-blur-md border border-white/10">
                        <UICardHeader>
                          <UICardTitle className="text-sm">Current Plan</UICardTitle>
                        </UICardHeader>
                        <UICardContent className="space-y-4">
                          <div className="text-base font-semibold">Free Tier</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" /> Advanced Negatives
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" /> Cloud Sync
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" /> Priority Support
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500">
                            Upgrade to Pro
                          </Button>
                        </UICardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
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