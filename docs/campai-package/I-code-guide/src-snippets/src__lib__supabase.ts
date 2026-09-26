// AI note: The single browser Supabase client. Accepts the publishable key under either variable name Bolt may inject. No secrets here, ever.
// Destination: src/lib/supabase.ts. Owner: Bolt creates it from this snippet in prompt H1; Claude Code may fix it while Bolt is idle.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// New key name first; Bolt's Supabase integration may still inject the legacy VITE_SUPABASE_ANON_KEY.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

if (!url || !key) {
  // Fail loudly in development; in production the ErrorBoundary shows a friendly message.
  throw new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY). Never put a secret key in a VITE_ variable.",
  );
}

if (key.startsWith("sb_secret_") || key.includes("service_role")) {
  throw new Error("A secret key was placed in the frontend environment. Remove it immediately and rotate it (Troubleshooting T14).");
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** The Edge Function name. One function, three operations. */
export const CAMPAIGN_AI_FUNCTION = "campaign-ai";
