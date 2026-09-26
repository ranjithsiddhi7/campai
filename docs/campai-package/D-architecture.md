<!-- AI note: Part D of the campAI implementation package: the technical architecture (diagram, responsibilities, data model, auth/AI/revision/save flows, security boundaries, secrets, cost control, Edge Function pattern, build-time workflow, known limits). It describes the code in E-supabase/, F-ai/ and I-code-guide/; it never restates it.
     Owner: Claude Code (docs); Bolt never edits it; humans and both tools read it. -->

# D-architecture.md — Part D: Technical architecture

Acronyms used in this part: API = Application Programming Interface; RLS = Row Level Security; SQL = Structured Query Language; JSON = JavaScript Object Notation; JSONB = JSON Binary (Postgres's binary JSON column type); JWT = JSON Web Token; CORS = Cross-Origin Resource Sharing; UUID = Universally Unique Identifier; CRUD = Create, Read, Update, Delete; UI = User Interface; CLI = Command-Line Interface; REST = Representational State Transfer; UTC = Coordinated Universal Time; ISO = International Organization for Standardization; RPC = Remote Procedure Call; CSV = Comma-Separated Values.

**The decisions in one paragraph.** campAI is a single-page React app hosted by Bolt, a Supabase project (Auth, Postgres with RLS, one Edge Function), and the OpenAI Responses API. The browser talks only to Supabase. Every AI call goes through one Edge Function, `campaign-ai`, which dispatches on an `operation` field to exactly three operations: `brief_check`, `generate`, `revise`. AI is used for judgment only; validation, normalisation, budget arithmetic, date handling, versioning, CRUD and access control are plain code and SQL. The campaign plan is a versioned JSON document; calendar rows are a projection of it. Cost is controlled by model choice per operation, bounded output, a per-user daily cap, idempotent requests and a ledger row for every attempt.

## 1. Architecture diagram

Run time (what the finished app does):

```
+---------------------------------------------------------------------------------+
|  BROWSER  (Vite + React + TypeScript app, hosted on *.bolt.host)                 |
|  Holds ONLY: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (sb_publishable_…) |
|  Never holds: OpenAI key, Supabase secret key, prompts                           |
+-------------+-----------------------------+------------------------+------------+
              |                             |                        |
              | (a) email + password        | (b) PostgREST          | (c) supabase.functions.invoke
              |     sign-up / sign-in       |     CRUD + RPC         |     { operation, request_id, … }
              |     -> session JWT          |     Bearer: user JWT   |     Bearer: user JWT
              v                             v                        v
+-------------------------+   +------------------------------+   +---------------------------------+
|  SUPABASE AUTH          |   |  POSTGRES via PostgREST      |   |  EDGE FUNCTION campaign-ai      |
|  auth.users             |   |  RLS on every table          |   |  (Deno; withSupabase or legacy) |
|  trigger -> profiles    |   |  SQL functions:              |   |  Secrets: OPENAI_API_KEY,       |
+-------------------------+   |   save_plan_version,         |   |   OPENAI_MODEL, OPENAI_MODEL_   |
                              |   update/add/delete_         |   |   LIGHT, AI_DAILY_LIMIT_PER_USER|
                              |   calendar_item,             |   |  Injected: SUPABASE_URL,        |
                              |   apply_revision,            |   |   SUPABASE_PUBLISHABLE_KEY,     |
                              |   my_ai_usage_summary        |   |   SUPABASE_SECRET_KEY           |
                              +------------------------------+   +-------+-----------------+-------+
                                     ^                 ^                 |                 |
                                     |                 |                 |                 |
                   (d) USER client   |                 |  (e) ADMIN      |                 | (f) POST /v1/responses
                   publishable key   |                 |  client, secret |                 |     Bearer: OPENAI_API_KEY
                   + user JWT, RLS   |                 |  key, no RLS    |                 |     text.format json_schema strict
                   campaigns,        |                 |  ai_usage_events|                 |     store:false, max_output_tokens
                   campaign_briefs,  |                 |  ai_model_      |                 v
                   campaign_plans,   +-----------------+  pricing ONLY   |     +---------------------------+
                   campaign_revisions                    +---------------+     |  OPENAI RESPONSES API     |
                                                                               |  gpt-6-sol / gpt-6-luna   |
                                                                               +---------------------------+
```

Key flows: the publishable key and the user's JWT travel browser → Supabase (a, b, c). The Edge Function re-uses that same JWT for its user client (d) and the injected secret key for its admin client (e). The OpenAI key exists only inside the Edge Function process (f). No arrow ever carries a secret towards the browser.

Build time (how the code gets written), a separate loop that never runs in production:

```
   +-----------------+      auto-commit / pull      +------------------+      git pull / push      +------------------+
   |  BOLT           | <--------------------------> |  GITHUB          | <----------------------> |  CLAUDE CODE     |
   |  owns src/ (UI) |        (every ~30 s)         |  single repo,    |    (start / end of       |  owns supabase/, |
   |  deploys to     |                              |  meeting point   |     every session)       |  contracts, docs |
   |  *.bolt.host    |                              +------------------+                          |  deploys Edge Fn |
   +-----------------+                                                                            |  via Supabase CLI|
                                                                                                  +------------------+
```

## 2. Responsibilities

| Layer | Does | Must NOT do |
|---|---|---|
| **Frontend** (Bolt-built React app) | Screens and navigation; sign-up/sign-in through `supabase.auth`; CRUD on campaigns, briefs and calendar rows through PostgREST; calls the three SQL RPCs for edits and Apply; calls the Edge Function through `supabase.functions.invoke`; generates the `request_id` UUID per attempt; validates loaded plans with Zod before rendering; shows flags, loading, error and empty states; the nine-question fallback when `brief_check` fails | Call OpenAI; hold any secret or any `VITE_` variable other than the two allowed; compute cost; decide ownership (RLS does); write `ai_usage_events`; send the brief in the `generate` request; modify the working plan during a revision before Apply |
| **Supabase Auth** | Email + password accounts; issues the session JWT the browser attaches everywhere; `auth.uid()` inside SQL | Store anything campaign-related; confirm emails during the hackathon (switched off, see section 10) |
| **Postgres + RLS** | Stores every entity; enforces ownership on every row for the `authenticated` role; constraints (lengths, enums, date arithmetic, unique `request_id`); cascades; `updated_at` triggers | Call AI; trust a `user_id` from the client (defaults to `auth.uid()` and is checked by policy) |
| **SQL functions** | Deterministic data operations: profile creation, plan versioning, calendar rebuild, calendar item CRUD, applying a revision, usage summary, daily-call count | Call AI; bypass RLS unless the function is explicitly `security definer` for a narrow reason (only `handle_new_user` and `count_user_ai_calls_today`) |
| **Edge Function `campaign-ai`** | Authenticates the caller; proves ownership through the user client; idempotency; daily cap; ledger; builds prompts; calls OpenAI with a timeout; validates (Zod) and normalises output; persists through the user client; computes cost from `ai_model_pricing`; returns safe errors | Trust browser-supplied brief or plan data for `generate` or `revise` (it reads both from the database); use the admin client for anything other than `ai_usage_events` and `ai_model_pricing`; retry more than once; stream; expose raw OpenAI errors, prompts or reasoning |
| **OpenAI Responses API** | Interpretation and judgment: field extraction (`brief_check`), the full campaign plan (`generate`), a proposed revised plan with `changed_sections` and `change_summary` (`revise`), all as strict Structured Outputs | Do arithmetic the app relies on (budget sums and dates are re-normalised in code); decide what is locked (code restores locked fields); be called from anywhere but the Edge Function |

## 3. Data model

The complete, executable definition is `E-supabase/migration.sql`; row types mirror it in `F-ai/types.ts` section 6. All timestamps are `timestamptz`; all dates are Postgres `date` and appear in the API as ISO `YYYY-MM-DD` strings. Every user-owned table has `user_id uuid not null default auth.uid()` so an insert from the browser cannot forget it, and every such table has an index on `user_id`.

### 3.1 `profiles`

Purpose: one application row per auth user (display name, email copy). Key columns: `id` (equals `auth.users.id`, primary key), `email`, `display_name`. Created by the `on_auth_user_created` trigger, never by the app. Cascade: deleting the auth user deletes the profile. Users can read and update only their own row; there is no insert policy because the trigger inserts.

### 3.2 `campaigns`

Purpose: the container the dashboard lists. Key columns: `title` (1–120 characters, defaults to `Untitled campaign`, later overwritten by the plan's title), `status` (`draft` → `generating` → `ready` | `error`), `current_plan_version` (0 until first generation), `last_error` (safe message shown on the error state). Index on `(user_id, updated_at desc)` for the dashboard. Cascade: hard delete of a campaign removes its brief, plans, calendar items and revisions; the ledger keeps its rows with `campaign_id` set to null (see 3.7).

### 3.3 `campaign_briefs`

Purpose: the confirmed structured inputs, one row per campaign (`campaign_id` is unique). Key columns: the nine fields as typed columns (`business`, `product_or_service`, `goal`, `audience_clues`, `budget_amount`, `currency`, `market`, `start_date`, `duration_weeks`, `end_date`, `existing_assets`, `tone_and_constraints` nullable) plus `brief_check` JSONB holding a `BriefCheckRecord` (whether AI was used, the free text, the `brief_check` result, which fields the user answered, the stated/inferred/missing statuses). Constraints worth knowing: `currency` must be a three-letter upper-case code; `duration_weeks` 1–12; `end_date` must equal `start_date + duration_weeks × 7 − 1 day`, so the browser must compute it the same way (`src/lib/brief.ts` does). The Edge Function reads this row for `generate`; the browser never sends brief data with that request.

### 3.4 `campaign_plans`

Purpose: versioned, immutable JSONB snapshots of the full `CampaignPlan`. Key columns: `version` (≥ 1, unique per campaign), `source` (`generated` | `edited` | `revised`), `plan` (must be a JSON object), `flags` (array of `ValidationFlag`, the "We adjusted this" notes). Index on `(campaign_id, version desc)` so "latest version" is one indexed read. There are select and insert policies only: versions are never updated or deleted by users; they disappear only through the campaign cascade.

**Plan-versioning rule.** The plan JSON is the source of truth. The latest version is the working copy. Every generation, every section edit, every calendar item edit/add/delete and every applied revision inserts a new version through `save_plan_version`, which also rebuilds `calendar_items` from the plan and bumps `campaigns.current_plan_version`. Nothing writes to `campaign_plans` or `calendar_items` except through that function (Troubleshooting T19 explains what goes wrong otherwise).

### 3.5 `calendar_items`

Purpose: one row per calendar entry so the calendar can be filtered, sorted and edited item by item. Columns mirror `CalendarItem` (`date`, `week_number`, `channel`, `format`, `objective`, `content_pillar`, `title`, `hook`, `body`, `cta`, `creative_direction`, `ad_script` nullable, `status`, `notes`) plus `sort_order`. Row ids equal the `id` values inside the plan's `calendar_items` array; `save_plan_version` guarantees this by assigning a UUID to any item whose id is not already one. Index on `(campaign_id, date, sort_order)`. The rows are a projection: they are deleted and re-inserted on every plan save, so a direct row update would be lost on the next save. That is why the browser edits through the three RPCs (section 9) rather than PostgREST updates.

### 3.6 `campaign_revisions`

Purpose: the proposal produced by `revise`, and its fate. Key columns: `request_id` (unique, same UUID as the ledger row), `instruction` (3–500 characters), `locked_sections` and `changed_sections` (JSON arrays of `SectionKey`), `change_summary`, `before_plan_version`, `after_plan_version` (null until applied, must exceed `before_plan_version`), `proposed_plan` (full plan JSON after lock restoration and normalisation), `status` (`proposed` | `applied` | `discarded`). Policies: select, insert and update own; no delete (cascade only). The Edge Function inserts through the user client, so RLS applies to it too.

### 3.7 `ai_usage_events`

Purpose: the cost ledger, one row per attempt including failures. Key columns: `user_id`, `campaign_id` (nullable, `on delete set null` so history survives campaign deletion), `operation`, `request_id` (unique: this is the idempotency key), `model`, `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`, `estimated_cost_usd` (six decimals), `currency` (always `USD`), `status` (ten values, listed in the migration), `error_code`, `latency_ms`, `response` (the successful `AiResponse`, stored so a replayed `request_id` can return it). Users can select their own rows; there is no insert, update or delete policy, so only the secret-key client writes it. Index on `(user_id, created_at desc)` serves the daily cap and the Settings summary.

### 3.8 `ai_model_pricing`

Purpose: list prices per one million tokens, so cost is data rather than code. Columns: `model` (primary key), `input_per_million_usd`, `cached_input_per_million_usd`, `output_per_million_usd`, `verified_on`, `active`. Seeded in the migration with `gpt-6-sol` and `gpt-6-luna` (verified 26 September 2026). Readable by any signed-in user; writable only by the service role, because no other policy exists.

### 3.9 SQL helper functions

Postgres runs a function either as the caller (`security invoker`, so RLS applies to every statement inside) or as the function's owner (`security definer`, which bypasses RLS). campAI defaults to invoker and uses definer only where the caller could not otherwise do the job.

1. **`set_updated_at`** — trigger that stamps `updated_at = now()` on update for `profiles`, `campaigns`, `campaign_briefs`, `calendar_items`, `campaign_revisions`. Trigger functions run in the trigger's context; execute is revoked from application roles because nobody calls it directly.
2. **`handle_new_user`** — trigger on `auth.users` insert that creates the profile row. `security definer` because at sign-up time there is no authenticated session yet and the `auth` schema trigger must be allowed to write to `public.profiles`.
3. **`count_user_ai_calls_today`** — counts a user's ledger rows since 00:00 UTC. `security definer` so the Edge Function's clients can count regardless of RLS, with an internal guard that only returns a count for the caller's own id or for the service role. (The shipped handler counts through the admin client with a filtered query, which is equivalent; the function remains available for the Settings page and tests.)
4. **`rebuild_calendar_items`** — deletes and re-inserts a campaign's calendar rows from a plan JSON, mapping every field, defaulting missing ones, and keeping UUID ids. `security invoker`: it runs under the caller's RLS, so a user can only rebuild rows for a campaign they own. Not meant to be called directly.
5. **`save_plan_version`** — the single write path for plans: validates `source` and shape, locks the campaign row (a miss raises "campaign not found"), computes the next version, assigns UUID ids inside the plan JSON, inserts the version, rebuilds calendar rows, and sets the campaign to `ready` with the new title and version. `security invoker` so RLS is the ownership check, which is also why the Edge Function must call it with the user client, never the admin client (Troubleshooting T17).
6. **`update_calendar_item`** — patches an allowed subset of fields on one item inside the latest plan JSON and saves a new `edited` version. `security invoker`.
7. **`delete_calendar_item`** — removes the item from the plan JSON and saves a new `edited` version. `security invoker`.
8. **`add_calendar_item`** — appends a fully defaulted item with a fresh UUID to the plan JSON, saves a new `edited` version, returns the id. `security invoker`.
9. **`apply_revision`** — locks the revision row, refuses if it is not `proposed`, saves the `proposed_plan` as a new `revised` version, sets `after_plan_version` and `status = 'applied'`. One transaction, `security invoker`.
10. **`my_ai_usage_summary`** — totals for the signed-in user (calls, successes, failures, calls today, tokens, estimated cost). `security invoker` and filtered on `auth.uid()`, so it can never aggregate another user's rows.

## 4. Auth flow

1. The user submits email and password on the sign-up screen; the browser calls `supabase.auth.signUp`. Because "Confirm email" is off, Supabase creates the `auth.users` row and returns a session immediately.
2. The `on_auth_user_created` trigger runs `handle_new_user`, inserting the `profiles` row with a display name derived from the email.
3. The supabase-js client stores the session (access JWT plus refresh token) in the browser and refreshes it automatically. `useAuth.tsx` exposes it through React context.
4. `RequireAuth` wraps every `/app` route: no session means a redirect to `/sign-in`; a session renders the page.
5. Every PostgREST query made with the shared client carries `Authorization: Bearer <access JWT>`; Postgres sets `auth.uid()` from it and RLS filters rows.
6. Every Edge Function call made with `supabase.functions.invoke` carries the same header. In the `withSupabase` pattern the wrapper verifies it and builds `ctx.supabase`; in the legacy pattern `index.ts` reads the header, calls `auth.getUser(token)` and builds the user client by hand. Either way the Edge Function's user client runs under the same RLS as the browser would.
7. Sign out clears the session; RequireAuth redirects on the next render.

## 5. OpenAI request flow (all three operations)

The order below is the order in `I-code-guide/src-snippets/supabase__functions___shared__handler.ts`, which both `index.ts` variants call.

1. **Parse and validate the body.** Non-POST → 405. Unparseable JSON → 400 `invalid_request`. The body is checked against `AiRequestSchema` (Zod): `operation`, a UUID `request_id`, a UUID `campaign_id`, and the operation's own fields (`free_text` 3–2,000 characters plus `defaults` for `brief_check`; `instruction` 3–500 characters plus `locked_sections` for `revise`).
2. **User check.** `index.ts` has already authenticated; the handler only confirms a user id is present, else 401 `unauthenticated`.
3. **Ownership through RLS.** `select id from campaigns where id = campaign_id` through the user client. No row → 404 `not_found`. There is no separate ownership query because RLS is the ownership check.
4. **Configuration.** Read the secrets; a missing `OPENAI_API_KEY` is a 500 that is logged, never described to the browser.
5. **Idempotency lookup.** Admin client reads `ai_usage_events` by `request_id`. A prior `success` row belonging to this user returns its stored `response` with 200 and header `X-Campai-Replayed: true`; any other prior row returns 409 `duplicate_request`.
6. **Daily cap.** Admin client counts this user's ledger rows since 00:00 UTC. At or above `AI_DAILY_LIMIT_PER_USER` (default 25) it inserts a `daily_limit_reached` row and returns 429 with a message naming the limit and the UTC reset.
7. **Ledger insert first.** A row with `status = 'internal_error'` and `error_code = 'in_progress'` is inserted before any OpenAI call, so a crash still leaves a trace. The unique `request_id` turns a racing duplicate into a 409 here.
8. **Load inputs.** `generate` reads the brief (missing → 409 `brief_missing`) and sets `campaigns.status = 'generating'`. `revise` reads the brief and the latest plan (missing → 409 `plan_missing`). `brief_check` reconciles the browser's `today` with the server date (±2 days) and needs nothing from the database.
9. **Call OpenAI with a timeout.** `callStructured` in `_shared/openai.ts` posts to `POST /v1/responses` under an `AbortController`: 20 seconds for `brief_check`, 110 seconds for `generate` and `revise`. Request shape: `model`, `instructions` (the system prompt), `input` (one user message built from the template), `text.format = { type: "json_schema", name, schema, strict: true }`, `max_output_tokens` from `OUTPUT_BOUNDS`, `store: false`. No `tools`, no `stream`.
10. **Read the response.** HTTP 429 → `rate_limited`; other non-2xx or network failure → `upstream_error`. Otherwise read `status`: `incomplete` (with `incomplete_details.reason`) → `incomplete`; anything other than `completed` → `upstream_error`. Walk `output[].content[]`: a part of `type: "refusal"` → `refused`; parts of `type: "output_text"` are concatenated into the JSON text. Usage is read from `usage.input_tokens`, `usage.output_tokens`, `usage.total_tokens` and `usage.input_tokens_details.cached_tokens`.
11. **Outcome mapping and the single retry.** Exactly one more call is allowed, within the same request and `request_id`, only for a transient upstream error (network, 5xx, or an unexpected 200 body) or for a schema failure (non-JSON text, or Zod rejecting it), in which case the retry input ends with a one-line correction naming the first error. Timeouts, rate limits, refusals and incomplete outputs are never retried. Tokens from both attempts are summed into the ledger.
12. **Validate.** The parsed text is checked against the operation's Zod schema (`BriefCheckResultSchema`, `CampaignPlanSchema`, `RevisionResultSchema`), which mirror the JSON Schemas in `F-ai/`.
13. **Normalise.** `brief_check` runs `fixBriefCheckDates` (future dates, duration 1–12, positive budget, three-letter currency, defaults from the browser). `generate` and `revise` run `normalisePlan` (section 6); `revise` first restores locked fields (section 7).
14. **Persist through the user client.** `generate` calls `save_plan_version(..., 'generated', flags)`; `revise` inserts a `campaign_revisions` row with `status = 'proposed'`; `brief_check` persists nothing (the browser stores the confirmed brief later).
15. **Finish the ledger.** Admin client updates the row with the final `status`, `model`, tokens, `estimated_cost_usd` computed from the active `ai_model_pricing` row (uncached input, cached input and output priced separately; a missing pricing row yields cost 0 and the suffix `;pricing_missing` on `error_code`), `latency_ms`, `error_code`, and, on success, the full `response` for replay.
16. **Respond.** 200 with the typed `AiResponse`, or the mapped error `{ error: { code, message, request_id } }` with the HTTP status from the mapping table in `F-ai/prompts.md` section 4.2. For `generate`, any failure also resets the campaign to `ready` (if an earlier version exists) or `error` with `last_error`.

## 6. Generation flow specifics

**Smart start (`brief_check`).** The browser creates the `campaigns` row, then sends `{ operation: "brief_check", request_id, campaign_id, free_text, defaults: { today, currency, market } }`. The model runs on `OPENAI_MODEL_LIGHT` and returns, for each of the nine fields, a value, a status (`stated` | `inferred` | `missing`), a suggested default and a plain-language question, plus a restatement and an assumptions list. The browser turns that into the question sequence: only `inferred` and `missing` fields are asked, prefilled. Any failure (timeout, error, invalid output) is swallowed by the browser, which shows the full nine-question sequence with static defaults. The user's confirmed answers are upserted into `campaign_briefs`, with the whole `brief_check` exchange recorded in the `brief_check` JSONB column.

**Build (`generate`).** The browser sends only `{ operation: "generate", request_id, campaign_id }`. The server reads the saved `campaign_briefs` row and the assumptions already shown during `brief_check`, builds the input from the template in `F-ai/prompts.md` section 2.2, and calls `OPENAI_MODEL`. This is why a user cannot generate against a brief they never saved and why the brief on screen and the brief the model saw are always the same row.

**Normalisation (`_shared/normalise.ts`, order fixed, each step producing a `ValidationFlag` only when it changes something):**

1. Budget: `currency` and `total` are forced to the brief; if line items do not sum to the total within 0.5, every amount is scaled proportionally, rounded to whole units, and the rounding remainder is placed on the largest line. Flag `budget_rescaled` and a sentence appended to `assumptions`.
2. Channel shares: scaled to sum to 100 within 0.5. Flag `channel_shares_rescaled`.
3. Timeline: `start_date` and `end_date` forced to the brief; phase dates clamped into the period; the last phase extended to the end if it stops short. Flag `timeline_adjusted`.
4. Calendar dates: any item outside the period is clamped to the nearest boundary, its `notes` gets the prefix "Date adjusted to fit the campaign. ", flag `date_clamped` with the item id. `week_number` is recomputed from the date for every item.
5. Calendar count: fewer than 6 → flag `calendar_count_low`; more than 20 → keep the first 20 by date, flag `calendar_count_high`. Accepted, never retried.
6. Pillar and channel names: an item's `content_pillar` or `channel` that does not match a defined pillar or channel (case-insensitive) is replaced by the closest substring match, else the first one. Flag `pillar_name_fixed`.
7. Creative brief due dates: clamped to on or before the campaign end. Flag `date_clamped` with the brief title as ref.
8. Ids: every `calendar_items[].id` becomes a UUID so plan JSON and `calendar_items` rows share ids (`save_plan_version` repeats this defensively).

**Where flags live and show.** Flags are returned in the response, saved in `campaign_plans.flags` with that version, and rendered by the workspace's `FlagsNotice` as "We adjusted this" next to the affected section or item. They are informational; the user can edit the underlying field like any other.

## 7. Revision flow

1. The user types an instruction (3–500 characters) in the `ReviseBar` and toggles locks on any of the twelve workspace sections. The browser sends `{ operation: "revise", request_id, campaign_id, instruction, locked_sections }`.
2. The server loads the brief and the latest plan (the working copy, including the user's manual edits) and sends the instruction, the locked list, the brief facts that must not change, and the compact plan JSON to `OPENAI_MODEL`.
3. The model returns `{ plan, changed_sections, change_summary }` against the `RevisionResult` schema, which wraps `campaign.schema.json`.
4. The server restores locked sections in code: for every key in `locked_sections`, the fields in `SECTION_FIELDS[key]` are copied back from the current plan. The map, from `F-ai/types.ts`:

| Section key | Plan fields restored when locked |
|---|---|
| `overview` | `title`, `executive_summary`, `business_objective`, `timeline` |
| `audience` | `audience` |
| `strategy` | `positioning`, `strategic_rationale` |
| `messaging` | `messaging`, `offer` |
| `channels` | `channels` |
| `content` | `content_pillars` |
| `calendar` | `calendar_items` |
| `copy` | `copy`, `ad_scripts` |
| `creative_briefs` | `creative_briefs` |
| `budget` | `budget` |
| `kpis` | `kpis` |
| `assumptions` | `assumptions`, `risks`, `next_actions` |

5. `normalisePlan` runs after the copy-back, so a locked budget is exact and new `new-*` calendar ids become UUIDs.
6. `changed_sections` is recomputed by deep-comparing each section's fields between the current and the proposed plan. The list shown to the user reflects what actually differs, not what the model claimed; a locked section therefore never appears in it.
7. The server inserts a `campaign_revisions` row (`status = 'proposed'`, `before_plan_version` = the version it was based on, `proposed_plan` = the normalised proposal) through the user client and returns `revision_id`, `proposed_plan`, `changed_sections`, `change_summary`, flags and usage.
8. The browser shows `ProposalDiff`: the summary on top, changed sections highlighted, current and proposed side by side. **Nothing in the working plan has changed at this point.** Navigating away leaves the proposal in the table with status `proposed`.
9. **Apply** calls `apply_revision(revision_id)`: one transaction that saves the proposal as a new version with `source = 'revised'`, rebuilds calendar rows, sets `after_plan_version`, marks the revision `applied` and bumps the campaign. The browser reloads the latest version.
10. **Discard** updates the revision's `status` to `discarded` through PostgREST. No plan version is written.

## 8. Save and retrieval flow with plan versioning

1. **Dashboard list.** `select * from campaigns order by updated_at desc` under RLS; each card shows title, status and last update. Delete is a PostgREST delete on `campaigns`; cascades remove everything except ledger history.
2. **Open a campaign.** `useCampaign.tsx` loads the campaign row, its brief, the latest `campaign_plans` row (`order by version desc limit 1`) and the `calendar_items` rows ordered by date and `sort_order`. The plan is validated with `CampaignPlanSchema.safeParse` before rendering; a failure shows "This campaign's data looks damaged" with a Rebuild button instead of crashing.
3. **Section edit.** `SectionEditor` edits plain form fields for one section. On save the browser merges the patch into the current plan JSON and calls `save_plan_version(campaign_id, plan, 'edited')`, which writes version n+1, rebuilds calendar rows and stamps the campaign. There is no partial-update path; a version is always a full snapshot.
4. **Calendar item edit, add, delete.** The browser calls `update_calendar_item(item_id, patch)`, `add_calendar_item(campaign_id, item)` or `delete_calendar_item(item_id)`. Each patches the plan JSON and writes a new `edited` version through `save_plan_version`, so the calendar rows and the plan can never disagree. Direct PostgREST updates on `calendar_items` are allowed by policy but must not be used, because the next save would overwrite them.
5. **Reopen.** The same load as step 2 returns the latest version; the user always sees their last save.
6. **Version history.** Every version stays in `campaign_plans` with its `source` and `flags`. Undo is a Could-have: re-saving an older version's `plan` through `save_plan_version(..., 'edited')` restores it as the newest version without deleting history. Export (Should-have) reads the latest plan and renders it; it needs no new table.

## 9. Security boundaries

### 9.1 RLS summary

All eight tables have RLS enabled; the `anon` role has no table privileges at all, so an unauthenticated visitor cannot read anything even if the publishable key is public (it is).

| Table | Select | Insert | Update | Delete |
|---|---|---|---|---|
| `profiles` | own | none (trigger) | own | none (cascade from `auth.users`) |
| `campaigns` | own | own (`user_id = auth.uid()`) | own | own |
| `campaign_briefs` | own | own, and the campaign must be owned | own | own |
| `campaign_plans` | own | own, and the campaign must be owned | none | none (cascade) |
| `calendar_items` | own | own, and the campaign must be owned | own | own |
| `campaign_revisions` | own | own, and the campaign must be owned | own | none (cascade) |
| `ai_usage_events` | own | none (service role only) | none | none |
| `ai_model_pricing` | any signed-in user | none (service role only) | none | none |

### 9.2 Why a miss is a 404 and not a 403

The Edge Function never checks ownership by comparing ids; it reads the campaign through the user client, and RLS makes another user's campaign indistinguishable from a non-existent one. Returning 404 in both cases means an attacker probing ids learns nothing about which ids exist. It also means Troubleshooting T3 (a 404 for a campaign the user owns) points at RLS or a missing `user_id`, never at the Edge Function's own logic.

### 9.3 The two clients

The Edge Function holds two clients and the split is fixed. The **user client** (publishable key plus the caller's JWT; `ctx.supabase` or hand-built) reads `campaigns`, `campaign_briefs`, `campaign_plans` and writes `campaign_plans` (through `save_plan_version`) and `campaign_revisions`. The **admin client** (secret key; `ctx.supabaseAdmin` or hand-built) touches only `ai_usage_events` and `ai_model_pricing`, because users have no write policy on the ledger and no reason to write pricing. Using the admin client for plans would silently bypass ownership and is a review-blocking defect.

### 9.4 Secrets and where they live

| Secret | Lives in | Never in |
|---|---|---|
| `OPENAI_API_KEY` | Supabase Edge Function secrets; locally `supabase/functions/.env` | Browser, `VITE_*`, Bolt settings, Git, chat |
| `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`, `AI_DAILY_LIMIT_PER_USER` | Same (not sensitive, but kept with the others so one command sets all four) | Browser |
| `SUPABASE_SECRET_KEY` (`sb_secret_…`) | Injected into the Edge Function by Supabase; never typed by the team | Anywhere else |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` | Injected into the Edge Function; the same values are public in the browser under `VITE_` names | Not secret |

### 9.5 The `VITE_` rule and the leaked-key test

Vite inlines every variable whose name starts with `VITE_` into the JavaScript served to every visitor. The only permitted `VITE_` names are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY` if Bolt's integration injected it). A "missing variable" error is never fixed by renaming a secret with a `VITE_` prefix (Troubleshooting T5). Part K's leaked-key test builds the production bundle (or fetches the deployed one) and searches it for `sb_secret_`, `service_role` and `sk-`; the required result is zero matches. A match is an incident: rotate the key, remove it, redeploy, re-test (T14).

### 9.6 CORS

The browser origin (`*.bolt.host`, or `localhost:5173` in development) differs from the Supabase origin, so every Edge Function call is cross-origin and the browser sends an `OPTIONS` preflight first. `withSupabase` answers it and stamps CORS headers on every response. The legacy `index.ts` returns the headers on `OPTIONS` itself and passes them to the handler so they appear on every response including errors (T1).

### 9.7 What never reaches the browser

The OpenAI key, the secret key, raw OpenAI error bodies, stack traces, the prompt text, any `reasoning` items, and other users' ids or data. The Edge Function logs details with `console.error` (visible in Supabase Dashboard → Edge Functions → Logs) and returns only the code and the plain-language message from the mapping table.

### 9.8 Rate limiting and input limits

There is no general rate limiter; the per-user daily cap on AI calls is the protection that matters, because AI calls are the only expensive operation and the live demo link is public. Input sizes are bounded at the schema level: `free_text` 2,000 characters, `instruction` 500 characters, brief text columns 500–1,000 characters, `title` 120. These limits also bound prompt size and therefore cost.

### 9.9 Email confirmation

"Confirm email" is switched off in Supabase Authentication settings for the hackathon so sign-up during the live demo is instant. To turn it back on afterwards: Supabase Dashboard → Authentication → Providers → Email → enable "Confirm email", then add the deployed site URL under Authentication → URL Configuration as the site URL and a redirect URL so the confirmation link returns to the app. No code changes are required; `supabase.auth.signUp` then returns a user without a session until the link is clicked, and the sign-up screen should tell the user to check their inbox.

## 10. Environment variables and secrets

| Name | Where it lives | Who sets it | May it be public? |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Bolt environment variables; `.env.local` for local dev | Bolt integration or a teammate (from Supabase Dashboard → Settings → API) | Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Bolt environment variables; `.env.local` | Same | Yes (it is designed for browsers; RLS protects data) |
| `VITE_SUPABASE_ANON_KEY` | Only if Bolt's integration injects it | Bolt integration | Yes (legacy name; the app accepts either) |
| `OPENAI_API_KEY` | Supabase Edge Function secrets (`supabase secrets set --env-file ./supabase/.env.production` or Dashboard); locally `supabase/functions/.env` | One teammate, from OpenAI Dashboard → API keys (project-scoped key) | Never |
| `OPENAI_MODEL` | Supabase secrets; local `.env` | Claude Code session I0; default `gpt-6-sol` | Not secret, but not in the browser |
| `OPENAI_MODEL_LIGHT` | Supabase secrets; local `.env` | Same; default `gpt-6-luna` | Same |
| `AI_DAILY_LIMIT_PER_USER` | Supabase secrets; local `.env` | Same; default `25` | Same |
| `SUPABASE_URL` | Injected into the Edge Function runtime | Supabase | Not applicable |
| `SUPABASE_PUBLISHABLE_KEY` | Injected into the Edge Function runtime | Supabase | Not applicable |
| `SUPABASE_SECRET_KEY` | Injected into the Edge Function runtime | Supabase | Never; never copied anywhere |

Rules: custom secret names must not start with `SUPABASE_` (the CLI rejects them); `.env`, `.env.local`, `supabase/.env.production` and `supabase/functions/.env` are git-ignored; `I-code-guide/env.example` is the only committed template and contains names, not values.

## 11. Cost-control approach

**Model per operation.** `brief_check` runs on `OPENAI_MODEL_LIGHT` (`gpt-6-luna`) because extraction is easy and latency matters. `generate` and `revise` run on `OPENAI_MODEL` (`gpt-6-sol`) because plan quality is the product. Both are secrets, so the team can drop everything to `gpt-6-luna` in one command if credit runs low, with no redeploy.

| Model | Input per 1M tokens | Cached input per 1M | Output per 1M | Verified |
|---|---|---|---|---|
| `gpt-6-sol` | US$2.00 | US$0.20 | US$10.00 | 2026-09-26 |
| `gpt-6-luna` | US$0.10 | US$0.01 | US$0.50 | 2026-09-26 |

**Output bounds.** `OUTPUT_BOUNDS` in `F-ai/types.ts` is the single place: 6–20 calendar items (target 12), at most 6 channels, 5 pillars, 3 ad scripts, 4 creative briefs, 8 KPIs; `max_output_tokens` 1,500 for `brief_check`, 12,000 for `generate` and `revise`. The JSON Schema `maxItems` values and the prompts follow these numbers, so lowering the calendar bound to 6–12 (the Part J cut) is a change in one file plus the schema.

**Worked estimate for one full campaign.** `brief_check` ≈ 800 input + 400 output tokens on `gpt-6-luna` = 800 × 0.10/1M + 400 × 0.50/1M ≈ US$0.0003. `generate` ≈ 1,800 input + 7,000 output on `gpt-6-sol` = 1,800 × 2.00/1M + 7,000 × 10.00/1M ≈ US$0.0036 + US$0.070 ≈ US$0.074. Total ≈ US$0.08, under the US$0.20 acceptance target with headroom for one retry. A `revise` call costs about the same as `generate` plus the plan echoed as input (roughly 8,000 more input tokens, ≈ US$0.016 uncached). Running everything on `gpt-6-luna` costs ≈ US$0.005 per campaign, under the US$0.02 target. Output tokens dominate, which is why the bounds matter more than prompt trimming.

**Daily cap.** `AI_DAILY_LIMIT_PER_USER` (default 25) counted from the ledger since 00:00 UTC, including failed attempts, so a user cannot burn credit through repeated failures either. The worst case for one account per day is therefore about 25 × US$0.09 ≈ US$2.25 on `gpt-6-sol`.

**Idempotency.** The browser generates one `request_id` per attempt and reuses it on Retry after a failure. A duplicate click on a completed request replays the stored response for free; a duplicate while in flight gets a 409. This removes the classic double-charge from impatient users.

**Ledger.** Every attempt is one row with tokens, cost, status, latency and error code, so cost is measurable per account, user, campaign, operation and model (the deck's slide 5 chain). The Settings page reads `my_ai_usage_summary()`; it is the visible proof for the "AI cost measurable" success criterion.

**Single retry, no streaming.** At most one extra OpenAI call per request, only for schema failures and transient upstream errors; never for refusals, timeouts, rate limits or incomplete output. Streaming is out of scope: one synchronous call with staged progress messages in the UI is simpler, cheaper to build and easier to make idempotent.

**Why pricing is a dated table.** List prices change; hardcoded numbers would silently make the ledger wrong. `ai_model_pricing` carries `verified_on` and `active`, so a price change is a one-row update, the ledger always records the estimate that was true at the time of the call, and a model with no row is visible as `;pricing_missing` rather than hidden as zero.

## 12. Edge Function pattern and fallback

**Current pattern: `withSupabase`.** `supabase/functions/campaign-ai/index.ts` is `I-code-guide/edge-function-withsupabase/index.ts`: `export default { fetch: withSupabase({ auth: "user" }, handler) }` from `npm:@supabase/server@^1`. The wrapper answers CORS preflight, rejects anonymous calls with 401, and supplies `ctx.supabase` (RLS-scoped) and `ctx.supabaseAdmin` (secret key). The handler passes those into `handleAiRequest`.

**Documented deviation in wording.** The master prompt names the user id as `ctx.userClaims.sub`. Verified against `@supabase/server` 1.8.0 on 26 September 2026, that property does not exist and fails type-checking; the normalised id is `ctx.userClaims.id` and the raw JWT subject is `ctx.jwtClaims.sub`. The shipped file uses `ctx.userClaims?.id ?? ctx.jwtClaims?.sub`. This is a deviation in field name only; the intent (the authenticated user's id from the verified token) is unchanged, and it is recorded here, in `CLAUDE.md` section 5 and as Troubleshooting T20 so no session "corrects" it back.

**Legacy fallback.** `I-code-guide/edge-function-legacy/index.ts` uses `Deno.serve`, reads the `Authorization` header, verifies it with `auth.getUser(token)`, builds the user client (publishable key plus that header) and the admin client (secret key) with `supabase-js`, writes CORS headers explicitly, and calls the same `handleAiRequest` with `responseHeaders`. The security design is identical because the handler is identical.

**The 45-minute rule.** If the `withSupabase` version does not work within 45 minutes of debugging (Troubleshooting T4), replace the one `index.ts` file with the legacy version, redeploy, and change the "Pattern in use" line in `CLAUDE.md` section 5. Nothing under `_shared/` changes. Do not attempt to run both or to merge them.

## 13. Build-time architecture

Two tools write code into one GitHub repository, and the split is by directory so they never touch the same file at the same time.

- **Bolt** owns `src/` (pages, components, hooks, `lib/supabase.ts`, `lib/api.ts`, `lib/brief.ts`, `lib/campaigns.ts`), `tailwind.config.js`, `package.json` and the Vite scaffold. It auto-commits working changes and pulls external changes about every 30 seconds. It deploys the frontend to `*.bolt.host`.
- **Claude Code** owns `supabase/` (migration, seed, the Edge Function and `_shared/`), the contract copies (`src/types/campaign.ts`, `src/lib/validation.ts`, byte copies of `F-ai/` files), `CLAUDE.md`, `AGENTS.md`, `.env.example` and `docs/`. It touches other `src/` files only for fixes Bolt struggles with, and only while Bolt is idle. It applies migrations and deploys the Edge Function through the Supabase CLI.
- **GitHub** is the meeting point: branch merges and conflict resolution happen there, not in either tool.
- **One change set per session.** Each Claude Code session is one Part H change set: `git pull`, show the session check, make the change, state how to verify, commit with the change-set name, push, `/clear`. Each Bolt prompt is likewise one change set ending with a verification step. The contract files (`campaign.schema.json`, `brief-check.schema.json`, `types.ts`) change only together, with the SQL, Edge Function and frontend updated in the same change set.

## 14. Known limits and what happens at scale

- **Edge Function wall-clock.** Generation is one synchronous call with a 110-second client timeout under a 150-second free-plan limit. A slower model or a larger plan hits T9; the remedies are lower output bounds first, then a plan upgrade, then (with approval) splitting generation.
- **Free-plan pauses.** A free Supabase project pauses after about a week of inactivity, and the first request after a pause is slow or fails. Before the demo, open the Dashboard and run one query to wake it, and keep the demo account's campaign seeded.
- **No realtime.** The workspace reloads after saves and Apply; two tabs on the same campaign can overwrite each other's edits at the version level (the last save wins, but nothing is lost because every version is kept).
- **Single region, single function.** All users hit one Postgres and one Edge Function region; latency to OpenAI adds to every call. At real scale the daily cap becomes a billing plan, `campaign_plans` needs pruning of old versions, and the ledger needs partitioning by month; none of that is needed for the hackathon.
- **Per-user cap only.** There is no global spend ceiling in the app; the OpenAI project's own spending limit is the backstop and must be set in the OpenAI Dashboard before the link goes public.
