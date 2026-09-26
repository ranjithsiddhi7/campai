<!-- AI note: Project memory for Claude Code (and, as AGENTS.md, for other coding tools). Read fully at the start of every session; it replaces replaying old conversations.
     Owner: Claude Code edits this file (repository root). Bolt must never edit it. Keep AGENTS.md byte-identical (copy after every change). -->

# CLAUDE.md — campAI

## 0. Session check (show this to the human at the start of EVERY session, before any other work)

```
campAI session check
1. Did you run `git pull`? Is Bolt idle?
2. Which ONE change set is this session for? (Part H prompt name)
3. Right model for it? Stronger: SQL/RLS, Edge Function, schema, debugging. Lighter: UI, copy, small fixes.
   Switch now if needed. Switching mid-session re-reads the whole session at full rate.
4. When done: commit, push, then /clear before the next change set.
```

If the human runs `/model` partway through a session, reply with exactly one line: "Heads-up: the next reply re-reads this whole session at the full, uncached rate. If the current task is done, `/clear` first." Then continue.

## 1. What campAI is (one-liner)

campAI is a Campaign Operating System: a small-business owner types what they want in plain words, answers only the questions we truly need, and gets one complete, editable, credible marketing campaign (audience, message, offer, channels, content, calendar, copy, budget, KPIs) in under two minutes. Three-day hackathon build. **One useful campaign beats ten unfinished features.**

The master specification is `docs/campai-package/campAI-implementation-package.md` (the combined document) and the files next to it. **The master prompt `campAI-master-prompt-v2.md` is the source of truth**; this file summarises it for daily work.

## 2. Stack and pinned dependencies (do not change without the human's explicit approval)

- **Frontend:** Bolt's Vite + React 18 + TypeScript + Tailwind CSS scaffold. Dependencies allowed: `react-router-dom`, `@supabase/supabase-js`, `zod`, `date-fns`, `lucide-react`. **No** state-management library (React context + custom hooks only). **No** component library (Tailwind + tokens in `tailwind.config.js`).
- **Backend:** Supabase — Auth (email + password, "Confirm email" OFF for the hackathon), Postgres with Row Level Security (RLS), one Edge Function `campaign-ai`.
- **AI:** OpenAI **Responses API** (`POST /v1/responses`) with strict Structured Outputs. Models via secrets: `OPENAI_MODEL` (default `gpt-6-sol`) for `generate` and `revise`; `OPENAI_MODEL_LIGHT` (default `gpt-6-luna`) for `brief_check`. `store: false`, `max_output_tokens` on every call, no streaming, no tools, no agents.
- **Version control:** GitHub. Bolt auto-commits and pulls every ~30 s. Claude Code: `git pull` at session start, commit + push at session end.
- **Hosting:** frontend on Bolt (`*.bolt.host`); Edge Function on Supabase.

## 3. Exactly three AI operations (pinned)

`brief_check`, `generate`, `revise` — all behind the single Edge Function `campaign-ai`, dispatched on the `operation` field. No chat agent, no autonomous loops, no tool calling. Contract: `src/types/campaign.ts` (`AiRequest`, `AiResponse`, `AiError`). Prompts: `supabase/functions/_shared/prompts.ts` (mirrors `docs/campai-package/F-ai/prompts.md`).

## 4. Keys and secrets (pinned; violating this is an incident)

- Browser gets **only** `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`), or `VITE_SUPABASE_ANON_KEY` if Bolt's integration injected that name. Nothing else may start with `VITE_`.
- Secrets live in Supabase Edge Function secrets: `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`, `AI_DAILY_LIMIT_PER_USER`. Locally in `supabase/functions/.env` (git-ignored). Secret names never start with `SUPABASE_`.
- The Supabase **secret key** (`sb_secret_…`) is injected into Edge Functions automatically; it is never typed anywhere by us.
- Never "fix" a missing-variable error by adding a `VITE_` prefix to a secret. Never paste a key into chat, a commit, or Bolt settings.
- Legacy `anon` / `service_role` JWT keys: do not introduce them.

## 5. Edge Function pattern in use

**Pattern in use: `withSupabase` (current).** ← Update this line if the team switches. Options:
- `withSupabase` from `npm:@supabase/server@^1` (file: `docs/campai-package/I-code-guide/edge-function-withsupabase/index.ts`). Verified against v1.8.0: the user id is `ctx.userClaims.id` (or `ctx.jwtClaims.sub`); `ctx.supabase` is RLS-scoped; `ctx.supabaseAdmin` uses the secret key.
- Legacy `Deno.serve` + hand-built clients + explicit CORS (file: `docs/campai-package/I-code-guide/edge-function-legacy/index.ts`).

Switch rule: if `withSupabase` does not work within **45 minutes** of debugging, replace `supabase/functions/campaign-ai/index.ts` with the legacy file, redeploy, and change the line above. Both use the same `_shared/handler.ts`; nothing else changes.

## 6. Repository layout and file ownership

```
CLAUDE.md, AGENTS.md            Claude Code
docs/campai-package/            Claude Code (the implementation package; read-only reference)
src/                            Bolt (Claude Code only for fixes Bolt struggles with, while Bolt is idle)
  types/campaign.ts             COPY of docs/campai-package/F-ai/types.ts — Claude Code owns; Bolt imports only
  lib/validation.ts             Claude Code owns (mirror of _shared/validation.ts); Bolt imports only
  lib/supabase.ts, api.ts, brief.ts, campaigns.ts   Bolt creates from snippets; either tool may fix
  hooks/, components/, pages/   Bolt
supabase/
  migrations/                   Claude Code (SQL). Bolt must never write SQL.
  seed.sql                      Claude Code
  functions/campaign-ai/index.ts            Claude Code
  functions/_shared/{types,validation,normalise,prompts,openai,handler}.ts + *.schema.json   Claude Code
  functions/.env                git-ignored, local secrets
.env.example                    Claude Code (no secrets, ever)
tailwind.config.js              Bolt (tokens from the package)
```

**Contract files are canonical:** `docs/campai-package/F-ai/campaign.schema.json`, `brief-check.schema.json`, `types.ts`. Copies live at `src/types/campaign.ts` and `supabase/functions/_shared/`. Change them only together, and update SQL, Edge Function and frontend in the same change set.

## 7. Instructions for any AI assistant or coding tool (from the master prompt)

1. The master prompt is the source of truth. If code, a chat message, or your defaults conflict with it, the master prompt wins unless the human explicitly overrides it now. If you think it is wrong, say so and propose a change; never silently deviate.
2. Do not change pinned decisions without explicit approval: OpenAI models and Responses API; Supabase key types; Edge Function pattern and fallback; exactly three AI operations behind one function; the table list; the frontend dependency list; the Claude Code / Bolt ownership split.
3. Never expose secrets (see section 4).
4. One change set at a time. Before editing, state in one or two lines which files you will change and why. After editing, state how to verify.
5. When something breaks, use the Troubleshooting runbook (section 9) first. If two fix attempts fail, stop and report what you tried, what happened, and the options. Do not rewrite the architecture or swap libraries.
6. The contract files are canonical (section 6).
7. If a pinned API or command fails in a way that suggests the platform changed, check the current official documentation, report the difference, and wait for approval. Decisions were verified on 26 September 2026.
8. Follow the session rules in section 8.
9. Talk to the human in plain language, expand every acronym on first use, give honest risk estimates, and say when you are unsure.

## 8. Session and usage rules

1. **One session per change set** (a Part H prompt name). `/clear` between change sets.
2. **Choose the model right after `/clear`, never mid-task.** Stronger model: SQL with RLS, the Edge Function, the JSON Schema, debugging. Lighter model: UI tweaks, copy, small fixes. Default to the lighter model.
3. `/compact` when a session is long but unfinished.
4. Paste only the relevant lines of logs and errors.
5. Start new sessions from files (this file, the package), not from history. Do not re-read large files already summarised.
6. Spend usage in priority order: must-have flow → café scenario passing twice → Should-haves. Check the plan's usage at the start of each day; if more than half the weekly allowance is gone, cut per Part J.
7. Backend-heavy work (SQL, Edge Function) happens here, not in Bolt. Never let both tools edit the same file at the same time.
8. Git: `git pull` first thing; commit with a message naming the change set (for example `H5: wire campaign-ai Edge Function`); push at the end.

## 9. Troubleshooting runbook (match symptom → fix → verify; two failed attempts = stop and report)

| # | Symptom | Likely cause | Fix |
|---|---------|--------------|-----|
| T1 | Browser console shows a CORS (Cross-Origin Resource Sharing) error calling the Edge Function | Preflight `OPTIONS` not answered or CORS headers missing | `withSupabase` handles CORS. Legacy pattern: return CORS headers on `OPTIONS` and on every response including errors (`_shared/handler.ts` adds `responseHeaders`) |
| T2 | Edge Function returns 401 | No user session token on the request | Call with `supabase.functions.invoke(...)` (attaches the token); confirm the user is signed in |
| T3 | 404 for a campaign the user owns | RLS policy missing/wrong, or `user_id` not set on insert | Check `campaigns_insert_own` policy and `user_id default auth.uid()` in the migration; re-run the RLS test in K-testing |
| T4 | `withSupabase` import fails, `ctx` undefined, auth odd | `@supabase/server` is recent; tools misuse it | Time box 45 min, then paste the legacy `index.ts`; update section 5 |
| T5 | Frontend says an environment variable is missing | Not set in Bolt, or wrong name | Browser may only have `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`). Never add a secret under `VITE_` |
| T6 | OpenAI 400 "Invalid schema" | Strict-mode rule broken | Every property in `required`; `additionalProperties: false` on every object; nullable as `["string","null"]`; no unsupported keywords (`$comment`/`title` are stripped in `prompts.ts`) |
| T7 | OpenAI `status: "incomplete"` | `max_output_tokens` too low | Raise `OUTPUT_BOUNDS.maxOutputTokens` or lower the calendar bound (6–12) in `types.ts` + schema `maxItems` |
| T8 | OpenAI refusal content item | Brief triggered a safety refusal | Show the safe message; no automatic retry; ledger status `refused` (already implemented) |
| T9 | Generation > 90 s or function times out | Output too large or Edge Function wall-clock limit | Lower output bounds first; check the plan's Edge Function limit; splitting generation needs human approval |
| T10 | OpenAI 429 / quota | Rate limit or prepaid credit exhausted | Check OpenAI billing; app shows "campAI is busy, try again in a minute" |
| T11 | Budget lines don't add up / dates outside campaign | Model arithmetic or date drift | Handled by `_shared/normalise.ts`; never by retrying |
| T12 | Bolt overwrote Claude Code changes / Git conflict | Both tools edited one file | Resolve on GitHub; re-apply the smaller change; respect ownership; `git pull` at session start |
| T13 | Bolt added a library not on the pinned list | Bolt defaults | Revert; restate the pinned list in the next Bolt prompt |
| T14 | Deployed JS contains `sb_secret_` or `sk-` | Secret leaked to the frontend | Incident: rotate the key now (Supabase/OpenAI), remove, redeploy, re-run the leak scan |
| T15 | Smart start hangs/errors/extracts nonsense | `brief_check` failed or invalid | App must fall back to the full nine-question sequence automatically; fix the fallback first |
| T16 | Claude Code or Bolt usage limit close | Long sessions, mid-session model switches, big pasted logs | `/clear`, lighter model, short prompts, error lines only; pause non-essential work |
| T17 | `save_plan_version` raises "campaign not found" for the owner | Called with a client that has no user session (RLS hides the row) | In the Edge Function use `ctx.supabase` (user client), never `supabaseAdmin`, for plans; in the browser confirm the session exists |
| T18 | `rebuild_calendar_items` permission denied | Function grant missing | The migration grants execute to `authenticated`; re-run `supabase db push` or the grant statement |
| T19 | Calendar edit "is not in the current plan" | Plan JSON ids and `calendar_items` ids diverged (data written without `save_plan_version`) | Always write plans through `save_plan_version`; to repair, re-save the latest plan through it once |
| T20 | `ctx.userClaims.sub` is undefined / type error | Master prompt names a field that does not exist in `@supabase/server` 1.x | Use `ctx.userClaims.id` (or `ctx.jwtClaims.sub`), as the package's `index.ts` already does |

See `TROUBLESHOOTING.md` in the package for the extended notes behind T17–T20.

## 10. Definition of done for the hackathon (short form)

Auth works; café scenario passes twice in a row end to end (smart start → questions → review → build ≤ 90 s → workspace → edit → revise Apply/Discard → save → reopen); second account cannot read the first account's data via the API; ledger row per attempt and a Settings usage summary; leak scan finds zero `sb_secret_`/`service_role`/`sk-` in the deployed bundle; live link, Loom, deck, team details submitted through the portal.
