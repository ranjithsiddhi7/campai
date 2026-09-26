<!-- AI note: Part K test plan for campAI: thirteen numbered test groups (happy path, auth, RLS via API, CRUD, AI schema, normalisation, revision locks, daily cap and idempotency, leaked-key scan, responsive, accessibility, failure/retry, café acceptance), a bug-log template and the "twice in a row" rule.
     Owner: Claude Code (docs); testers/humans fill in results; Bolt never edits it. -->

# K-testing.md — Part K: Testing

## How to use this file

Acronyms used in this part: RLS = Row Level Security; API = Application Programming Interface; JWT = JSON Web Token; REST = Representational State Transfer; CRUD = Create, Read, Update, Delete; UI = User Interface; CLI = Command-Line Interface; URL = Uniform Resource Locator; JSON = JavaScript Object Notation; UTC = Coordinated Universal Time; KPI = Key Performance Indicator; SGD = Singapore dollars; UUID = Universally Unique Identifier; CORS = Cross-Origin Resource Sharing.

1. Tests are numbered K1.1, K1.2 and so on. Each has **Preconditions**, **Steps** (numbered, each labelled with the platform it happens on), **Expected**, and a **Pass/Fail** box to fill in.
2. Run the tests in the order of the summary table. Day 1 tests prove the backend is safe before any AI credit is spent; Day 2 tests prove the must-have flow; Day 3 tests prove quality and the demo.
3. **The must-have scenario (K1, then K13) must pass TWICE consecutively before any Should-have work starts.** A fix between the two runs resets the count. Record both runs in the test-run record at the end of this file.
4. Log every failure in the bug log (template at the end), with the runbook entry (T1–T22) that applies. Two failed fix attempts on one bug means stop and report (master prompt rule 5).
5. Every AI test costs money. Prefer `brief_check` (about US$0.001 on `gpt-6-luna`) when a test only needs "any AI call". A full `generate` on `gpt-6-sol` costs about US$0.07–0.10. The per-user daily cap is 25 calls; testers who run many AI tests should use a second test account so the demo account keeps headroom.
6. Where a test says "SQL Editor", it means Supabase Dashboard → SQL Editor, which runs as the database owner and bypasses RLS. That is fine for checking data, but never use it as proof of RLS; K3 proves RLS through the public API.

### Summary table

| Test id | Name | When to run | Tool needed |
|---|---|---|---|
| K2 | Authentication | Day 1 (after H2) | Browser, Supabase Dashboard |
| K3 | RLS isolation via API | Day 1 (after migration) and again Day 3 | Terminal with `curl`, two accounts |
| K4 | CRUD | Day 1–2 | Browser, Table Editor |
| K5 | AI schema | Day 1 (script) and Day 2 (10 generations) | Node.js, SQL Editor |
| K9 | Leaked-key scan | Day 1 (first deploy) and after EVERY deploy | Terminal |
| K1 | Happy path (must-have flow) | Day 2, then twice consecutively on Day 3 | Browser, Table Editor |
| K6 | Budget/date normalisation | Day 2 | SQL Editor, optional Deno |
| K7 | Revision and locked sections | Day 2 | Browser, Table Editor |
| K8 | Daily cap and idempotency | Day 2 | Terminal with `curl`, Supabase CLI |
| K12 | Failure and retry | Day 2 evening | Supabase CLI (secrets), browser dev tools |
| K10 | Responsive | Day 3 morning | Browser dev tools |
| K11 | Accessibility | Day 3 morning | Keyboard, VoiceOver or NVDA |
| K13 | Café-scenario acceptance (two consecutive runs) | Day 3, before submission | Browser, SQL Editor, stopwatch |

---

## K1 — Happy path (the full must-have flow)

This is the fourteen-step must-have flow from the master prompt, run as one continuous test.

### K1.1 End-to-end café run

**Preconditions:** the deployed site (or `npm run dev` against the real Supabase project) is up; the Edge Function is deployed with all four secrets; OpenAI has credit; you have a fresh test email address; the tester has a stopwatch. Compute the expected dates before you start: the default start date is the **first Monday of next month** relative to the day you run the test (for a run in late September 2026 that is **2026-10-05**, ending **2026-11-01** after 4 weeks). Write your computed dates here: start `____-__-__`, end `____-__-__`.

**Steps:**

1. (Browser) Open the site. Select **Get started** / **Sign up**. Enter the fresh email and a password of at least 8 characters. Submit.
2. (Browser) Expected landing: the dashboard's empty state ("No campaigns yet" with a **New campaign** button). No email-confirmation step.
3. (Browser) Select **New campaign**. The smart start screen shows one free-text box with the café sentence as the placeholder example.
4. (Browser) Type exactly: `I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.` Select **Continue**. Start the stopwatch.
5. (Browser) Wait for the brief check (3–8 seconds). Note the number of follow-up screens shown, one per screen, with a progress indicator.
6. (Browser) On each follow-up screen, accept the prefilled suggestion by selecting **Next** (or change it if the suggestion is clearly wrong; note what you changed).
7. (Browser) Brief review screen: check each field's label. Stated fields show as stated; inferred or defaulted fields show "We assumed this — change it if it's wrong."
8. (Browser) Select **Build my campaign**. Restart the stopwatch. Watch the staged progress messages.
9. (Browser) When the workspace appears, stop the stopwatch and record the generation time.
10. (Browser) Walk through all twelve workspace sections in the navigation: Overview, Audience, Strategy, Messaging and Offer, Channels, Content Ideas, Calendar, Copy and Ad Scripts, Creative Briefs, Budget, KPIs, Assumptions and Risks.
11. (Browser) In **Budget**, edit one line item's notes text and save. In **Calendar**, open one item, change its title, save.
12. (Browser) Open the revise bar, type `Make it suitable for younger customers`, no locks, submit. Wait for the proposal. Read the change summary and highlighted sections. Select **Apply**.
13. (Browser) Go to the dashboard (top-left link). The campaign appears with its generated title and status `ready`. Open it again.
14. (Supabase Dashboard → Table Editor) Check the rows listed under Expected.

**Expected:**

- Step 2: the dashboard opens immediately after sign-up (confirm email is off).
- Step 5: brief check statuses are goal **stated**, business **stated**, budget **stated** (1500 SGD); product or service **inferred** (coffee, drinks and café food); market **inferred** (Singapore); schedule **inferred** (your computed first Monday, 4 weeks); audience clues, existing assets, tone **missing** with usable defaults. Follow-up screens: **at most 6** (the inferred and missing fields). Stated fields are not asked again.
- Step 7: the review screen shows all nine fields; three are marked stated, the rest marked assumed.
- Step 9: generation completes in **≤ 90 seconds** (target 45). Record the time: `___ s`.
- Step 10: all twelve sections render with content; no section is empty; no raw JSON shown. Budget line items are whole numbers that **sum to 1500 SGD**. Channels: at most 6, with budget shares summing to 100. Calendar: **6–20 items**, every date within your computed start and end dates, week numbers 1–4.
- Step 11: each edit saves without error; a small "Saved" confirmation appears; the plan version shown in the workspace increments by one per edit.
- Step 12: the proposal shows a change summary in the second person and highlights changed sections; after Apply, the version increments again and the audience section reflects younger customers.
- Step 13: the reopened campaign shows the applied revision (not the pre-revision content).
- Step 14, Table Editor: `campaigns` has one row with `status = 'ready'` and `current_plan_version` equal to the version shown in the UI (expect 4: generated, two edits, one revision). `campaign_briefs` has one row with `budget_amount = 1500.00`, `currency = 'SGD'`, `start_date` and `end_date` equal to your computed dates. `campaign_plans` has one row per version; version 1 has `source = 'generated'`. `calendar_items` row count equals the calendar count in the workspace. `campaign_revisions` has one row with `status = 'applied'` and `after_plan_version` set. `ai_usage_events` has three rows (`brief_check`, `generate`, `revise`), all `status = 'success'`, each with non-zero `total_tokens` and `estimated_cost_usd`.

**Pass/Fail:** [ ] Pass [ ] Fail — Generation time: ____ s — Follow-up screens shown: ____ — Notes: ____________________

### K1.2 Reopen shows version history

**Preconditions:** K1.1 passed.

**Steps:**

1. (Browser) From the dashboard, open the campaign. In the Overview section find the version indicator.
2. (Supabase Dashboard → SQL Editor) Run: `select version, source, created_at from campaign_plans where campaign_id = '<campaign id>' order by version;`

**Expected:** the UI shows the latest version number; the SQL returns rows 1..N with sources `generated`, `edited`, `edited`, `revised` in order. Version 1 still exists (versions are immutable; there is no update or delete policy on `campaign_plans`).

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K2 — Authentication

### K2.1 Sign-up is instant

**Preconditions:** Supabase Authentication → Email provider enabled, "Confirm email" OFF.

**Steps:**

1. (Browser) Open `/sign-up`. Enter a new email and a password. Submit.
2. (Supabase Dashboard → Authentication → Users) Find the user.
3. (Supabase Dashboard → Table Editor → profiles) Find the matching row.

**Expected:** step 1 lands on `/app` without a "check your email" message; step 2 shows the user with a confirmed timestamp; step 3 shows a `profiles` row with the same `id`, `email` filled, `display_name` equal to the part of the email before `@` (set by the `handle_new_user` trigger).

**Pass/Fail:** [ ] Pass [ ] Fail

### K2.2 Wrong password

**Steps:**

1. (Browser) Sign out. Open `/sign-in`. Enter the email from K2.1 with a wrong password. Submit.

**Expected:** an inline error in plain language ("Email or password is incorrect") near the form, not a browser alert, not a raw Supabase message such as `invalid_grant`. The password field keeps focus. No redirect.

**Pass/Fail:** [ ] Pass [ ] Fail

### K2.3 Sign out

**Steps:**

1. (Browser) Sign in correctly. Open Settings. Select **Sign out**.
2. (Browser) Press the back button.

**Expected:** step 1 returns to the landing page or `/sign-in`; step 2 does not show the dashboard content (the `RequireAuth` guard redirects to `/sign-in`).

**Pass/Fail:** [ ] Pass [ ] Fail

### K2.4 Protected route redirect

**Steps:**

1. (Browser, signed out, or a private window) Paste `https://<app>.bolt.host/app/settings` into the address bar.
2. (Browser) Sign in when prompted.

**Expected:** step 1 redirects to `/sign-in`; step 2 lands on `/app/settings` (the intended page), or at minimum on `/app`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K2.5 Session persists on refresh

**Steps:**

1. (Browser) Signed in, on the dashboard, press refresh (F5). Then close the tab, reopen the site.

**Expected:** still signed in both times; a brief "Loading…" status is acceptable, a flash of the sign-in page is not.

**Pass/Fail:** [ ] Pass [ ] Fail

### K2.6 Signed-in user visiting auth pages

**Steps:**

1. (Browser, signed in) Open `/sign-in`.

**Expected:** redirected to `/app`.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K3 — RLS isolation via the API with two accounts

This is the acceptance target "a second user account cannot read, list, or modify the first user's campaign (verified through the API, not only the UI)". It uses Supabase's REST API directly, so a UI bug cannot hide a policy bug.

**Preconditions:** two accounts exist: **A** (owns at least one campaign with a plan, for example the K1 account) and **B** (a fresh account with no campaigns). You know A's campaign id (`campaigns.id`, from the URL `/app/campaigns/<id>` or the Table Editor). You have the project ref and the publishable key (`sb_publishable_…`). Terminal with `curl` and, ideally, `jq`.

### K3.0 Obtain a JWT for user B

A JWT is the signed session token Supabase issues at sign-in. Either method works.

1. (Terminal) Sign in as B through the Auth API:
   ```bash
   curl -s -X POST "https://<ref>.supabase.co/auth/v1/token?grant_type=password" \
     -H "apikey: <publishable key>" \
     -H "Content-Type: application/json" \
     -d '{"email":"<user B email>","password":"<user B password>"}' | jq -r .access_token
   ```
   Copy the printed token. It expires after one hour; re-run to refresh.
2. (Browser, alternative) Signed in as B, open dev tools → Application → Local Storage → the site's origin → key `sb-<ref>-auth-token`. The value is JSON; copy the `access_token` field.
3. (Terminal) Export it to save typing: `export B_JWT="<token>"` and `export A_CAMPAIGN="<A's campaign id>"`, `export REF="<ref>"`, `export PK="<publishable key>"`.

Repeat for user A if you want to confirm the positive case (A sees A's rows).

### K3.1 B lists campaigns

```bash
curl -s "https://$REF.supabase.co/rest/v1/campaigns?select=id,title,user_id" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT"
```
**Expected:** `[]` (an empty array), HTTP 200. Optional positive check with A's JWT: A's campaign appears.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.2 B reads A's campaign by id

```bash
curl -s "https://$REF.supabase.co/rest/v1/campaigns?id=eq.$A_CAMPAIGN&select=*" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT"
```
**Expected:** `[]`. RLS hides the row; it does not return 403, it returns nothing. Also try `campaign_briefs?campaign_id=eq.$A_CAMPAIGN`, `campaign_plans?campaign_id=eq.$A_CAMPAIGN`, `calendar_items?campaign_id=eq.$A_CAMPAIGN`, `campaign_revisions?campaign_id=eq.$A_CAMPAIGN` — all `[]`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.3 B updates A's campaign

```bash
curl -s -i -X PATCH "https://$REF.supabase.co/rest/v1/campaigns?id=eq.$A_CAMPAIGN" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"title":"HACKED"}'
```
**Expected:** HTTP 200 (or 204) with body `[]`: zero rows matched. (Supabase Dashboard → Table Editor) A's title is unchanged.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.4 B deletes A's campaign

```bash
curl -s -i -X DELETE "https://$REF.supabase.co/rest/v1/campaigns?id=eq.$A_CAMPAIGN" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" -H "Prefer: return=representation"
```
**Expected:** HTTP 200/204 with `[]`; A's campaign, plans and calendar items still exist.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.5 B inserts a plan into A's campaign

```bash
curl -s -i -X POST "https://$REF.supabase.co/rest/v1/campaign_plans" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" -H "Content-Type: application/json" \
  -d "{\"campaign_id\":\"$A_CAMPAIGN\",\"version\":999,\"source\":\"edited\",\"plan\":{}}"
```
**Expected:** HTTP 403 with `"code":"42501"` and a message containing `new row violates row-level security policy` (the insert policy requires the campaign to belong to B). No row appears in `campaign_plans`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.6 B calls the Edge Function with A's campaign id

```bash
curl -s -i -X POST "https://$REF.supabase.co/functions/v1/campaign-ai" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" -H "Content-Type: application/json" \
  -d "{\"operation\":\"generate\",\"request_id\":\"$(uuidgen | tr 'A-Z' 'a-z')\",\"campaign_id\":\"$A_CAMPAIGN\"}"
```
(On Windows without `uuidgen`, paste any UUID from an online generator; the value is not sensitive.)

**Expected:** HTTP 404, body `{"error":{"code":"not_found","message":"We couldn't find that campaign.","request_id":"<the uuid>"}}`. No OpenAI call is made and no `ai_usage_events` row is written (the ownership check runs before the ledger insert). Confirm in the SQL Editor: `select count(*) from ai_usage_events where request_id = '<the uuid>';` returns 0.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.7 Publishable key with no JWT

```bash
curl -s -i "https://$REF.supabase.co/rest/v1/campaigns?select=id" -H "apikey: $PK"
```
**Expected:** HTTP 401 (or 403) with `permission denied for table campaigns` — the migration revokes all table privileges from the `anon` role. Not an empty array: an unauthenticated visitor gets no access at all. The Edge Function with no `Authorization` header returns 401 as well.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.8 B reads the ledger

```bash
curl -s "https://$REF.supabase.co/rest/v1/ai_usage_events?select=user_id,operation,status" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT"
```
**Expected:** only rows whose `user_id` is B's id (probably `[]` for a fresh account). A's rows never appear.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.9 B inserts into the ledger

```bash
curl -s -i -X POST "https://$REF.supabase.co/rest/v1/ai_usage_events" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" -H "Content-Type: application/json" \
  -d '{"operation":"generate","request_id":"11111111-1111-4111-8111-111111111111","status":"success","user_id":"<B user id>"}'
```
**Expected:** HTTP 403 `permission denied for table ai_usage_events` (only `select` is granted to `authenticated`; only the Edge Function's secret-key client writes the ledger). This also proves a user cannot forge their own usage to dodge the daily cap.

**Pass/Fail:** [ ] Pass [ ] Fail

### K3.10 B updates pricing

```bash
curl -s -i -X PATCH "https://$REF.supabase.co/rest/v1/ai_model_pricing?model=eq.gpt-6-sol" \
  -H "apikey: $PK" -H "Authorization: Bearer $B_JWT" -H "Content-Type: application/json" \
  -d '{"output_per_million_usd":0}'
```
**Expected:** HTTP 403 `permission denied for table ai_model_pricing`. A `GET` on the same table with B's JWT returns both pricing rows (readable by signed-in users).

**Pass/Fail:** [ ] Pass [ ] Fail

If any K3 test fails, apply runbook T3, re-run `supabase db push`, and re-run the whole of K3. Do not proceed to the live link until K3 passes in full.

---

## K4 — CRUD

### K4.1 Create, rename, delete a campaign with cascade check

**Preconditions:** signed in as a test account with one generated campaign (from K1).

**Steps:**

1. (Supabase Dashboard → SQL Editor) Before deleting, count child rows: `select (select count(*) from campaign_briefs where campaign_id='<id>') briefs, (select count(*) from campaign_plans where campaign_id='<id>') plans, (select count(*) from calendar_items where campaign_id='<id>') items, (select count(*) from campaign_revisions where campaign_id='<id>') revisions, (select count(*) from ai_usage_events where campaign_id='<id>') ledger;`. Write the numbers down.
2. (Browser) Dashboard → **New campaign** → smart start → enter any text → proceed to review → leave. Dashboard shows the new campaign as `draft` with the default title "Untitled campaign" (or the brief-derived title).
3. (Browser) Open the K1 campaign, rename it from the Overview header (inline title edit). Return to the dashboard.
4. (Browser) On the dashboard, choose **Delete** on the K1 campaign. A confirmation modal appears naming the campaign. Confirm.
5. (Supabase Dashboard → SQL Editor) Re-run the count query.

**Expected:** step 3: the new title shows on the dashboard and in `campaigns.title`. Step 4: the campaign disappears from the list; the empty state appears if it was the last one. Step 5: briefs, plans, items and revisions counts are all **0** (cascade delete); the `ledger` count is unchanged but those rows now have `campaign_id = null` (`on delete set null`), so the Settings usage summary still counts the spend.

**Pass/Fail:** [ ] Pass [ ] Fail

### K4.2 Brief upsert

**Steps:**

1. (Browser) Open a `draft` campaign at the review screen. Change the budget to 2000, select **Save** (or proceed and return). Change it again to 1500.
2. (Supabase Dashboard → Table Editor → campaign_briefs) Filter by `campaign_id`.

**Expected:** exactly **one** brief row per campaign (the `unique (campaign_id)` constraint), `budget_amount = 1500.00`, `updated_at` later than `created_at`, `end_date = start_date + duration_weeks*7 - 1`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K4.3 Calendar add, edit, delete through the UI

**Preconditions:** a `ready` campaign; note its current version V and calendar count N.

**Steps:**

1. (Browser) Calendar → **Add item**. Fill title `Test post`, pick a date inside the campaign, channel from the list, save.
2. (Browser) Open the new item, change status to `done`, save.
3. (Browser) Delete the new item, confirm.
4. (Supabase Dashboard → SQL Editor) `select version, source from campaign_plans where campaign_id='<id>' order by version desc limit 4;` and `select count(*) from calendar_items where campaign_id='<id>';`

**Expected:** after step 1 the version is V+1 and the count N+1; after step 2, V+2 (status badge shows Done); after step 3, V+3 and the count N. SQL shows three new rows with `source = 'edited'`. The plan JSON's `calendar_items` array and the `calendar_items` rows agree (T19 guard): `select jsonb_array_length(plan->'calendar_items') from campaign_plans where campaign_id='<id>' order by version desc limit 1;` equals the row count.

**Pass/Fail:** [ ] Pass [ ] Fail

### K4.4 Section edit

**Steps:**

1. (Browser) Messaging and Offer → edit the core message → save. Refresh the page.

**Expected:** the edit survives the refresh; a new `campaign_plans` version with `source = 'edited'`; the brief is untouched.

**Pass/Fail:** [ ] Pass [ ] Fail

### K4.5 Revision rows

**Steps:**

1. (Supabase Dashboard → Table Editor → campaign_revisions) After K7, list rows for the campaign.

**Expected:** one row per revision request; `status` is `applied` or `discarded` (a `proposed` row that is older than a few minutes means the UI failed to record the user's choice; log it); `before_plan_version` set on all; `after_plan_version` set only on `applied` rows and greater than `before_plan_version`.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K5 — AI schema

### K5.1 Schema compile, example validation and strict-mode walk (no AI credit)

**Preconditions:** Node.js 18 or later on a laptop; the package folder available (in the repository at `docs/campai-package/`).

**Steps:**

1. (Terminal) In an empty folder: `npm init -y >/dev/null && npm install ajv@8 --silent`.
2. (Terminal) Save the script below as `check-schema.mjs`, adjusting the three paths if your package lives elsewhere, then run `node check-schema.mjs`.

```javascript
import Ajv from "ajv";
import { readFileSync } from "node:fs";

const load = (p) => JSON.parse(readFileSync(p, "utf8"));
const campaign = load("./docs/campai-package/F-ai/campaign.schema.json");
const briefCheck = load("./docs/campai-package/F-ai/brief-check.schema.json");
const example = load("./docs/campai-package/F-ai/cafe-example.json");

// 1. Both schemas compile under Ajv's strict mode.
const ajv = new Ajv({ strict: true, allErrors: true });
const validateCampaign = ajv.compile(campaign);
ajv.compile(briefCheck);
console.log("compile: ok");

// 2. The café example validates against the campaign schema.
const ok = validateCampaign(example);
console.log("cafe-example.json valid:", ok);
if (!ok) { console.log(validateCampaign.errors); process.exit(1); }

// 3. Strict-mode walker: every object has additionalProperties:false and lists every property in required.
let objects = 0, problems = 0;
function walk(node, path) {
  if (!node || typeof node !== "object") return;
  const types = Array.isArray(node.type) ? node.type : [node.type];
  if (types.includes("object")) {
    objects++;
    if (node.additionalProperties !== false) { problems++; console.log("missing additionalProperties:false at", path); }
    const props = Object.keys(node.properties ?? {});
    const req = node.required ?? [];
    for (const p of props) if (!req.includes(p)) { problems++; console.log("property not required:", path + "." + p); }
    for (const r of req) if (!props.includes(r)) { problems++; console.log("required but not defined:", path + "." + r); }
    for (const p of props) walk(node.properties[p], path + "." + p);
  }
  if (node.items) walk(node.items, path + "[]");
  for (const k of ["anyOf", "oneOf", "allOf"]) if (Array.isArray(node[k])) node[k].forEach((s, i) => walk(s, `${path}.${k}[${i}]`));
  if (node.$defs) for (const d of Object.keys(node.$defs)) walk(node.$defs[d], path + ".$defs." + d);
}
for (const [name, schema] of [["campaign", campaign], ["brief_check", briefCheck]]) {
  objects = 0; problems = 0;
  walk(schema, name);
  console.log(`${name}: ${objects} object schemas, ${problems} strict-mode problems`);
  if (problems) process.exit(1);
}
```

**Expected output (verified against the package on 26 September 2026):**
```
compile: ok
cafe-example.json valid: true
campaign: 21 object schemas, 0 strict-mode problems
brief_check: 11 object schemas, 0 strict-mode problems
```
Any problem line means OpenAI will reject the schema with 400 "Invalid schema" (runbook T6). Fix the schema file, re-copy it to `supabase/functions/_shared/` and `src/`, redeploy.

**Pass/Fail:** [ ] Pass [ ] Fail

### K5.2 Ten real generations, at least nine pass first time

**Preconditions:** the deployed Edge Function; a dedicated test account (ten generations use up to 10 of the 25 daily calls plus brief checks; use a second account if needed); about US$1 of OpenAI credit.

**Steps:**

1. (Browser) For each of the ten briefs below, create a new campaign through smart start, accept the defaults, and select **Build my campaign**. Record whether the workspace appeared on the first try.
   1. `I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.`
   2. `I sell handmade candles online and want more first-time buyers before the holidays. Budget US$2,000, starting next month for six weeks.`
   3. `I am a local plumber in Manchester. I want more emergency call-outs. I can spend £800 over a month.`
   4. `Our yoga studio in Melbourne wants 30 new members for the new year. Budget A$3,000, starting the first week of January.`
   5. `Small independent bookshop. We want people to come to our monthly author evenings. Budget €500 starting next month.`
   6. `Food truck selling tacos at office parks. Need more lunch crowds Tuesday to Thursday. S$900 next month.`
   7. `I tutor secondary school maths online. I want 10 new students before exam season. Budget 40,000 INR over 8 weeks.`
   8. `Pet grooming salon, want more repeat bookings from existing customers. Budget C$1,200, start next Monday.`
   9. `A coworking space in Lisbon wants to fill 15 empty desks. Budget €2,500, run for 6 weeks starting next month.`
   10. `Florist wanting more Valentine's pre-orders. Budget £1,000, 3 weeks before 14 February.`
2. (Supabase Dashboard → SQL Editor) After all ten:
   ```sql
   select operation, status, error_code, latency_ms, total_tokens, estimated_cost_usd, created_at
   from ai_usage_events
   where operation = 'generate' and created_at > now() - interval '3 hours'
   order by created_at;
   ```

**Expected:** at least **9 of 10** rows have `status = 'success'`. No row has `status = 'schema_invalid'` (a schema failure that the single retry rescued still shows `success`, but with roughly double `total_tokens` and latency; note those). Median `latency_ms` under 60,000; every success under 90,000. Median `estimated_cost_usd` under 0.15. For brief 10 (a date in the past relative to a run in late 2026), the brief check should push the start date to a future date; note what it chose.

Record: passes `__/10`, median latency `____ ms`, median cost `US$____`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K5.3 Ledger has no `schema_invalid` after the ten runs

**Steps:**

1. (SQL Editor) `select count(*) from ai_usage_events where status = 'schema_invalid';`

**Expected:** 0, or if more than 1 in the last 24 hours, open the Edge Function logs, copy the first `console.error` line naming the failing path, and apply T6 or tighten the prompt.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K6 — Budget and date normalisation

Normalisation runs in `supabase/functions/_shared/normalise.ts` in the order given in `F-ai/prompts.md` section 2.3. It is code, never a retry. These tests check that it fires and that the flags reach the database and the UI.

### K6.1 Odd budget provokes proportional rescaling

**Steps:**

1. (Browser) New campaign with the brief: `I run a bakery. I want more weekend customers. My budget is S$1,333. Start next month.` Build.
2. (SQL Editor) `select version, flags, (plan->'budget'->>'total')::numeric as total, (select sum((li->>'amount')::numeric) from jsonb_array_elements(plan->'budget'->'line_items') li) as line_sum from campaign_plans where campaign_id='<id>' and version = 1;`

**Expected:** `total = 1333`, `line_sum = 1333` (tolerance 0). If the model's raw output did not sum exactly, `flags` contains `{"code":"budget_rescaled", ...}` and the plan's `assumptions` array ends with "Budget lines were scaled to match the total of 1333 SGD." The workspace Budget section shows a "We adjusted this" note. If the model happened to sum correctly, `flags` may be empty; that is also a pass for this test, but then run K6.4.

**Pass/Fail:** [ ] Pass [ ] Fail

### K6.2 Calendar dates inside the period and week numbers recomputed

**Steps:**

1. (SQL Editor) For any generated campaign:
   ```sql
   select b.start_date, b.end_date, min(ci.date), max(ci.date),
          bool_and(ci.date between b.start_date and b.end_date) as all_inside,
          bool_and(ci.week_number = ((ci.date - b.start_date) / 7) + 1) as weeks_ok
   from calendar_items ci join campaign_briefs b on b.campaign_id = ci.campaign_id
   where ci.campaign_id = '<id>' group by 1,2;
   ```

**Expected:** `all_inside = true` and `weeks_ok = true`. If any item was clamped, `campaign_plans.flags` contains a `date_clamped` entry with the item id in `ref`, and that item's `notes` starts with "Date adjusted to fit the campaign."

**Pass/Fail:** [ ] Pass [ ] Fail

### K6.3 Channel shares sum to 100

**Steps:**

1. (SQL Editor) `select (select sum((c->>'budget_share_percent')::numeric) from jsonb_array_elements(plan->'channels') c) from campaign_plans where campaign_id='<id>' order by version desc limit 1;`

**Expected:** 100 (± 0.5). A `channel_shares_rescaled` flag appears when the model's shares needed fixing.

**Pass/Fail:** [ ] Pass [ ] Fail

### K6.4 Unit tests for the normaliser (optional, needs Deno 2.x)

The package verified `normalise.ts` with unit tests on 26 September 2026. To re-run them locally, create `supabase/functions/_shared/normalise_test.ts` with at least these cases and run `cd supabase/functions && deno test _shared/`:

1. A plan whose four budget lines sum to 1400 with a 1500 brief → after `normalisePlan`, the lines sum to exactly 1500, all whole numbers, flag `budget_rescaled`, assumptions gain the scaling note.
2. A calendar item dated one day before `start_date` and one dated a week after `end_date` → both clamped to the boundaries, `week_number` 1 and last week, two `date_clamped` flags with the item ids, notes prefixed.
3. Twenty-two calendar items → twenty kept (earliest by date), flag `calendar_count_high`; five items → all kept, flag `calendar_count_low`.
4. An item with `content_pillar: "offer"` when the pillar is named "The Offer" → replaced by "The Offer", flag `pillar_name_fixed`.
5. `restoreLockedSections(current, proposed, ["budget"])` → the returned plan's `budget` deep-equals `current.budget`; `diffSections` then excludes `budget`.
6. `firstMondayOfNextMonth(new Date(Date.UTC(2026, 8, 26)))` → `2026-10-05`; `endDateFor(2026-10-05, 4)` → `2026-11-01`.

**Expected:** all tests pass. If the seed plan is used as the fixture (`E-supabase/seed.sql` embeds a valid plan), copy it into the test as a constant rather than reading the SQL file.

**Pass/Fail:** [ ] Pass [ ] Fail [ ] Skipped (no Deno)

---

## K7 — Revision and locked sections

**Preconditions:** a `ready` campaign with budget total 1500 SGD, current version V.

### K7.1 Locked budget is not changed

**Steps:**

1. (Browser) Open the revise bar. Tick the lock on **Budget**. Type `Cut the budget by 30%`. Submit. Wait (30–90 s).
2. (Browser) Read the proposal.
3. (SQL Editor) `select status, locked_sections, changed_sections, change_summary, before_plan_version, after_plan_version from campaign_revisions where campaign_id='<id>' order by created_at desc limit 1;`

**Expected:** the proposal's Budget section is identical to the current one (total 1500, same lines). `changed_sections` does **not** contain `budget` (the Edge Function copies locked fields back and recomputes the diff, so even if the model changed it, the proposal does not). `change_summary` explains that the budget was locked so the cut could not be applied (or that it changed other things instead). `locked_sections = ["budget"]`, `status = 'proposed'`, `before_plan_version = V`, `after_plan_version = null`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K7.2 Discard changes nothing

**Steps:**

1. (Browser) On the K7.1 proposal, select **Discard**.
2. (SQL Editor) Re-run the K7.1 query; also `select current_plan_version from campaigns where id='<id>';` and `select max(version) from campaign_plans where campaign_id='<id>';`

**Expected:** revision `status = 'discarded'`, `after_plan_version` still null; `current_plan_version = V`; no new plan version; the workspace shows the original content.

**Pass/Fail:** [ ] Pass [ ] Fail

### K7.3 Unlocked budget changes but the total is preserved

**Steps:**

1. (Browser) Revise again, no locks, `Cut the budget by 30%`. Submit.
2. (Browser) Read the proposal's Budget section.

**Expected:** the model may reduce some lines or move money, but after normalisation the line items **still sum to 1500 SGD** (the brief's total is authoritative; the app never changes the budget total through revision). If the model tried to lower the total, a `budget_rescaled` flag appears on the proposal and the change summary or the "We adjusted this" note explains it. `changed_sections` includes `budget`.

**Pass/Fail:** [ ] Pass [ ] Fail

### K7.4 Apply increments the version and rebuilds the calendar

**Steps:**

1. (Browser) Select **Apply** on the K7.3 proposal.
2. (SQL Editor) `select version, source from campaign_plans where campaign_id='<id>' order by version desc limit 1;`, `select status, after_plan_version from campaign_revisions where campaign_id='<id>' order by created_at desc limit 1;`, and `select count(*) from calendar_items where campaign_id='<id>';`

**Expected:** newest plan `version = V+1`, `source = 'revised'`; revision `status = 'applied'`, `after_plan_version = V+1`; `campaigns.current_plan_version = V+1`; calendar row count equals `jsonb_array_length(plan->'calendar_items')` of version V+1 (rows were deleted and re-inserted by `rebuild_calendar_items`; ids in the plan and the rows match).

**Pass/Fail:** [ ] Pass [ ] Fail

### K7.5 Audience revision keeps calendar ids

**Steps:**

1. (Browser) Revise with `Make it suitable for younger customers`, lock **Calendar**. Apply.
2. (SQL Editor) Compare calendar item ids before and after.

**Expected:** the calendar section is byte-identical (locked); ids unchanged; `changed_sections` includes `audience` and probably `messaging`, `copy`, but not `calendar`.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K8 — Daily cap and idempotency

**Preconditions:** Supabase CLI linked to the project; a test account **C** that has made **no AI calls today (UTC)**; C's JWT (`K3.0` method) exported as `C_JWT`; a campaign owned by C exported as `C_CAMPAIGN` (any `draft` campaign works because `brief_check` only needs ownership).

### K8.1 Daily cap returns 429 on the third call when the limit is 2

**Steps:**

1. (Terminal, Supabase CLI) `supabase secrets set AI_DAILY_LIMIT_PER_USER=2`. Wait about a minute for running function instances to pick up the new value; if step 3 still allows a third call, run `supabase functions deploy campaign-ai` and repeat.
2. (Terminal) Run this three times, changing nothing except that each run generates a new `request_id`:
   ```bash
   curl -s -i -X POST "https://$REF.supabase.co/functions/v1/campaign-ai" \
     -H "apikey: $PK" -H "Authorization: Bearer $C_JWT" -H "Content-Type: application/json" \
     -d "{\"operation\":\"brief_check\",\"request_id\":\"$(uuidgen | tr 'A-Z' 'a-z')\",\"campaign_id\":\"$C_CAMPAIGN\",\"free_text\":\"I run a café. I want more customers during weekdays. My budget is S\$1,500. I want to start next month.\",\"defaults\":{\"today\":\"$(date -u +%F)\",\"currency\":\"SGD\",\"market\":\"Singapore\"}}"
   ```
3. (SQL Editor) `select operation, status, error_code, created_at from ai_usage_events where user_id='<C user id>' and created_at::date = current_date order by created_at;`
4. (Terminal) Reset: `supabase secrets set AI_DAILY_LIMIT_PER_USER=25` and confirm with `supabase secrets list`.

**Expected:** calls 1 and 2 return HTTP 200 with `"operation":"brief_check"`. Call 3 returns **HTTP 429** with `{"error":{"code":"daily_limit_reached","message":"You've reached today's limit of 2 AI actions. It resets at midnight UTC.", ...}}`. SQL shows three rows: two `success`, one `daily_limit_reached` (the cap counts every attempt, including the refused one, so the fourth call is also refused). The UI, when it receives this error, shows the message and a note about when it resets, without a retry button. After step 4 the cap is 25 again.

**Pass/Fail:** [ ] Pass [ ] Fail

### K8.2 Same request id twice: replay of a success

**Steps:**

1. (Terminal) `export RID=$(uuidgen | tr 'A-Z' 'a-z')`. Send the K8.1 `brief_check` request with `\"request_id\":\"$RID\"`. Confirm HTTP 200.
2. (Terminal) Send exactly the same request again with the same `$RID`.
3. (SQL Editor) `select count(*) from ai_usage_events where request_id='$RID';`

**Expected:** step 2 returns **HTTP 200** with the same body as step 1 and the response header `X-Campai-Replayed: true`; step 3 returns **1** (no second ledger row, no second OpenAI charge; `total_tokens` unchanged).

**Pass/Fail:** [ ] Pass [ ] Fail

### K8.3 Same request id twice: duplicate of a failure or an in-progress call

**Steps:**

1. (Terminal) Open two terminals. In the first, send a `generate` request for a campaign with a saved brief with a fresh `$RID`. Within five seconds, in the second terminal send the identical request with the same `$RID`.
2. (Terminal, later) Send a `brief_check` with a `request_id` that belongs to an earlier **failed** row (find one with `select request_id from ai_usage_events where status <> 'success' and user_id='<C user id>' limit 1;`).

**Expected:** the second terminal in step 1 gets **HTTP 409** `duplicate_request` ("That request is already being handled." from the unique-constraint race, or "That request was already handled. Start a new one." if the first ledger row had been written moments earlier), while the first terminal completes normally. Step 2 also returns 409 `duplicate_request`. The browser client treats 409 as "the earlier attempt finished — reload" (see `src/lib/api.ts`).

**Pass/Fail:** [ ] Pass [ ] Fail

### K8.4 Double-click Build produces one ledger row

**Steps:**

1. (Browser) On the review screen, double-click **Build my campaign** as fast as you can. Also try clicking once, then again while the progress screen shows (if the button is still reachable).
2. (SQL Editor) `select count(*), min(status) from ai_usage_events where campaign_id='<id>' and operation='generate';`

**Expected:** the button disables on the first click; the count is **1**. Because the component creates the `request_id` once per user action and reuses it, even a second request that slipped through is answered with a replay or a 409, never a second generation.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K9 — Leaked-key scan of the deployed bundle

Run this after the **first** deploy and after **every** deploy. A match is an incident (runbook T14): rotate the key first, investigate second.

### K9.1 Local production build

**Steps:**

1. (Terminal, repository root, with the real `.env.local` present so the build mirrors Bolt's) `npm run build`
2. (Terminal) `grep -rEn "sb_secret_|service_role|sk-[A-Za-z0-9]" dist/ ; echo "matches: $?"`
3. (Terminal) `grep -rEn "OPENAI" dist/ ; echo "matches: $?"`

**Expected:** steps 2 and 3 print no matching lines and `matches: 1` (`grep` exits 1 when nothing matches). `matches: 0` means at least one hit: read the hit; a string such as `sk-` inside a random hash is a false positive you can dismiss after reading it, but any 30-plus-character token following `sk-` or `sb_secret_` is a leak. The publishable key `sb_publishable_…` and the project URL **will** appear; that is expected and safe.

**Pass/Fail:** [ ] Pass [ ] Fail

### K9.2 Deployed site

**Steps:**

1. (Terminal) List the JavaScript files the deployed page loads:
   ```bash
   curl -s https://<app>.bolt.host/ | grep -oE 'src="[^"]+\.js"'
   ```
2. (Terminal) For each path printed (they look like `/assets/index-abc123.js`), fetch and scan it:
   ```bash
   curl -s "https://<app>.bolt.host/assets/index-abc123.js" | grep -oE "sb_secret_[A-Za-z0-9_-]+|service_role|sk-[A-Za-z0-9_-]{10,}|OPENAI[A-Z_]*" ; echo "matches: $?"
   ```
3. (Browser, alternative) Dev tools → Sources → search all files (Ctrl+Shift+F) for `sb_secret_`, `service_role`, `sk-`, `OPENAI`.

**Expected:** every scan prints `matches: 1` with no lines above it. If the deployed page loads its JavaScript through `type="module"` chunks, scan each chunk the first file imports as well (search the first file for `import("./` paths).

**Pass/Fail:** [ ] Pass [ ] Fail — Deploy scanned (commit or time): __________

### K9.3 Environment variable names

**Steps:**

1. (Bolt → project settings → Environment variables) Read the list.
2. (Terminal) `grep -rn "VITE_" src/ vite.config.ts | grep -v "VITE_SUPABASE_URL\|VITE_SUPABASE_PUBLISHABLE_KEY\|VITE_SUPABASE_ANON_KEY"`

**Expected:** Bolt holds only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`); the grep prints nothing. Any other `VITE_` name is a T5/T14 finding.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K10 — Responsive

Use the browser's device toolbar (Chrome: dev tools → toggle device toolbar) and check each viewport width: **375** (phone), **768** (tablet portrait), **1024** (small laptop), **1440** (desktop). The workspace is optimised for 1024 and up; on 375 it must be usable, not perfect.

### K10.1 Per-screen checks at each width

| Screen | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Landing: heading readable, one primary button, no horizontal scroll | [ ] | [ ] | [ ] | [ ] |
| Sign-in / sign-up: form full width on phone, centred card on desktop, error text wraps | [ ] | [ ] | [ ] | [ ] |
| Dashboard: cards stack in one column on phone, 2 columns at 768, 3 at 1440; New campaign button reachable without scrolling | [ ] | [ ] | [ ] | [ ] |
| Smart start: textarea at least 5 lines tall, placeholder fully visible, Continue button not covered by the on-screen keyboard (test on a real phone if possible) | [ ] | [ ] | [ ] | [ ] |
| Follow-up question: one question, progress indicator visible, example answers wrap | [ ] | [ ] | [ ] | [ ] |
| Brief review: nine rows readable; stated/assumed badge does not overflow | [ ] | [ ] | [ ] | [ ] |
| Generation progress: message centred, no layout jump between stages | [ ] | [ ] | [ ] | [ ] |
| Workspace: navigation becomes a horizontally scrollable tab strip on phone and tablet, a left column at 1024 and up; the active tab is visible without scrolling the strip | [ ] | [ ] | [ ] | [ ] |
| Budget table: on phone the table scrolls horizontally inside its container or collapses to stacked rows; totals still shown | [ ] | [ ] | [ ] | [ ] |
| Calendar: table at 1024 and up; **cards** (one per item, date and channel on top, title, status badge) at 375 and 768; the edit drawer becomes full-screen on phone | [ ] | [ ] | [ ] | [ ] |
| Revise bar and proposal: lock checkboxes wrap; Apply and Discard both visible without scrolling on phone | [ ] | [ ] | [ ] | [ ] |
| Settings: usage summary numbers do not overflow their tiles | [ ] | [ ] | [ ] | [ ] |

### K10.2 General rules at every width

1. No horizontal page scrollbar (only intended inner containers scroll sideways).
2. Tap targets at least 44 × 44 CSS pixels on phone.
3. Text never smaller than 14 px for body copy.
4. Zoom to 200% at 1440: layout reflows, nothing is cut off.

**Pass/Fail:** [ ] Pass [ ] Fail — Viewports with issues: __________

---

## K11 — Accessibility

### K11.1 Keyboard-only walkthrough of the must-have flow

**Steps (Browser, unplug or ignore the mouse):**

1. Tab from the landing page to **Get started**, press Enter.
2. Complete sign-up with Tab, typing and Enter.
3. Tab to **New campaign**, Enter. Tab into the textarea, type the café sentence, Tab to **Continue**, Enter.
4. On each follow-up screen: focus must land on the question's input automatically; Enter submits; Shift+Tab reaches **Back**.
5. Review: Tab through all nine rows and any **Change** links; Enter on **Build my campaign**.
6. Workspace: Tab into the section navigation; arrow keys or Tab move between sections; Enter selects. Tab to a calendar item, Enter opens the drawer; Escape closes it; focus returns to the item that opened it.
7. Revise bar: Tab to the lock checkboxes, Space toggles; Tab to the instruction, type, Enter submits; Tab between **Apply** and **Discard**.
8. Open the delete confirmation on the dashboard with the keyboard; Escape cancels; focus returns to the Delete button.

**Expected:** every interactive element is reachable and operable; no keyboard trap; modals and drawers trap focus inside while open and restore it on close.

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.2 Focus visible

**Expected:** every focused element shows the focus ring from the tokens (`0 0 0 2px #0a0a0a, 0 0 0 4px #c9a86a`), visible against both the page background and card surfaces. Focus is never removed with `outline: none` without a replacement.

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.3 Labels and names

**Steps:** (Browser dev tools → Accessibility panel, or the axe browser extension) inspect each form field and icon button.

**Expected:** every input has a programmatic label (visible `<label for>` or `aria-label`); icon-only buttons (delete, lock, close) have an `aria-label`; the section navigation is a `<nav aria-label="Campaign sections">` with the current section marked `aria-current="page"`; status badges have text, not colour alone.

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.4 Live regions during generation and saving

**Expected:** the generation progress container has `role="status"` and `aria-live="polite"` so each staged message is announced; the "Saved" toast and inline errors are announced (`role="status"` for success, `role="alert"` for errors). The auth loading state already uses `role="status" aria-live="polite"` (see `src/hooks/useAuth.tsx`).

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.5 Contrast spot checks with the token values

Computed contrast ratios against the page background `#0a0a0a` (WCAG = Web Content Accessibility Guidelines; 4.5:1 for normal text, 3:1 for large text and UI components):

| Token | Colour | Ratio on `#0a0a0a` | Use |
|---|---|---|---|
| `ink` | `#f4f4f2` | about 18:1 | body and headings: pass |
| `ink.secondary` | `#a3a3a3` | about 7.9:1 | helper text: pass |
| `ink.muted` | `#737373` | about 4.2:1 | **below 4.5:1** — use only for large text (18 px+ or 14 px bold) or non-essential decoration, never for helper text that carries meaning |
| `accent` | `#c9a86a` | about 8.8:1 | links, primary button background with `ink.inverse` text: pass |
| `state.danger` | `#e06c6c` | about 6.2:1 | error text: pass |
| `state.success` | `#6fbf8a` | about 8.9:1 | saved confirmation: pass |
| `line` | `#262626` | about 1.3:1 | decorative borders only; input borders that must be perceivable use `line.strong` `#333333` plus a visible focus state |

**Steps:** confirm with a contrast checker on three real screens (sign-in error, workspace helper text, calendar status badge) that no meaningful text uses `ink.muted` on the page background and that badge text on `accent.soft` surfaces still reaches 4.5:1.

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.6 Screen-reader smoke test

**Steps:** (macOS: VoiceOver, Cmd+F5; Windows: NVDA, free) On the sign-in page and on the brief review screen:

1. Navigate by headings (VoiceOver: VO+Cmd+H; NVDA: H). The page has one `h1` and logical `h2`s.
2. Navigate by form controls. Each announces its label, type and any error.
3. On the review screen each row announces the field name, the value and "stated" or "assumed" as text.

**Expected:** no "unlabelled button", no "clickable" on plain text, no announcement of raw JSON or token strings.

**Pass/Fail:** [ ] Pass [ ] Fail

### K11.7 Reduced motion

**Steps:** (Operating system → accessibility → reduce motion, or Chrome dev tools → Rendering → emulate `prefers-reduced-motion: reduce`.) Trigger the generation progress screen and open a drawer.

**Expected:** transitions become instant or near-instant; no infinite spinner animation that cannot be paused (a static "Working…" label with a progress step counter is fine).

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K12 — Failure and retry

Each test simulates one failure mode, checks the safe message the user sees, then checks the ledger. Do these on Day 2 evening with the demo account **not** signed in, and restore every setting afterwards. Each simulation costs at most one cheap call.

### K12.1 Wrong OpenAI key → `upstream_error`

**Steps:**

1. (Terminal, Supabase CLI) `supabase secrets set OPENAI_API_KEY=sk-invalid-for-test`. Wait a minute (or redeploy) for the change to take effect.
2. (Browser) Run smart start with the café sentence.
3. (SQL Editor) Latest ledger row.
4. (Terminal) Restore the real key: `supabase secrets set --env-file ./supabase/.env.production`. Confirm with a successful brief check.

**Expected:** step 2: smart start silently falls back to the **nine-question sequence** (no error shown; this is the T15 rule). To see the user-facing message, run a `generate` instead on a campaign with a saved brief: the error state shows "campAI couldn't reach its AI service. Please try again." with a **Retry** button. Step 3: `status = 'upstream_error'`, `error_code = 'upstream_error'`, `total_tokens = 0`, `latency_ms` small. The Edge Function log shows the OpenAI 401 body; the browser never does.

**Pass/Fail:** [ ] Pass [ ] Fail

### K12.2 Nonexistent model → `upstream_error`

**Steps:**

1. (Terminal) `supabase secrets set OPENAI_MODEL_LIGHT=gpt-does-not-exist`.
2. (Browser) Smart start with the café sentence.
3. (Terminal) Restore: `supabase secrets set OPENAI_MODEL_LIGHT=gpt-6-luna`.

**Expected:** fallback to the nine questions; ledger row `upstream_error` with `model = 'gpt-does-not-exist'` and `error_code` ending in `;pricing_missing` (no pricing row for that model — this is the visible gap the Settings summary is designed to expose). OpenAI returns 400/404 for an unknown model, which is not retried.

**Pass/Fail:** [ ] Pass [ ] Fail

### K12.3 No network → network message

**Steps:**

1. (Browser dev tools → Network → Offline) On the review screen select **Build my campaign**.
2. (Browser) Set the network back online and select **Retry**.

**Expected:** step 1: within a few seconds the error state shows the network message ("You seem to be offline. Check your connection and try again.") with **Retry**; no ledger row exists because the request never reached the function. Step 2: the retry **reuses the same `request_id`** (check the request body in the Network tab) and succeeds; exactly one ledger row.

**Pass/Fail:** [ ] Pass [ ] Fail

### K12.4 Incomplete output (optional, provokes `incomplete_output`)

**Steps:**

1. (Claude Code, temporary change) In `supabase/functions/_shared/types.ts` set `maxOutputTokens.generate` to `400`. Deploy.
2. (Browser) Build a campaign.
3. (Claude Code) Revert to `12000`, deploy, commit nothing from the experiment.

**Expected:** the error state shows "The plan came back unfinished. Try again; if it happens twice, shorten your brief."; ledger `status = 'incomplete'`, `error_code = 'incomplete_output'`, `output_tokens` about 400; campaign status `error` with `last_error` set (or `ready` if an earlier version existed). Not retried automatically.

**Pass/Fail:** [ ] Pass [ ] Fail [ ] Skipped

### K12.5 Brief check failure shows nine questions, no error

**Steps:**

1. (Terminal) Temporarily break the light model as in K12.2, or set the brief-check timeout artificially low, or (simplest) block `*.supabase.co/functions/*` in dev tools → Network request blocking.
2. (Browser) Smart start with any text.

**Expected:** after the failure (up to 20 s on timeout) the app shows question 1 of 9 (goal) prefilled with the free text where sensible, with a progress indicator "1 of 9". No error toast. The brief can be completed and generated normally. `campaign_briefs.brief_check.used_ai = false` for that campaign.

**Pass/Fail:** [ ] Pass [ ] Fail

### K12.6 Edge Function timeout message

**Steps:**

1. (Observation only) If any generation during K5.2 exceeded 110 s, the function aborts the OpenAI call.

**Expected:** the error state shows "This is taking longer than usual. Please try again."; ledger `status = 'timeout'`, `latency_ms` about 110,000. If this happens more than once in ten runs, apply T9 (lower output bounds) before the demo.

**Pass/Fail:** [ ] Pass [ ] Fail [ ] Not observed

### K12.7 Retry reuses the request id and never double-bills

**Steps:**

1. (Browser dev tools → Network) After any failed generate (K12.1 or K12.3), select **Retry** and compare the two request bodies.

**Expected:** identical `request_id`. If the first attempt wrote a failure row, the retry gets **409 `duplicate_request`** and the UI must then issue a fresh `request_id` automatically (the client's documented behaviour is to reload and let the user click Build again, which mints a new id). Either way the user never sees a stuck screen, and the ledger never shows two `success` rows for one click.

**Pass/Fail:** [ ] Pass [ ] Fail

### K12.8 Damaged plan data

**Steps:**

1. (SQL Editor, test campaign only) `update campaign_plans set plan = plan - 'kpis' where campaign_id='<id>' and version = (select max(version) from campaign_plans where campaign_id='<id>');`
2. (Browser) Open the campaign.

**Expected:** the error state "This campaign's data looks damaged" with a **Rebuild** button (calls `generate` again), not a blank page or a crash. The error boundary catches anything else with a plain message and a link back to the dashboard.

**Pass/Fail:** [ ] Pass [ ] Fail

---

## K13 — Café-scenario acceptance (slide 10)

This is the hackathon test from slide 10 of the deck. It must pass **twice consecutively** on the deployed site, on Day 3, before submission. It reuses the K1 flow and adds a content judgement: does the output actually tell a café owner what to do?

### K13.1 The six success criteria mapped to checks

| # | Slide 10 criterion | Where to look | Check |
|---|---|---|---|
| 1 | The owner just says what they want | Smart start | The café sentence alone, plus at most six prefilled follow-ups, reaches the review screen. No marketing terms were required. |
| 2 | Who to target | Audience | A primary segment defined by behaviour and situation (for example weekday office or remote workers within walking distance), with pains, motivations and objections; one secondary segment. |
| 3 | What to say and what offer to run | Messaging and Offer | One core message a customer could repeat; one offer that drives repeat weekday visits (a stamp card, a weekday-only deal), with mechanics and terms. |
| 4 | Where to run it and what content to create | Channels, Content Ideas, Calendar, Copy and Ad Scripts, Creative Briefs | At most 6 channels favouring the existing Instagram account and email list plus in-store; 3–5 content pillars with ideas; 6–20 dated calendar items; paste-ready captions and at least one email; at least one ad script; at least one creative brief. |
| 5 | How to allocate S$1,500 and how long to run it | Budget, Overview timeline | Line items in whole SGD summing to exactly 1,500; a timeline exactly matching the brief's start and end dates with 1–4 phases. |
| 6 | What success looks like, and AI cost is measurable | KPIs; Settings usage summary | 2–8 KPIs with numeric targets measurable without paid tools (till receipts, promo codes, Instagram insights); the Settings page shows calls, tokens and estimated cost that match the ledger. |

A criterion fails if a layperson tester (someone on the team who is not building the product) cannot answer the question from the workspace within one minute.

### K13.2 Procedure for each run

1. (Browser, fresh test account or the demo account after a reset per Part L7) Run K1.1 steps 1–10 with the café sentence verbatim. Time the generation.
2. (Browser) Hand the laptop to the layperson tester with the six questions on paper. Tick each criterion they can answer.
3. (Browser) Perform one edit and one revision with Apply (K1.1 steps 11–12). Reopen from the dashboard.
4. (Browser → Settings) Read calls, tokens, estimated cost.
5. (SQL Editor) `select operation, model, latency_ms, total_tokens, estimated_cost_usd from ai_usage_events where campaign_id='<id>' order by created_at;` Record generation latency and the summed cost of `brief_check` + `generate` (the acceptance target is ≤ US$0.20 on `gpt-6-sol`; the revise call is extra).
6. (Terminal) Run K9.2 against the deployed site (it is part of the definition of done, and a deploy may have happened since the last scan).

### K13.3 Pass rule

Both runs must satisfy: all six criteria ticked; generation ≤ 90 s; brief check + generate ≤ US$0.20; twelve sections rendered; edit and revision saved; reopen shows the latest version; leak scan clean. Record both runs in the test-run record below. If run 2 fails, fix, then run **two more** consecutive runs.

---

## Bug log

### Severity definitions

- **S1 — Blocks the must-have flow or the demo, or a security failure** (auth broken, generation fails, RLS leak, key leak, data loss). Fix now; nothing else proceeds.
- **S2 — Wrong behaviour with a workaround** (a section renders badly, a flag not shown, an edit needs a refresh to appear). Fix before submission if time allows; otherwise note it in the demo script and avoid it.
- **S3 — Cosmetic or polish** (spacing, copy, minor responsive issue). Fix only after the café scenario has passed twice.

### Template

| Id | Date/time (UTC) | Found in test | Severity | Symptom | Steps to reproduce | Expected | Actual | Runbook entry | Owner tool | Fix commit | Verified by | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B-001 | 2026-09-27 03:14 | K3.6 | S1 | Second user's Edge Function call for another user's campaign returned 200 and generated a plan | K3.6 with user B's JWT and user A's campaign id | 404 `not_found`, no ledger row | 200 with a plan; ledger row written under B | T3 | Claude Code | `I0: fix campaigns policy user_id default` | Mercury | Closed |
| B-002 | 2026-09-27 09:40 | K10.1 | S3 | Calendar cards on 375 px overflow the viewport by 12 px because the drawer has a fixed width | Open Calendar at 375 px, open any item | Drawer full-screen on phone | Drawer 420 px wide, page scrolls sideways | — | Bolt | `H7: calendar drawer full-screen under md` | Mercury | Open |
| | | | | | | | | | | | | |

Columns: **Owner tool** is Bolt (anything in `src/` UI) or Claude Code (anything in `supabase/`, contracts, `CLAUDE.md`, or `src/` fixes Bolt struggles with while Bolt is idle). **Fix commit** uses the change-set convention `<change set id>: <summary>`. **Status** is Open, Fixing, Fixed (awaiting verification), Closed, or Deferred (with a reason, S2/S3 only).

Keep the log as `docs/bug-log.md` in the repository (Claude Code owns the file; anyone may append rows). Paste only the row, never whole logs, into Claude Code or Bolt when asking for a fix.

---

## The "twice in a row" rule

1. The must-have scenario is K1.1 (all fourteen steps) plus the K13 criteria, run on the **deployed** site with a **fresh sign-up** or a reset demo account.
2. It passes when every Expected line holds with no manual workaround (no refresh to make an edit appear, no re-click, no dev-tools intervention).
3. Two passes must be **consecutive**: run 1 pass, run 2 pass, with no code change, deploy, secret change or database edit between them. Any change between the runs resets the count to zero.
4. Only after two consecutive passes may the team spend time or usage on Should-haves (duplication, export, status labels, templates, unsaved-change warning, calendar filters) or on S3 bugs.
5. If a later change touches the must-have flow (auth, brief, generate, workspace, calendar edit, revise, save/reopen, Edge Function, migration), the rule applies again before submission: two consecutive passes on the final deployed build.
6. The final two passes are the K13 runs recorded below; their date, latency and cost go into the submission notes and the Loom voice-over ("built in 48 seconds for about eight cents").

## Test-run record: the two consecutive café runs

| Field | Run 1 | Run 2 |
|---|---|---|
| Date and time (UTC) | | |
| Deployed commit (short SHA from GitHub) | | |
| Tester / layperson tester | | |
| Account used (fresh sign-up or reset demo) | | |
| Computed default start date / end date | | |
| Follow-up screens shown (≤ 6) | | |
| Brief check latency (ms) and cost (US$) | | |
| Generation latency (ms) (≤ 90,000) | | |
| Generate cost (US$) | | |
| Brief check + generate total (≤ US$0.20) | | |
| Calendar items (6–20), all inside period | | |
| Budget lines sum to 1500 SGD | | |
| Flags recorded (`campaign_plans.flags`) | | |
| Six slide-10 criteria ticked (6/6) | | |
| Edit saved, version after edit | | |
| Revision instruction, locked sections, Apply result, version after | | |
| Reopen shows latest version | | |
| Settings summary matches ledger (calls / tokens / cost) | | |
| Leak scan K9.2 result | | |
| Overall | Pass / Fail | Pass / Fail |
| Notes | | |

Consecutive passes achieved on (date/time UTC): ____________ Signed: ____________
