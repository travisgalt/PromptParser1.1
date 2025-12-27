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
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  let actorId: string | null = null;
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const supabaseAuth = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabaseAuth.auth.getUser();
    actorId = userData?.user?.id ?? null;
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }

  const { action, target_resource, details } = body ?? {};
  if (!action) {
    return new Response(JSON.stringify({ error: "Missing action" }), { status: 400, headers: corsHeaders });
  }

  await supabase.from("audit_logs").insert({
    actor_user_id: actorId,
    action,
    target_resource: target_resource ?? null,
    details: details ?? null,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});