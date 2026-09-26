<!-- AI note: Extended troubleshooting for campAI: the master prompt's runbook T1–T16 plus issues found while writing and verifying this package (T17–T22).
     Owner: Claude Code appends new entries (also add a one-line row to CLAUDE.md section 9). Bolt never edits this. -->

# TROUBLESHOOTING.md — campAI

Use with rule 5 of the AI instructions: match the symptom, apply the fix, verify. **Two failed attempts means stop and report** what you tried, what happened, and the options. Do not rewrite the architecture or swap libraries.

Acronyms used: CORS = Cross-Origin Resource Sharing; RLS = Row Level Security; JWT = JSON Web Token; JSON = JavaScript Object Notation; SQL = Structured Query Language; UUID = Universally Unique Identifier; API = Application Programming Interface; UI = User Interface.

## Part 1 — The master prompt's runbook (T1–T16)

| # | Symptom | Likely cause | Fix | Verify |
|---|---------|--------------|-----|--------|
| T1 | Browser console shows a CORS error when calling the Edge Function | Preflight `OPTIONS` not answered, or CORS headers missing | `withSupabase` handles CORS. On the legacy pattern, `index.ts` answers `OPTIONS` and passes `responseHeaders` to the shared handler, which adds them to every response including errors | Network tab: `OPTIONS campaign-ai` returns 200 with `Access-Control-Allow-Origin` |
| T2 | Edge Function returns 401 | No user session token | Use `supabase.functions.invoke(...)` (it attaches the signed-in user's token). Confirm `supabase.auth.getSession()` is non-null before calling | `curl` with a real user JWT returns 200/400, not 401 |
| T3 | 404 for a campaign the user owns | RLS policy missing/wrong, or `user_id` not set on insert | Migration has `user_id uuid not null default auth.uid()` and `campaigns_insert_own`; re-run `supabase db push`; re-run K-testing RLS test | Table Editor shows the row's `user_id` equals the auth user id |
| T4 | `withSupabase` import fails, `ctx` undefined, auth behaves unexpectedly | `@supabase/server` is recent; tools misuse it | Time box 45 minutes. Then copy `edge-function-legacy/index.ts` over `supabase/functions/campaign-ai/index.ts`, redeploy, and update CLAUDE.md section 5 | `supabase functions serve` logs a request; curl smoke test passes |
| T5 | Frontend says an environment variable is missing | Not set in Bolt, or wrong name | Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`). Never add a secret under `VITE_` | `src/lib/supabase.ts` no longer throws |
| T6 | OpenAI returns 400 "Invalid schema" | Strict-mode rules broken | Every property listed in `required`; `additionalProperties: false` on every object; nullable as `["string","null"]`; keep enums short; `prompts.ts` strips `$comment` and `title` before sending | `node` script: compile the schema with Ajv and walk it (K-testing "AI schema" test) |
| T7 | OpenAI response `status` is `incomplete` | `max_output_tokens` too low | Raise `OUTPUT_BOUNDS.maxOutputTokens.generate` (12,000 → 16,000), or lower the calendar bound to 6–12 in `types.ts` and `campaign.schema.json` `maxItems` | Ledger row status `success`; `output_tokens` below the limit |
| T8 | OpenAI returns a refusal content item | Safety refusal | Shown as a safe error; no retry; ledger status `refused` (implemented in `handler.ts`) | Ledger row `status = 'refused'` |
| T9 | Generation exceeds 90 s or the function times out | Output too large, or Edge Function wall-clock limit (150 s free plan) | Lower output bounds first; then check the plan; splitting generation into two calls needs human approval | Ledger `latency_ms` ≤ 90,000 on three runs |
| T10 | OpenAI 429 or quota error | Rate limit or prepaid credit exhausted | OpenAI Dashboard → Billing; app shows "campAI is busy, try again in a minute" | Retry after a minute succeeds |
| T11 | Budget lines don't add up, or dates fall outside the campaign | Model arithmetic / date drift | Handled by `_shared/normalise.ts` (proportional scaling, clamping) and flagged in `campaign_plans.flags`; never by retrying | Flags visible in the workspace "We adjusted this" note |
| T12 | Bolt overwrote Claude Code's changes / Git conflict | Both tools edited the same file | Resolve on GitHub; re-apply the smaller change; follow the ownership split; `git pull` at the start of every Claude Code session | `git log` shows both commits; app builds |
| T13 | Bolt added a library not on the pinned list | Bolt defaults | Revert; restate the pinned list (see `bolt-project-instructions.md`) in the next prompt | `package.json` dependencies match the pinned list |
| T14 | Deployed JavaScript contains `sb_secret_` or `sk-` | Secret leaked into the frontend | **Incident.** Rotate the key immediately (Supabase → API keys; OpenAI → API keys), remove it from the frontend, redeploy, re-run the leak scan | Leak scan returns zero matches |
| T15 | Smart start hangs, errors, or extracts nonsense | `brief_check` failed, timed out, or returned invalid fields | The app must silently show the full nine-question sequence (`questionsToAsk(null)` in `src/lib/brief.ts`). Fix the fallback first | Disable network for the function → the nine questions appear |
| T16 | Claude Code or Bolt usage limit is close | Long sessions, mid-session model switches, large pasted logs | `/clear`, lighter model, short prompts, paste only error lines; must-have flow first | Usage page shows the burn rate flattening |

## Part 2 — Issues found while writing and verifying this package (T17–T22)

| # | Symptom | Cause | Fix | Verify |
|---|---------|-------|-----|--------|
| T17 | `save_plan_version` raises `campaign not found` even though the campaign exists | The function is `security invoker`; it was called through a client with no user session, so RLS hid the row (for example `supabaseAdmin` in the Edge Function, or a browser client before sign-in) | Call it through the user-scoped client (`ctx.supabase` / the browser client after sign-in). The admin client is only for `ai_usage_events` and `ai_model_pricing` | Same call through the user client returns the version number |
| T18 | `permission denied for function rebuild_calendar_items` | An early draft revoked execute from everyone; `security invoker` callers need it | The migration now grants execute to `authenticated` and `service_role` (and revokes from `anon`/`public`) | `select public.save_plan_version(...)` as an authenticated user succeeds |
| T19 | Editing a calendar item duplicated it, or `calendar item … is not in the current plan` | Plan JSON item ids (`ci-01`) did not match the UUIDs in `calendar_items` | `save_plan_version` now rewrites non-UUID ids in the plan JSON before storing, so plan items and rows always share ids. Always write plans through it (never `insert into campaign_plans` directly) | After `update_calendar_item`, both the row and `plan->'calendar_items'` show the change; row count unchanged |
| T20 | TypeScript error: `Property 'sub' does not exist on type 'UserClaims'` | The master prompt says `ctx.userClaims.sub`; in `@supabase/server` 1.8.0 the normalised claims object has `id`, `role`, `email`, `appMetadata`, `userMetadata`; the raw JWT payload is `ctx.jwtClaims.sub` | `index.ts` uses `ctx.userClaims?.id ?? ctx.jwtClaims?.sub`. This is a documented deviation from the master prompt's wording, not from its intent; the human has been told (README "Deviations") | `deno check supabase/functions/campaign-ai/index.ts` passes |
| T21 | Ajv or another validator rejects `$comment` in the schema, or OpenAI rejects the schema | Package schema files carry a `$comment` (the AI note) and `title` for humans | `prompts.ts` `stripMeta()` removes both before sending to OpenAI. Ajv accepts `$comment` natively | Ajv compiles both schemas; OpenAI returns 200 |
| T22 | `date-fns` first-Monday helper and the Edge Function disagree on the default start date | Browser uses local time, function uses UTC | Both compute "first Monday of next month" from a calendar date, not a timestamp; the function also accepts the browser's `today` within ±2 days. If they still differ, trust the value shown on the review screen (it is what gets saved) | Café scenario on 26 Sep 2026 → 2026-10-05 in both |

## Part 3 — Quick diagnostics

- **Edge Function logs:** Supabase Dashboard → Edge Functions → `campaign-ai` → Logs. Every failure logs `console.error` with the cause; the browser only gets the safe message.
- **Ledger as a black box recorder:** `select operation, status, error_code, latency_ms, total_tokens, estimated_cost_usd, created_at from ai_usage_events order by created_at desc limit 20;` in the SQL Editor. A row with `error_code = 'in_progress'` and status `internal_error` means the function crashed or timed out before finishing.
- **RLS quick check:** in the SQL Editor, `select count(*) from campaigns;` returns all rows (postgres role bypasses RLS); the same query through the REST API with a user JWT must return only that user's rows.
- **Schema quick check:** `node -e "const Ajv=require('ajv');const a=new Ajv({strict:true});a.compile(require('./docs/campai-package/F-ai/campaign.schema.json'));console.log('ok')"` (run in a folder with `ajv` installed).
