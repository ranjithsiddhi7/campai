// AI note: campaign-ai Edge Function, CURRENT pattern: `withSupabase` from npm:@supabase/server handles auth, CORS and client creation.
// Destination: supabase/functions/campaign-ai/index.ts. Owner: Claude Code. If this pattern fails after 45 minutes of debugging, replace this file with edge-function-legacy/index.ts (Troubleshooting T4).

// Deno + Supabase Edge Runtime. Secrets used (never in the browser): OPENAI_API_KEY, OPENAI_MODEL, OPENAI_MODEL_LIGHT, AI_DAILY_LIMIT_PER_USER.
// SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY are injected by Supabase and read by withSupabase.

import { withSupabase } from "npm:@supabase/server@^1";
import { handleAiRequest } from "../_shared/handler.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    // withSupabase has already:
    //  - answered the CORS preflight (OPTIONS) and will add CORS headers to this response,
    //  - verified the caller's session token (auth: "user" rejects anonymous calls with 401),
    //  - built ctx.supabase (RLS-scoped, acts as the user) and ctx.supabaseAdmin (secret key, bypasses RLS).
    // NOTE (verified against @supabase/server 1.8.0 on 26 Sep 2026): the normalised user id is `ctx.userClaims.id`;
    // the raw JWT subject is `ctx.jwtClaims.sub`. The master prompt's `ctx.userClaims.sub` does not exist and fails type-checking.
    const userId = ctx.userClaims?.id ?? ctx.jwtClaims?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: { code: "unauthenticated", message: "Please sign in.", request_id: null } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return await handleAiRequest(req, {
      userId,
      userClient: ctx.supabase,
      adminClient: ctx.supabaseAdmin,
    });
  }),
};

/*
Local run:    supabase functions serve campaign-ai --env-file ./supabase/functions/.env
Deploy:       supabase functions deploy campaign-ai
Smoke test (replace <ref>, <user-jwt> from the browser's session, <campaign-id> owned by that user):
  curl -X POST "https://<ref>.supabase.co/functions/v1/campaign-ai" \
    -H "Authorization: Bearer <user-jwt>" -H "Content-Type: application/json" \
    -d '{"operation":"generate","request_id":"'"$(uuidgen)"'","campaign_id":"<campaign-id>"}'
Expected: 200 with { operation: "generate", plan_version: 1, plan: {...}, flags: [...], usage: {...} }
*/
