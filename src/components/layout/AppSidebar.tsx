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
import { Settings, Lock, Shield, User as UserIcon, LogOut, Trash2, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
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

  // FIX: Add missing preferences state
  const [prefMedium, setPrefMedium] = React.useState<"photo" | "render">("photo");
  const [prefSafeMode, setPrefSafeMode] = React.useState<boolean>(true);

  // ADDED: global preferences local state
  const [globalNegative, setGlobalNegative] = React.useState<string>("");
  const [autoSaveImages, setAutoSaveImages] = React.useState<boolean>(false);
  const [privacyBlur, setPrivacyBlur] = React.useState<boolean>(false);
  const [confirmClearOpen, setConfirmClearOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!openSettings) return;

    // Load preferences from localStorage when modal opens
    const medium = (localStorage.getItem("pref_default_medium") as "photo" | "render") || "photo";
    const safe = localStorage.getItem("pref_default_safemode");
    setPrefMedium(medium === "render" ? "render" : "photo");
    setPrefSafeMode(safe === "false" ? false : true);

    // Load global generation preferences
    setGlobalNegative(localStorage.getItem("generator:global_negative") || "");
    setAutoSaveImages(localStorage.getItem("generator:auto_save_images") === "true");
    setPrivacyBlur(localStorage.getItem("generator:privacy_blur") === "true");

    // Fetch usage stats (total generated prompts) and admin flag
    if (userId) {
      supabase
        .from("generated_prompts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .then(({ count }) => {
          setPromptCount(typeof count === "number" ? count : 0);
        });

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

  // ADDED: handlers for storage management
  const clearHistory = async () => {
    if (userId) {
      await supabase.from("generated_prompts").delete().eq("user_id", userId);
      window.dispatchEvent(new CustomEvent("generator:history_update"));
    } else {
      localStorage.removeItem("generator:history");
      window.dispatchEvent(new CustomEvent("generator:history_update"));
    }
    setConfirmClearOpen(false);
  };

  const exportAllPrompts = async () => {
    let records: any[] = [];
    if (userId) {
      const { data } = await supabase
        .from("generated_prompts")
        .select("id, positive_prompt, negative_prompt, settings, created_at")
        .order("created_at", { ascending: false });
      records = data || [];
    } else {
      try {
        const raw = localStorage.getItem("generator:history");
        const parsed = raw ? JSON.parse(raw) : [];
        records = parsed;
      } catch {
        records = [];
      }
    }
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts_export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

                  {/* Profile Header (full width, gradient) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 rounded-md border border-white/10 p-4 bg-gradient-to-r from-gray-900 to-gray-800">
                      <div className="flex items-center gap-4">
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
                    </div>

                    {/* Stats Card - premium style */}
                    <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 border-l-4 border-purple-500">
                      <UICardHeader>
                        <UICardTitle className="text-sm">Total Prompts Generated</UICardTitle>
                      </UICardHeader>
                      <UICardContent>
                        <div className="text-3xl font-bold">{promptCount}</div>
                        <div className="text-xs text-muted-foreground">Across all sessions</div>
                      </UICardContent>
                    </Card>

                    {/* Global Generation Preferences */}
                    <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 md:col-span-2">
                      <UICardHeader>
                        <UICardTitle className="text-sm">Global Generation Preferences</UICardTitle>
                      </UICardHeader>
                      <UICardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Global Negative Prompt</Label>
                          <Textarea
                            placeholder="e.g., nsfw, low quality, bad hands"
                            value={globalNegative}
                            onChange={(e) => {
                              const v = e.target.value;
                              setGlobalNegative(v);
                              localStorage.setItem("generator:global_negative", v);
                            }}
                            className="min-h-[100px] bg-slate-900 border-slate-700 text-white"
                          />
                          <div className="text-xs text-muted-foreground">
                            This base negative will be applied automatically to new sessions.
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Auto-save generated images to history</Label>
                          <Switch
                            checked={autoSaveImages}
                            onCheckedChange={(c) => {
                              setAutoSaveImages(c);
                              localStorage.setItem("generator:auto_save_images", String(c));
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Blur items in Recent History sidebar</Label>
                          <Switch
                            checked={privacyBlur}
                            onCheckedChange={(c) => {
                              setPrivacyBlur(c);
                              localStorage.setItem("generator:privacy_blur", String(c));
                              // Broadcast to update sidebar rendering
                              window.dispatchEvent(new CustomEvent("generator:history_update"));
                            }}
                          />
                        </div>
                      </UICardContent>
                    </Card>

                    {/* Data & Storage */}
                    <Card className="bg-slate-900/60 backdrop-blur-md border border-white/10 md:col-span-2">
                      <UICardHeader>
                        <UICardTitle className="text-sm">Data & Storage</UICardTitle>
                      </UICardHeader>
                      <UICardContent className="flex flex-wrap gap-3">
                        <Button
                          variant="destructive"
                          onClick={() => setConfirmClearOpen(true)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Clear Generation History
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={exportAllPrompts}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" /> Export All Prompts
                        </Button>
                      </UICardContent>
                    </Card>
                  </div>

                  {/* Tabs: keep only content sections; remove Theme box */}
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
                      {/* We already rendered the grid above as the overview content */}
                      <div className="text-xs text-muted-foreground">
                        Overview includes profile, stats, global preferences, and storage tools.
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

                  {/* Clear History Confirmation */}
                  <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Generation History</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your recent generation history. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={clearHistory}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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