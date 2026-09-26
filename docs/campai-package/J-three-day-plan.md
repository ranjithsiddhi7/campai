<!-- AI note: Part J: the hour-by-hour three-day build plan for campAI — every block with objective, actions, platform, tool, session/model choice, verification, stop condition and usage weight; plus the cut list, usage budget plan and go/no-go gates.
     Owner: Claude Code (docs); the team edits times as needed; Bolt never edits it. -->

# J-three-day-plan.md — Part J: Three-day plan

Acronyms: RLS = Row Level Security; API = Application Programming Interface; UI = User Interface; CLI = Command-Line Interface; SQL = Structured Query Language; JSON = JavaScript Object Notation; URL = Uniform Resource Locator; JWT = JSON Web Token; CRUD = Create, Read, Update, Delete.

## 1. How to read the plan, and the roles

The plan is a sequence of numbered blocks per day. Blocks that share a time slot run in parallel, one per person, and never touch the same files. Every block names the Part H prompt or package files it uses, the platform, the tool, and a stop condition: the moment you stop trying and report to the team instead of pushing on. If a block finishes early, start the next one; do not add features. The must-have flow (sign in → brief → generate → workspace → edit → revise → save → reopen) always comes before anything optional, and the café scenario must pass twice in a row before the first Should-have is touched. The submission deadline is assumed to be 18:00 on Day 3; if yours differs, shift every Day 3 time by the same amount and keep the two-hour buffer.

| Role | Person | Owns | Tools |
|---|---|---|---|
| Bolt driver | Person A | Everything under `src/` through prompts G and H1–H13; the Bolt deployment | Bolt, browser, GitHub |
| Claude Code driver | Person B | `supabase/` (migration, seed, Edge Function), `CLAUDE.md`, `AGENTS.md`, docs, debugging, the contract copies `src/types/campaign.ts` and `src/lib/validation.ts` | Claude Code, terminal, Supabase CLI, Supabase Dashboard, OpenAI Dashboard |
| Tester and demo (optional) | Person C | Runs the K-testing checks, keeps the bug log, prepares the deck, records the Loom | Browser, terminal (curl), slide template, Loom |

With two people, Person B also does Person C's work; the tester blocks run in Person B's column, Person A records the Loom while Person B aligns the deck.

## 2. Daily rhythm (all three days)

| Time | What | Who |
|---|---|---|
| 09:00 | Usage check: open the Claude usage page and the Bolt usage page; write both percentages in the bug log header. Rule: if more than 50% of the weekly allowance is gone on either tool, apply the cut list (section 7) from item 1 before anything else today | Person B |
| 09:15 | Stand-up, 15 minutes: which change sets today, who owns which files, which blocks run in parallel. Say it out loud: Bolt in `src/`, Claude Code in `supabase/` and docs. Day 3 stand-up also fixes the freeze time (15:15) and submission time (16:00) | All |
| 09:30–13:00 | Work in blocks | All |
| 13:00 | Sync, 15–30 minutes: Person B runs `git pull`; Person A confirms Bolt shows the latest commit (Bolt pulls every 30 seconds). Record any gate due at midday. Reassign a stuck block | All |
| 13:30–18:00 | Work in blocks | All |
| 18:00 | Must-have flow run: whatever part of the flow exists today, run once on the deployed `*.bolt.host` site, never on localhost | Person C (or B) |
| 18:30 | Bug log review: every open bug gets an owner and a slot tomorrow, or a "will not fix" note naming the cut item | All |
| End of day | Claude Code: commit, push, `/clear`. Bolt: confirm the last auto-commit is on GitHub. Tick the end-of-day checklist (section 10) | A and B |

## 3. Legend for the per-block fields

| Field | Meaning |
|---|---|
| Time | Start–end, local time |
| Objective | The one outcome the block exists for |
| Actions | Numbered steps naming the prompt id or files |
| Platform | Bolt, Supabase Dashboard, Supabase CLI, GitHub, OpenAI Dashboard, terminal, browser |
| Tool | Bolt, Claude Code, or human (no AI tool) |
| Session / model | Whether Claude Code starts a fresh session with `/clear` (yes/no), and the model tier chosen right after `/clear`: Stronger (SQL and RLS, Edge Function, schema, debugging) or Lighter (UI, copy, small fixes). "n/a" when Claude Code is not used |
| Expected result | What you see when the block is done |
| Verification | The check that proves it |
| Stop condition | When to stop and report instead of continuing |
| Usage weight | light / medium / heavy expected Claude or Bolt usage; heavy blocks are scheduled early |

## 4. Day 1 — Repository, Supabase, backend scaffold, shell, authentication (09:00–20:00)

### D1-1 Repository, Bolt project and GitHub connection (Person A)

| Field | Value |
|---|---|
| Time | 09:30–10:15 |
| Objective | One GitHub repository that Bolt commits to |
| Actions | 1. GitHub: create private repository `campai`. 2. Bolt: new project from the default Vite + React + TypeScript + Tailwind CSS scaffold. 3. Bolt: connect GitHub to `campai`; wait for the first auto-commit. 4. Bolt: paste `I-code-guide/bolt-project-instructions.md` into the project-level instructions setting if your plan has one. 5. Invite Persons B and C as collaborators |
| Platform | GitHub, Bolt |
| Tool | human |
| Session / model | n/a |
| Expected result | Scaffold files visible on GitHub `main` |
| Verification | A Bolt commit appears on GitHub within a minute of connecting |
| Stop condition | 30 minutes without a Bolt commit on GitHub: report; Person B pushes the scaffold from the laptop and Bolt imports from GitHub |
| Usage weight | light |

### D1-2 Supabase project, authentication settings, CLI link, OpenAI key (Person B)

| Field | Value |
|---|---|
| Time | 09:30–10:30 |
| Objective | Supabase project ready with instant sign-up; laptop linked; OpenAI billable |
| Actions | 1. `E-supabase/setup-steps.md` Part 1: project `campai`, Singapore region, database password in the password manager; note Project ref, Project URL, publishable key. 2. Part 2: Email provider on, "Confirm email" OFF, Site URL `http://localhost:5173`, redirect URLs `http://localhost:5173/**` and `https://*.bolt.host/**`. 3. Part 3: `git clone`, install the CLI, `supabase login`, `supabase init`, `supabase link --project-ref <ref>`. 4. Part 5 step 15: OpenAI Dashboard → project-scoped key `campai-hackathon`, US$10 prepaid credit, US$20 monthly limit. 5. Create `supabase/.env.production` with the four secret lines (git-ignored) |
| Platform | Supabase Dashboard, terminal, OpenAI Dashboard |
| Tool | human |
| Session / model | n/a |
| Expected result | Project ready; `supabase link` reports linked; OpenAI shows credit |
| Verification | Authentication → Providers → Email shows Confirm email off; `supabase projects list` marks `campai` linked |
| Stop condition | CLI fails to install after two methods (package manager, then `npx supabase`): use the Dashboard SQL Editor path (setup-steps step 14) and report |
| Usage weight | light |

### D1-3 Bolt starting prompt G: the frontend shell (Person A)

| Field | Value |
|---|---|
| Time | 10:15–12:30 |
| Objective | Every screen exists with stubbed café data and navigation; no backend yet |
| Actions | 1. Bolt: paste `G-bolt-starting-prompt.md` exactly, nothing else. 2. Click through Landing → Sign-up → Dashboard → New campaign → workspace (twelve sections) → Settings → Not found. 3. If Bolt added a dependency outside the pinned list, one prompt: "Remove <package>; allowed dependencies are react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react" (T13). 4. At most two small follow-up prompts for missing screens; everything else goes in the bug log for the H prompts. 5. Deploy to `*.bolt.host`; note the URL |
| Platform | Bolt |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Shell deployed; every route in `I-code-guide/index.md` section 2 renders |
| Verification | Open the deployed URL on a phone and a laptop |
| Stop condition | Build fails after two fix prompts: stop, record the error lines, continue with H1 after lunch on whatever builds |
| Usage weight | heavy (Bolt) |

### D1-4 I0 backend scaffold (Person B)

| Field | Value |
|---|---|
| Time | 10:30–12:30 |
| Objective | Migration applied, secrets set, Edge Function deployed, demo data seeded |
| Actions | 1. Claude Code: `/clear`, Stronger model, `git pull`; Bolt is busy with prompt G but `src/` is untouched by Claude Code except the two contract copies. 2. Ask Claude Code to perform `I-code-guide/index.md` section 8 steps 1–10 (package into `docs/campai-package/`, `CLAUDE.md`, `AGENTS.md`, `.env.example`, `.gitignore` lines, migration, seed, `_shared/` files, `campaign-ai/index.ts`, `src/types/campaign.ts`, `src/lib/validation.ts`). 3. `supabase db push` (setup-steps Part 4). 4. `supabase secrets set --env-file ./supabase/.env.production`; `supabase secrets list` (Part 5). 5. `supabase functions deploy campaign-ai` (Part 6). 6. Dashboard: create `demo@campai.app` with Auto Confirm; run `seed.sql` in the SQL Editor (Part 7). 7. Commit `I0: backend scaffold (migration, seed, edge function, contracts)`, push, `/clear` |
| Platform | terminal, Supabase CLI, Supabase Dashboard |
| Tool | Claude Code |
| Session / model | `/clear` yes; Stronger |
| Expected result | Eight tables, two pricing rows, one demo campaign with 12 calendar items, `campaign-ai` deployed |
| Verification | Authentication → Policies shows RLS on every table; `supabase secrets list` shows the four names |
| Stop condition | `db push` fails twice after the runbook: stop and report the exact error lines; never hand-edit the migration without the team |
| Usage weight | heavy (Claude) |

### D1-5 First curl smoke test of the Edge Function (Person B)

| Field | Value |
|---|---|
| Time | 12:30–13:00 |
| Objective | The deployed function answers correctly before any UI calls it |
| Actions | 1. `curl -i -X POST https://<ref>.supabase.co/functions/v1/campaign-ai -H "Content-Type: application/json" -d '{}'` → 401 `unauthenticated`. 2. JWT for the demo user: `curl -X POST "https://<ref>.supabase.co/auth/v1/token?grant_type=password" -H "apikey: <publishable key>" -H "Content-Type: application/json" -d '{"email":"demo@campai.app","password":"<demo password>"}'`; copy `access_token`. 3. Repeat step 1 with `-H "Authorization: Bearer <access_token>"` → 400 `invalid_request`. 4. Valid `brief_check` request (shape: `AiRequest` in `src/types/campaign.ts`) for the demo campaign id → 200 with nine fields. 5. SQL Editor: `select operation, status, latency_ms, estimated_cost_usd from ai_usage_events order by created_at desc limit 3;` |
| Platform | terminal, Supabase Dashboard |
| Tool | human; Claude Code only if a call fails |
| Session / model | no new session unless debugging; then `/clear` yes; Stronger |
| Expected result | 401, 400, 200 in that order; one ledger row `success` |
| Verification | Edge Function Logs show the three requests, no stack trace |
| Stop condition | Any `withSupabase` import or `ctx` error starts the 45-minute clock (T4). At 45 minutes: paste `edge-function-legacy/index.ts` over `campaign-ai/index.ts`, redeploy, update `CLAUDE.md` section 5, commit |
| Usage weight | medium |

### D1-6 H1 Connect Supabase (Person A)

| Field | Value |
|---|---|
| Time | 13:30–15:00 |
| Objective | Frontend has a Supabase client and only the two allowed environment variables |
| Actions | 1. Bolt: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (setup-steps Part 8, integration Path A or paste Path B). 2. Paste prompt H1; Bolt creates `src/lib/supabase.ts` from `src-snippets/src__lib__supabase.ts`. 3. Preview console: no missing-variable error. 4. If the integration offers to run SQL, decline |
| Platform | Bolt |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | App loads with a working client |
| Verification | Bolt environment settings list exactly two variables; no console errors |
| Stop condition | T5 error after two prompts: stop; Person B checks names; never add a `VITE_` secret |
| Usage weight | light |

### D1-7 Repository hygiene and test scripts (Person B)

| Field | Value |
|---|---|
| Time | 13:30–15:00 |
| Objective | Docs current; RLS and leak-scan commands ready for Day 2 |
| Actions | 1. Claude Code: `/clear`, Lighter, `git pull`. 2. Confirm `CLAUDE.md` section 5 names the deployed pattern; `cp CLAUDE.md AGENTS.md`. 3. Save the D1-5 curl commands, the two-account RLS test from `K-testing.md`, and an SQL insert for a café test brief into `docs/test-scripts.md` (no tokens or passwords). 4. Commit `docs: test scripts`, push, `/clear` |
| Platform | terminal |
| Tool | Claude Code |
| Session / model | `/clear` yes; Lighter |
| Expected result | Tomorrow's tests are copy-paste |
| Verification | `git diff --stat` touches only `docs/`, `CLAUDE.md`, `AGENTS.md` |
| Stop condition | None; shorten if D1-5 needed the fallback |
| Usage weight | light |

### D1-8 H2 Authentication (Person A)

| Field | Value |
|---|---|
| Time | 15:00–17:00 |
| Objective | Real sign-up, sign-in, sign-out, route guard, dashboard list |
| Actions | 1. Bolt: paste prompt H2 (`src/hooks/useAuth.tsx` from the snippet, `RequireAuth`, sign-in and sign-up pages, dashboard reading `campaigns`). 2. Preview: sign up with a fresh email, land on `/app`, sign out, sign in. 3. Dashboard: a `profiles` row exists. 4. Deploy |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Deployed site signs up without email confirmation and guards `/app` |
| Verification | Private window on `/app` redirects to `/sign-in` |
| Stop condition | Two failed prompts on one auth error: stop, send the error lines to Person B, who advises (no hand-off point is open on Day 1; Person B edits only `supabase/`) |
| Usage weight | medium |

### D1-9 Edge Function hardening and URL configuration (Person B)

| Field | Value |
|---|---|
| Time | 15:00–17:00 |
| Objective | Function verified against the deployed database; Supabase knows the live URL |
| Actions | 1. Claude Code: `/clear`, Stronger, `git pull`. 2. If Deno is installed: `cd supabase/functions && deno check campaign-ai/index.ts`. 3. Supabase Dashboard → Authentication → URL Configuration: Site URL = the real `*.bolt.host` URL; add it with `/**` to redirects. 4. Commit, push, `/clear` |
| Platform | terminal, Supabase Dashboard |
| Tool | Claude Code |
| Session / model | `/clear` yes; Stronger |
| Expected result | No type errors; URL configuration matches the deployed site |
| Verification | `deno check` passes or is skipped; Site URL shows the bolt.host address |
| Stop condition | Two failed fixes of a type error: report; the shipped function was verified, so suspect a copy step |
| Usage weight | medium |

### D1-10 Fix buffer (A and B)

| Field | Value |
|---|---|
| Time | 17:00–18:00 |
| Objective | Nothing blocks sign-up and sign-in |
| Actions | 1. Bug log top-down: A fixes `src/` in Bolt, B fixes `supabase/` in Claude Code. 2. Nothing new is started |
| Platform | Bolt, terminal |
| Tool | Bolt, Claude Code |
| Session / model | `/clear` yes; Lighter for UI, Stronger for `supabase/` |
| Expected result | No open item marked "blocks flow" |
| Verification | Bug log |
| Stop condition | Two failed fixes on one bug: park it for Day 2 09:30 |
| Usage weight | medium |

### D1-11 Must-have flow run, Gate 1, close of day

| Field | Value |
|---|---|
| Time | 18:00–19:30 (buffer to 20:00) |
| Objective | Sign up and sign in on the deployed shell; Edge Function answers curl; repository clean |
| Actions | 1. Person C (or B), deployed URL: sign up with a new email, reach the empty dashboard, sign out, sign in. 2. Person B re-runs D1-5 steps 1 and 3 (401, then 400). 3. Record Gate 1 (section 9). 4. Bug log review; commit, push, `/clear`; Bolt's last commit on GitHub; usage percentages in the bug log; agree tomorrow's 09:30 blocks (D2-1 and D2-2) |
| Platform | browser, terminal, GitHub |
| Tool | human |
| Session / model | n/a |
| Expected result | Gate 1 passed; end-of-day checklist ticked |
| Verification | `profiles` row for the new email; `git status` clean |
| Stop condition | Gate failed: apply the Gate 1 fallback tonight, not tomorrow |
| Usage weight | light |

## 5. Day 2 — Brief, generation, workspace, calendar, save and reopen (09:00–20:00)

Stand-up note: today's change sets are H3, H4, H5, H6, H7, H8. H5 (first real generation from the UI) is the heavy block and must be done by 13:00; Person B proves generation on the backend from 09:30 so the UI never waits on an unknown.

### D2-1 H3 Guided brief (Person A)

| Field | Value |
|---|---|
| Time | 09:30–10:45 |
| Objective | Nine questions, one per screen, with defaults and examples; brief saved to `campaign_briefs` |
| Actions | 1. Bolt: paste prompt H3 (`src/lib/brief.ts` from the snippet, `QuestionStep`, `BriefReview`, `createCampaign()` and `upsertBrief()` in `src/lib/campaigns.ts`). 2. Preview: New campaign → nine defaults → review. 3. Dashboard: one `draft` campaign and one `campaign_briefs` row |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | A saved café brief |
| Verification | Reload: the review screen shows the saved values |
| Stop condition | Two failed prompts: record error lines; go to H4 only if the brief saves, otherwise call Person B at 10:45 |
| Usage weight | medium |

### D2-2 Backend generation dry run: the first real generation (Person B)

| Field | Value |
|---|---|
| Time | 09:30–10:45 |
| Objective | One real `generate` succeeds on the deployed function before the UI depends on it |
| Actions | 1. Claude Code: `/clear`, Stronger, `git pull`. 2. SQL Editor: insert a test campaign and café brief for the demo user (`docs/test-scripts.md`). 3. Terminal: demo JWT (D1-5 step 2); send `operation: "generate"` for that campaign id. 4. SQL Editor: `campaign_plans` version 1 with `source = 'generated'`, 6–20 `calendar_items`, ledger row `success`, `latency_ms` ≤ 90,000, non-zero `estimated_cost_usd`. 5. Run again with a new `request_id`; then repeat the first `request_id` and confirm header `X-Campai-Replayed: true` |
| Platform | terminal, Supabase Dashboard |
| Tool | human for the calls; Claude Code for debugging |
| Session / model | `/clear` yes; Stronger |
| Expected result | Two generations, one replay, three ledger rows |
| Verification | Ledger query from `TROUBLESHOOTING.md` Part 3 |
| Stop condition | `incomplete` twice (T7): raise `maxOutputTokens.generate` to 16000 in both `types.ts` copies, redeploy, one more try. Latency above 90 s twice (T9): apply cut item 2 and report. Two other failures: stop and report the log lines |
| Usage weight | heavy (Claude) |

### D2-3 H4 Brief check and smart start (Person A)

| Field | Value |
|---|---|
| Time | 10:45–11:45 |
| Objective | Free-text box → `brief_check` → only inferred or missing questions → review marks assumed values; silent fallback to nine questions |
| Actions | 1. Bolt: paste prompt H4 (`SmartStart`, `briefCheck()` in `src/lib/api.ts`, `draftFromBriefCheck()`, `questionsToAsk(statuses)`). 2. Preview: type the café sentence; fewer than nine questions appear; review shows "We assumed this". 3. Fallback test (T15): in browser DevTools, block requests to `campaign-ai`, start a new campaign → nine questions appear with no error shown |
| Platform | Bolt, browser |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Smart start works and degrades to the fixed sequence |
| Verification | Ledger shows a `brief_check` row on `gpt-6-luna`; blocked-request test shows nine steps |
| Stop condition | Fallback does not trigger after two prompts: apply cut item 4 (always `questionsToAsk(null)`) until fixed; generation must not wait for this |
| Usage weight | medium |

### D2-4 Dry-run fixes and second test account (Person B)

| Field | Value |
|---|---|
| Time | 10:45–11:45 |
| Objective | Backend issues from D2-2 closed; ready to support H5 |
| Actions | 1. Continue the D2-2 session if the bug is the same, otherwise `/clear`, Stronger. 2. Fix only in `supabase/`; `supabase functions deploy campaign-ai`. 3. If nothing to fix: create `tester2@campai.app` (Auto Confirm) and read the K-testing RLS and CRUD sections. 4. Commit, push |
| Platform | terminal, Supabase Dashboard |
| Tool | Claude Code |
| Session / model | continue, or `/clear` yes; Stronger |
| Expected result | Backend stable |
| Verification | D2-2 step 4 checks still hold after redeploy |
| Stop condition | Two failed fixes: report; keep the last working deploy |
| Usage weight | medium |

### D2-5 H5 AI Edge Function wiring: generation from the UI (Person A; Person B on standby)

| Field | Value |
|---|---|
| Time | 11:45–13:00 |
| Objective | "Build my campaign" calls `generate` via `supabase.functions.invoke`, shows staged progress, then the workspace |
| Actions | 1. Bolt: paste prompt H5 (`generateCampaign()` with a stable `request_id` in `src/lib/api.ts`, `GenerationProgress`, handling of `generating`, `ready`, `error` with Retry reusing the same `request_id`). 2. Preview: café brief → Build → ≤ 90 s → real content in the workspace. 3. Dashboard: new plan version, calendar rows, ledger row. 4. Person B watches Edge Function Logs during the first click. 5. Record Gate 2 at the 13:00 sync |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt; Claude Code on standby |
| Session / model | Person B: `/clear` yes; Stronger, opened only when an error appears |
| Expected result | Gate 2: one real generation saved and visible in the UI |
| Verification | Workspace content matches the newest `campaign_plans.plan` |
| Stop condition | Two failed Bolt prompts on the invoke call: **hand-off point 1** opens. Person A stops prompting (Bolt idle); Person B pastes `src-snippets/src__lib__api.ts` over `src/lib/api.ts` in Claude Code, fixes the call site, commits, pushes; Person A waits one minute for Bolt to pull. 45 minutes total, then report |
| Usage weight | heavy (Bolt and Claude) |

### D2-6 H6 Campaign rendering (Person A)

| Field | Value |
|---|---|
| Time | 13:30–15:00 |
| Objective | All twelve sections render the real plan; normalisation flags shown as "We adjusted this" |
| Actions | 1. Bolt: paste prompt H6 (`useCampaign.tsx` from the snippet, one component per section, `FlagsNotice`, damaged-data state with Rebuild). 2. Preview: click every section; check budget lines, timeline dates, KPIs. 3. Deploy |
| Platform | Bolt |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | No stub data or "undefined" anywhere |
| Verification | Compare three sections with `campaign_plans.plan` |
| Stop condition | Two prompts on one rendering bug: log it and move on; cosmetics wait for H11 |
| Usage weight | medium |

### D2-7 RLS isolation test via API with two accounts (Person B or C)

| Field | Value |
|---|---|
| Time | 13:30–15:00 |
| Objective | A second user cannot read, list or modify the first user's data through the API |
| Actions | 1. JWTs for the demo user and `tester2@campai.app`. 2. `K-testing.md` RLS section, as tester2: `GET /rest/v1/campaigns?select=*` → empty; `GET /rest/v1/campaigns?id=eq.<demo campaign id>` → empty; `PATCH` that id → zero rows; `POST /functions/v1/campaign-ai` with the demo campaign id → 404 `not_found`. 3. Repeat for `campaign_plans`, `calendar_items`, `campaign_revisions`, `ai_usage_events`. 4. Record pass or fail per table |
| Platform | terminal |
| Tool | human; Claude Code (Stronger) only to fix a policy |
| Session / model | no session unless fixing; then `/clear` yes; Stronger |
| Expected result | Every cross-account request returns nothing or 404 |
| Verification | The same requests with the demo JWT return the rows |
| Stop condition | A leak on any table is a blocker: Person B adds a new migration file with the policy fix, `supabase db push`, re-run. Two failed fixes: stop, report; no further UI work until fixed |
| Usage weight | medium |

### D2-8 H7 Editable calendar (Person A)

| Field | Value |
|---|---|
| Time | 15:00–16:30 |
| Objective | Calendar items can be added, edited, deleted and status-changed; every change writes a plan version |
| Actions | 1. Bolt: paste prompt H7 (`CalendarTable`, `CalendarItemDrawer`, calls to `update_calendar_item`, `add_calendar_item`, `delete_calendar_item` in `src/lib/campaigns.ts`). 2. Preview: edit a title, move a date, add an item, delete one, mark one `done`. 3. Dashboard: row count matches; latest `campaign_plans` version has `source = 'edited'` |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Calendar CRUD complete and persistent |
| Verification | Reload: edits persist; plan JSON `calendar_items` matches the rows (T19) |
| Stop condition | "is not in the current plan" twice: it is T19; Person B handles it in `supabase/`; Person A logs and continues with H8 |
| Usage weight | medium |

### D2-9 Leak scan on a production build (Person B or C)

| Field | Value |
|---|---|
| Time | 15:00–16:30 |
| Objective | Zero secrets in the shipped JavaScript |
| Actions | 1. Laptop clone: `git pull`, `npm install`, `.env.local` with the two `VITE_` variables, `npm run build`. 2. K-testing leak scan: search `dist/assets/*.js` for `sb_secret_`, `service_role`, `sk-`. 3. Deployed bundle: view source on the bolt.host site, open each script URL, search the same strings. 4. Record |
| Platform | terminal, browser |
| Tool | human |
| Session / model | n/a |
| Expected result | Zero matches, local and deployed |
| Verification | Scan command prints 0 for all three strings |
| Stop condition | Any match: incident per T14; rotate the key now, find the source, redeploy, rescan; everything else pauses |
| Usage weight | light |

### D2-10 H8 Save/reopen and section editing (Person A)

| Field | Value |
|---|---|
| Time | 16:30–18:00 |
| Objective | Edit any section in plain forms; reopen from the dashboard; rename and delete a campaign |
| Actions | 1. Bolt: paste prompt H8 (`SectionEditor`, `saveSection(patch)` → `save_plan_version(...,'edited')`, dashboard reopen, rename, delete with confirmation). 2. Preview: edit the core message and one KPI target, dashboard, reopen, confirm; delete a throwaway campaign. 3. Deploy |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Save and reopen work with versioning; delete cascades |
| Verification | A new `campaign_plans` version per edit; the deleted campaign has no rows in any table |
| Stop condition | Two failed prompts on saving: log the error lines; Person B checks T17 (user client, not admin) at Day 3 09:30 before H9 |
| Usage weight | medium |

### D2-11 Bug triage and backend fixes (Person B)

| Field | Value |
|---|---|
| Time | 16:30–18:00 |
| Objective | Every `supabase/` bug from today closed |
| Actions | 1. Claude Code: `/clear`; Stronger for SQL or function, Lighter for docs. 2. Fix, redeploy, re-run the affected K-testing check. 3. New symptoms go to `TROUBLESHOOTING.md` Part 2 and a one-line row in `CLAUDE.md` section 9 (copy to `AGENTS.md`). 4. Commit, push, `/clear` |
| Platform | terminal |
| Tool | Claude Code |
| Session / model | `/clear` yes; by bug type |
| Expected result | No open backend bug |
| Verification | The failing check passes |
| Stop condition | Two failed fixes on one bug: park it with a workaround note |
| Usage weight | medium |

### D2-12 Café scenario end to end once, Gate 3, close of day (all)

| Field | Value |
|---|---|
| Time | 18:00–20:00 |
| Objective | The full must-have flow (revision excluded, not yet built) on the deployed site with the café sentence |
| Actions | 1. Person C (or B), fresh account: sign up → New campaign → smart start with "I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month." → follow-ups with defaults (SGD, Singapore, 4 weeks, Instagram and email list) → review → Build → workspace → edit one section → edit one calendar item → dashboard → reopen. 2. Time the generation. 3. Check the café criteria: who to target, what to say, what offer, where, what content, how S$1,500 is split, how long, what success looks like. 4. Record per step on the K-testing scenario sheet. 5. Record Gate 3 (café once + RLS pass). 6. Bug log review; commit, push, `/clear`; usage percentages; if either tool is above 80%, apply section 8 for tomorrow |
| Platform | browser, GitHub |
| Tool | human |
| Session / model | n/a |
| Expected result | One clean pass; Gate 3 recorded; checklist ticked |
| Verification | Generation ≤ 90 s; reopen shows the edits; `git status` clean |
| Stop condition | A failed step becomes Day 3's first block, before H9; Gate 3 failed → its fallback is tomorrow's first block |
| Usage weight | light |

## 6. Day 3 — Revision, usage, twice in a row, cleanup, submission (09:00–18:00 deadline)

Stand-up note: code freeze 15:15, submission by 16:00, deadline 18:00. Open bugs from D2-12 take a fix window 09:30–10:00 if needed (Person B, Stronger); otherwise H9 starts at 09:30.

### D3-1 H9 Revision Apply/Discard with locked sections (Person A; Person B on standby)

| Field | Value |
|---|---|
| Time | 09:30–11:00 |
| Objective | Instruction → proposal with `change_summary` and highlighted `changed_sections` → Apply or Discard; locked sections never change |
| Actions | 1. Bolt: paste prompt H9 (`ReviseBar` with lock toggles, `requestRevision(instruction, lockedSections)` in `src/lib/api.ts`, `ProposalDiff`, `apply_revision` and discard in `src/lib/campaigns.ts`). 2. Preview: lock Budget, ask "Make it suitable for younger customers"; proposal lists changed sections; Budget unchanged; Apply → new plan version, `campaign_revisions.status = 'applied'`. 3. Second revision → Discard → `discarded`, plan unchanged |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt; Claude Code standby |
| Session / model | Person B: `/clear` yes; Stronger, only if the function errors |
| Expected result | Revision flow complete with locks |
| Verification | One `applied` and one `discarded` row; locked section text identical before and after |
| Stop condition | Locks fail after two prompts but Apply/Discard works: apply cut item 1 and move on. Apply/Discard itself fails twice: **hand-off point 2** opens (Person B fixes `src/lib/api.ts` or `src/lib/campaigns.ts` in Claude Code while Bolt is idle, 45 minutes maximum) |
| Usage weight | heavy (Bolt) |

### D3-2 Cap, idempotency and demo account checks (Person B or C)

| Field | Value |
|---|---|
| Time | 09:30–11:00 |
| Objective | Daily cap and duplicate handling proven; demo account ready |
| Actions | 1. Terminal, tester2 JWT: same `request_id` twice → replay header or 409 (K-testing idempotency test). 2. `supabase secrets set AI_DAILY_LIMIT_PER_USER=2`, redeploy, three `brief_check` calls as tester2 → third is 429 with ledger status `daily_limit_reached`; set it back to 25, redeploy. 3. Dashboard: `demo@campai.app` still has the seeded café campaign; password matches the password manager. 4. Record |
| Platform | terminal, Supabase CLI, Supabase Dashboard |
| Tool | human; Claude Code (Stronger) only for a fix |
| Session / model | no session unless fixing |
| Expected result | Cap and idempotency pass; demo account signs in |
| Verification | `supabase secrets list` still shows four names; ledger shows the 429 row |
| Stop condition | Cap not enforced after one fix: report; usage tracking is a Must-have and outranks H11 |
| Usage weight | light |

### D3-3 H10 Usage ledger and Settings (Person A)

| Field | Value |
|---|---|
| Time | 11:00–12:00 |
| Objective | Settings shows email, sign out, and the AI usage summary (calls, tokens, estimated cost) |
| Actions | 1. Bolt: paste prompt H10 (Settings calls `my_ai_usage_summary()`; per-operation counts, total tokens, cost in USD, today's calls versus the cap). 2. Preview numbers match `select * from my_ai_usage_summary();` as that user. 3. Deploy |
| Platform | Bolt, Supabase Dashboard |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Visible proof of "AI cost measurable" |
| Verification | Shown cost equals the user's summed `estimated_cost_usd` to the cent |
| Stop condition | Two failed prompts: Person B checks the function grant (T18); a plain table is acceptable if formatting fails |
| Usage weight | light |

### D3-4 Fix window before the twice test (Person B)

| Field | Value |
|---|---|
| Time | 11:00–12:00 |
| Objective | Nothing open that blocks the must-have flow |
| Actions | 1. Claude Code: `/clear`, model by bug type. 2. Close backend bugs; update docs. 3. Commit, push, `/clear` |
| Platform | terminal |
| Tool | Claude Code |
| Session / model | `/clear` yes; Stronger for function or SQL, Lighter otherwise |
| Expected result | No "blocks flow" item |
| Verification | Affected checks pass |
| Stop condition | Two failed fixes: decide with the team whether a cut item resolves it |
| Usage weight | medium |

### D3-5 Café scenario twice consecutively (all)

| Field | Value |
|---|---|
| Time | 12:00–13:15 |
| Objective | The full must-have flow, including revision with a locked section, passes twice in a row on the deployed site |
| Actions | 1. Run 1, fresh account: D2-12 steps plus lock Budget → revise for younger customers → Apply → reopen → Settings shows the calls. 2. Run 2, another fresh account, same steps, no code change in between. 3. If Run 2 fails: fix, then start again from Run 1. 4. Record generation time and cost for both (targets ≤ 90 s, ≤ US$0.20 per campaign) |
| Platform | browser, Supabase Dashboard |
| Tool | human |
| Session / model | n/a; fixes between attempts follow D3-4 |
| Expected result | Two consecutive passes; Should-have work now permitted |
| Verification | Two pass rows with timestamps on the scenario sheet |
| Stop condition | Three attempts without two consecutive passes: apply cut items 1 and 2, test again; no Should-have starts until the twice rule is met, even if H11 and H12 are skipped |
| Usage weight | light |

### D3-6 H11 Responsiveness and accessibility (Person A; only if on schedule)

| Field | Value |
|---|---|
| Time | 13:30–14:00 |
| Objective | Phone layout for landing, auth, dashboard, brief; keyboard focus states; labelled inputs |
| Actions | 1. Runs only if the twice test passed by 13:15 and both usage figures are below 80% (decided at the 13:00 sync); otherwise skip to D3-9. 2. Bolt: paste prompt H11. 3. Phone: brief flow completes; workspace readable in landscape. 4. Keyboard: tab through sign-in and the brief |
| Platform | Bolt, browser |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | No horizontal scroll on phone screens; visible focus ring |
| Verification | K-testing responsive and accessibility checks pass |
| Stop condition | 30-minute hard stop; keep it if the build is green, otherwise revert the last Bolt change |
| Usage weight | medium |

### D3-7 Deployment preparation and Loom rehearsal (Person B, Person C)

| Field | Value |
|---|---|
| Time | 13:30–14:30 |
| Objective | Submission materials drafted while Bolt polishes |
| Actions | 1. Person C: rehearse the Loom script from `L-deployment-and-submission.md` once against the deployed site with the demo account. 2. Person B: Claude Code `/clear`, Lighter; final `CLAUDE.md` section 5 and `TROUBLESHOOTING.md`; `.env.example` has no values; commit, push, `/clear`. 3. Person B: redirect URLs include the final bolt.host URL |
| Platform | browser, terminal, Supabase Dashboard |
| Tool | Claude Code, human |
| Session / model | `/clear` yes; Lighter |
| Expected result | Rehearsal under 3 minutes; docs final |
| Verification | Timed rehearsal |
| Stop condition | None |
| Usage weight | light |

### D3-8 H12 Demo data and dashboard polish (Person A; only if on schedule)

| Field | Value |
|---|---|
| Time | 14:00–14:30 |
| Objective | Status labels and the three seed templates (café, online store, local service) on the dashboard |
| Actions | 1. Same gate as D3-6. 2. Bolt: paste prompt H12. 3. Preview: a template prefills the smart start text; labels match `campaigns.status`. 4. Deploy |
| Platform | Bolt |
| Tool | Bolt |
| Session / model | n/a |
| Expected result | Demo-ready dashboard |
| Verification | Demo account shows the seeded café campaign with a `ready` label |
| Stop condition | 30-minute hard stop; revert if the build breaks |
| Usage weight | medium |

### D3-9 H13 Production cleanup (Person A, Person B)

| Field | Value |
|---|---|
| Time | 14:30–15:00 |
| Objective | No debug output, no stub data, safe error copy, correct titles |
| Actions | 1. Bolt: paste prompt H13 (remove `console.log`, stub data and placeholder text; error copy from `C-ux-spec.md`; page title and favicon). 2. Person B, laptop clone: `git pull`, `npm run build`, leak scan again; `grep -r "VITE_" src/` shows only the two allowed names. 3. Deploy |
| Platform | Bolt, terminal |
| Tool | Bolt, human |
| Session / model | n/a |
| Expected result | Clean production bundle |
| Verification | Leak scan zero matches; no console output during the flow |
| Stop condition | Any regression: revert that Bolt change; cleanup never justifies breaking the flow |
| Usage weight | light |

### D3-10 Final deploy, smoke test, demo account, code freeze

| Field | Value |
|---|---|
| Time | 15:00–15:15 |
| Objective | The exact build to be submitted is live and verified |
| Actions | 1. Bolt: Deploy; copy the final URL. 2. Smoke test per Part L: sign in as `demo@campai.app`, open the café campaign, five sections, sign out; sign up with a new email, smart start to the review screen. 3. Demo account has one `ready` campaign and no half-finished drafts. 4. Announce **code freeze at 15:15**: no code change after this except a rollback to the last green commit on GitHub |
| Platform | Bolt, browser, Supabase Dashboard |
| Tool | human |
| Session / model | n/a |
| Expected result | Frozen, working live link |
| Verification | Smoke test passes on a device that has never opened the site |
| Stop condition | Smoke test fails: roll back to the commit that passed the twice test, redeploy, repeat; never fix forward |
| Usage weight | light |

### D3-11 Loom recording and deck alignment

| Field | Value |
|---|---|
| Time | 15:15–15:50 |
| Objective | 2–3 minute Loom; pitch deck on the provided template |
| Actions | 1. Person C (or A): record against the frozen site with the demo account and the Part L script; one clean take. 2. Person B: align the deck with the ten slides of the master prompt; add the live URL and a screenshot of the Settings usage summary (slide 10, "AI cost measurable"). 3. Collect team details as the portal requires |
| Platform | browser |
| Tool | human |
| Session / model | n/a |
| Expected result | Loom link and deck ready |
| Verification | Loom plays end to end under 3 minutes; deck opens on the template |
| Stop condition | Still no usable take at 15:45: submit the best take; do not reopen code |
| Usage weight | light |

### D3-12 Submission through the portal and post-submission watch

| Field | Value |
|---|---|
| Time | 15:50–16:00 submission (two hours before the 18:00 deadline); watch until 18:00 |
| Objective | Submitted, confirmed, screenshotted; the live link keeps working through the deadline |
| Actions | 1. Portal: live product link, Loom link, pitch deck, team details, as `L-deployment-and-submission.md` lists them. 2. Only through the portal. 3. Screenshot the confirmation to the team channel. 4. Until 18:00, every 30 minutes: open the live URL, sign in as the demo account, open the café campaign; check OpenAI credit and Supabase project status. 5. If the site breaks: roll back to the frozen commit and redeploy; that is the only permitted change |
| Platform | browser, OpenAI Dashboard, Supabase Dashboard |
| Tool | human |
| Session / model | n/a |
| Expected result | Confirmation by 16:00; four successful checks logged afterwards |
| Verification | Screenshot in the channel; check log |
| Stop condition | Portal down: retry every 15 minutes; if still down at 17:30, follow the organiser's announced fallback. A rollback fails: tell the organisers, with the confirmation screenshot |
| Usage weight | light |

## 7. Parallelism map and hand-off points

| Slot | Person A (Bolt, `src/`) | Person B (Claude Code, `supabase/` and docs) | Person C (tester) |
|---|---|---|---|
| Day 1 09:30–10:30 | D1-1 repository and Bolt | D1-2 Supabase, CLI, OpenAI | Bug log; reads K-testing |
| Day 1 10:30–13:00 | D1-3 prompt G | D1-4 I0 scaffold, D1-5 curl smoke test | Clicks through the shell |
| Day 1 13:30–17:00 | D1-6 H1, D1-8 H2 | D1-7 hygiene, D1-9 hardening | Prepares test accounts |
| Day 2 09:30–11:45 | D2-1 H3, D2-3 H4 | D2-2 dry run, D2-4 fixes | Bug log |
| Day 2 11:45–13:00 | D2-5 H5 | Standby for D2-5 | Watches Edge Function Logs |
| Day 2 13:30–18:00 | D2-6 H6, D2-8 H7, D2-10 H8 | D2-7 RLS test, D2-9 leak scan, D2-11 fixes | Runs D2-7 and D2-9 |
| Day 3 09:30–12:00 | D3-1 H9, D3-3 H10 | D3-2 checks, D3-4 fixes | Runs D3-2 |
| Day 3 13:30–15:00 | D3-6 H11, D3-8 H12, D3-9 H13 | D3-7 docs, D3-9 leak scan | D3-7 Loom rehearsal |

Rules:

1. Bolt edits only `src/`, `tailwind.config.js` and `package.json`. Claude Code edits only `supabase/`, `CLAUDE.md`, `AGENTS.md`, `.env.example`, `docs/`, and the two contract copies `src/types/campaign.ts` and `src/lib/validation.ts`. No file is open in both tools at the same time.
2. Claude Code runs `git pull` at the start of every session; Bolt pulls every 30 seconds, so Person A waits one minute after any Claude Code push before the next prompt.
3. Exactly two hand-off points allow Claude Code to edit other `src/` files, and only while Person A has stopped prompting (Bolt idle), each capped at 45 minutes:
   - **Hand-off 1 (Day 2, D2-5, H5):** two Bolt prompts fail to make `generateCampaign()` call the Edge Function correctly → Person B pastes the `src/lib/api.ts` snippet and fixes the call site.
   - **Hand-off 2 (Day 3, D3-1, H9):** two Bolt prompts fail on Apply/Discard → Person B fixes `src/lib/api.ts` or `src/lib/campaigns.ts`.
   Outside these points Person B advises on what to prompt but does not touch `src/`.

## 8. If behind schedule, cut this (in exactly this order)

| # | Cut | What it saves | How to do it |
|---|---|---|---|
| 1 | Locked sections in revision (keep Apply/Discard) | 30–60 minutes of Bolt UI work and one debugging round in H9 | Bolt prompt: hide the lock toggles in `ReviseBar`; `requestRevision()` sends `locked_sections: []`. Edge Function and `revise` prompt unchanged, so locks can return with one prompt |
| 2 | Calendar item bound reduced to 6–12 | Shorter generation (typically 20–40% fewer output tokens), fewer `incomplete` results, lower latency | Claude Code (`/clear`, Stronger): in `F-ai/types.ts` set `OUTPUT_BOUNDS.calendarItemsMax: 12` and `calendarItemsTarget: 9`; in `F-ai/campaign.schema.json` set `maxItems: 12` on `calendar_items`; copy both files to `src/types/campaign.ts` and to `supabase/functions/_shared/` (`types.ts`, `campaign.schema.json`); `supabase functions deploy campaign-ai`; one commit |
| 3 | All Should-haves | Half a day: H12 templates, calendar filters, export, duplication, unsaved-change warning, status labels | Skip D3-6 and D3-8; do not send H11 or H12; go from D3-5 to H13 |
| 4 | The smart start | About an hour of Bolt and debugging time and the T15 risk in the demo | In `src/lib/brief.ts`, always call `questionsToAsk(null)` (all nine fixed questions with defaults); keep the `brief_check` operation in the Edge Function untouched so nothing in `supabase/` changes; demo script starts from question 1 |

**Never cut:** authentication, generation, save and reopen, editing (sections and calendar), RLS, the usage ledger and its Settings summary. If these do not fit, take more cuts from the list above and send fewer polish prompts; never shortcut security or data integrity.

## 9. Usage budget plan

| Heavy block | Day and time | Tool that burns | Why heavy |
|---|---|---|---|
| D1-3 prompt G shell | Day 1 10:15–12:30 | Bolt | Largest single prompt; whole scaffold rewritten |
| D1-4 I0 backend scaffold | Day 1 10:30–12:30 | Claude Code (Stronger) | Many files, migration push, first deploy, first debugging |
| D2-2 generation dry run | Day 2 09:30–10:45 | Claude Code (Stronger) | Debugging OpenAI, schema and timing with long log lines |
| D2-5 H5 wiring | Day 2 11:45–13:00 | Bolt and Claude Code | Riskiest integration; possible hand-off |
| D3-1 H9 revision | Day 3 09:30–11:00 | Bolt | Largest Day 3 UI change set |

Rules:

1. Heavy blocks run before 13:00 on their day, while the team is fresh and the fallback still fits. Nothing heavy after 15:00 on any day.
2. Every Claude Code session starts with `/clear` and the model choice; no `/model` mid-session; paste only error lines; `/compact` if a session passes an hour unfinished.
3. **Claude usage at 80%** of the weekly allowance: move every remaining UI or copy fix to Bolt or the Lighter model; keep the Stronger model only for a blocking `supabase/` bug; stop optional work (H11, H12, docs polish); apply cut item 3 at once.
4. **Bolt usage at 80%**: batch small UI fixes into one prompt per hour; Person A stops prompting and Person B performs remaining `src/` fixes in Claude Code (Lighter) while Bolt is idle, one commit per batch; skip H11 and H12.
5. Both at 80% before the twice test passes: apply cut items 1 to 3, finish the twice test by hand-testing, spend what is left only on H13 and the rollback path.
6. Usage percentages go in the bug log header at 09:00 and at close of day so the trend is visible.

## 10. Risk checkpoints: three go/no-go gates

| Gate | When | Passes if | If it fails |
|---|---|---|---|
| Gate 1 | End of Day 1 (D1-11) | Sign-up and sign-in work on the deployed `*.bolt.host` shell; the Edge Function answers curl with 401 (no token) and 400 (token, empty body) without crashing | Same evening: for auth, Person B checks the Supabase URL configuration and Bolt variables (T5); for the function, apply T4 and switch to the legacy pattern before leaving. Day 2 opens with a 30-minute fix window at 09:30; H3 shifts 30 minutes; H5 still done by 13:30 |
| Gate 2 | Midday Day 2 (13:00 sync, after D2-5) | One real generation started from the UI is saved in `campaign_plans` and visible in the workspace | `incomplete` or timing failure: apply cut item 2. Otherwise run hand-off 1 straight after lunch (Person B on `src/lib/api.ts`, Bolt idle). H6 starts by 14:30; H8 may slip to Day 3 morning before H9, in which case H11 and H12 are dropped (cut item 3) |
| Gate 3 | End of Day 2 (D2-12) | Café scenario passed once end to end (without revision) and the two-account RLS test passed on every table | RLS failure: Day 3 opens with the policy fix and re-test at 09:30; H9 shifts to 10:30, H10 to 12:00; apply cut item 1 so H9 fits. Scenario failure: fix the failed step first; twice test moves to 13:00; H11 and H12 dropped; Loom recorded from the best working flow |

## 11. Bug log and end-of-day checklist

Bug log: use the template in `K-testing.md` (one row per bug: id, date, block, symptom, error lines, runbook item tried, owner, status, fix commit). Keep it in the team channel or a shared document, not in the repository. Header lines: today's Claude usage percent, Bolt usage percent, gates passed.

End-of-day checklist, tick all before leaving:

1. Must-have flow run on the deployed site recorded with pass or fail per step.
2. Every open bug has an owner and a slot tomorrow, or a "will not fix" note naming the cut item.
3. Claude Code: `git add -A && git commit -m "<change set>" && git push`, then `/clear`.
4. Bolt: latest auto-commit visible on GitHub `main`; no unsaved edits.
5. `CLAUDE.md` section 5 names the Edge Function pattern actually deployed; `AGENTS.md` identical.
6. No secret in any commit, Bolt setting or chat message today; if unsure, run the leak scan on the current build.
7. Usage percentages for both tools written in the bug log header.
8. Tomorrow's 09:30 parallel blocks agreed and named.
9. The deployed URL still loads.
