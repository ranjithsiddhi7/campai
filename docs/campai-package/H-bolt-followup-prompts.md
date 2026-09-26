<!-- AI note: Part H of the campAI implementation package: thirteen targeted Bolt follow-up prompts (H1–H13), one change set each, that turn the Part G shell into the working product on Supabase and the campaign-ai Edge Function.
     Owner: Claude Code (docs) maintains the text; humans paste it into Bolt; Bolt never edits this file. -->

# H-bolt-followup-prompts.md — Part H: Bolt follow-up prompts (one change set each)

Acronyms used in this file: UI = User Interface; UX = User Experience; API = Application Programming Interface; RLS = Row Level Security; RPC = Remote Procedure Call (here: calling a Postgres function through `supabase.rpc`); JSON = JavaScript Object Notation; KPI = Key Performance Indicator; CTA = call to action; UUID = Universally Unique Identifier; CRUD = Create, Read, Update, Delete.

## How to use

1. **One prompt per Bolt message.** Copy the fenced block of one prompt, paste it as a single Bolt message, and send nothing else until that change set is verified. Never combine two prompts.
2. **Wait for a stable build.** Bolt must report a clean build with the preview running before you start the "Verify" steps. If Bolt reports an error, let it fix only that error; if two attempts fail, stop and record the issue for Claude Code (Troubleshooting rule 5 in `CLAUDE.md`).
3. **Verify, then move on.** Run every numbered "Verify" step in the browser, the browser console, or the Supabase Dashboard as stated. Do not send the next prompt until all steps pass.
4. **Bolt auto-commits.** Confirm the commit appears in GitHub after each prompt. Claude Code must be idle on `src/` while Bolt works (it runs `git pull` before its next session). Never let both tools touch `src/` at the same time.
5. **Prerequisites are Claude Code change sets.** Several prompts need the backend in place first: `I0` is the Claude Code session described in `I-code-guide/index.md` section 8 (migration pushed, seed applied, `campaign-ai` deployed with secrets, `src/types/campaign.ts` and `src/lib/validation.ts` copied in). The prerequisite line at the top of each prompt says what must exist.
6. **Every prompt starts with the same one-line reminder** of the pinned dependency and secret rules and ends with "Do not change any other files." Keep both lines when pasting; they are what stops Bolt from adding libraries or environment variables.
7. **Snippets are pasted verbatim.** When a prompt names a file under `docs/campai-package/I-code-guide/src-snippets/`, Bolt creates the destination file by copying that snippet unchanged (the snippet's first two comment lines may stay). The snippet name encodes the destination: `src__lib__api.ts` means `src/lib/api.ts`.

## Table of contents

| Id | Name | Prerequisite | Usage weight |
|---|---|---|---|
| H1 | Connect Supabase | Part G verified; `I0` done; Supabase environment variables set in Bolt | light |
| H2 | Authentication | H1; "Confirm email" turned off in Supabase Auth | medium |
| H3 | Guided brief (nine questions, saved brief) | H2 | heavy |
| H4 | Brief check / smart start | H3; `campaign-ai` deployed with `OPENAI_API_KEY` and `OPENAI_MODEL_LIGHT` | medium |
| H5 | AI Edge Function wiring: generation | H4 | heavy |
| H6 | Campaign rendering from the database | H5; `src/lib/validation.ts` present from `I0` | heavy |
| H7 | Editable calendar on `calendar_items` | H6 | medium |
| H8 | Save / reopen and section editing | H7 | medium |
| H9 | Revision Apply/Discard with locks | H8 | medium |
| H10 | Usage ledger and Settings summary | H9 | light |
| H11 | Responsiveness and accessibility pass | H10 | medium |
| H12 | Demo data and dashboard polish | H11; `seed.sql` applied with the demo user created | light |
| H13 | Production cleanup | H12; run before the final deployment | light |

---

## H1 — Connect Supabase

**Prerequisite:** Part G shell verified and committed. `I0` backend scaffold deployed by Claude Code (migration pushed). Supabase environment variables are set in Bolt by one of two paths: (a) Bolt's native Supabase integration (Bolt Pro/Teams), which injects `VITE_SUPABASE_URL` and usually `VITE_SUPABASE_ANON_KEY`; or (b) manual: in Bolt's environment settings (or a `.env` file that is git-ignored) set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` copied from Supabase Dashboard → Project Settings → API Keys (the value starts with `sb_publishable_…`). Never paste anything that starts with `sb_secret_` or `sk-`.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H1: connect the app to Supabase. This creates one file and imports it once. No screens change.

1. Create src/lib/supabase.ts by pasting docs/campai-package/I-code-guide/src-snippets/src__lib__supabase.ts unchanged. It exports `supabase` (the single browser client, created with the publishable key) and `CAMPAIGN_AI_FUNCTION` (the string "campaign-ai"). It reads VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, falling back to VITE_SUPABASE_ANON_KEY if the Supabase integration injected that name instead. It throws a clear error if the variables are missing or if a secret key was placed in the browser environment, and the existing ErrorBoundary already shows a friendly message for that error.

2. In src/main.tsx add the side-effect import `import "./lib/supabase";` as the first import, so a misconfigured deployment fails at start-up with the ErrorBoundary message instead of failing later inside a screen.

3. Add `src/vite-env.d.ts` typing for the two variables if the scaffold does not already declare `ImportMetaEnv` (readonly VITE_SUPABASE_URL: string; readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string; readonly VITE_SUPABASE_ANON_KEY?: string). Do not declare any other variable.

4. Do not call Supabase from any screen yet. Do not remove the stub data or any stub path; authentication and data arrive in the next change sets.

5. Both connection paths are supported by the same file. Path (a): the Bolt Supabase integration injects VITE_SUPABASE_URL and, on some plans, VITE_SUPABASE_ANON_KEY; the fallback in the snippet picks that up. Path (b): the human pasted VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (an sb_publishable_… value) into Bolt's environment settings. Do not add code for either path beyond the snippet.

6. If the environment variables appear to be missing, do not invent, rename or hardcode them, and never add a VITE_ prefix to any other value to make an error go away. Report exactly which name is missing and stop.

7. Expand acronyms once in any copy you write, for example RLS (Row Level Security); no user-facing copy changes in this change set.

Done when: the app builds, every route still renders exactly as before, and the browser console shows no error from src/lib/supabase.ts.

Do not change any other files.
```

**Verify**

1. Browser: open `/app`. The dashboard renders as before; the console has no error mentioning Supabase.
2. Browser → Network tab: reload; no request to your Supabase project should appear yet (nothing calls it until H2).
3. Bolt file tree: `src/lib/supabase.ts` exists and matches the snippet line for line. No `.env` file is committed; if Bolt created `.env`, confirm it is listed in `.gitignore` and contains only the two `VITE_SUPABASE_` names.
4. Negative test: temporarily rename `VITE_SUPABASE_URL` in Bolt's environment settings to `VITE_SUPABASE_URLX`, reload. The ErrorBoundary must show "campAI isn't set up correctly on this deployment". Restore the name and confirm the app is back.
5. GitHub: a new commit from Bolt contains `src/lib/supabase.ts` and the one-line change to `src/main.tsx`.

---

## H2 — Authentication

**Prerequisite:** H1 verified. In Supabase Dashboard → Authentication → Providers → Email, "Confirm email" is turned off for the hackathon (E-supabase/setup-steps.md says how to turn it back on). The `profiles` trigger from the migration is in place (`I0`).

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H2: real email-and-password authentication.

1. Create src/hooks/useAuth.tsx by pasting docs/campai-package/I-code-guide/src-snippets/src__hooks__useAuth.tsx unchanged. It exports AuthProvider (context holding user, session, loading, signUp, signIn, signOut), useAuth() and RequireAuth (a route guard that shows a small loading line, then redirects to /sign-in with the attempted path in location.state.from). signUp and signIn return null on success or a plain-language error string on failure; they never throw.

2. In src/main.tsx nest the providers as BrowserRouter > AuthProvider > ErrorBoundary > App.

3. Wire the pages:
   - /sign-up: on submit call signUp(email, password). Show the returned error string in the existing aria-live error area. On success navigate to /app. Basic client checks before calling: email contains "@", password at least 6 characters (message: "Use a password with at least 6 characters."). Disable the button and show "Creating your account…" while the call runs.
   - /sign-in: same pattern with signIn. On success navigate to location.state.from if present, else /app. Busy text: "Signing you in…".
   - Both pages: if useAuth().user already exists, redirect to /app immediately.
   - Settings: show the real user email from useAuth().user.email; "Sign out" calls signOut() then navigates to /.
   - Landing: if the user is signed in, the primary button reads "Open dashboard" and goes to /app.

4. In src/App.tsx wrap every /app route element (Dashboard, NewCampaign, Campaign, Settings) in <RequireAuth>. The landing, sign-in, sign-up and not-found routes stay public.

5. Add a "Sign out" item to the AppShell top bar (icon button with an accessible label), calling signOut() and navigating to /.

6. Keep the stubbed dashboard, brief flow and workspace exactly as they are. This change set is authentication only.

Done when: a new user can sign up, land on /app, sign out, sign back in and return to the page they were sent from; a signed-out visit to /app/settings redirects to /sign-in and returns to /app/settings after signing in; wrong credentials show "That email and password don't match. Try again."

Do not change any other files.
```

**Verify**

1. Browser: `/sign-up` with a fresh email and a 6-character password lands on `/app`. Console has no errors.
2. Supabase Dashboard → Authentication → Users: the new user is listed. Table Editor → `profiles`: a row with the same id and email exists (created by the trigger).
3. Browser: Sign out from the top bar; you land on `/`. Visit `/app/settings` directly; you are redirected to `/sign-in`; sign in; you arrive at `/app/settings` and see your email.
4. Browser: sign in with a wrong password; the friendly error appears in the error area and a screen reader would announce it (the element has `aria-live="polite"`).
5. Browser: while signed in, visit `/sign-in`; you are sent to `/app`.
6. Browser: sign up a second time with the same email; the message is "There's already an account with this email. Sign in instead."
7. GitHub: the commit contains `src/hooks/useAuth.tsx`, `src/main.tsx`, `src/App.tsx` and the four pages, nothing under `supabase/`.

---

## H3 — Guided brief (nine questions, saved brief)

**Prerequisite:** H2 verified. The `campaigns` and `campaign_briefs` tables with RLS exist from `I0`.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H3: the guided brief runs on real state and is saved to Supabase. The smart-start AI call is NOT wired yet; for now the smart-start "Continue" behaves like "Skip" and shows all nine questions.

1. Create src/lib/brief.ts by pasting docs/campai-package/I-code-guide/src-snippets/src__lib__brief.ts unchanged. It exports QUESTIONS (the nine questions with the exact copy already in the shell), DEFAULT_CURRENCY, DEFAULT_MARKET, DEFAULT_DURATION_WEEKS, CAFE_EXAMPLE, todayIso, firstMondayOfNextMonth, endDateFor, BriefDraft, emptyDraft, FieldStatuses, allMissing, draftFromBriefCheck, questionsToAsk, questionLabel, validateDraft, toCampaignBrief and toBriefCheckRecord.

2. Create src/lib/campaigns.ts by pasting docs/campai-package/I-code-guide/src-snippets/src__lib__campaigns.ts unchanged. It holds every database read and write the app makes (campaign CRUD (create, read, update, delete), briefs, plan versions, calendar items, revisions, usage). Use only these functions for data access; never call supabase.from in a component.

3. Rework NewCampaign (/app/new) to use brief.ts:
   - State: draft = emptyDraft(), statuses = allMissing(), campaignId: string | null, and the list of questions = questionsToAsk(null).
   - The question components read label, helper, placeholder, examples and kind from QUESTIONS; delete the copies of that copy hardcoded in the shell.
   - On the first user action (smart-start Continue or Skip) call createCampaign() once, store its id, then show the questions. If /app/new is opened with ?campaign=<id>, reuse that id instead of creating a new row.
   - Each step validates with validateDraft(draft) and blocks Continue only on the current field's error, shown inline.
   - Budget step: number input bound to draft.budget_amount plus a currency Select (SGD, USD, EUR, GBP, AUD, INR, MYR, IDR) bound to draft.currency. Schedule step: date input bound to draft.start_date and a weeks Select 1–12 bound to draft.duration_weeks; show the computed end date with endDateFor as helper text.
   - Review screen: list all nine values from the draft; every row is "You told us" for now (statuses are all "missing" until H4). "Build my campaign" is renamed "Save and continue" for this change set: it runs validateDraft over everything, then upsertBrief(campaignId, toCampaignBrief(draft), toBriefCheckRecord({ usedAi: false, freeText: null, result: null, statuses, answered: keys of every question shown })), then renameCampaign(campaignId, draft.goal trimmed to 80 characters), then navigates to /app/campaigns/<campaignId>.
   - Errors from the save show in an inline ErrorState with Retry; the busy button reads "Saving…".

4. Dashboard: replace STUB_CAMPAIGNS with listCampaigns() loaded on mount (loading, empty and error states with Retry). Cards show title, status Badge, updated date; clicking opens /app/campaigns/<id>. Remove the temporary "Show empty state" toggle. Rename and Delete stay non-functional until H8.

5. Campaign page (/app/campaigns/:id): on mount call getCampaign(id) and getBrief(id). If getCampaign returns null show the not-found state. If status is "draft" and no brief exists, show "Finish your brief" linking to /app/new?campaign=<id>. If status is "draft" and a brief exists, show the saved brief as a read-only review (nine rows) with the button "Build my campaign", which for now still runs the stubbed 4-second generation and then shows the stubbed workspace. Everything else on the page is unchanged.

Done when: a signed-in user completes all nine questions, saves, sees the saved brief on the campaign page, and the dashboard lists the campaign with status Draft.

Do not change any other files.
```

**Verify**

1. Browser: New campaign → Continue (or Skip) → answer all nine questions with the café values → Save and continue. You land on `/app/campaigns/<uuid>` showing the nine saved values.
2. Supabase Dashboard → Table Editor → `campaigns`: one row with your `user_id`, title equal to your goal text, status `draft`. `campaign_briefs`: one row for that `campaign_id` with `budget_amount` 1500, `currency` SGD, `end_date` 27 days after `start_date`, and `brief_check.used_ai` = false.
3. Browser: dashboard lists the campaign with the Draft badge; a second account (sign out, sign up another email) sees an empty dashboard.
4. Browser: leave a budget of 0 and press Continue; the inline message "Enter a budget greater than zero." appears and the step does not advance. Pick a start date in the past; "Pick a start date after today." appears.
5. Browser: open `/app/new?campaign=<that uuid>` and save again; `campaign_briefs` still has one row for the campaign (upsert), `updated_at` changed.
6. Console: no errors. GitHub: the commit touches `src/lib/brief.ts`, `src/lib/campaigns.ts`, `src/pages/NewCampaign.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Campaign.tsx` and brief components only.

---

## H4 — Brief check / smart start

**Prerequisite:** H3 verified. `campaign-ai` is deployed and its secrets are set (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`, `AI_DAILY_LIMIT_PER_USER`). A quick `curl` test from E-supabase/setup-steps.md returned a `brief_check` result.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H4: smart start calls the real brief_check operation and asks only the questions we still need. It must fall back silently to all nine questions on any failure.

1. Create src/lib/api.ts by pasting docs/campai-package/I-code-guide/src-snippets/src__lib__api.ts unchanged. It exports AiClientError (code, message safe to show, status, requestId), newRequestId(), briefCheck(), generateCampaign() and reviseCampaign(). All three call the single Edge Function "campaign-ai" through supabase.functions.invoke, which attaches the signed-in user's token. Never call OpenAI or any other API (application programming interface) from the browser.

2. In NewCampaign, smart-start Continue now does, in order:
   a. Require at least 3 characters of text (inline message "Tell us a little more, even one sentence helps.").
   b. createCampaign() if there is no campaignId yet.
   c. Show the inline spinner "Reading your brief…" and call briefCheck({ campaignId, freeText, defaults: { today: todayIso(), currency: DEFAULT_CURRENCY, market: DEFAULT_MARKET } }).
   d. On success: const { draft, statuses } = draftFromBriefCheck(response.result); store the draft, statuses, response.result and the free text; questions = questionsToAsk(statuses). Use questionLabel(question, result) for each question heading, so the model's plain-language question appears when it has one.
   e. On ANY error (AiClientError of any code, a thrown exception, or a timeout) do not show an error. Set statuses = allMissing(), result = null, questions = questionsToAsk(null), keep the user's free text, and continue to the first question exactly as Skip does. Log nothing that includes the error body beyond console.warn("brief_check fallback", error.code).
   f. If questionsToAsk returns an empty list (everything stated), go straight to the review screen.

3. Question steps for fields whose status is "inferred" show the caption "We assumed this — change it if it's wrong." under the prefilled value; "missing" fields show the placeholder only. Track answered keys: every question shown counts as answered.

4. Review screen: when a result exists, show result.restatement as the opening paragraph and result.assumptions as a bulleted list titled "What we assumed". Badges per row: "You told us" when statuses[key] is "stated", "We assumed" when "inferred", and no badge when "missing" but answered. Save with toBriefCheckRecord({ usedAi: result !== null, freeText, result, statuses, answered }) so the record lands in campaign_briefs.brief_check.

5. Remove stubBriefCheck from src/lib/stub.ts and every import of it.

Done when: the café sentence produces six or fewer follow-up questions with prefilled defaults, the review shows the restatement and assumptions, and switching off the network (browser offline mode) before pressing Continue produces the full nine-question sequence with no error message.

Do not change any other files.
```

**Verify**

1. Browser: New campaign → type the café sentence → Continue. Within about 5 seconds you see the first follow-up question; goal, business and budget are not asked. Prefilled values show the "We assumed this" caption.
2. Browser → Network tab: one POST to `/functions/v1/campaign-ai` with status 200; the request body has `operation: "brief_check"` and a UUID `request_id`; the response contains `result.fields` and `usage`.
3. Supabase Dashboard → Table Editor → `ai_usage_events`: one new row with `operation` `brief_check`, `status` `success`, model equal to your `OPENAI_MODEL_LIGHT`, non-zero tokens and a small `estimated_cost_usd`.
4. Browser: finish the questions and save. `campaign_briefs.brief_check` for that campaign has `used_ai: true`, the `free_text`, the `result` object and `field_statuses`.
5. Fallback: DevTools → Network → set "Offline", type the sentence, Continue. The full nine questions appear with defaults; no error toast or message is shown. Set the network back online.
6. Fallback 2 (server error): in Supabase Dashboard → Edge Functions → Secrets, temporarily change `OPENAI_MODEL_LIGHT` to `not-a-model`, retry; you get all nine questions silently; `ai_usage_events` records a failed row. Restore the secret.
7. Console: no uncaught errors; at most one `console.warn` line during the fallback tests.

---

## H5 — AI Edge Function wiring: generation

**Prerequisite:** H4 verified. The `generate` operation has been tested once with `curl` (E-supabase/setup-steps.md) and completed in under 90 seconds.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H5: "Build my campaign" calls the real generate operation and the workspace shows the real plan.

1. Campaign page (/app/campaigns/:id): keep a request id in a ref, created once with newRequestId() from src/lib/api.ts. "Build my campaign" calls generateCampaign({ campaignId, requestId: ref.current }). Show the GenerationProgress screen while it runs. On success: set ref.current = newRequestId(), then reload the page's data (getCampaign, getBrief and getLatestPlan from src/lib/campaigns.ts) and render the workspace from getLatestPlan(id).plan instead of getStubPlan(). Show "Version <version>" from that row.

2. Staged progress for a real 30–90 second call. Advance the six existing messages on a timer: 0 s "Reading your brief", 8 s "Choosing who to target", 18 s "Shaping the message and the offer", 30 s "Picking channels and splitting the budget", 45 s "Writing content and the calendar", 65 s "Checking numbers and dates", and stay on the last one until the call returns. The progress bar moves to 90% over 75 seconds and never reaches 100% before the response. Keep the note "This usually takes 30 to 90 seconds." and the aria-live="polite" status line. Remove the "Simulate error" link.

3. Error handling. Catch AiClientError and render the generation error state (heading "We couldn't build your campaign", the error's message, which is always safe to show) with actions by code:
   - "duplicate_request": the earlier attempt finished or is finishing; set a new request id and reload the data instead of showing an error.
   - "daily_limit_reached": message plus text "Your daily AI allowance resets at midnight UTC." and a link "See your usage" to /app/settings. No Retry button.
   - "refused": message plus button "Back to brief" (to /app/new?campaign=<id>). No Retry.
   - "timeout", "network", "unknown": buttons Retry and Back to dashboard. Retry reuses the SAME request id, so a call that actually completed on the server is replayed rather than billed twice.
   - every other code ("rate_limited", "incomplete_output", "schema_invalid", "upstream_error", "brief_missing", "internal_error", "invalid_request", "not_found", "unauthenticated"): buttons Retry and Back to dashboard. Retry uses a NEW request id, because the server already recorded that attempt as failed.

4. Status handling on load. Read campaign.status: "draft" with a brief → review plus Build; "draft" without a brief → "Finish your brief"; "generating" → show GenerationProgress and poll getCampaign every 5 seconds until the status changes (this covers a page reload mid-generation); "ready" → workspace; "error" → the error state showing campaign.last_error with Retry (new request id).

5. Double clicks: disable Build while a call is in flight. The request id design already makes a repeated click safe.

6. Do not touch the calendar, section editing or revision behaviour yet; they still work on the local copy of the plan. Do not remove src/lib/stub.ts yet.

Done when: the café brief builds a real campaign in under 90 seconds, the workspace shows the generated title and sections, and the dashboard card shows status Ready.

Do not change any other files.
```

**Verify**

1. Browser: open the draft café campaign, Build my campaign. Progress messages advance; within 90 seconds the workspace renders with a generated title (not "Weekday Regulars…" unless the model chose the same words) and twelve sections filled.
2. Network tab: one POST to `campaign-ai` with `operation: "generate"`; the response has `plan_version` 1, `plan`, `flags` and `usage`.
3. Supabase Dashboard: `campaigns.status` = `ready`, `current_plan_version` = 1; `campaign_plans` has one row with `source` `generated`; `calendar_items` has between 6 and 20 rows for the campaign; `ai_usage_events` has a `generate` row with `status` `success` and `latency_ms` under 90000.
4. Browser: reload the workspace page; it renders the same plan from the database (no stub title).
5. Duplicate test: click Build, then immediately reload the page and click Build again if it is offered. You end up on the ready workspace with exactly one `generate` success row in the ledger, possibly plus one `duplicate_request` row.
6. Error rendering: in Supabase Dashboard set `AI_DAILY_LIMIT_PER_USER` to `1`, create a new draft and Build; you see the daily-limit state with the Settings link and no Retry. Restore the value to `25`.
7. Console: no errors. GitHub commit touches `src/pages/Campaign.tsx` and the brief/GenerationProgress components only.

---

## H6 — Campaign rendering from the database

**Prerequisite:** H5 verified. `src/lib/validation.ts` exists (copied by Claude Code in `I0`).

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H6: one campaign state provider feeds the whole workspace, with validation on load.

1. Create src/hooks/useCampaign.tsx by pasting docs/campai-package/I-code-guide/src-snippets/src__hooks__useCampaign.tsx unchanged. It already implements the H5 retry rule (the request id is kept only after a timeout or network error and rotated after any server-reported failure). The file exports CampaignProvider({ campaignId }) and useCampaign(), which returns campaign, brief, plan, planVersion, flags, calendar, loading, saving, error, notFound, reload, generating, generate, saveSection, editCalendarItem, createCalendarItem, removeCalendarItem, lockedSections, toggleLock, revising, proposal, requestRevision, applyProposal, discardProposal.

2. In src/App.tsx render the /app/campaigns/:id route as <CampaignProvider campaignId={id}><Campaign /></CampaignProvider>, reading id from useParams. Wrap that element in a second <ErrorBoundary homeHref="/app">.

3. Rewrite the Campaign page to read everything from useCampaign(): loading → full-page Spinner "Loading your campaign…"; notFound → the not-found state; error with no plan → ErrorState with Retry calling reload; campaign.status "draft" → the review plus Build calling generate; "generating" or generating === true → GenerationProgress (keep the H5 timers and the 5-second polling through reload); "error" → the H5 error state; "ready" → the workspace. Delete the ad-hoc getCampaign/getBrief/getLatestPlan calls added in H3 and H5 from this page.

4. Validate the plan before rendering. Import CampaignPlanSchema from src/lib/validation.ts (import only; never edit that file). const parsed = CampaignPlanSchema.safeParse(plan). On failure render an ErrorState titled "This campaign's data looks damaged" with the text "We can rebuild it from your brief." and a button "Rebuild" that calls generate(). On success pass parsed.data to the section components.

5. All twelve section components receive the real plan (parsed.data). Remove every import of getStubPlan from the workspace and section components. The calendar section renders the plan's calendar_items read-only for now (H7 switches it to the database rows).

6. FlagsNotice renders flags from useCampaign() (each ValidationFlag.message on its own line, with the ref in muted text when present). Hide it when the list is empty.

7. PageHeader shows plan.title, the status Badge from campaign.status and "Version {planVersion}". Keep the local "Save" button, revision bar and section editors functionally as they are; they are wired in H8 and H9.

Done when: the workspace renders entirely from the database through useCampaign(), a reload keeps the same content, and a deliberately broken plan shows the Rebuild state instead of a crash.

Do not change any other files.
```

**Verify**

1. Browser: open the ready café campaign; all twelve sections show the generated content; the header shows Version 1 and a Ready badge. Console clean.
2. Browser: sign in as the second account and open the first account's campaign URL; you see the not-found state (RLS hides the row), not an error.
3. Damaged-data test: Supabase Dashboard → SQL Editor, run `update campaign_plans set plan = plan - 'kpis' where campaign_id = '<id>' and version = 1;` Reload the workspace: the "This campaign's data looks damaged" state appears with Rebuild. Press Rebuild: a new generation runs, version becomes 2, sections render. (If you prefer not to spend a call, restore the row by re-running the H5 `generate` later.)
4. Browser: if a flag exists (for example `budget_rescaled`), FlagsNotice shows its message above the sections; otherwise it is absent. Check `campaign_plans.flags` in the dashboard to know which to expect.
5. Search the `src/` tree in Bolt for `getStubPlan`: no matches remain in `pages/` or `components/workspace/`.
6. GitHub commit touches `src/hooks/useCampaign.tsx`, `src/App.tsx`, `src/pages/Campaign.tsx` and workspace components.

---

## H7 — Editable calendar on `calendar_items`

**Prerequisite:** H6 verified.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H7: the calendar edits real rows through the database helper functions. Every save writes a new plan version on the server.

1. CalendarTable reads `calendar` (CalendarItemRow[]) from useCampaign(), not plan.calendar_items. Sort by date, then sort_order. Columns and the below-md card layout stay as built. Show the count in the section heading ("Calendar · 12 items").

2. CalendarItemDrawer edits one CalendarItemRow. On Save build a patch containing only the fields that changed (compare with the original row) and call editCalendarItem(row.id, patch) from useCampaign(). The helper calls the database function update_calendar_item through supabase.rpc (RPC = Remote Procedure Call); the provider reloads the plan and rows afterwards, so the table and "Version N" update by themselves. While saving is true, disable Save, Cancel and Delete and show "Saving…". On error show the message inside the drawer with a Retry that resubmits the same patch; keep the drawer open.

3. "Add item" opens the same drawer empty with defaults: date = plan.timeline.start_date, week_number = 1, status "planned", ad_script null, every other text field "". Compute week_number from the chosen date with date-fns differenceInCalendarDays from plan.timeline.start_date, divided by 7, floored, plus 1; recompute whenever the date changes, but let the user override it. Require date, channel, format and title before Save (inline messages "Add a date.", "Add a channel.", "Add a format.", "Add a title."). Save calls createCalendarItem(item).

4. Delete inside the drawer opens the confirm Modal "Remove this calendar item? This can't be undone." with Remove and Cancel. Remove calls removeCalendarItem(row.id), closes the drawer on success and shows a Toast "Item removed".

5. Dates: the date input constrains min to plan.timeline.start_date and max to plan.timeline.end_date, with helper text "Between <start> and <end>". Status Select offers planned, in_progress, done, skipped with the labels Planned, In progress, Done, Skipped.

6. Remove all local-state calendar editing from the shell, including any copy of the items kept in component state.

7. After every successful save show a Toast "Saved · Version N" using planVersion from useCampaign().

Done when: editing, adding and deleting items changes the rows in Supabase, each action increments the plan version, and a reload shows the same calendar.

Do not change any other files.
```

**Verify**

1. Browser: edit an item's title, Save. The row updates; the header version increments by one; Toast "Saved · Version 2".
2. Supabase Dashboard: `calendar_items` shows the new title; `campaign_plans` has a new row with `source` `edited` whose `plan.calendar_items` contains the same title (rows and plan JSON stay in sync).
3. Browser: Add item with a date inside the campaign, channel, format, title; Save. It appears in date order; `calendar_items` has one more row; version increments again.
4. Browser: delete that item through the confirm dialog; it disappears; version increments; the row is gone from `calendar_items`.
5. Browser: try to save an item with an empty title; the inline message blocks the save and no request is sent (Network tab).
6. Browser: reload the workspace; the calendar matches the database. Second account: cannot open the campaign at all (as in H6).
7. Console clean. GitHub commit touches `src/components/calendar/*` and, if needed, `src/components/ui/Toast.tsx` only.

---

## H8 — Save / reopen and section editing

**Prerequisite:** H7 verified.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H8: section edits are saved as plan versions; campaigns can be reopened, renamed and deleted from the dashboard.

1. SectionEditor saves through useCampaign().saveSection(patch). The patch contains only the plan fields that belong to the section being edited, using SECTION_FIELDS from src/types/campaign.ts (for example messaging → { messaging, offer }; assumptions → { assumptions, risks, next_actions }). Array fields are edited one line per item and split on newlines, trimming and dropping empty lines. Number fields (budget line amounts, channel budget_share_percent, ad script duration_seconds) use number inputs and are saved as numbers. Nullable fields (offer.terms, calendar ad_script) save an empty input as null. Do not let the editor change calendar_items; that section is edited only through the calendar drawer.

2. Budget section editor: when line item amounts change, show the computed total under the list and a warning line "Line items add up to <sum>, your budget is <total>." when they differ; still allow saving (the plan is the user's).

3. Overview section editor edits title, executive_summary, business_objective and timeline (start_date, end_date and each phase's name, dates and focus). Saving title also calls renameCampaign(campaignId, title) so the dashboard card matches.

4. Header: remove the local "Save" button. Replace it with a status text: "Saving…" while saving, otherwise "All changes saved · Version {planVersion}". Every edit saves immediately; there is no separate save step.

5. Dashboard: cards open the workspace (already true). Rename: an inline text field on the card (Enter saves, Escape cancels) calling renameCampaign then refreshing the list. Delete: the confirm Modal "Delete this campaign? This can't be undone." now calls deleteCampaign(id), refreshes the list and shows a Toast "Campaign deleted". Show "Deleting…" on the button while it runs; on error show the message in the modal with Retry.

6. Workspace top bar: "Back to dashboard" stays. Add "Rename" to the header overflow menu using the same inline field.

7. Optional Should-have, only if everything above works: an unsaved-change warning. When a SectionEditor or the calendar drawer has edits that are not saved, register a beforeunload handler that asks the browser to confirm leaving, and show a Modal "You have unsaved edits. Leave without saving?" when the user clicks another section or Back to dashboard. Remove the handler when the editor closes.

Done when: editing any section persists across a reload and increments the version, renaming updates the dashboard, and deleting removes the campaign and its rows.

Do not change any other files.
```

**Verify**

1. Browser: edit Messaging and Offer, change the core message, Save. Header shows "All changes saved · Version N+1". Reload: the new text is there.
2. Supabase Dashboard: `campaign_plans` latest row has `source` `edited` and the new `messaging.core_message`; `campaigns.current_plan_version` equals that version.
3. Browser: edit Overview, change the title; the header and the dashboard card show the new title; `campaigns.title` matches.
4. Browser: edit Budget line amounts so they no longer sum to the total; the warning line appears; Save still works and the plan stores the numbers as numbers (check the JSON in the dashboard: no quotes around amounts).
5. Browser: on the dashboard rename a campaign inline; Escape cancels, Enter saves. Delete a test campaign; it disappears; in Supabase, its `campaign_briefs`, `campaign_plans` and `calendar_items` rows are gone (cascade) while `ai_usage_events` rows remain with `campaign_id` null.
6. Browser: sign out, sign in, open the campaign from the dashboard: everything is as saved (the "reopen" step of the must-have flow).
7. Console clean. GitHub commit touches the workspace section components, `SectionEditor.tsx`, `PageHeader.tsx`, `Dashboard.tsx`.

---

## H9 — Revision Apply/Discard with locks

**Prerequisite:** H8 verified. The `revise` operation has been tested once with `curl`.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H9: plain-language revisions through the real revise operation, with locked sections and Apply/Discard.

1. ReviseBar uses useCampaign(): the input is validated to 3–500 characters (inline message "Describe the change in a few words, up to 500 characters."); "Revise" calls requestRevision(instruction). While revising is true show the spinner "Revising your campaign…" with the note "This usually takes 30 to 90 seconds." and disable the input, the button and the lock toggles. The "Lock sections" toggle reveals twelve checkboxes, one per SECTION_KEYS entry labelled with SECTION_LABELS, bound to lockedSections and toggleLock. Caption: "Locked sections won't change." Remove the stubbed proposal code entirely.

2. Errors: when useCampaign().error is set right after a revision attempt, show it inline under the bar with a Retry that resubmits the same instruction. For code "daily_limit_reached" add the link "See your usage" to /app/settings and no Retry; for "refused" show the message and no Retry.

3. ProposalDiff renders when proposal is not null, above the sections and below FlagsNotice:
   - Top: proposal.change_summary as a paragraph, then a Badge per key in proposal.changed_sections using SECTION_LABELS.
   - For each changed section, list the fields from SECTION_FIELDS[key] whose value differs between plan and proposal.proposed_plan (compare with JSON.stringify), showing the current value on the left and the proposed value on the right (stacked below md), each rendered as readable text: strings as paragraphs, string arrays as bullet lists, objects and arrays of objects as a compact definition list (key: value per line, nested one level). Calendar changes: show counts only ("Calendar: 12 items → 14 items") plus the titles of added and removed items.
   - Locked sections appear at the end in muted text as "Unchanged (locked): <labels>".
   - Buttons: primary "Apply changes" → applyProposal(); secondary "Discard" → discardProposal(). Disable both while saving. After Apply show Toast "Revision applied · Version N" (planVersion updates through the provider); after Discard show Toast "Revision discarded".
   - Clear lockedSections after Apply or Discard so the next revision starts unlocked.

4. While a proposal is open, disable ReviseBar with the caption "Apply or discard the current proposal first." Section editors and the calendar drawer are also disabled while a proposal is open, so the base plan cannot change under the proposal.

5. Rendering rule: the sections keep showing the CURRENT plan while a proposal is open. Only ProposalDiff shows proposed values.

Done when: "Make it suitable for younger customers" returns a proposal within 90 seconds, locked sections are listed as unchanged and are identical after Apply, Apply increments the version and updates the sections, and Discard leaves everything as it was.

Do not change any other files.
```

**Verify**

1. Browser: lock "Budget" and "Calendar", enter "Make it suitable for younger customers", Revise. Within 90 seconds ProposalDiff appears with a change summary and changed-section badges; Budget and Calendar are listed under "Unchanged (locked)".
2. Supabase Dashboard: `campaign_revisions` has a row with `status` `proposed`, your `locked_sections`, `changed_sections` and `proposed_plan`; `ai_usage_events` has a `revise` success row.
3. Browser: Apply changes. Toast shows the new version; sections update; `campaign_revisions.status` = `applied`, `after_plan_version` set; `campaign_plans` latest row has `source` `revised`; the budget line items and calendar rows are byte-identical to before (compare in the dashboard).
4. Browser: run a second revision, then Discard. `campaign_revisions.status` = `discarded`; no new plan version; the sections did not change.
5. Browser: while a proposal is open, the ReviseBar, the section Edit buttons and the calendar drawer are disabled with the caption shown.
6. Browser: enter two characters and press Revise; the inline validation blocks it with no network request.
7. Console clean. GitHub commit touches `src/components/revision/*` and the workspace page only.

---

## H10 — Usage ledger and Settings summary

**Prerequisite:** H9 verified (at least one `brief_check`, `generate` and `revise` row exist in the ledger).

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H10: the Settings page shows the real AI usage summary, the visible proof that AI cost is measurable.

1. Settings loads getUsageSummary() and listRecentUsage(20) from src/lib/campaigns.ts on mount, with a loading Spinner, an ErrorState with Retry, and an empty state "No AI calls yet." when total_calls is 0.

2. The "AI usage" Card shows, as labelled figures with captions: Calls (total_calls, with "successful_calls succeeded · failed_calls failed" underneath); Calls today (calls_today, caption "of 25 per day, the default daily limit"); Tokens (total_tokens, caption "input_tokens in · cached_input_tokens cached · output_tokens out"); Estimated cost (estimated_cost_usd formatted as US$ with four decimals, caption "Estimated from list prices in USD (United States dollars) at the time of each call"). Format thousands with toLocaleString().

3. "Recent activity" table below the card, from listRecentUsage: time (date-fns format "d MMM HH:mm"), operation (brief_check → "Brief check", generate → "Generate", revise → "Revise"), model, status as a Badge (success green, everything else in the warning or danger state colour), total_tokens, estimated cost (four decimals), latency in seconds with one decimal. Below md render each row as a compact Card. Caption under the table: "Every attempt is recorded, including failures."

4. Add an "AI usage" link to the AppShell top bar's Settings icon tooltip (accessible name "Settings and AI usage").

5. Daily cap rendering everywhere: create a tiny shared component DailyLimitNotice (in src/components/ui) that renders the message from an AiClientError with code "daily_limit_reached" plus the text "Your daily AI allowance resets at midnight UTC (Coordinated Universal Time)." and the link "See your usage" to /app/settings. Use it in the generation error state (H5) and under the ReviseBar (H9) in place of the ad-hoc text added there.

6. Keep the account block: email, "Sign out". Add a muted line "Signed in with email and password."

Done when: Settings shows figures that match the ledger table in Supabase and the recent activity list shows the last calls newest first.

Do not change any other files.
```

**Verify**

1. Browser: open `/app/settings`. Calls, Calls today, Tokens and Estimated cost show non-zero numbers. Recent activity lists your calls newest first with status badges.
2. Supabase Dashboard → Authentication → Users: copy your user id. SQL Editor: `select count(*), sum(total_tokens), sum(estimated_cost_usd) from ai_usage_events where user_id = '<your id>';` The three figures match the Settings card (cost to four decimals).
3. Browser: the second account's Settings shows only its own calls (RLS on the ledger).
4. Browser: force the daily cap (set `AI_DAILY_LIMIT_PER_USER` to `1`, attempt a revision) and confirm DailyLimitNotice appears under the ReviseBar with the Settings link; Settings shows the failed attempt with status `daily_limit_reached`. Restore the secret to `25`.
5. Browser at 375 px: the activity rows render as cards with no horizontal scroll.
6. Console clean. GitHub commit touches `src/pages/Settings.tsx`, `src/components/ui/DailyLimitNotice.tsx`, the H5 error state and `ReviseBar.tsx`.

---

## H11 — Responsiveness and accessibility pass

**Prerequisite:** H10 verified. Run this only after the café scenario has passed end to end at least once.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H11: an accessibility and responsiveness pass. No new features, no new libraries, no behaviour changes.

1. Focus: every interactive element shows the token focus ring (shadow-focus) on :focus-visible, including cards that act as links, table row actions, badges that are buttons, and the lock checkboxes. Remove any outline-none that is not paired with a focus-visible style.

2. Labels: every input, select and textarea has a visible <label> with htmlFor, or an aria-label where a visible label is impossible (icon buttons: "Open menu", "Sign out", "Settings and AI usage", "Edit calendar item: <title>"). Error messages are linked with aria-describedby and the input gets aria-invalid="true".

3. Live regions: the generation status line, the revision status, toasts, the auth error areas and "Saving… / All changes saved" use aria-live="polite" (role="status"). Use aria-live="assertive" (role="alert") only for the generation and revision error states.

4. Dialogs: Modal and CalendarItemDrawer have role="dialog", aria-modal="true", aria-labelledby pointing at their heading, trap Tab inside, close on Escape, and return focus to the element that opened them. The overflow menu on cards uses a button with aria-haspopup="menu" and aria-expanded, and arrow keys move between items.

5. Workspace navigation: at lg and above a <nav aria-label="Campaign sections"> list; below lg a horizontally scrollable tab strip with role="tablist", each item role="tab" with aria-selected, arrow-key movement between tabs, and the active tab scrolled into view on load. The section panel has role="tabpanel" and a heading at the top so screen readers land on the section name.

6. Calendar: below md each item renders as a Card with the date as the heading, channel and format as a caption, status Badge, and an Edit button. The drawer becomes a full-screen sheet below md with a sticky header (title, Close) and a sticky footer (Save, Cancel, Delete).

7. Reduced motion: wrap every transition and the progress-bar animation in a motion-safe: variant, or read prefers-reduced-motion in CSS and set transition durations to 0.

8. Colour contrast: check every text and border pairing against the tokens; if any secondary text sits on surface-hover or accent-soft with less than 4.5:1 contrast, switch it to ink or ink-secondary on surface. Do not introduce new colours.

9. Layout: no horizontal page scroll at 375, 768, 1024 and 1280 px on any route. Tables that must be wide (channels, budget, KPIs (key performance indicators), recent activity) scroll inside their own container with a visible edge, never the page. Touch targets are at least 40 by 40 pixels on mobile.

10. Landmarks and headings: one <main> per page, one h1 per page, headings in order (h1 → h2 → h3) without skipping levels; the top bar is a <header>, the ReviseBar is a <footer role="contentinfo"> or a <section aria-label="Revise">.

11. Page titles: set document.title per route ("campAI", "Sign in · campAI", "Dashboard · campAI", "<campaign title> · campAI", "Settings · campAI", "Page not found · campAI") with a small effect in each page; no library.

Done when: the whole café flow can be completed with the keyboard alone, a screen reader announces status changes and dialog titles, and no route scrolls horizontally at the four widths.

Do not change any other files.
```

**Verify**

1. Keyboard only: from `/`, sign in, create a campaign, answer questions, build, edit a section, open and close the calendar drawer, request and apply a revision, sign out. Focus is visible at every step and never disappears behind a dialog.
2. Screen reader (Windows Narrator or macOS VoiceOver): opening the calendar drawer announces its title; the generation status changes are announced without moving focus; toasts are announced.
3. Browser DevTools → Lighthouse → Accessibility on `/app`, the workspace and Settings: score 95 or higher, no "contrast" or "label" failures.
4. Device toolbar at 375, 768, 1024, 1280 px: no horizontal page scroll on any route; the tab strip appears below 1024 px; calendar cards below 768 px.
5. Operating system "Reduce motion" enabled: transitions and the progress bar animation stop; layout unaffected.
6. Browser tab titles change per route.
7. `package.json` unchanged. Console clean. GitHub commit touches components and pages only.

---

## H12 — Demo data and dashboard polish

**Prerequisite:** H11 verified. Claude Code has created the demo user `demo@campai.app` in Supabase Authentication and applied `E-supabase/seed.sql` (pricing rows plus the café campaign for the demo user).

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H12: dashboard polish for the demo and three template chips on smart start. Do not seed any data from the frontend; the demo campaign already exists in the database.

1. Dashboard status labels. Map campaign.status to a Badge label and colour: draft → "Draft" (ink-secondary on surface), generating → "Building…" (state-info), ready → "Ready" (state-success), error → "Needs attention" (state-danger). Add a second line on each card: "Updated <relative time>" using date-fns formatDistanceToNow with addSuffix, and for ready campaigns "Version <current_plan_version>". Sort is already newest-updated first.

2. Dashboard header: "Campaigns" as h1 with the count ("3 campaigns"), the "New campaign" primary button, and for an empty list the existing empty state. Cards with status "error" show an inline "Retry build" link to the workspace, which lands on the H5 error state with Retry.

3. Demo account behaviour needs no code: signing in as the seeded demo user must list the café campaign "Weekday Regulars: 4 Weeks to Busier Mornings" as Ready and open it. If the workspace shows anything other than the seeded plan, do not patch data in the frontend; report it.

4. Smart start template chips (Should-have). Under the textarea add three chips labelled "Café", "Online store", "Local service". Clicking one fills the textarea (replacing its content) with, respectively:
   - CAFE_EXAMPLE from src/lib/brief.ts.
   - "I sell handmade candles online. I want to sell out our new autumn collection. My budget is US$800. I want to start in two weeks."
   - "I run a mobile dog-grooming service in Melbourne. I want 30 new bookings. My budget is A$1,200. I want to start next month."
   Chips are buttons with type="button", visible focus, and aria-pressed reflecting the currently applied template. The helper text stays; add "Or start from an example:" above the chips.

5. Landing page: replace the three columns' body copy with one sentence each that matches the real product: "Say it in your own words" → "One or two sentences. No marketing terms needed."; "Answer only what we need" → "We ask about what we couldn't work out, one question at a time."; "Get a complete, editable plan" → "Audience, message, offer, channels, calendar, copy, budget and KPIs (key performance indicators), ready to edit."

6. Not-found page: add the campaign case. When the workspace shows the not-found state, the copy reads "We can't find that campaign. It may have been deleted, or it belongs to another account." with the link "Go to dashboard".

Done when: the demo account opens the café campaign in two clicks, cards show clear status labels, and the three chips fill the smart-start box.

Do not change any other files.
```

**Verify**

1. Browser: sign out; sign in as `demo@campai.app` with the team's demo password. The dashboard shows the café campaign with the Ready badge and "Version 1"; opening it renders the seeded plan (title "Weekday Regulars: 4 Weeks to Busier Mornings", 12 calendar items).
2. Browser: New campaign; click each chip; the textarea content changes accordingly and the active chip shows as pressed. Continue with "Online store": brief check runs and the currency default in the budget step is USD if the model extracted it (otherwise SGD, which is acceptable).
3. Browser: a draft and a ready campaign show different badges; an error campaign (if you have one from H5 testing) shows "Needs attention" and "Retry build".
4. Browser: open `/app/campaigns/00000000-0000-0000-0000-000000000000`; the campaign not-found copy appears.
5. Supabase Dashboard: no new rows were created by the frontend beyond your own actions (the seed is untouched).
6. Console clean. GitHub commit touches `Dashboard.tsx`, `SmartStart.tsx`, `Landing.tsx`, `Campaign.tsx` (not-found copy) and `Badge.tsx`.

---

## H13 — Production cleanup

**Prerequisite:** H12 verified and the café scenario has passed twice in a row (Part K). Run this immediately before the final deployment on Bolt hosting.

```
Reminder: dependencies stay exactly react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react; add no packages; the browser may only have VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY); never add another VITE_ variable or put any key in code; never write SQL or Edge Function code.

Change set H13: production cleanup. Remove scaffolding, confirm the security rules, and make sure the production build passes. No feature changes.

1. Delete src/lib/stub.ts and src/data/cafe-example.json, and remove every import or reference to them. If any component still depends on stub data, that is a bug: report the file instead of keeping the stub.

2. Remove development-only UI: the "Simulate error" link if any trace remains, the "Show empty state" toggle if any trace remains, and any placeholder numbers or the placeholder email on Settings.

3. Remove every console.log and console.debug in src/. Keep the console.error in src/components/ErrorBoundary.tsx and the single console.warn("brief_check fallback", …) in the smart-start fallback. Make sure no log line ever prints a session, token, key or the full error body from the Edge Function.

4. Environment check: search the whole project for "VITE_". The only names allowed are VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and VITE_SUPABASE_ANON_KEY (in src/lib/supabase.ts, src/vite-env.d.ts and .env.example only). Search for "sb_secret_", "service_role", "sk-" and "OPENAI": there must be no matches in src/ except the guard strings inside src/lib/supabase.ts. Confirm .gitignore lists .env and .env.local.

5. Confirm the error boundary wraps the whole app in src/main.tsx and the workspace route in src/App.tsx, and that the NotFound route ("*") exists and renders the not-found page with a link to /app (or / when signed out).

6. Run the production build (npm run build). Fix TypeScript errors only by correcting types in src/ files that Bolt owns; never edit src/types/campaign.ts or src/lib/validation.ts. If the build reports an unused import or variable, remove it. The build must finish with no errors; warnings about chunk size are acceptable.

7. Confirm package.json dependencies are exactly the scaffold's plus react-router-dom, @supabase/supabase-js, zod, date-fns, lucide-react. If anything else is present, remove it and the code that used it, then rebuild.

8. Set the production document title fallback to "campAI" in index.html and add a meta description: "campAI turns what you want into a complete, editable marketing campaign." No analytics scripts, no external fonts other than the existing Inter import if one exists.

9. Do not run or describe the deployed-bundle leak scan; the human runs it after deployment (Part K). Do not touch supabase/, docs/, CLAUDE.md or AGENTS.md.

Done when: the build passes, no stub code remains, no forbidden strings appear in src/, and every route still works in the preview.

Do not change any other files.
```

**Verify**

1. Bolt: the build log ends without errors. The preview renders `/`, `/app`, a workspace, `/app/settings` and an unknown path.
2. Bolt file tree: `src/lib/stub.ts` and `src/data/cafe-example.json` are gone; searching `src/` for `stub` returns nothing.
3. Bolt search: `VITE_` appears only with the three allowed names; `sb_secret_`, `service_role`, `sk-` and `OPENAI` appear only inside the guard strings of `src/lib/supabase.ts`.
4. Deploy on Bolt hosting (Part L). Then, from a terminal, run the leak scan against the live bundle: `curl -s https://<your-app>.bolt.host/ | grep -o 'assets/[^"]*\.js' | sort -u | while read f; do curl -s "https://<your-app>.bolt.host/$f"; done | grep -c -E 'sb_secret_|service_role|sk-[A-Za-z0-9]'` must print `0`. If it prints anything else, treat it as an incident (Troubleshooting T14): rotate the key, remove it, redeploy, rescan.
5. On the live URL: sign in as the demo user, open the café campaign, request one revision and discard it, open Settings; the ledger shows the call. Console clean.
6. GitHub: the final Bolt commit removes the stub files and touches no file under `supabase/` or `docs/`.
