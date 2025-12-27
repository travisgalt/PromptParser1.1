"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/auth/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { models } from "@/lib/model-data";

// Types
type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  theme_preference: string | null;
  is_admin: boolean | null;
  is_banned: boolean | null;
};

type NegKeyword = {
  id: string;
  keyword: string;
  category: string;
  active: boolean;
  weight: number;
  created_at: string;
};

type StyleRow = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  category: string | null;
  enabled: boolean;
  sort_order: number;
  compatible_models: string[];
  tag_mapping: any | null;
  updated_at: string;
};

export default function Admin() {
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.user?.id;

  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [profiles, setProfiles] = React.useState<ProfileRow[]>([]);
  const [negatives, setNegatives] = React.useState<NegKeyword[]>([]);
  const [styles, setStyles] = React.useState<StyleRow[]>([]);
  const [newNeg, setNewNeg] = React.useState<{ keyword: string; category: string; weight: number }>({
    keyword: "",
    category: "misc",
    weight: 1.0,
  });
  const [newStyle, setNewStyle] = React.useState<Partial<StyleRow & { tag_mapping: any }>>({
    slug: "",
    label: "",
    description: "",
    category: "",
    enabled: true,
    sort_order: 0,
    compatible_models: [],
    tag_mapping: null,
  });

  // Generic audit helper (best effort)
  const logAudit = async (action: string, target?: any, details?: any) => {
    await supabase.functions.invoke("audit-events", {
      body: { action, target_resource: target, details }
    });
  };

  React.useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const self = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();

      const admin = !!self.data?.is_admin;
      setIsAdmin(admin);

      if (admin) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, bio, theme_preference, is_admin, is_banned")
          .order("updated_at", { ascending: false });
        setProfiles(profs || []);

        const { data: negs } = await supabase
          .from("negative_keywords")
          .select("*")
          .order("updated_at", { ascending: false });
        setNegatives(negs || []);

        const { data: stylesData } = await supabase
          .from("styles")
          .select("*")
          .order("sort_order", { ascending: true });
        setStyles(stylesData || []);
      }

      setLoading(false);
    }
    load();
  }, [userId]);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
          </CardHeader>
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
            <p className="text-sm text-muted-foreground">Your account does not have admin privileges.</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => navigate("/")}>Back Home</Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>View Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use edge function for admin/ban actions so we get server-side checks + audit logs
  const updateUser = async (id: string, patch: Partial<ProfileRow>) => {
    const action =
      patch.is_admin === true ? "grant_admin" :
      patch.is_admin === false ? "revoke_admin" :
      patch.is_banned === true ? "ban_user" :
      patch.is_banned === false ? "unban_user" : null;

    if (!action) return;

    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action, target_user_id: id },
    });

    if (error) {
      showError("Update failed");
      return;
    }

    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    showSuccess("Updated user via backend");
  };

  const addNegative = async () => {
    if (!newNeg.keyword.trim()) return;
    const payload = {
      keyword: newNeg.keyword.trim(),
      category: newNeg.category,
      weight: Number(newNeg.weight) || 1.0,
    };
    const { data, error } = await supabase.from("negative_keywords").insert(payload).select("*").single();
    if (error) {
      showError("Add failed");
      await logAudit("negative_keyword.create.failed", undefined, { error: error.message, payload });
      return;
    }
    setNegatives((prev) => [data as NegKeyword, ...prev]);
    setNewNeg({ keyword: "", category: "misc", weight: 1.0 });
    showSuccess("Keyword added");
    await logAudit("negative_keyword.create", { type: "negative_keyword", id: data.id }, { after: data });
  };

  const updateNegative = async (id: string, patch: Partial<NegKeyword>) => {
    const { data, error } = await supabase.from("negative_keywords").update(patch).eq("id", id).select("*").single();
    if (error) {
      showError("Update failed");
      await logAudit("negative_keyword.update.failed", { type: "negative_keyword", id }, { error: error.message, patch });
      return;
    }
    setNegatives((prev) => prev.map((n) => (n.id === id ? (data as NegKeyword) : n)));
    showSuccess("Keyword updated");
    await logAudit("negative_keyword.update", { type: "negative_keyword", id }, { after: data, changed_fields: Object.keys(patch) });
  };

  const deleteNegative = async (id: string) => {
    const before = negatives.find((n) => n.id === id);
    const { error } = await supabase.from("negative_keywords").delete().eq("id", id);
    if (error) {
      showError("Delete failed");
      await logAudit("negative_keyword.delete.failed", { type: "negative_keyword", id }, { error: error.message });
      return;
    }
    setNegatives((prev) => prev.filter((n) => n.id !== id));
    showSuccess("Keyword deleted");
    await logAudit("negative_keyword.delete", { type: "negative_keyword", id }, { before });
  };

  // Styles admin actions
  const createStyle = async () => {
    if (!newStyle.slug || !newStyle.label) {
      showError("Slug and label are required");
      return;
    }
    if (!newStyle.compatible_models || newStyle.compatible_models.length === 0) {
      showError("Select at least one compatible model");
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "create_style", payload: newStyle }
    });
    if (error || !data?.ok) {
      showError("Create failed");
      await logAudit("style.create.failed", undefined, { error: error?.message, payload: newStyle });
      return;
    }
    const created = data.data as StyleRow;
    setStyles((prev) => [...prev, created].sort((a,b) => a.sort_order - b.sort_order));
    setNewStyle({
      slug: "",
      label: "",
      description: "",
      category: "",
      enabled: true,
      sort_order: 0,
      compatible_models: [],
      tag_mapping: null,
    });
    showSuccess("Style created");
  };

  const updateStyle = async (id: string, patch: Partial<StyleRow>) => {
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "update_style", payload: { id, ...patch } }
    });
    if (error || !data?.ok) {
      showError("Update failed");
      await logAudit("style.update.failed", { type: "style", id }, { error: error?.message, patch });
      return;
    }
    const updated = data.data as StyleRow;
    setStyles((prev) => prev.map((s) => (s.id === id ? updated : s)).sort((a,b) => a.sort_order - b.sort_order));
    showSuccess("Style updated");
  };

  const toggleStyleEnabled = async (id: string, next: boolean) => {
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "toggle_enable", payload: { id, enabled: next } }
    });
    if (error || !data?.ok) {
      showError("Toggle failed");
      await logAudit("style.enable_toggle.failed", { type: "style", id }, { error: error?.message, enabled: next });
      return;
    }
    const updated = data.data as StyleRow;
    setStyles((prev) => prev.map((s) => (s.id === id ? updated : s)));
    showSuccess(next ? "Style enabled" : "Style disabled");
  };

  const deleteStyle = async (id: string) => {
    const { error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "delete_style", payload: { id } }
    });
    if (error) {
      showError("Delete failed");
      await logAudit("style.delete.failed", { type: "style", id }, { error: error.message });
      return;
    }
    setStyles((prev) => prev.filter((s) => s.id !== id));
    showSuccess("Style deleted");
    await logAudit("style.delete", { type: "style", id });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Badge variant="default">Admin</Badge>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="negatives">Negative Keywords</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Banned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.display_name || p.id}</TableCell>
                      <TableCell>
                        <Badge variant={p.is_admin ? "default" : "secondary"}>{p.is_admin ? "Yes" : "No"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_banned ? "destructive" : "secondary"}>{p.is_banned ? "Yes" : "No"}</Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updateUser(p.id, { is_admin: !p.is_admin })}>
                          {p.is_admin ? "Revoke Admin" : "Grant Admin"}
                        </Button>
                        <Button size="sm" variant={p.is_banned ? "secondary" : "destructive"} onClick={() => updateUser(p.id, { is_banned: !p.is_banned })}>
                          {p.is_banned ? "Unban" : "Ban"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negatives">
          <Card>
            <CardHeader>
              <CardTitle>Negative Keywords</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kw">Keyword</Label>
                  <Input id="kw" value={newNeg.keyword} onChange={(e) => setNewNeg({ ...newNeg, keyword: e.target.value })} placeholder="e.g., bad anatomy" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat">Category</Label>
                  <Input id="cat" value={newNeg.category} onChange={(e) => setNewNeg({ ...newNeg, category: e.target.value })} placeholder="artifacts | anatomy | exposure | composition | text | color | misc" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wt">Weight</Label>
                  <Input id="wt" type="number" step="0.1" value={newNeg.weight} onChange={(e) => setNewNeg({ ...newNeg, weight: Number(e.target.value || 1.0) })} />
                </div>
              </div>
              <Button onClick={addNegative}>Add Keyword</Button>

              <Separator />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {negatives.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="text-sm">{n.keyword}</TableCell>
                      <TableCell className="text-sm">{n.category}</TableCell>
                      <TableCell>
                        <Switch checked={n.active} onCheckedChange={(c) => updateNegative(n.id, { active: c })} />
                      </TableCell>
                      <TableCell className="w-32">
                        <Input type="number" step="0.1" value={n.weight} onChange={(e) => updateNegative(n.id, { weight: Number(e.target.value || 1.0) })} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="destructive" onClick={() => deleteNegative(n.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="styles">
          <Card>
            <CardHeader>
              <CardTitle>Styles Catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create new style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style-slug">Slug</Label>
                  <Input id="style-slug" value={newStyle.slug || ""} onChange={(e) => setNewStyle({ ...newStyle, slug: e.target.value.trim() })} placeholder="e.g., cel_shaded" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style-label">Label</Label>
                  <Input id="style-label" value={newStyle.label || ""} onChange={(e) => setNewStyle({ ...newStyle, label: e.target.value })} placeholder="Display name" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="style-desc">Description</Label>
                  <Input id="style-desc" value={(newStyle.description as string) || ""} onChange={(e) => setNewStyle({ ...newStyle, description: e.target.value })} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style-cat">Category</Label>
                  <Input id="style-cat" value={(newStyle.category as string) || ""} onChange={(e) => setNewStyle({ ...newStyle, category: e.target.value })} placeholder="e.g., illustration / 3d / photo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style-sort">Sort Order</Label>
                  <Input id="style-sort" type="number" value={Number(newStyle.sort_order || 0)} onChange={(e) => setNewStyle({ ...newStyle, sort_order: Number(e.target.value || 0) })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Compatible Models</Label>
                  <div className="flex flex-wrap gap-2">
                    {models.map((m) => {
                      const selected = (newStyle.compatible_models || []).includes(m.id);
                      return (
                        <Button
                          key={m.id}
                          variant={selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const set = new Set(newStyle.compatible_models || []);
                            if (selected) set.delete(m.id); else set.add(m.id);
                            setNewStyle({ ...newStyle, compatible_models: Array.from(set) });
                          }}
                        >
                          {m.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="style-tags">Tag Mapping (JSON)</Label>
                  <textarea
                    id="style-tags"
                    className="w-full min-h-[120px] rounded-md border border-white/10 bg-slate-900/60 p-2 text-sm text-slate-200"
                    placeholder='e.g., {"positive":["cel shaded","flat color"],"negative":[]}'
                    value={newStyle.tag_mapping ? JSON.stringify(newStyle.tag_mapping) : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      try {
                        const parsed = v.trim() ? JSON.parse(v) : null;
                        setNewStyle({ ...newStyle, tag_mapping: parsed });
                      } catch {
                        // Keep raw text to allow editing; make it null on invalid JSON
                        setNewStyle({ ...newStyle, tag_mapping: null });
                      }
                    }}
                  />
                  <div className="text-xs text-muted-foreground">
                    Provide structured tags that the engine can use. Positive/negative arrays are typical.
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Enabled</Label>
                    <Switch checked={!!newStyle.enabled} onCheckedChange={(c) => setNewStyle({ ...newStyle, enabled: c })} />
                  </div>
                </div>
              </div>
              <Button onClick={createStyle}>Create Style</Button>

              <Separator className="my-6" />

              {/* Styles list */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Compatible Models</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {styles.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{s.label}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.slug}</TableCell>
                      <TableCell className="text-sm">{s.category || "-"}</TableCell>
                      <TableCell className="w-24">
                        <Input
                          type="number"
                          value={s.sort_order}
                          onChange={(e) => updateStyle(s.id, { sort_order: Number(e.target.value || s.sort_order) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch checked={s.enabled} onCheckedChange={(c) => toggleStyleEnabled(s.id, c)} />
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <div className="flex flex-wrap gap-1">
                          {s.compatible_models.map((mid) => {
                            const m = models.find((x) => x.id === mid);
                            return <Badge key={mid} variant="secondary">{m ? m.name : mid}</Badge>;
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => updateStyle(s.id, { label: s.label + "" })}>Save</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteStyle(s.id)}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}