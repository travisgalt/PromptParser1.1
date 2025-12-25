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

export default function Admin() {
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.user?.id;

  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [profiles, setProfiles] = React.useState<ProfileRow[]>([]);
  const [negatives, setNegatives] = React.useState<NegKeyword[]>([]);
  const [newNeg, setNewNeg] = React.useState<{ keyword: string; category: string; weight: number }>({
    keyword: "",
    category: "misc",
    weight: 1.0,
  });

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
      return;
    }
    setNegatives((prev) => [data as NegKeyword, ...prev]);
    setNewNeg({ keyword: "", category: "misc", weight: 1.0 });
    showSuccess("Keyword added");
  };

  const updateNegative = async (id: string, patch: Partial<NegKeyword>) => {
    const { data, error } = await supabase.from("negative_keywords").update(patch).eq("id", id).select("*").single();
    if (error) {
      showError("Update failed");
      return;
    }
    setNegatives((prev) => prev.map((n) => (n.id === id ? (data as NegKeyword) : n)));
    showSuccess("Keyword updated");
  };

  const deleteNegative = async (id: string) => {
    const { error } = await supabase.from("negative_keywords").delete().eq("id", id);
    if (error) {
      showError("Delete failed");
      return;
    }
    setNegatives((prev) => prev.filter((n) => n.id !== id));
    showSuccess("Keyword deleted");
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
      </Tabs>
    </div>
  );
}