"use client";

import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { models } from "@/lib/model-data";
import { themesList } from "@/lib/prompt-data";

type ThemeRow = {
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

type EnabledFilter = "all" | "enabled" | "disabled";

const ThemesManager: React.FC = () => {
  const [themes, setThemes] = React.useState<ThemeRow[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState<string>("");
  const [filterModel, setFilterModel] = React.useState<string>("all");
  const [filterEnabled, setFilterEnabled] = React.useState<EnabledFilter>("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");

  // Create Theme dialog
  const [openCreate, setOpenCreate] = React.useState<boolean>(false);
  const [createPayload, setCreatePayload] = React.useState<{ slug: string; label: string; category?: string; description?: string; compatible_models: string[] }>({
    slug: "",
    label: "",
    category: "",
    description: "",
    compatible_models: [],
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<ThemeRow | null>(null);

  const loadThemes = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("themes")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMsg("Failed to load themes. Check admin access or try again.");
      setThemes([]);
    } else {
      setThemes((data as any[]) || []);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    loadThemes();
  }, []);

  const uniqueCategories = React.useMemo(() => {
    const set = new Set<string>();
    themes.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ["all", ...Array.from(set)];
  }, [themes]);

  const filtered = React.useMemo(() => {
    return themes.filter((t) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || t.label.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
      const matchesModel = filterModel === "all" || (Array.isArray(t.compatible_models) && t.compatible_models.includes(filterModel));
      const matchesEnabled =
        filterEnabled === "all" ? true :
        filterEnabled === "enabled" ? t.enabled :
        !t.enabled;
      const matchesCategory = filterCategory === "all" || (t.category ?? "") === filterCategory;
      return matchesSearch && matchesModel && matchesEnabled && matchesCategory;
    });
  }, [themes, search, filterModel, filterEnabled, filterCategory]);

  const toggleEnabled = async (row: ThemeRow, next: boolean) => {
    const { data, error } = await supabase.functions.invoke("admin-themes", {
      body: { action: "toggle_enable", payload: { id: row.id, enabled: next } },
    });
    if (error || !data?.ok) {
      showError("Toggle failed");
      return;
    }
    const updated = data.data as ThemeRow;
    setThemes((prev) => prev.map((t) => (t.id === row.id ? updated : t)));
    showSuccess(next ? "Theme enabled" : "Theme disabled");
  };

  const deleteTheme = async (row: ThemeRow) => {
    const { error } = await supabase.functions.invoke("admin-themes", {
      body: { action: "delete_theme", payload: { id: row.id } },
    });
    if (error) {
      showError("Delete failed");
      return;
    }
    setThemes((prev) => prev.filter((t) => t.id !== row.id));
    setDeleteTarget(null);
    showSuccess("Theme deleted");
  };

  const duplicateTheme = async (row: ThemeRow) => {
    const baseSlug = row.slug;
    let newSlug = `${baseSlug}-copy`;
    let counter = 1;
    while (themes.some((t) => t.slug === newSlug)) {
      newSlug = `${baseSlug}-copy-${counter++}`;
    }
    const payload = {
      slug: newSlug,
      label: `${row.label} (Copy)`,
      description: row.description,
      category: row.category,
      enabled: row.enabled,
      sort_order: row.sort_order,
      compatible_models: row.compatible_models,
      tag_mapping: row.tag_mapping,
    };
    const { data, error } = await supabase.functions.invoke("admin-themes", {
      body: { action: "create_theme", payload },
    });
    if (error || !data?.ok) {
      showError("Duplicate failed");
      return;
    }
    const created = data.data as ThemeRow;
    setThemes((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
    showSuccess("Theme duplicated");
  };

  const toggleModelCompat = async (row: ThemeRow, modelId: string) => {
    const set = new Set(row.compatible_models || []);
    if (set.has(modelId)) set.delete(modelId);
    else set.add(modelId);
    const nextList = Array.from(set);
    const { data, error } = await supabase.functions.invoke("admin-themes", {
      body: { action: "update_theme", payload: { id: row.id, compatible_models: nextList } },
    });
    if (error || !data?.ok) {
      showError("Update failed");
      return;
    }
    const updated = data.data as ThemeRow;
    setThemes((prev) => prev.map((t) => (t.id === row.id ? updated : t)));
    showSuccess("Compatibility updated");
  };

  const importDefaults = async () => {
    const compatible = models.map((m) => m.id);
    let createdCount = 0;
    for (const slug of themesList) {
      try {
        const { data, error } = await supabase.functions.invoke("admin-themes", {
          body: {
            action: "create_theme",
            payload: {
              slug,
              label: slug.replace(/_/g, " "),
              category: "general",
              enabled: true,
              sort_order: 0,
              compatible_models: compatible,
              tag_mapping: null,
            },
          },
        });
        if (!error && data?.ok) {
          createdCount++;
          const created = data.data as ThemeRow;
          setThemes((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        }
      } catch {
        // skip failed item
      }
    }
    showSuccess(`Imported ${createdCount} themes`);
  };

  const onCreateSave = async () => {
    if (!createPayload.slug || !createPayload.label || createPayload.compatible_models.length === 0) {
      showError("Slug, label, and at least one model are required");
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-themes", {
      body: { action: "create_theme", payload: createPayload },
    });
    if (error || !data?.ok) {
      showError("Create failed");
      return;
    }
    const created = data.data as ThemeRow;
    setThemes((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
    setOpenCreate(false);
    setCreatePayload({ slug: "", label: "", category: "", description: "", compatible_models: [] });
    showSuccess("Theme created");
  };

  return (
    <div className="space-y-4">
      {/* Header: search, filters, global + */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search themes (label or slug)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Separator orientation="vertical" className="hidden md:block h-8" />
          <div className="flex items-center gap-2">
            <Label className="text-xs">Model</Label>
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="text-sm rounded-md bg-slate-900 border border-white/10 px-2 py-1"
            >
              <option value="all">All</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Enabled</Label>
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value as EnabledFilter)}
              className="text-sm rounded-md bg-slate-900 border border-white/10 px-2 py-1"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Category</Label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm rounded-md bg-slate-900 border border-white/10 px-2 py-1"
            >
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {filterModel !== "all" || filterEnabled !== "all" || filterCategory !== "all" || search.trim() !== "" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setFilterModel("all"); setFilterEnabled("all"); setFilterCategory("all"); }}
              className="text-xs"
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenCreate(true)}>Create Theme</DropdownMenuItem>
              <DropdownMenuItem onClick={importDefaults}>Import Defaults</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={loadThemes}>Refresh List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading themes…</div>
      ) : errorMsg ? (
        <div className="text-sm text-red-400">{errorMsg}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-slate-900/40 p-4 text-sm text-muted-foreground">
          No themes found. Try clearing filters, or use “Add → Create Theme” or “Add → Import Defaults”.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="bg-slate-800 border border-white/10">
              <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm">{t.label}</CardTitle>
                  <div className="text-xs text-muted-foreground">Slug: {t.slug}</div>
                  <div className="flex items-center gap-2">
                    {t.category ? <Badge variant="secondary">{t.category}</Badge> : null}
                    <Badge variant={t.enabled ? "default" : "secondary"}>{t.enabled ? "Enabled" : "Disabled"}</Badge>
                    <div className="text-[10px] text-muted-foreground">Updated {new Date(t.updated_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Per-theme + menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Options
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Edit Theme</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => duplicateTheme(t)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Compatibility</DropdownMenuLabel>
                      {models.map((m) => {
                        const active = (t.compatible_models || []).includes(m.id);
                        return (
                          <DropdownMenuItem key={m.id} onClick={() => toggleModelCompat(t, m.id)}>
                            {active ? "Remove from " : "Add to "} {m.name}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* X delete */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteTarget(t)}
                    className="gap-1"
                    aria-label="Delete Theme"
                    title="Delete Theme"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Enabled toggle */}
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch checked={t.enabled} onCheckedChange={(c) => toggleEnabled(t, c)} />
                </div>

                {/* Compatible models chips */}
                <div className="space-y-1">
                  <Label className="text-xs">Compatible Models</Label>
                  <div className="flex flex-wrap gap-1">
                    {(t.compatible_models || []).map((mid) => {
                      const m = models.find((x) => x.id === mid);
                      return (
                        <Badge key={mid} variant="secondary">
                          {m ? m.name : mid}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Description and mapping (preview-only text) */}
                {t.description ? (
                  <div className="text-xs text-muted-foreground">Desc: {t.description}</div>
                ) : null}
                {t.tag_mapping ? (
                  <div className="text-[11px] text-muted-foreground line-clamp-3">
                    Tags: {JSON.stringify(t.tag_mapping)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Theme dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg bg-slate-900/90 border border-white/10">
          <DialogHeader>
            <DialogTitle>Create Theme</DialogTitle>
            <DialogDescription>Define basics and compatibility. You can edit mappings later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={createPayload.slug}
                onChange={(e) => setCreatePayload((p) => ({ ...p, slug: e.target.value.trim() }))}
                placeholder="e.g., cyberpunk"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input
                value={createPayload.label}
                onChange={(e) => setCreatePayload((p) => ({ ...p, label: e.target.value }))}
                placeholder="Display name"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input
                value={createPayload.category ?? ""}
                onChange={(e) => setCreatePayload((p) => ({ ...p, category: e.target.value }))}
                placeholder="e.g., historical / sci-fi / atmospheric"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={createPayload.description ?? ""}
                onChange={(e) => setCreatePayload((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional"
                className="bg-slate-900 border-slate-700 text-white min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Compatible Models</Label>
              <div className="flex flex-wrap gap-2">
                {models.map((m) => {
                  const selected = (createPayload.compatible_models || []).includes(m.id);
                  return (
                    <Button
                      key={m.id}
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const set = new Set(createPayload.compatible_models || []);
                        if (selected) set.delete(m.id); else set.add(m.id);
                        setCreatePayload((p) => ({ ...p, compatible_models: Array.from(set) }));
                      }}
                    >
                      {m.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button onClick={onCreateSave}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleteTarget?.label}”. You can disable instead if you want to keep it hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteTheme(deleteTarget)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThemesManager;