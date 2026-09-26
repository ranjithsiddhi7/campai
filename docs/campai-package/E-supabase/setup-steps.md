<!-- AI note: Step-by-step Supabase setup for campAI: project, auth settings, keys, CLI, migration, secrets, Edge Function, seed data, local and deployed testing.
     Owner: Claude Code (docs). Bolt never edits this. Humans follow it in execution order. -->

# E-supabase/setup-steps.md — Supabase setup, in execution order

Each step names the platform it happens on. Expand once: CLI = Command-Line Interface; RLS = Row Level Security; JWT = JSON Web Token; URL = Uniform Resource Locator; API = Application Programming Interface.

## Part 1 — Create the project (Supabase Dashboard, 10 minutes)

1. **Supabase Dashboard** → New project. Name `campai`, region closest to your demo audience (Singapore for the café scenario), a strong database password saved in the team password manager. Free plan is enough for the hackathon.
2. Wait for "Project is ready". Note the **Project ref** (the 20-character id in the URL, `https://supabase.com/dashboard/project/<ref>`).
3. **Project Settings → API keys**. You will see two kinds of keys:
   - **Publishable key** `sb_publishable_…` → goes in the browser as `VITE_SUPABASE_PUBLISHABLE_KEY`. Safe to expose; RLS protects data.
   - **Secret key** `sb_secret_…` → **never** leaves the server. Edge Functions receive it automatically as `SUPABASE_SECRET_KEY` (the `@supabase/server` helper reads it); you do not paste it anywhere in the frontend or in Bolt.
   - The legacy `anon` and `service_role` JWT keys are shown under a "Legacy" tab. Do not use them for new work (deprecated end of 2026). If Bolt's integration injects `VITE_SUPABASE_ANON_KEY`, the frontend accepts it (see `I-code-guide/src-snippets/src__lib__supabase.ts`).
4. **Project Settings → Data API**: confirm the **Project URL** `https://<ref>.supabase.co` → `VITE_SUPABASE_URL`.

## Part 2 — Authentication settings (Supabase Dashboard, 5 minutes)

5. **Authentication → Sign In / Providers → Email**: Email provider enabled. **Turn OFF "Confirm email"** so sign-up is instant during the hackathon and demo.
   - *To turn it back on after the hackathon:* the same toggle; also set up a custom SMTP (Simple Mail Transfer Protocol) sender under **Authentication → Emails → SMTP settings**, because the built-in sender is rate-limited to a few emails per hour.
6. **Authentication → URL Configuration**:
   - Site URL: your Bolt hosting URL, for example `https://campai.bolt.host` (use `http://localhost:5173` until you have deployed).
   - Redirect URLs: add `http://localhost:5173/**`, `https://*.bolt.host/**`, and your final Bolt URL with `/**`.
   - Email + password sign-in does not need redirects to work, but password-reset links do; adding them now avoids a later surprise.
7. **Authentication → Rate Limits**: leave defaults. **Authentication → Attack protection**: leave "Prevent use of leaked passwords" off for the demo (it blocks simple demo passwords) and note to turn it on later.

## Part 3 — Install the CLI and link (terminal on ONE teammate's laptop, 10 minutes)

8. **Terminal**: install the Supabase CLI.
   - macOS: `brew install supabase/tap/supabase`
   - Windows (PowerShell): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` then `scoop install supabase`
   - Any OS with Node: `npx supabase --version` (use `npx supabase` in place of `supabase` in every command below)
9. **Terminal**, inside the cloned GitHub repository root:
   ```bash
   supabase login                      # opens the browser, creates an access token
   supabase init                       # creates supabase/ (skip if the folder already exists)
   supabase link --project-ref <ref>   # asks for the database password from step 1
   ```
10. Add to `.gitignore` (Claude Code does this in the first session):
    ```
    supabase/.env
    supabase/functions/.env
    supabase/.env.production
    .env
    .env.local
    ```

## Part 4 — Apply the migration (Supabase CLI, 5 minutes)

11. Copy `E-supabase/migration.sql` to `supabase/migrations/20260926000000_campai_init.sql` (Claude Code does this).
12. **Terminal**: `supabase db push`. Expected: "Applying migration 20260926000000_campai_init.sql… Finished supabase db push." One NOTICE that trigger `on_auth_user_created` does not exist is normal on a fresh project.
13. **Supabase Dashboard → Table Editor**: you should see `profiles`, `campaigns`, `campaign_briefs`, `campaign_plans`, `calendar_items`, `campaign_revisions`, `ai_usage_events`, `ai_model_pricing` (two rows). **Dashboard → Authentication → Policies**: every table shows RLS enabled with the policies from the migration.
14. Alternative without CLI: paste the whole of `migration.sql` into **Dashboard → SQL Editor** → Run. Use this only if the CLI is blocked; the CLI keeps migrations in Git.

## Part 5 — Secrets for the Edge Function (Supabase CLI or Dashboard, 5 minutes)

15. **OpenAI Dashboard** (platform.openai.com) → API keys → Create new secret key, named `campai-hackathon`, project-scoped. Copy it once. **Billing** → add at least US$10 prepaid credit and set a monthly budget limit of, say, US$20.
16. **Terminal**: create `supabase/.env.production` (git-ignored) with:
    ```
    OPENAI_API_KEY=sk-...
    OPENAI_MODEL=gpt-6-sol
    OPENAI_MODEL_LIGHT=gpt-6-luna
    AI_DAILY_LIMIT_PER_USER=25
    ```
    then `supabase secrets set --env-file ./supabase/.env.production` and verify with `supabase secrets list` (values are hidden; names must appear).
    - Or **Dashboard → Edge Functions → Secrets** → add the four names by hand.
    - Secret names must not start with `SUPABASE_` (those are reserved and injected automatically: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`).
17. For local development, copy the same four lines into `supabase/functions/.env` (git-ignored). `supabase functions serve` loads it automatically.

## Part 6 — Deploy the Edge Function (Supabase CLI, 5 minutes)

18. Claude Code creates `supabase/functions/campaign-ai/index.ts` from `I-code-guide/edge-function-withsupabase/index.ts`, plus `supabase/functions/_shared/` files (`types.ts`, `schemas.ts`, `validation.ts`, `normalise.ts`, `prompts.ts`, `openai.ts`).
19. **Terminal**: `supabase functions deploy campaign-ai`. Expected: "Deployed Functions on project <ref>: campaign-ai". JWT verification: the function verifies the user itself (`withSupabase({ auth: 'user' })` or the legacy manual check), so deploy with the default settings; if your CLI version asks, keep `verify_jwt` **on** for the current pattern and set `--no-verify-jwt` only if you are using the publishable key path described in Troubleshooting T2.
20. **Dashboard → Edge Functions → campaign-ai → Logs** stays open during the first test.

## Part 7 — Seed the demo data (Supabase Dashboard, 5 minutes)

21. **Dashboard → Authentication → Users → Add user → Create new user**: `demo@campai.app`, a password from the password manager, **Auto Confirm User** ticked.
22. **Dashboard → SQL Editor**: paste `E-supabase/seed.sql`, Run. Expected NOTICE: `campAI seed: created demo campaign … (plan version 1) for demo@campai.app`. Re-running says "already exists, skipping".
23. **Table Editor → campaigns**: one row "Weekday Regulars: 4 Weeks to Busier Mornings", status `ready`; `calendar_items` has 12 rows; `ai_usage_events` has 2 rows.

## Part 8 — Frontend environment (Bolt, 3 minutes)

24. **Bolt** → project settings → Environment variables (or the Supabase integration, which fills them for you):
    ```
    VITE_SUPABASE_URL=https://<ref>.supabase.co
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
    ```
    Nothing else. No `OPENAI_*`, no `sb_secret_`. If Bolt's integration created `VITE_SUPABASE_ANON_KEY` instead, leave it; the code accepts either.
25. **Two connection paths, pick one:**
    - **Path A — Bolt's native Supabase integration** (needs Bolt Pro/Teams and one Supabase organisation per Bolt account): Bolt → Integrations → Supabase → Connect → pick the `campai` project. Bolt injects the URL and key. Do **not** let Bolt run SQL migrations for you; migrations stay in Claude Code via the CLI.
    - **Path B — CLI fallback** (any plan): everything above is already done from the laptop; paste the two variables into Bolt by hand.

## Part 9 — Local testing (terminal, 15 minutes)

26. `supabase start` (needs Docker) starts a local Postgres, Auth and Edge runtime; `supabase db reset` applies migrations and `supabase/seed.sql` (the demo campaign is skipped locally until a demo user exists; sign up through the app running against local, then re-run the seed in the local Studio at `http://127.0.0.1:54323`).
27. `supabase functions serve campaign-ai --env-file ./supabase/functions/.env` in a second terminal.
28. Point the frontend at local: `.env.local` with `VITE_SUPABASE_URL=http://127.0.0.1:54321` and the local publishable key printed by `supabase start` (labelled "Publishable key"; older CLI versions print only an "anon key", which works as `VITE_SUPABASE_ANON_KEY`).
29. `npm run dev`, sign up, create a campaign, run the café scenario. Watch the `functions serve` terminal for logs.
30. If Docker is not available on any laptop, skip local testing and test against the real project with a throwaway user; the daily cap protects the OpenAI budget.

## Part 10 — Deployed testing (browser + terminal, 10 minutes)

31. Sign up with a fresh email on the deployed site; confirm a `profiles` row appeared.
32. Run the café scenario end to end; confirm `campaign_plans` version 1, 6–20 `calendar_items`, and an `ai_usage_events` row with status `success` and a non-zero `estimated_cost_usd`.
33. Run the RLS isolation test from `K-testing.md` (two accounts, via the REST API with `curl`).
34. Run the leaked-key scan from `K-testing.md` against the deployed JavaScript bundle.

## Reference: what lives where

| Item | Location | Set by |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Bolt environment variables / `.env.local` | Team (Bolt) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`, `AI_DAILY_LIMIT_PER_USER` | Supabase Edge Function secrets / `supabase/functions/.env` | Team (CLI) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` inside Edge Functions | Injected by Supabase automatically | Supabase |
| Migration | `supabase/migrations/20260926000000_campai_init.sql` | Claude Code |
| Seed | `supabase/seed.sql` | Claude Code |
| Edge Function | `supabase/functions/campaign-ai/index.ts` + `supabase/functions/_shared/*` | Claude Code |
