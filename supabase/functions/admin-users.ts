import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  // Create a client that can verify the JWT and also has service role for DB writes
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData } = await supabase.auth.getUser();
  const callerId = userData?.user?.id;
  if (!callerId) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  // Check admin
  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", callerId)
    .single();

  if (!adminCheck?.is_admin) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { action, target_user_id } = body as { action: string; target_user_id: string };

  if (!action || !target_user_id) {
    return new Response(JSON.stringify({ error: "Missing action or target_user_id" }), { status: 400, headers: corsHeaders });
  }

  // Perform action
  let patch: Record<string, any> | null = null;
  if (action === "grant_admin") patch = { is_admin: true };
  else if (action === "revoke_admin") patch = { is_admin: false };
  else if (action === "ban_user") patch = { is_banned: true };
  else if (action === "unban_user") patch = { is_banned: false };
  else {
    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });
  }

  const { error: upErr } = await supabase.from("profiles").update(patch).eq("id", target_user_id);
  if (upErr) {
    return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: corsHeaders });
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_user_id: callerId,
    action,
    target_user_id,
    details: { patch },
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});