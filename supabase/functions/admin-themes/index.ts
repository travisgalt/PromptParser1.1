import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ThemePayload = {
  id?: string;
  slug?: string;
  label?: string;
  description?: string | null;
  category?: string | null;
  enabled?: boolean;
  sort_order?: number;
  compatible_models?: string[];
  tag_mapping?: Record<string, unknown> | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData } = await supabase.auth.getUser();
  const callerId = userData?.user?.id;
  if (!callerId) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", callerId)
    .single();

  if (!adminCheck?.is_admin) {
    await supabase.from("audit_logs").insert({
      actor_user_id: callerId,
      action: "access_denied.themes",
      details: { reason: "Non-admin attempted themes admin action" },
    });
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { action, payload } = body as { action: string; payload: ThemePayload };

  if (!action) {
    return new Response(JSON.stringify({ error: "Missing action" }), { status: 400, headers: corsHeaders });
  }

  const logAudit = async (actionName: string, target?: Record<string, any>, details?: Record<string, any>) => {
    await supabase.from("audit_logs").insert({
      actor_user_id: callerId,
      action: actionName,
      target_resource: target ?? null,
      details: details ?? null,
    });
  };

  if (action === "create_theme") {
    const p = payload ?? {};
    if (!p.slug || !p.label) {
      await logAudit("theme.create.failed", undefined, { error: "slug and label required" });
      return new Response(JSON.stringify({ error: "slug and label required" }), { status: 400, headers: corsHeaders });
    }
    if (!Array.isArray(p.compatible_models) || p.compatible_models.length === 0) {
      await logAudit("theme.create.failed", undefined, { error: "At least one compatible model required" });
      return new Response(JSON.stringify({ error: "At least one compatible model required" }), { status: 400, headers: corsHeaders });
    }
    const { data: existing } = await supabase.from("themes").select("id").eq("slug", p.slug).maybeSingle();
    if (existing) {
      await logAudit("theme.create.failed", undefined, { error: "Slug already exists", slug: p.slug });
      return new Response(JSON.stringify({ error: "Slug already exists" }), { status: 409, headers: corsHeaders });
    }

    const insertPayload = {
      slug: p.slug,
      label: p.label,
      description: p.description ?? null,
      category: p.category ?? null,
      enabled: p.enabled ?? true,
      sort_order: typeof p.sort_order === "number" ? p.sort_order : 0,
      compatible_models: p.compatible_models,
      tag_mapping: p.tag_mapping ?? null,
      created_by: callerId,
      updated_by: callerId,
    };

    const { data, error } = await supabase.from("themes").insert(insertPayload).select("*").single();
    if (error) {
      await logAudit("theme.create.failed", undefined, { error: error.message, payload: insertPayload });
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    await logAudit("theme.create", { type: "theme", id: data.id, slug: data.slug }, { after: data });
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "update_theme") {
    const p = payload ?? {};
    if (!p.id) {
      await logAudit("theme.update.failed", undefined, { error: "id required" });
      return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: corsHeaders });
    }

    const { data: before } = await supabase.from("themes").select("*").eq("id", p.id).single();
    if (!before) {
      await logAudit("theme.update.failed", { type: "theme", id: p.id }, { error: "Theme not found" });
      return new Response(JSON.stringify({ error: "Theme not found" }), { status: 404, headers: corsHeaders });
    }

    const patch: Record<string, any> = { updated_by: callerId };
    for (const key of ["slug","label","description","category","enabled","sort_order","compatible_models","tag_mapping"] as const) {
      if (p[key] !== undefined) patch[key] = p[key] as any;
    }

    const { data: after, error } = await supabase.from("themes").update(patch).eq("id", p.id).select("*").single();
    if (error) {
      await logAudit("theme.update.failed", { type: "theme", id: p.id }, { error: error.message, patch });
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    await logAudit("theme.update", { type: "theme", id: p.id }, { before, after, changed_fields: Object.keys(patch) });
    return new Response(JSON.stringify({ ok: true, data: after }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "toggle_enable") {
    const p = payload ?? {};
    if (!p.id || p.enabled === undefined) {
      await logAudit("theme.enable_toggle.failed", undefined, { error: "id and enabled required" });
      return new Response(JSON.stringify({ error: "id and enabled required" }), { status: 400, headers: corsHeaders });
    }
    const { data: before } = await supabase.from("themes").select("id, enabled").eq("id", p.id).single();

    const { data: after, error } = await supabase
      .from("themes")
      .update({ enabled: p.enabled, updated_by: callerId })
      .eq("id", p.id)
      .select("*")
      .single();

    if (error) {
      await logAudit("theme.enable_toggle.failed", { type: "theme", id: p.id }, { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    await logAudit(p.enabled ? "theme.enable" : "theme.disable", { type: "theme", id: p.id }, { before, after });
    return new Response(JSON.stringify({ ok: true, data: after }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "delete_theme") {
    const p = payload ?? {};
    if (!p.id) {
      await logAudit("theme.delete.failed", undefined, { error: "id required" });
      return new Response(JSON.stringify({ error: "id required" }), { status: 400, headers: corsHeaders });
    }
    const { data: before } = await supabase.from("themes").select("*").eq("id", p.id).single();

    const { error } = await supabase.from("themes").delete().eq("id", p.id);
    if (error) {
      await logAudit("theme.delete.failed", { type: "theme", id: p.id }, { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    await logAudit("theme.delete", { type: "theme", id: p.id }, { before });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });
});