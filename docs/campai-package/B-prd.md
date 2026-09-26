<!-- AI note: Part B concise PRD for campAI: goals, personas, user stories, functional and non-functional requirements, scope, acceptance criteria, risks. Each requirement is testable and names the table, SQL function, or operation it depends on.
     Owner: Claude Code (docs). Bolt never edits this; humans read it. -->

# B-prd.md — Part B: Concise PRD (Product Requirements Document)

Acronyms: PRD = Product Requirements Document; AI = Artificial Intelligence; MVP = Minimum Viable Product; KPI = Key Performance Indicator; RLS = Row Level Security; CRUD = Create, Read, Update, Delete; UX = User Experience; UI = User Interface; API = Application Programming Interface; JSON = JavaScript Object Notation; JSONB = Postgres's binary JSON column type; SQL = Structured Query Language; WCAG = Web Content Accessibility Guidelines; CTA = call to action; ISO = International Organization for Standardization; UUID = Universally Unique Identifier; CORS = Cross-Origin Resource Sharing; SGD = Singapore dollars; USD = United States dollars; CLI = Command-Line Interface; HTTP = Hypertext Transfer Protocol; CSV = Comma-Separated Values; PDF = Portable Document Format; REST = Representational State Transfer.

Contract files referenced, never restated: `F-ai/types.ts`, `F-ai/campaign.schema.json`, `F-ai/brief-check.schema.json`, `F-ai/prompts.md`.

## 1. Goals

1. **Prove the promise.** A non-marketer types one sentence and receives a complete, credible, editable campaign in under two minutes.
2. **Ship the must-have flow first.** Sign up, brief, generate, review, edit, revise, save, reopen, delete, all working on the deployed link before any optional feature.
3. **Keep AI narrow and measurable.** Exactly three operations (`brief_check`, `generate`, `revise`) behind one Edge Function, a ledger row per attempt, a visible cost summary.
4. **Keep data private.** RLS on every user-owned table; a second account cannot see the first account's campaigns through the API.
5. **Finish inside the team's limits.** Three days, two to four people, weekly usage limits on Claude and Bolt, Supabase free plan, OpenAI prepaid credit.

## 2. Users

| Persona | Situation | Goal | Needs from campAI |
|---|---|---|---|
| **Mei, café owner (primary)** | One café in Singapore, quiet weekdays, S$1,500, Instagram and a small email list, no marketing training | More weekday customers next month | Who to target, what to say and offer, where, what to post each day, how to split S$1,500 |
| **Arjun, online store founder** | Small online product range, some ad experience, no strategy method | Launch a new line and lift repeat purchases | A defensible positioning and channel mix, plus email and paid-social copy to paste into his tools |
| **Dana, local service provider** | Home services, word of mouth, budget under S$1,000 | Fill next month's open slots in one neighbourhood | A local-first plan with a simple offer, short calendar, and KPIs she can track by hand |

All three get the deck's UX principles: ask, do not teach; one question at a time; never a blank page; recommend, do not overwhelm; everything editable.

## 3. User stories

1. As a new visitor, I want to sign up with email and password so that I can start immediately without a confirmation email.
2. As a returning user, I want to sign in and land on my dashboard so that I can pick up where I left off.
3. As a first-time user, I want the empty dashboard to show one clear "New campaign" action and an example so that I never face a blank page.
4. As a user, I want to describe what I want in one free-text box with the café sentence as an example so that I can begin in my own words.
5. As a user, I want the app to work out what it already knows from my sentence, and still ask me the nine plain questions if that check is unavailable, so that I answer only what is needed and can always reach the build step.
6. As a user, I want each follow-up question one at a time, prefilled with a suggestion and examples, so that I am never stuck.
7. As a user, I want a brief review with assumed values clearly marked so that I can correct wrong guesses before building.
8. As a user, I want one button to build my campaign and staged progress messages so that I know it is working during the 30 to 90 second wait.
9. As a user, I want to review my campaign section by section so that I understand exactly what to do.
10. As a user, I want to edit any section in plain form fields so that the plan fits my business without waiting for AI.
11. As a user, I want to edit, add, and delete individual calendar items so that the calendar matches my real week.
12. As a user, I want to ask for a revision in plain language ("Make it suitable for younger customers") so that I can steer the plan without redoing the brief.
13. As a user, I want to lock sections I have approved so that a revision never overwrites them.
14. As a user, I want to see what a revision changed and choose Apply or Discard so that nothing changes without my consent.
15. As a user, I want every edit and applied revision saved as a new version so that I can close the browser and reopen later without losing work.
16. As a user, I want to delete a campaign I no longer need so that my dashboard stays tidy.
17. As a user, I want a settings page with my email, sign out, and my AI usage (calls, tokens, estimated cost) so that I can see what the AI work costs.
18. As a user, I want plain-language errors with a Retry button when generation or revision fails, and a clear notice when I have hit the daily AI limit, so that I know what happened and what to do.

## 4. Functional requirements

Each is testable in `K-testing.md`.

### 4.1 Authentication

- **FR-1.** Email and password sign-up and sign-in through Supabase Auth; "Confirm email" off in the Supabase Dashboard for the hackathon, with the re-enable step documented in `E-supabase/setup-steps.md`.
- **FR-2.** Sign-up creates one `profiles` row via a trigger on `auth.users`; no frontend code writes to `profiles`.
- **FR-3.** `/app`, `/app/new`, `/app/campaigns/:id`, and `/app/settings` require a session (`RequireAuth`); unauthenticated visitors go to `/sign-in`; signed-in visitors of `/sign-in` or `/sign-up` go to `/app`.
- **FR-4.** Sign out clears the session and returns to the landing page.
- **FR-5.** The browser holds only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY` if Bolt injected that name); no other `VITE_` variable exists.

### 4.2 Brief

- **FR-6.** Smart start shows one free-text box with the placeholder "I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month." and one primary action.
- **FR-7.** Submitting creates a `campaigns` row with status `draft` (if none exists) and calls `brief_check` with the free text, a client-generated `request_id` (UUID), and `defaults` (today's ISO date, currency, market; SGD and Singapore for the café).
- **FR-8.** `brief_check` returns, for each of the nine fields in `BRIEF_FIELD_ORDER`, a status (`stated`, `inferred`, `missing`), a suggested default, and a plain-language question, plus a restatement and assumptions (`BriefCheckResult`). The Edge Function validates dates as future ISO dates; an invalid start date becomes the first Monday of next month.
- **FR-9.** Follow-up screens appear only for `inferred` or `missing` fields, one per screen, in the fixed order goal, business, product or service, audience clues, budget and currency, market, start date and duration, existing assets, tone and constraints; each prefilled, with examples and a progress indicator. `stated` fields are not asked.
- **FR-10.** If `brief_check` fails, times out (20 seconds), or fails validation, the app shows all nine questions with code-side defaults and no AI, without an error message.
- **FR-11.** The review screen lists all nine fields, marks inferred values "We assumed this — change it if it's wrong.", and allows changes.
- **FR-12.** Confirming upserts one `campaign_briefs` row per campaign with the typed `CampaignBrief` columns (`end_date` derived as `start_date + duration_weeks × 7 − 1 day`) and a `brief_check` JSONB holding the `BriefCheckRecord`.
- **FR-13.** Tone and constraints is the only optional field; all others must be non-empty and the budget positive before "Build my campaign" is enabled.

### 4.3 Generation

- **FR-14.** "Build my campaign" calls `generate` with `campaign_id` and a fresh `request_id`; the Edge Function reads the brief from `campaign_briefs`, never from the browser.
- **FR-15.** `campaigns.status` is set to `generating` before the OpenAI call and to `ready` on success or `error` (with `last_error`) on failure.
- **FR-16.** The call uses the Responses API with `text.format = { type: "json_schema", strict: true }` and `F-ai/campaign.schema.json`, model `OPENAI_MODEL` (default `gpt-6-sol`), `store: false`, `max_output_tokens` from `OUTPUT_BOUNDS`, no streaming, 110-second timeout.
- **FR-17.** Output is validated with Zod (`CampaignPlanSchema`); one retry on failure within the same request; a second failure returns `schema_invalid`.
- **FR-18.** Normalisation runs in code in the order of `F-ai/prompts.md` section 2.3 (budget scaling, channel shares, timeline, calendar date clamping with `week_number` recomputed, count flags at under 6 or over 20, pillar and channel name matching, creative brief due dates, UUID ids); each change produces a `ValidationFlag` stored with the plan.
- **FR-19.** The normalised plan is saved through `save_plan_version(campaign_id, plan, 'generated', flags)`, which inserts the `campaign_plans` version, rebuilds `calendar_items`, and sets `campaigns.current_plan_version` and status `ready` in one transaction.
- **FR-20.** While `generating`, the workspace route shows staged progress messages timed for a 30 to 90 second wait; on `error` it shows the safe message and a Retry button reusing the same `request_id`.
- **FR-21.** The plan respects the bounds: 6 to 20 calendar items (target 12), at most 6 channels, 5 content pillars, 3 ad scripts, 4 creative briefs, 8 KPIs.

### 4.4 Workspace

- **FR-22.** `/app/campaigns/:id` provides navigation for exactly twelve sections, in order: Overview, Audience, Strategy, Messaging and Offer, Channels, Content Ideas, Calendar, Copy and Ad Scripts, Creative Briefs, Budget, KPIs, Assumptions and Risks (`SECTION_KEYS`, `SECTION_FIELDS`, `SECTION_LABELS`); the selected section lives in `?section=`.
- **FR-23.** Every section renders from the latest `campaign_plans` row and shows validation flags as a "We adjusted this" notice.
- **FR-24.** Every field in a section is editable through plain form fields (no AI); saving calls `save_plan_version(campaign_id, patched_plan, 'edited', flags)`, which writes a new version and bumps `current_plan_version`.
- **FR-25.** The Budget section shows line items summing to `budget.total` in the brief's currency; editing re-validates the total in the browser and shows any difference before save.
- **FR-26.** A stored plan that fails `CampaignPlanSchema.safeParse` on load shows "This campaign's data looks damaged" with a Rebuild button (calls `generate`).
- **FR-27.** The dashboard lists the user's `campaigns` (title, status, updated date), offers "New campaign", opens on click, and deletes with confirmation; an empty list shows the empty state.

### 4.5 Calendar

- **FR-28.** The Calendar section lists `calendar_items` rows ordered by date then `sort_order` (date, week, channel, format, title, status), with the full item (objective, pillar, hook, body, CTA, creative direction, ad script, notes) in an edit drawer.
- **FR-29.** Editing calls `update_calendar_item(item_id, patch)`, which updates the row and writes a new `campaign_plans` version with `source = 'edited'`.
- **FR-30.** Adding calls `add_calendar_item(campaign_id, item)`, which inserts the row with a new UUID and writes a new plan version containing it.
- **FR-31.** Deleting calls `delete_calendar_item(item_id)`, which removes the row and writes a new plan version without it.
- **FR-32.** Status is `planned`, `in_progress`, `done`, or `skipped`, changeable inline; dates outside the campaign period are rejected in the browser. The plan JSON is the source of truth; `calendar_items` is its editable projection.

### 4.6 Revision

- **FR-33.** The workspace offers a revision bar with an instruction (3 to 500 characters) and a lock toggle per section.
- **FR-34.** Submitting calls `revise` with `campaign_id`, `request_id`, `instruction`, `locked_sections`; the Edge Function reads the latest plan from `campaign_plans`.
- **FR-35.** The Edge Function validates and normalises the proposal (as FR-17 and FR-18), restores every field of every locked section from the current plan, recomputes `changed_sections` by deep comparison, and inserts a `campaign_revisions` row with status `proposed`, `before_plan_version`, `locked_sections`, `changed_sections`, `change_summary`, `proposed_plan`. The working plan is untouched.
- **FR-36.** The browser shows `change_summary`, highlights `changed_sections` with a before/after view per changed section, and offers Apply and Discard.
- **FR-37.** Apply calls `apply_revision(revision_id)`, which in one transaction inserts a new `campaign_plans` version with `source = 'revised'`, rebuilds `calendar_items`, sets `after_plan_version`, marks the revision `applied`, and bumps `current_plan_version`.
- **FR-38.** Discard sets the revision status to `discarded`; nothing else changes.
- **FR-39.** A locked section's fields are identical before and after Apply, and its key never appears in the `changed_sections` shown to the user.

### 4.7 Persistence and versioning

- **FR-40.** All plan writes go through `save_plan_version`, `update_calendar_item`, `add_calendar_item`, `delete_calendar_item`, or `apply_revision`; no frontend code inserts into `campaign_plans` or `calendar_items` directly.
- **FR-41.** `campaign_plans.version` increases by one per write; `source` is `generated`, `edited`, or `revised`; `campaigns.current_plan_version` equals the highest version.
- **FR-42.** Reopening loads `campaigns`, `campaign_briefs`, the plan row at `current_plan_version`, and `calendar_items`, rendering within 2 seconds on a normal connection.
- **FR-43.** Deleting a campaign hard-deletes the `campaigns` row and cascades to `campaign_briefs`, `campaign_plans`, `calendar_items`, `campaign_revisions`; `ai_usage_events` rows keep `campaign_id` set to null.
- **FR-44.** Every user-owned row carries `user_id` defaulting to `auth.uid()`, `created_at`, and `updated_at` maintained by trigger where applicable.

### 4.8 Usage and limits

- **FR-45.** Every Edge Function call, including failures, writes one `ai_usage_events` row (`user_id`, `campaign_id`, `operation`, `request_id`, `model`, `input_tokens`, `cached_input_tokens`, `output_tokens`, `total_tokens`, `estimated_cost_usd`, `currency = 'USD'`, `status`, `error_code`, `latency_ms`, `response` on success), inserted before the OpenAI call and updated after.
- **FR-46.** `estimated_cost_usd` is computed from the active `ai_model_pricing` row (input, cached input, output price per million tokens, `verified_on`); never hardcoded. A missing row yields cost 0 and `;pricing_missing` on `error_code`.
- **FR-47.** A per-user daily cap of `AI_DAILY_LIMIT_PER_USER` (default 25) is enforced by counting the user's ledger rows for the current UTC day; the call over the cap returns HTTP 429 `daily_limit_reached` and writes a ledger row with that status.
- **FR-48.** `ai_usage_events.request_id` is unique. A repeat with a stored successful response returns it with HTTP 200 and header `X-Campai-Replayed: true`; a repeat with any other status returns HTTP 409 `duplicate_request`.
- **FR-49.** Settings shows the user's email, sign out, and an AI usage summary (calls, tokens, estimated cost in USD, by operation) from `my_ai_usage_summary()`. The ledger is readable only by its owner; `ai_model_pricing` is readable by authenticated users and writable only by the service role.
- **FR-50.** At the cap, Build and Revise show "You've reached today's AI limit. It resets at midnight UTC." and are disabled; editing, saving, and reopening still work.

### 4.9 Errors

- **FR-51.** The Edge Function maps every outcome to a safe message and an `AiErrorCode` exactly as in `F-ai/prompts.md` section 4.2.
- **FR-52.** Exactly one automatic retry for `schema_invalid` and transient `upstream_error`; none for refusals, incomplete output, rate limits, or timeouts.
- **FR-53.** The browser never receives the OpenAI key, the Supabase secret key, raw OpenAI error bodies, stack traces, prompt text, or reasoning items; full details go to Edge Function logs in the Supabase Dashboard.
- **FR-54.** A campaign the caller does not own returns HTTP 404 from the Edge Function (RLS hides the row) and the not-found state in the app; unknown routes show the not-found page.
- **FR-55.** A React error boundary shows a recoverable error state with "Reload" instead of a blank page.

## 5. Non-functional requirements

- **NFR-1. Performance.** `generate` ≤ 90 seconds (target 45) on `gpt-6-sol`; `brief_check` ≤ 20 seconds on `gpt-6-luna`; `revise` ≤ 90 seconds; workspace open ≤ 2 seconds; section and calendar saves visible ≤ 1 second.
- **NFR-2. Cost.** A full campaign (`brief_check` + `generate`) ≤ US$0.20 on `gpt-6-sol` and ≤ US$0.02 on `gpt-6-luna`, measured from `ai_usage_events`; output bounded per FR-21. Build-time Claude and Bolt usage is weighted per block in `J-three-day-plan.md`.
- **NFR-3. Security.** RLS enabled on every user-owned table with owner-only select, insert, update, and delete policies, verified with two accounts through the API. Secrets (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_MODEL_LIGHT`, `AI_DAILY_LIMIT_PER_USER`) exist only as Supabase Edge Function secrets; none starts with `VITE_` or `SUPABASE_`. The deployed bundle has zero matches for `sb_secret_`, `service_role`, `sk-`. The Edge Function requires a session (401 otherwise) and answers CORS preflight.
- **NFR-4. Accessibility.** WCAG 2.1 AA basics: text contrast ≥ 4.5:1 on the near-black theme, visible focus states everywhere, full keyboard operation of brief, workspace navigation, calendar drawer, and Apply/Discard, labels bound to inputs, live-region announcements for loading and errors, no meaning by colour alone.
- **NFR-5. Responsiveness.** Landing, auth, dashboard, brief, and settings work from 360 px width with no horizontal scroll; workspace and calendar are optimised for ≥ 1024 px and stack with a section picker below that.
- **NFR-6. Reliability.** Intake works without AI (nine-question fallback); at most one retry per request; normalisation instead of retries for budget and date problems; idempotent by `request_id`; generation state survives reload because status lives in `campaigns`.
- **NFR-7. Observability.** One ledger row per AI attempt (status, latency, tokens, cost); Edge Function logs carry full error details keyed by `request_id`; Settings is the user view, the Supabase Dashboard is the team view.
- **NFR-8. Maintainability.** `F-ai/` contracts are canonical and copied byte for byte; no component redeclares a type; Bolt owns `src/`, Claude Code owns `supabase/`, contracts, and docs; one change set per prompt or session.
- **NFR-9. Compatibility.** Current Chrome, Edge, Firefox, Safari on desktop; Safari and Chrome on mobile for non-workspace screens.

## 6. In-scope features

1. Email and password authentication with instant sign-up.
2. Dashboard with empty state, create, open, delete.
3. Smart start with `brief_check`, targeted follow-ups, nine-question fallback.
4. Brief review with stated versus assumed marking.
5. One-call secure generation through `campaign-ai` with validation and normalisation.
6. Twelve-section workspace with editable fields and flag notices.
7. Editable calendar with add, edit, delete, status.
8. Plain-language revision with locks, change summary, Apply/Discard.
9. Plan versioning and reopen.
10. Usage ledger, pricing table, daily cap, idempotency, Settings summary.
11. Loading, empty, error, retry, not-found states.
12. Responsive, accessible UI on the tokens in `C-ux-spec.md`.
13. Should-haves only after the café scenario passes twice: duplication, export, dashboard status labels, three seed briefs, unsaved-change warning, calendar filters.

## 7. Out-of-scope features

Direct social publishing; live campaign analytics; complex CRM integrations; enterprise permissions; full project management; multiple autonomous agents; numerous external APIs; advanced reporting; ad-platform execution; real-time collaboration; streaming generation; image generation. Also excluded by pinned decisions: chat agents, tool calling, any fourth AI operation, state-management or component libraries, legacy `anon` and `service_role` keys.

## 8. Acceptance criteria

Scenario sentence used throughout: **"I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month."** Defaults: currency SGD, market Singapore, 4 weeks from the first Monday of next month, assets Instagram account and a small email list.

1. **AC-1 Sign-up.** A new email and password reaches the empty dashboard within 5 seconds with no confirmation step; a `profiles` row exists.
2. **AC-2 Smart start.** The café sentence yields a `brief_check` result where goal, business, budget, and schedule are `stated` or `inferred`, and at most five follow-up screens appear.
3. **AC-3 Fallback.** With the Edge Function unreachable, the same entry shows all nine questions with defaults, no error message, and reaches the review.
4. **AC-4 Review.** All nine fields shown; inferred ones carry "We assumed this — change it if it's wrong."; changing one and confirming updates `campaign_briefs`.
5. **AC-5 Generation time.** "Build my campaign" reaches the workspace in ≤ 90 seconds by `latency_ms` and stopwatch; median ≤ 60 seconds over ten runs.
6. **AC-6 Schema pass rate.** In ten consecutive café generations, at least nine succeed without the retry (status `success`, no `schema_invalid` in `error_code`).
7. **AC-7 Cost.** For each run, `estimated_cost_usd` for `brief_check` plus `generate` ≤ US$0.20; Settings shows the totals.
8. **AC-8 Completeness.** The plan explains who to target, what to say, what offer, where, what content, how to allocate S$1,500, how long, and what success looks like; all twelve sections non-empty; line items sum to 1,500 SGD; all dates inside the 4-week period; counts within FR-21.
9. **AC-9 Edit.** Editing the core message creates plan version 2 with `source = 'edited'`, visible after a full reload.
10. **AC-10 Calendar CRUD.** Editing a title, adding an item, and deleting one each create a new plan version, update `calendar_items`, and survive reload.
11. **AC-11 Revision with locks.** Locking Budget and requesting "Make it suitable for younger customers" returns a proposal whose Budget fields equal the current plan, whose `changed_sections` excludes `budget` and includes `audience` or `messaging`, with a one-paragraph `change_summary`.
12. **AC-12 Apply and Discard.** Apply creates a version with `source = 'revised'` and marks the revision `applied`; Discard leaves the version unchanged and marks it `discarded`.
13. **AC-13 Reopen.** Sign out, sign in, open from the dashboard: latest version and all calendar items shown.
14. **AC-14 Delete.** Zero rows remain in `campaign_briefs`, `campaign_plans`, `calendar_items`, `campaign_revisions` for that id; `ai_usage_events` rows remain with `campaign_id` null.
15. **AC-15 RLS isolation.** With a second account's token, direct REST reads of `campaigns`, `campaign_briefs`, `campaign_plans`, `calendar_items`, `campaign_revisions`, `ai_usage_events` return zero rows for the first account's campaign; an update changes zero rows; the Edge Function returns 404 for that `campaign_id`.
16. **AC-16 Cap and idempotency.** With `AI_DAILY_LIMIT_PER_USER = 2` on a test project, the third call returns 429 `daily_limit_reached`; re-sending a successful `generate` with the same `request_id` returns the same plan with `X-Campai-Replayed: true` and no new OpenAI call.
17. **AC-17 Leak scan.** The deployed `*.bolt.host` bundle has zero matches for `sb_secret_`, `service_role`, `sk-`.
18. **AC-18 Error states.** Forcing a timeout on a test deploy shows "This is taking longer than usual. Please try again." with Retry reusing the `request_id`; the ledger row has status `timeout`.
19. **AC-19 Accessibility and responsiveness.** The must-have flow completes by keyboard only; no text below 4.5:1 contrast; no horizontal scroll at 360 px on brief and dashboard.
20. **AC-20 Twice in a row.** AC-1 to AC-13 pass on the deployed link twice consecutively, logged in `K-testing.md`, before any Should-have work starts.

## 9. Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation | Owner tool |
|---|---|---|---|---|---|
| R1 | OpenAI latency pushes `generate` past 90 s or the Edge Function limit | Medium | High | Bounded output, 110 s abort, staged progress UI; if repeated, lower the calendar bound to 6–12 before any architectural change (T7, T9) | Claude Code; Supabase Dashboard logs |
| R2 | Schema failures below the 9/10 target | Medium | High | Strict-mode schema verified in `F-ai/`; one retry quoting the first error; normalisation in code for arithmetic and dates; café example validated (T6) | Claude Code |
| R3 | Cost blowout through the public demo link | Medium | High | Daily cap (default 25), `request_id` idempotency, ledger per attempt, `gpt-6-luna` for `brief_check`, prepaid credit; check OpenAI Dashboard usage each morning | Supabase Dashboard secrets; OpenAI Dashboard |
| R4 | `withSupabase` (`@supabase/server`) immaturity blocks the Edge Function | Medium | Medium | 45-minute time box, then paste `I-code-guide/edge-function-legacy/index.ts`; record in `CLAUDE.md` (T4) | Claude Code; Supabase CLI |
| R5 | Bolt adds libraries outside the pinned list | High | Medium | Pinned list restated in every Bolt prompt and `bolt-project-instructions.md`; revert on sight (T13) | Bolt; GitHub |
| R6 | Merge conflicts between Bolt and Claude Code | Medium | Medium | Fixed file ownership; `git pull` at each Claude Code session start; `src/` edits only while Bolt idle; resolve on GitHub (T12) | GitHub; Claude Code |
| R7 | Weekly usage limits on Claude or Bolt run out mid-build | Medium | High | Lighter model by default, one session per change set, `/clear` between sets, usage weights and cut order in `J-three-day-plan.md` (T16) | Claude Code; Bolt |
| R8 | Email confirmation left on, blocking live sign-up | Low | High | Turn off on Day 1 in Supabase Dashboard, Authentication, Providers, Email; smoke-test sign-up on the deployed link on Day 3 | Supabase Dashboard |
| R9 | Secret leaks through a `VITE_` variable or a commit | Low | Critical | `VITE_` rule in `CLAUDE.md` and Bolt instructions; env files git-ignored; leak scan before submission; rotate immediately if found (T5, T14) | Claude Code; Supabase Dashboard; OpenAI Dashboard |
| R10 | Scope creep (chat agent, extra operations, integrations) | High | High | Three pinned operations; Should-haves gated behind two café passes; "one useful campaign beats ten unfinished features" in every prompt | Humans; Claude Code |
| R11 | Demo-day network slow or blocked | Medium | High | Demo the seeded café campaign (reopen path) first, live generation second; Loom recorded in advance; phone hotspot ready | Supabase seed; Bolt hosting |
| R12 | Seed data missing (no pricing rows, no demo campaign) | Low | High | Run `E-supabase/seed.sql` after every `supabase db push` on production; `pricing_missing` surfaces in Settings if pricing is empty | Supabase CLI |
| R13 | Date and timezone drift (past start date, wrong week numbers, cap reset hour) | Medium | Medium | Client sends `today`; Edge Function validates future dates and defaults to the first Monday of next month; dates clamped and `week_number` recomputed; cap counted by UTC day and the message says so (T11) | Claude Code |
| R14 | Bolt's Supabase integration unavailable on the team's plan | Medium | Low | CLI fallback in `E-supabase/setup-steps.md`; publishable key and URL pasted into Bolt settings | Supabase CLI; Bolt |
| R15 | Teammate without terminal experience blocked on CLI steps | Medium | Medium | One designated CLI teammate; Dashboard alternatives documented; commands in execution order in `I-code-guide/index.md` | Terminal; Supabase Dashboard |
