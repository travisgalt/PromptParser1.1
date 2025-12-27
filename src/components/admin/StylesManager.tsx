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
import { Shield, Plus, X, Wand2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { models } from "@/lib/model-data";

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

type EnabledFilter = "all" | "enabled" | "disabled";

const StylesManager: React.FC = () => {
  const [styles, setStyles] = React.useState<StyleRow[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState<string>("");
  const [filterModel, setFilterModel] = React.useState<string>("all");
  const [filterEnabled, setFilterEnabled] = React.useState<EnabledFilter>("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");

  // Create Style dialog state
  const [openCreate, setOpenCreate] = React.useState<boolean>(false);
  const [createPayload, setCreatePayload] = React.useState<{ slug: string; label: string; category?: string; description?: string; compatible_models: string[] }>({
    slug: "",
    label: "",
    category: "",
    description: "",
    compatible_models: [],
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = React.useState<StyleRow | null>(null);

  const loadStyles = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMsg("Failed to load styles. Check admin access or try again.");
      setStyles([]);
    } else {
      setStyles((data as any[]) || []);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    loadStyles();
  }, []);

  const uniqueCategories = React.useMemo(() => {
    const set = new Set<string>();
    styles.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ["all", ...Array.from(set)];
  }, [styles]);

  const filtered = React.useMemo(() => {
    return styles.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || s.label.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
      const matchesModel = filterModel === "all" || (Array.isArray(s.compatible_models) && s.compatible_models.includes(filterModel));
      const matchesEnabled =
        filterEnabled === "all" ? true :
        filterEnabled === "enabled" ? s.enabled :
        !s.enabled;
      const matchesCategory = filterCategory === "all" || (s.category ?? "") === filterCategory;
      return matchesSearch && matchesModel && matchesEnabled && matchesCategory;
    });
  }, [styles, search, filterModel, filterEnabled, filterCategory]);

  const toggleEnabled = async (row: StyleRow, next: boolean) => {
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "toggle_enable", payload: { id: row.id, enabled: next } },
    });
    if (error || !data?.ok) {
      showError("Toggle failed");
      return;
    }
    const updated = data.data as StyleRow;
    setStyles((prev) => prev.map((s) => (s.id === row.id ? updated : s)));
    showSuccess(next ? "Style enabled" : "Style disabled");
  };

  const deleteStyle = async (row: StyleRow) => {
    const { error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "delete_style", payload: { id: row.id } },
    });
    if (error) {
      showError("Delete failed");
      return;
    }
    setStyles((prev) => prev.filter((s) => s.id !== row.id));
    setDeleteTarget(null);
    showSuccess("Style deleted");
  };

  const duplicateStyle = async (row: StyleRow) => {
    // Generate a unique slug
    const baseSlug = row.slug;
    let newSlug = `${baseSlug}-copy`;
    let counter = 1;
    while (styles.some((s) => s.slug === newSlug)) {
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
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "create_style", payload },
    });
    if (error || !data?.ok) {
      showError("Duplicate failed");
      return;
    }
    const created = data.data as StyleRow;
    setStyles((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
    showSuccess("Style duplicated");
  };

  const toggleModelCompat = async (row: StyleRow, modelId: string) => {
    const set = new Set(row.compatible_models || []);
    if (set.has(modelId)) set.delete(modelId);
    else set.add(modelId);
    const nextList = Array.from(set);
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "update_style", payload: { id: row.id, compatible_models: nextList } },
    });
    if (error || !data?.ok) {
      showError("Update failed");
      return;
    }
    const updated = data.data as StyleRow;
    setStyles((prev) => prev.map((s) => (s.id === row.id ? updated : s)));
    showSuccess("Compatibility updated");
  };

  const importDefaults = async () => {
    // Import basic entries from static list with all models compatible
    const { stylesList } = await import("@/lib/prompt-data");
    const compatible = models.map((m) => m.id);
    let createdCount = 0;
    for (const slug of stylesList) {
      try {
        const { data, error } = await supabase.functions.invoke("admin-styles", {
          body: {
            action: "create_style",
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
          const created = data.data as StyleRow;
          setStyles((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
        }
      } catch {
        // skip on failure
      }
    }
    showSuccess(`Imported ${createdCount} styles`);
  };

  const onCreateSave = async () => {
    if (!createPayload.slug || !createPayload.label || createPayload.compatible_models.length === 0) {
      showError("Slug, label, and at least one model are required");
      return;
    }
    const { data, error } = await supabase.functions.invoke("admin-styles", {
      body: { action: "create_style", payload: createPayload },
    });
    if (error || !data?.ok) {
      showError("Create failed");
      return;
    }
    const created = data.data as StyleRow;
    setStyles((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
    setOpenCreate(false);
    setCreatePayload({ slug: "", label: "", category: "", description: "", compatible_models: [] });
    showSuccess("Style created");
  };

  return (
    <div className="space-y-4">
      {/* Header actions: search, filters, global + menu */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search styles (label or slug)"
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
              <DropdownMenuItem onClick={() => setOpenCreate(true)}>Create Style</DropdownMenuItem>
              <DropdownMenuItem onClick={importDefaults}>Import Defaults</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={loadStyles}>Refresh List</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Empty / error / loading states */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading styles…</div>
      ) : errorMsg ? (
        <div className="text-sm text-red-400">{errorMsg}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-white/10 bg-slate-900/40 p-4 text-sm text-muted-foreground">
          No styles found. Try clearing filters, or use “Add → Create Style” or “Add → Import Defaults”.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="bg-slate-800 border border-white/10">
              <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm">{s.label}</CardTitle>
                  <div className="text-xs text-muted-foreground">Slug: {s.slug}</div>
                  <div className="flex items-center gap-2">
                    {s.category ? <Badge variant="secondary">{s.category}</Badge> : null}
                    <Badge variant={s.enabled ? "default" : "secondary"}>{s.enabled ? "Enabled" : "Disabled"}</Badge>
                    <div className="text-[10px] text-muted-foreground">Updated {new Date(s.updated_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Per-style + menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Options
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Edit Style</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => duplicateStyle(s)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Compatibility</DropdownMenuLabel>
                      {models.map((m) => {
                        const active = (s.compatible_models || []).includes(m.id);
                        return (
                          <DropdownMenuItem key={m.id} onClick={() => toggleModelCompat(s, m.id)}>
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
                    onClick={() => setDeleteTarget(s)}
                    className="gap-1"
                    aria-label="Delete Style"
                    title="Delete Style"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Enabled toggle */}
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch checked={s.enabled} onCheckedChange={(c) => toggleEnabled(s, c)} />
                </div>

                {/* Compatible models chips */}
                <div className="space-y-1">
                  <Label className="text-xs">Compatible Models</Label>
                  <div className="flex flex-wrap gap-1">
                    {(s.compatible_models || []).map((mid) => {
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
                {s.description ? (
                  <div className="text-xs text-muted-foreground">Desc: {s.description}</div>
                ) : null}
                {s.tag_mapping ? (
                  <div className="text-[11px] text-muted-foreground line-clamp-3">
                    Tags: {JSON.stringify(s.tag_mapping)}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Style dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg bg-slate-900/90 border border-white/10">
          <DialogHeader>
            <DialogTitle>Create Style</DialogTitle>
            <DialogDescription>Define basics and compatibility. You can edit tag mapping later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input
                value={createPayload.slug}
                onChange={(e) => setCreatePayload((p) => ({ ...p, slug: e.target.value.trim() }))}
                placeholder="e.g., cel_shaded"
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
                placeholder="e.g., illustration / 3d / photo"
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
            <AlertDialogTitle>Delete Style</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleteTarget?.label}”. You can disable instead if you want to keep it hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteStyle(deleteTarget)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StylesManager;