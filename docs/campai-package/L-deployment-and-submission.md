<!-- AI note: Part L for campAI: GitHub workflow, Supabase production configuration, secrets, Edge Function and frontend deployment, post-deploy smoke test, demo account, Loom and live-demo scripts, pitch-deck alignment, final submission checklist, post-hackathon hardening.
     Owner: Claude Code (docs); testers/humans fill in results; Bolt never edits it. -->

# L-deployment-and-submission.md — Part L: Deployment and submission

Acronyms used in this part: RLS = Row Level Security; API = Application Programming Interface; JWT = JSON Web Token; REST = Representational State Transfer; CRUD = Create, Read, Update, Delete; UI = User Interface; CLI = Command-Line Interface; URL = Uniform Resource Locator; JSON = JavaScript Object Notation; SMTP = Simple Mail Transfer Protocol; UTC = Coordinated Universal Time; KPI = Key Performance Indicator; CSV = Comma-Separated Values; PDF = Portable Document Format; SGD = Singapore dollars; SHA = Secure Hash Algorithm (the short commit id GitHub shows).

Every step names its platform: **GitHub**, **Bolt**, **Supabase Dashboard**, **Supabase CLI** (terminal on one teammate's laptop), **OpenAI Dashboard**, **Terminal**, **Browser**, **Claude Code**.

---

## L1 — GitHub workflow

### L1.1 Create the repository (Day 1, first hour)

1. (GitHub) New repository `campai`, private, default branch `main`, no template files (Bolt will push the scaffold). Add the teammates as collaborators with write access.
2. (GitHub → Settings → Branches) Leave `main` unprotected during the hackathon; Bolt pushes straight to it. A protection rule would block Bolt's auto-commits.
3. (Bolt) Create the project from the Part G starting prompt. When the shell builds, open Bolt's **GitHub** integration → **Connect repository** → pick `campai` → branch `main`. Bolt pushes the scaffold. From now on Bolt **auto-commits working changes** and **pulls external changes about every 30 seconds**.
4. (Claude Code, terminal) `git clone https://github.com/<org>/campai.git && cd campai`. Then run the Part I section 8 install ("I0: backend scaffold"). Commit and push.
5. (Bolt) Within a minute, confirm Bolt's file tree shows `CLAUDE.md`, `supabase/`, `src/types/campaign.ts`. If not, ask Bolt to pull (or wait one more cycle).

### L1.2 Rules of the road

1. **Commit message convention:** `<change set id>: <summary>`, for example `H5: wire campaign-ai Edge Function`, `I0: backend scaffold`, `K3: fix campaign_plans insert policy`. Bolt's own auto-commit messages are whatever Bolt writes; do not edit them.
2. **Claude Code sessions** start with `git pull` and end with `git add -A && git commit -m "..." && git push` (CLAUDE.md section 8). One change set per session.
3. **Never both tools on one file at once.** Claude Code touches `src/` only while Bolt is idle (no prompt running).
4. **Protected files (Claude Code owns; Bolt never edits):** `CLAUDE.md`, `AGENTS.md`, `.env.example`, `.gitignore`, `docs/campai-package/**`, `supabase/**`, `src/types/campaign.ts`, `src/lib/validation.ts`, `docs/bug-log.md`. If Bolt changes one, revert that hunk on GitHub and restate the ownership rule in the next Bolt prompt (runbook T13 style).
5. **Branches:** work on `main`. If a risky refactor is needed, Claude Code creates a branch, opens a pull request on GitHub, and merges it there. Bolt does not merge branches; it only sees `main`.
6. **Git-ignored, never committed:** `.env`, `.env.local`, `supabase/.env`, `supabase/functions/.env`, `supabase/.env.production`. Before the first push from Claude Code, run `git status --ignored | grep env` to confirm they are ignored.

### L1.3 On conflict (runbook T12)

1. (Claude Code) If `git pull` reports a conflict, do not force-push. Open the conflicting file, keep Bolt's UI change and Claude Code's backend change if they are in different hunks, and commit the merge.
2. (GitHub) If Bolt shows a "conflict" banner, resolve it in GitHub's web editor: pick the version from the tool that owns the file (section L1.2 rule 4), re-apply the smaller change by hand, commit.
3. (Bolt) Wait for Bolt to pull the resolved `main`. If Bolt's working copy is now behind, ask it: "Pull the latest `main` and do not change any files."
4. Log the conflict as an S2 bug with the file name; recurring conflicts on the same file mean the ownership split is being ignored.

---

## L2 — Supabase production configuration

The full procedure is `E-supabase/setup-steps.md` Parts 1–2 (project, keys, auth settings). Before the first public deploy, confirm this checklist in the **Supabase Dashboard**:

| # | Check | Where | Expected |
|---|---|---|---|
| 1 | Project not paused | Project home | Status "Healthy". Free-plan projects pause after a week of inactivity; open the dashboard daily during the hackathon |
| 2 | Confirm email OFF | Authentication → Sign In / Providers → Email | Toggle off, so sign-up is instant during the demo |
| 3 | Site URL | Authentication → URL Configuration | `https://<app>.bolt.host` (your real Bolt hosting URL, no trailing slash) |
| 4 | Redirect URLs | Authentication → URL Configuration | `http://localhost:5173/**`, `https://*.bolt.host/**`, `https://<app>.bolt.host/**` |
| 5 | Leaked-password protection OFF | Authentication → Attack protection | Off for the demo (it rejects simple demo passwords); listed in L12 to turn on afterwards |
| 6 | RLS enabled on all 8 tables | Authentication → Policies (or Table Editor, shield icon) | `profiles`, `campaigns`, `campaign_briefs`, `campaign_plans`, `calendar_items`, `campaign_revisions`, `ai_usage_events`, `ai_model_pricing` all show "RLS enabled" with the migration's policies |
| 7 | Pricing rows present | Table Editor → `ai_model_pricing` | Two rows: `gpt-6-sol` (2.00 / 0.20 / 10.00) and `gpt-6-luna` (0.10 / 0.01 / 0.50), `verified_on = 2026-09-26`, `active = true` |
| 8 | Publishable key in use | Project Settings → API keys | The key pasted into Bolt starts with `sb_publishable_`; the legacy `anon` key is not referenced anywhere new |
| 9 | Data API exposed schema | Project Settings → Data API | `public` is exposed (default); nothing else added |
| 10 | Migration applied | SQL Editor: `select version from supabase_migrations.schema_migrations;` | Contains `20260926000000` |

If any check fails, fix it and re-run K3 (RLS via API) before continuing.

---

## L3 — Secrets

### L3.1 The four secrets (Supabase Edge Function secrets only)

| Name | Value | Notes |
|---|---|---|
| `OPENAI_API_KEY` | `sk-…` from the OpenAI Dashboard, project-scoped, named `campai-hackathon` | The only true secret among the four |
| `OPENAI_MODEL` | `gpt-6-sol` | Used by `generate` and `revise` |
| `OPENAI_MODEL_LIGHT` | `gpt-6-luna` | Used by `brief_check` |
| `AI_DAILY_LIMIT_PER_USER` | `25` | Per-user daily cap; lower it if the OpenAI budget is tight |

The Supabase secret key (`sb_secret_…`) is injected into Edge Functions automatically as `SUPABASE_SECRET_KEY`. Nobody types it anywhere.

### L3.2 Set and verify

1. (Terminal) Create `supabase/.env.production` (git-ignored) with the four lines.
2. (Supabase CLI) `supabase secrets set --env-file ./supabase/.env.production`
3. (Supabase CLI) `supabase secrets list` — the four names appear (values are hidden). The reserved `SUPABASE_*` names also appear; that is normal.
4. (Supabase Dashboard → Edge Functions → Secrets) Same four names visible. This is the alternative place to set them if the CLI is unavailable.
5. Changing a secret takes effect on the next function instance start (usually within a minute). If a change does not seem to apply, `supabase functions deploy campaign-ai`.

### L3.3 Never in Bolt

1. (Bolt → project settings → Environment variables) Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY` if Bolt's integration created it). If anyone added `OPENAI_API_KEY` or any `VITE_OPENAI_*` there, delete it, treat the key as exposed and rotate it (L3.4).
2. Never paste a secret into a Bolt prompt, a Claude Code prompt, a commit, a screenshot or a chat. Paste only the variable **name** when asking for help.

### L3.4 Rotation procedure (use after any suspected leak, and once after the hackathon)

1. (OpenAI Dashboard → API keys) Create a new key `campai-hackathon-2`. Copy it.
2. (Terminal) Replace the value in `supabase/.env.production`; (Supabase CLI) `supabase secrets set --env-file ./supabase/.env.production`.
3. (Browser) Run one `brief_check` (smart start) and confirm it succeeds and a `success` ledger row appears.
4. (OpenAI Dashboard) Revoke the old key. Confirm a second brief check still works.
5. Supabase secret key rotation, if ever needed: (Supabase Dashboard → Project Settings → API keys) create a new secret key, then delete the old one; Edge Functions receive the new one automatically. The publishable key does not need rotation because it is designed to be public.
6. Log the rotation in `docs/bug-log.md` (S1, closed) with the time and the reason.

### L3.5 Verify none leaked

Run K9.1 and K9.2 (leaked-key scan) after every deploy. Additionally, (GitHub) search the repository for `sk-` and `sb_secret_` (repository search box). Zero code matches expected; `.env.example` contains only the placeholder `sk-...`, which is acceptable because it is not a key.

---

## L4 — Edge Function deployment

### L4.1 Deploy

1. (Claude Code) Confirm `supabase/functions/campaign-ai/index.ts` is the `withSupabase` version (or the legacy version after a T4 switch, recorded in `CLAUDE.md` section 5) and `supabase/functions/_shared/` holds `types.ts`, `campaign.schema.json`, `brief-check.schema.json`, `validation.ts`, `normalise.ts`, `prompts.ts`, `openai.ts`, `handler.ts`.
2. (Supabase CLI, repository root) `supabase functions deploy campaign-ai`. Expected: `Deployed Functions on project <ref>: campaign-ai`.
3. (Supabase Dashboard → Edge Functions) `campaign-ai` is listed with a recent "Last deployed" time and version number.

### L4.2 Smoke test with curl

1. (Terminal) Obtain a JWT for a test user (K3.0). Export `REF`, `PK`, `JWT` and a campaign id you own as `CID`.
2. (Terminal) Invalid request first (costs nothing):
   ```bash
   curl -s -i -X POST "https://$REF.supabase.co/functions/v1/campaign-ai" \
     -H "apikey: $PK" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{}'
   ```
   Expected: HTTP 400, body `{"error":{"code":"invalid_request","message":"Invalid request: ...","request_id":null}}`, and response headers that include `Access-Control-Allow-Origin` (CORS).
3. (Terminal) Unauthenticated (no `Authorization` header): expected HTTP 401.
4. (Terminal) A real cheap call:
   ```bash
   curl -s -X POST "https://$REF.supabase.co/functions/v1/campaign-ai" \
     -H "apikey: $PK" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
     -d "{\"operation\":\"brief_check\",\"request_id\":\"$(uuidgen | tr 'A-Z' 'a-z')\",\"campaign_id\":\"$CID\",\"free_text\":\"I run a café. I want more customers during weekdays. My budget is S\$1,500. I want to start next month.\",\"defaults\":{\"today\":\"$(date -u +%F)\",\"currency\":\"SGD\",\"market\":\"Singapore\"}}" | jq .
   ```
   Expected JSON shape:
   ```json
   {
     "operation": "brief_check",
     "request_id": "<uuid>",
     "result": {
       "restatement": "You run a café ...",
       "assumptions": ["..."],
       "fields": { "goal": {"value": "...", "status": "stated", "suggested_default": "...", "question": "..."}, "business": {"...": "..."}, "product_or_service": {"...": "..."}, "audience_clues": {"...": "..."}, "budget": {"amount": 1500, "currency": "SGD", "status": "stated", "suggested_amount": 1500, "suggested_currency": "SGD", "question": "..."}, "market": {"...": "..."}, "schedule": {"start_date": null, "duration_weeks": null, "status": "inferred", "suggested_start_date": "2026-10-05", "suggested_duration_weeks": 4, "question": "..."}, "existing_assets": {"...": "..."}, "tone_and_constraints": {"...": "..."} }
     },
     "usage": { "model": "gpt-6-luna", "input_tokens": 0, "cached_input_tokens": 0, "output_tokens": 0, "total_tokens": 0, "estimated_cost_usd": 0.0, "latency_ms": 0 }
   }
   ```
   (Token and latency numbers are real values, not zero; `suggested_start_date` is the first Monday of next month for the day you run it.)
5. (Supabase Dashboard → Edge Functions → campaign-ai → Logs) The request appears with status 200. Errors log `console.error` lines with the cause.
6. (SQL Editor) `select operation, status, model, total_tokens, estimated_cost_usd, latency_ms from ai_usage_events order by created_at desc limit 3;` shows the `success` row with a non-zero cost.

### L4.3 Redeploy procedure

1. (Claude Code) Make the change in `supabase/functions/**`. State the change set and how to verify.
2. (Supabase CLI) `supabase functions deploy campaign-ai`.
3. (Terminal) Re-run L4.2 steps 2 and 4.
4. (Claude Code) Commit `H5-fix: <summary>` and push.
5. Redeploys do not change secrets or data; they only replace code. There is no downtime worth mentioning.

### L4.4 The 45-minute fallback (runbook T4)

If the `withSupabase` version fails to import, `ctx` is undefined, or auth behaves oddly, and 45 minutes of debugging have not fixed it:

1. (Claude Code) `cp docs/campai-package/I-code-guide/edge-function-legacy/index.ts supabase/functions/campaign-ai/index.ts`.
2. (Supabase CLI) `supabase functions deploy campaign-ai`.
3. (Claude Code) Update `CLAUDE.md` section 5 to "Pattern in use: legacy". Commit `I0: switch campaign-ai to legacy pattern (T4)`.
4. (Terminal) L4.2 smoke test. The security design is identical: RLS-scoped client for campaign reads, secret-key client only for the ledger and pricing.

---

## L5 — Frontend deployment on Bolt

### L5.1 Environment variables in Bolt

1. (Bolt → project settings → Environment variables) `VITE_SUPABASE_URL=https://<ref>.supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…`. Nothing else. If Bolt's Supabase integration (Path A in setup-steps Part 8) filled them, verify the names; the code accepts `VITE_SUPABASE_ANON_KEY` as well.
2. Bolt rebuilds when variables change; wait for the preview to reload.

### L5.2 Deploy

1. (Bolt) Select **Deploy** (or **Publish**) in the top bar. Bolt builds the Vite production bundle and hosts it at `https://<app>.bolt.host`. The first deploy lets you choose the subdomain; pick something short such as `campai`.
2. (Bolt) Copy the URL. Paste it into `E-supabase/setup-steps.md` step 6 settings (Supabase Site URL and Redirect URLs, L2 checks 3–4) if not already done.
3. A custom domain is **not** needed for the hackathon; the `*.bolt.host` link is the live product link for submission.

### L5.3 After every deploy (10 minutes)

1. (Browser) Hard refresh the deployed URL (Ctrl+Shift+R / Cmd+Shift+R) to bypass the cached bundle.
2. (Browser) Sign in as the demo account (L7). The dashboard shows the seeded café campaign.
3. (Terminal) Leak scan K9.2 on the deployed bundle. Record the result in the K9 Pass/Fail box with the deploy time.
4. (Browser) Run the L6 smoke test.
5. (GitHub) Note the short SHA of the commit that was deployed (Bolt's last auto-commit before the deploy). Write it in the deploy log below.

| Deploy # | Date/time (UTC) | Short SHA | Leak scan | Smoke test | Deployed by |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### L5.4 Roll back

Bolt has no one-click rollback, so rollback is "redeploy an older commit":

1. (GitHub) Find the last good commit's SHA (from the deploy log). Either revert the bad commits with **Revert** on GitHub (preferred; keeps history linear), or, from Claude Code, `git revert <bad-sha>..HEAD` and push.
2. (Bolt) Wait for Bolt to pull `main` (about 30 seconds); confirm the preview shows the old behaviour.
3. (Bolt) **Deploy** again. Hard refresh, sign-in check, leak scan.
4. If the bad change was in the Edge Function rather than the frontend, roll back with Claude Code (`git revert`) and `supabase functions deploy campaign-ai`; the frontend does not need a redeploy.

---

## L6 — Smoke test after deploy (10-minute script)

Run in this order; stop and log an S1 bug at the first failure. AI credit spent: one `revise` call (about US$0.08); generation is not repeated.

1. (Browser, private window) Open `https://<app>.bolt.host`. Landing page renders with the heading, one primary button, no console errors (dev tools → Console).
2. (Browser) **Sign in** as `demo@campai.app`. Lands on the dashboard.
3. (Browser) Dashboard shows the café campaign "Weekday Regulars: 4 Weeks to Busier Mornings" with status `ready`.
4. (Browser) Open it. All twelve section tabs render content. Budget lines sum to 1,500 SGD. Calendar shows 12 items dated 5 October to 1 November 2026.
5. (Browser) Calendar → open one item → change its status to `done` → save. Badge updates; version number increments.
6. (Browser) Revise: lock **Budget**, instruction `Make it suitable for younger customers`, submit. Proposal arrives within 90 seconds with a change summary; Budget is not in the changed sections. Select **Apply**. Version increments.
7. (Browser) Settings: email shown; usage summary shows calls, tokens, estimated cost, and today's calls; the numbers increased by one call since step 6.
8. (Browser) **Sign out**. Lands on the landing page or sign-in.
9. (Browser) **Sign up** with a fresh throwaway email (for example `smoke+<date>@<your domain>`). Lands on the empty dashboard.
10. (Browser) **New campaign** → smart start with the café sentence → follow-up questions → **review screen**. Stop here unless you are deliberately testing generation; the review screen proves the intake path and the `brief_check` call without spending a `generate`. Leave the draft; delete it from the dashboard afterwards.

Record: pass/fail, time taken, the deploy SHA.

---

## L7 — Demo account and data

1. (Supabase Dashboard → Authentication → Users → Add user → Create new user) Email `demo@campai.app`, a password generated by the team password manager, **Auto Confirm User** ticked.
2. (Supabase Dashboard → SQL Editor) Paste `E-supabase/seed.sql` (already copied to `supabase/seed.sql`) and run. Expected NOTICE: `campAI seed: created demo campaign <id> (plan version 1) for demo@campai.app`. Re-running prints "already exists, skipping".
3. (Supabase Dashboard → Table Editor) `campaigns`: one row for the demo user, status `ready`; `calendar_items`: 12 rows; `ai_usage_events`: 2 rows (the seeded brief check and generate), so the Settings page has something to show even before a live call.
4. (Supabase Dashboard → Authentication → Users) Create a second account `rls-b@campai.app` (Auto Confirm) with **no** campaigns. This is user B for the K3 RLS proof and for the live-demo "second account cannot see anything" moment.
5. (Password manager) Store both passwords in the team vault under "campAI hackathon". Never in the repository, the deck, or the Loom.
6. **Reset the demo campaign before the demo** so it shows the clean seeded state: (SQL Editor) `delete from campaigns where user_id = (select id from auth.users where email = 'demo@campai.app');` (cascade removes briefs, plans, items, revisions; ledger rows keep their history with `campaign_id = null`), then re-run `seed.sql`. Takes one minute.
7. **Daily cap headroom:** the cap is 25 calls per user per UTC day. Rehearsals count. Check before the demo: (SQL Editor) `select public.count_user_ai_calls_today((select id from auth.users where email='demo@campai.app'));` If it is above 15, either wait for midnight UTC (08:00 Singapore time), demo from a fresh account, or temporarily raise `AI_DAILY_LIMIT_PER_USER` to 50 and lower it afterwards.
8. **OpenAI credit:** (OpenAI Dashboard → Billing) keep at least **US$5** prepaid on the day of the demo. A full café run costs about US$0.10; ten rehearsals plus the live demo are under US$2.
9. **Demo credentials for judges:** if the portal or judges ask for a login, give `demo@campai.app` and its password in the submission form's notes field only, and rotate the password after judging.

---

## L8 — Loom script (2–3 minutes)

Record at 1440 px wide, browser only, no dock or notifications. One take per beat is fine; Loom trims. Speak plainly; the spoken lines below are a guide, not a script to read stiffly.

| Time | On screen | Spoken line |
|---|---|---|
| 0:00–0:15 | Landing page | "Small-business owners know their goal. What stops them is everything between the goal and a campaign: audience, message, offer, channels, content, budget, timing, and how to tell if it worked. The problem isn't ambition, it's complexity." |
| 0:15–0:30 | Landing page, then click Get started | "campAI is a campaign operating system. You say what you want in your own words, answer only the questions we genuinely need, and get one complete, editable campaign. Professional intelligence underneath, radical simplicity on top." |
| 0:30–1:15 | Signed in as demo. New campaign → smart start. Type the café sentence. Show the few follow-up questions, accept the defaults, reach the review screen | "Here's the hackathon scenario. 'I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.' One cheap AI call reads that and tells us what was stated, what it inferred, and what's missing. It only asks about the gaps, one question at a time, each with a suggested answer. The review screen marks what we assumed so the owner can correct it in ten seconds." |
| 1:15–1:45 | Either: click Build and show a real generation with the staged progress, sped up 4x in the edit, with the real time shown on screen; or: switch to the pre-generated demo campaign and say so | Option A: "One structured AI call builds the whole plan. This is real time sped up; it took forty-something seconds and cost about eight cents." Option B: "Generation takes 30 to 90 seconds, so I built this one just before recording. It's the same brief, unedited." Say which one honestly. |
| 1:45–2:20 | Workspace tour: Audience → Messaging and Offer → Channels → Budget → Calendar (open one item, edit the title, save) | "Who to target: weekday office and remote workers within a ten-minute walk, with their pains and objections. What to say and what offer: a Weekday Regulars stamp card. Where: the café's own Instagram and email list first, one small paid boost. How to spend S$1,500: line items that sum exactly, in code, not by hope. And a dated calendar you edit item by item; every edit is a saved version." |
| 2:20–2:45 | Revise bar: lock Budget, type "Make it suitable for younger customers", submit; show the change summary and the highlighted sections; Apply | "Change it in plain language. I've locked the budget so the AI can't touch it. It returns the full plan, tells me what changed and why, and I choose Apply or Discard. Locked sections are enforced in code." |
| 2:45–3:00 | Settings: usage summary. Then the dashboard | "Cost before code: every AI call is in a ledger with tokens and estimated cost, so the owner and we can see exactly what thinking costs. Three AI operations, one function, everything else is ordinary software. That's campAI." |

Checks before uploading: the video shows no secrets (no dev tools, no Supabase dashboard), no passwords typed on screen (use the browser's saved credentials or paste from the vault while the recording is paused), and the length is between 2:00 and 3:00.

---

## L9 — Live demo script (3–5 minutes) with a plan B for each risk

**Set-up (before you are called):** laptop on power, notifications off, two browser windows side by side: **Window 1** signed in as `demo@campai.app` on the dashboard; **Window 2** signed in as `rls-b@campai.app` on its empty dashboard. A third tab holds the deck. A phone hotspot is ready as a second network. A printed copy of the seeded café plan (Budget and Calendar pages) sits next to the laptop. Demo campaign reset per L7 step 6; cap headroom checked.

| Beat | Time | What you do | Plan B |
|---|---|---|---|
| 1. The problem | 0:00–0:30 | Deck slides 2–3 while speaking (same lines as the Loom) | If the projector fails, speak without slides |
| 2. Smart start | 0:30–1:30 | Window 1: New campaign, type the café sentence live, show the follow-ups and the review screen | If `brief_check` is slow or fails, the app falls back to the nine questions by design; say "and when the AI is unavailable, it simply asks all nine" and proceed. If the site is down, open the offline slide screenshots of these screens |
| 3. Build | 1:30–2:30 | Click **Build my campaign**. While the staged progress runs (30–90 s), explain the architecture: one Edge Function, three operations, strict schema, normalisation in code, cost ledger | If generation is still running at 2:30, switch to the pre-generated seeded campaign on the dashboard: "This is the same brief, built earlier; I'll come back to the live one." If the site is down, use the printed plan for beat 4 |
| 4. The plan | 2:30–3:30 | Audience → Messaging and Offer → Channels → Budget (point at the total) → Calendar (edit one item) | If an edit errors, refresh once; if it errors again, move on and say "logged" |
| 5. Revise with a lock | 3:30–4:20 | Lock Budget, "Make it suitable for younger customers", submit; explain Apply/Discard while it runs; Apply | If revise is slow, show the applied revision on the seeded campaign from a rehearsal (`campaign_revisions` history is visible in the workspace's version list) and describe the lock |
| 6. Trust and cost | 4:20–4:50 | Window 2: user B's dashboard is empty; paste the demo campaign's URL into window 2 → not found. Back to window 1: Settings usage summary | If window 2 has expired, the printed K3 curl output (404 `not_found`) is on the second page of the printout |
| 7. Close | 4:50–5:00 | Dashboard with the campaign saved. "Anyone can run a strategically sound campaign without being a strategist." | — |

Rules for the presenter: never open dev tools or the Supabase dashboard on the projector; never type a password on screen; if something fails twice, say what happened in one sentence and move on. The audience remembers composure more than the glitch.

---

## L10 — Pitch-deck alignment with the ten slides

| Slide | Title (from the master prompt's slide summary) | What in the product proves it | What to say |
|---|---|---|---|
| 1 | campAI — Campaign Operating System | The product name and category on the landing page and in the deck | "A campaign operating system, not a copywriting toy" |
| 2 | The problem isn't ambition, it's complexity | The nine brief fields and the twelve workspace sections are exactly the list of things an owner struggles with | "We turned the list of things that overwhelm owners into the list of things the product decides for them" |
| 3 | The big idea: café input → OS Brain → campaign plan | Smart start with the café sentence → `generate` → workspace | Demo beat 2–4 |
| 4 | Product promise and four principles: ask don't teach, one question at a time, AI does the thinking, recommend don't overwhelm | Smart start asks only missing fields, one per screen, with suggestions; every section gives one recommendation, not a menu | "Six questions at most, each pre-answered" |
| 5 | Cost before code; ledger Account → User → Campaign → AI Function → Model → Tokens → Cost | `ai_usage_events` columns map one-to-one to that chain; `ai_model_pricing` table; Settings summary; daily cap; idempotent `request_id` | "Three AI calls per campaign, about ten cents, every one accounted for" |
| 6 | UX: never a blank page; Goal → Guidance → Recommendation → Action | Placeholder example, prefilled suggestions, "We assumed this" markers, next actions section | "You never face an empty box" |
| 7 | OS Brain: ten reasoning steps from objective to KPIs | The `generate` system prompt's numbered steps (objective → audience → positioning → offer → channels → content → copy → budget → timeline → KPIs) and the resulting sections | "The brain is one carefully structured prompt with a strict output contract, not an agent swarm" |
| 8 | Hackathon scope: build v0.1 list vs "not tonight" list | Must match the MVP scope: **built** = auth, guided brief with smart start, secure generation, workspace, editable calendar, editing, save/reopen with versions, CRUD, plain-language revision with locks and Apply/Discard, budget allocation, KPIs, usage ledger and daily cap, responsive accessible UI, loading and error states. **Not tonight** = social publishing, live analytics, CRM integrations, enterprise permissions, project management, multiple agents, many external APIs, advanced reporting, ad-platform execution, real-time collaboration, streaming, image generation | Read both lists as they stand; if a Should-have shipped (duplication, export, templates), mention it as a bonus, never as scope |
| 9 | Stack: Bolt, Supabase, AI layer, GitHub, future integrations | Bolt-hosted frontend; Supabase Auth, Postgres with RLS, one Edge Function; OpenAI Responses API with strict Structured Outputs; GitHub with two-tool ownership split | "The 'AI gateway' on this slide is our single Edge Function in front of OpenAI" |
| 10 | The hackathon test: the café scenario and six success criteria | K13 evidence: the two consecutive test-run records (latency, cost, 6/6 criteria) | Quote the real numbers from the K13 record: "built twice in a row, N seconds, N cents" |

Before submitting the deck: confirm slide 8's two lists match the paragraph above word for word with the master prompt's MVP scope; confirm slide 10's six criteria are the ones K13.1 maps; replace any placeholder numbers with the K13 record values.

---

## L11 — Final submission checklist

From the playbook's submission requirements, plus the team's own rules.

| # | Item | Owner | Done |
|---|---|---|---|
| 1 | **Live product link** `https://<app>.bolt.host`, opened in a private window from a phone and a laptop within the last hour | | [ ] |
| 2 | **2–3 minute Loom** walkthrough (L8), link set to "anyone with the link can view", length checked | | [ ] |
| 3 | **Pitch deck on the provided template** (10 slides, L10 alignment done, exported to PDF as a backup) | | [ ] |
| 4 | **Team details** exactly as the portal asks (names, emails, roles) | | [ ] |
| 5 | **Submitted only through the portal** (no email or chat submissions count) | | [ ] |
| 6 | Repository access ready if asked: GitHub URL, and a reviewer invitation prepared but not sent until requested | | [ ] |
| 7 | Demo credentials (`demo@campai.app` and password) in the portal notes field if the form allows, or ready to share on request | | [ ] |
| 8 | **Freeze rule:** no deploys, secret changes or database edits after the final K13 double pass, except an S1 fix followed by a full L6 smoke test and a repeat K13 double pass | | [ ] |
| 9 | K9 leak scan clean on the final deployed bundle (record the SHA) | | [ ] |
| 10 | K3 RLS proof re-run on the final build (at least K3.1, K3.2, K3.6) | | [ ] |
| 11 | Demo campaign reset (L7 step 6); cap headroom and OpenAI credit checked | | [ ] |
| 12 | **Who submits:** one named person; a second person watches the portal for confirmation | | [ ] |
| 13 | **Confirmation screenshot** of the portal's success message saved to the team vault and posted in the team chat | | [ ] |
| 14 | **2-hour buffer:** the submission is completed at least two hours before the portal deadline; the buffer is for portal outages, not for more features | | [ ] |

---

## L12 — Post-hackathon hardening (short list)

1. (Supabase Dashboard → Authentication → Email) Turn **Confirm email** back on, and configure a custom SMTP sender under Authentication → Emails → SMTP settings so confirmation emails are reliable.
2. (Supabase Dashboard → Authentication → Attack protection) Enable "Prevent use of leaked passwords".
3. Rotate the OpenAI key (L3.4) and change the demo account passwords; remove judge credentials.
4. Lower `AI_DAILY_LIMIT_PER_USER` (for example to 10) or replace the flat cap with per-account quotas tied to a plan.
5. Add error monitoring: forward Edge Function `console.error` lines to a log drain or alerting service, and add a browser error reporter behind the error boundary.
6. Move the pricing verification date forward: re-check OpenAI list prices, update `ai_model_pricing.verified_on` and the figures, and add a reminder to re-verify monthly.
7. Add a `deleted_at` soft-delete on `campaigns` if users ask for undo; add export (CSV, PDF) and duplication from the Should-have list.
8. Turn on GitHub branch protection for `main` with pull-request review once Bolt is no longer auto-committing.
