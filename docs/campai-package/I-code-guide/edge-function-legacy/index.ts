// AI note: campaign-ai Edge Function, LEGACY fallback pattern: Deno.serve, clients built by hand from the Authorization header, explicit CORS.
// Destination: supabase/functions/campaign-ai/index.ts (replacing the withSupabase version). Owner: Claude Code. Record the switch in CLAUDE.md ("Edge Function pattern in use").

// Same security design as the withSupabase version: the user-scoped client reads the campaign (RLS proves ownership; a miss is a 404),
// the secret-key client is used only for the ledger and pricing. Nothing else changes; _shared/handler.ts is identical.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleAiRequest } from "../_shared/handler.ts";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonError(code: string, message: string, status: number): Response {
  return new Response(JSON.stringify({ error: { code, message, request_id: null } }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // 1. CORS preflight: must return the headers, or the browser blocks the real request (Troubleshooting T1).
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  // New key names first; legacy names accepted so an older project still works.
  const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !publishableKey || !secretKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY in the function environment");
    return jsonError("internal_error", "Something went wrong. Please try again.", 500);
  }

  // 2. The signed-in user's token, attached automatically by supabase.functions.invoke() in the browser.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return jsonError("unauthenticated", "Please sign in.", 401);

  // 3. User-scoped client: every query runs under Row Level Security as this user.
  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData?.user) return jsonError("unauthenticated", "Please sign in.", 401);

  // 4. Admin client: secret key, bypasses RLS. Only for ai_usage_events and ai_model_pricing.
  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // 5. Shared handler adds the CORS headers to every response, including errors.
  return await handleAiRequest(req, {
    userId: userData.user.id,
    userClient,
    adminClient,
    responseHeaders: CORS_HEADERS,
  });
});

/*
Local run:    supabase functions serve campaign-ai --env-file ./supabase/functions/.env
Deploy:       supabase functions deploy campaign-ai
Smoke test:   same curl as in edge-function-withsupabase/index.ts
*/
