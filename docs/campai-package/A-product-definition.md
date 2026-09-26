<!-- AI note: Part A product definition for campAI: one-liner, user, pains, 5 Whys, problem statement, success metric, must-have flow, MoSCoW scope, assumptions. It is the "why and what" the rest of the package builds.
     Owner: Claude Code (docs). Bolt never edits this; humans read it. -->

# A-product-definition.md — Part A: Product definition

Acronyms: AI = Artificial Intelligence; MVP = Minimum Viable Product; MoSCoW = Must, Should, Could, Won't; KPI = Key Performance Indicator; RLS = Row Level Security; CRUD = Create, Read, Update, Delete; UX = User Experience; UI = User Interface; API = Application Programming Interface; ISO = International Organization for Standardization; UUID = Universally Unique Identifier; SGD = Singapore dollars; CLI = Command-Line Interface; PDF = Portable Document Format; CSV = Comma-Separated Values.

## 1. Product one-liner

**campAI is a Campaign Operating System: a small-business owner types what they want in plain words, answers only the questions we truly need, and gets one complete, editable, credible marketing campaign (audience, message, offer, channels, content, calendar, copy, budget, KPIs) in under two minutes.**

Category: Campaign Operating System. Core promise: anyone can run a strategically sound campaign without being a strategist. Transformation: from "I need more customers" to "Here is exactly what to do." Principle: professional intelligence underneath, radical simplicity on top.

## 2. Primary user

Small-business owners, founders, and non-marketers who run their own promotion. The reference persona is a café owner in Singapore with S$1,500 to spend, an Instagram account, a small email list, and no marketing training. They have a clear goal, a rough budget, a few assets, and little time. They lack marketing vocabulary, a method for turning a goal into a plan, and a calendar that says what to do on which day. Secondary personas are in `B-prd.md`.

## 3. Context

1. Small-business marketing advice is abundant but fragmented; none of it yields one coherent, dated plan tied to the owner's budget.
2. General AI chat tools write copy on request but leave the structuring work (audience, positioning, channels, budget, calendar, KPIs) to a user who does not know what to ask for: the blank page the deck's UX principles forbid.
3. Agencies solve it at a price and turnaround that exclude a S$1,500 campaign.
4. This is a three-day hackathon build by two to four people with limited engineering experience, using Bolt (frontend), Supabase (backend), and the OpenAI Responses API (three AI operations). Scope must fit what that team can finish, test twice end to end, and demo live.

## 4. Top three pains

1. **Complexity, not ambition.** The owner knows the goal ("more weekday customers") but faces ten linked decisions at once: audience, strategy, positioning, messaging, channels, content, budget, media, timeline, KPIs. Each depends on the others, so there is nowhere to start.
2. **Blank-page paralysis and jargon.** Existing tools demand marketing terms (segments, funnels, hooks) before they help. Without those words the owner stalls or posts and prays.
3. **No executable output.** Good advice arrives as prose. The owner needs a dated calendar with the caption, offer, channel, and budget for each action, and a way to change one item without redoing everything.

## 5. The 5 Whys

Start: **small-business owners do not run structured campaigns, even when they want more customers and have money to spend.**

1. **Why?** Turning a goal into a campaign needs many dependent decisions (who, what to say, what offer, where, when, how much, how to measure), and the owner does not know where to begin.
2. **Why not?** Every available tool either assumes marketing knowledge (templates, ad managers, courses) or hands out fragments on demand (a chatbot writing one caption) instead of guiding the owner from goal to plan in order.
3. **Why do tools behave that way?** They are built around the inputs the tool wants (segment, objective type, bid strategy) rather than the language the owner already uses ("I run a café, I want more weekday customers, I have S$1,500").
4. **Why are they built around their own inputs?** The reasoning that converts plain language into a coherent strategy (inferring the audience, choosing the offer, splitting the budget, sequencing a calendar) historically required a human strategist, so software left that step to the user.
5. **Why has that step stayed with the human?** Until recently there was no affordable way to do professional-grade strategic reasoning on demand, and even now nobody has packaged that reasoning behind an interface that asks one plain question at a time, gives one strong recommendation, and keeps the output editable.

**Root cause:** the strategic reasoning between "goal" and "plan" has never been packaged as a product that speaks the owner's language and produces an executable, editable result.

## 6. Final problem statement

Small-business owners who want more customers cannot convert a plain goal and a modest budget into a coherent, credible, dated campaign, because the strategic reasoning in between has never been packaged behind an interface that asks only what it needs, recommends rather than overwhelms, and produces a plan they can edit and act on. campAI packages that reasoning: three server-side AI operations behind a guided, editable workspace.

## 7. Success metric

The hackathon test is the café scenario (deck slide 10). The primary metric is binary: **the must-have flow passes the café scenario twice in a row on the deployed link.** These targets make "passes" precise and are tested in `K-testing.md`:

| # | Target | How measured |
|---|---|---|
| 1 | Generation ≤ 90 seconds (target 45) on `gpt-6-sol` | `latency_ms` on the `generate` row in `ai_usage_events`; stopwatch from "Build my campaign" to workspace |
| 2 | AI cost per full campaign (`brief_check` + `generate`) ≤ US$0.20 on `gpt-6-sol`, ≤ US$0.02 on `gpt-6-luna` | Sum of `estimated_cost_usd` for the two rows, priced from `ai_model_pricing`; shown in Settings |
| 3 | Schema validation passes first time in ≥ 9 of 10 runs | `generate` rows with status `success` and no retry across 10 consecutive café runs |
| 4 | Café scenario passes twice consecutively before any Should-have work | Two signed-off ticks on the scenario test in `K-testing.md` |
| 5 | A second account cannot read, list, or modify the first account's campaign, verified via the API | RLS isolation test in `K-testing.md` with two accounts, direct REST and Edge Function calls |

Secondary metric: Settings shows calls, tokens, and estimated cost from the ledger, the visible proof of the deck's "AI cost measurable" criterion.

## 8. Must-have flow (all fourteen steps, condensed)

1. **Sign up or sign in** with email and password (Supabase Auth; "Confirm email" off for the hackathon).
2. **Start a new campaign** from the dashboard or its empty state.
3. **Smart start.** One free-text box, "Tell us what you want, in your own words", with the café sentence as placeholder.
4. **One `brief_check` call** on the light model extracts the nine brief fields, each with value, status (`stated`, `inferred`, `missing`), suggested default, and plain-language question, plus a restatement and assumptions. Today's date and default currency and market are sent; dates return in ISO format and code validates them.
5. **Follow-up questions only where needed.** One field per screen, only for `inferred` or `missing` fields, prefilled and with examples, in fixed order: goal, business, product or service, audience clues, budget and currency, market, start date and duration, existing assets, tone and constraints (optional). **Fallback:** if `brief_check` fails, times out, or returns invalid output, the app silently shows all nine questions with defaults and no AI.
6. **Brief review.** Inferred values marked "We assumed this — change it if it's wrong."
7. **Build my campaign.** One button.
8. **One `generate` call** returns the complete structured campaign. The Edge Function validates it, normalises budget, channel shares, timeline, calendar dates, and counts in code, saves plan version 1, and rebuilds the calendar rows.
9. **Review** the twelve workspace sections: Overview, Audience, Strategy, Messaging and Offer, Channels, Content Ideas, Calendar, Copy and Ad Scripts, Creative Briefs, Budget, KPIs, Assumptions and Risks.
10. **Edit** sections and calendar items with plain form fields; no AI; each save writes a new plan version.
11. **Request a revision** in plain language ("Make it suitable for younger customers"), optionally locking sections.
12. **One `revise` call** receives the current plan, instruction, and locked sections; returns the full updated plan plus `changed_sections` and a one-paragraph `change_summary`. The app shows what changed and offers **Apply** or **Discard**. Locked sections are restored in code.
13. **Save.** Every edit and applied revision is a new plan version; `current_plan_version` increments.
14. **Reopen** from the dashboard; the latest version loads.

Exactly three AI operations exist: `brief_check`, `generate`, `revise`. No chat agent, no autonomous loops, no tool calling. This flow must work reliably before any optional feature is attempted.

## 9. MoSCoW scope

### Must have (the MVP)

1. Authentication (email and password).
2. Guided brief (smart start, follow-up questions, nine-question fallback).
3. Brief check, validation, and review.
4. Secure AI generation through the single `campaign-ai` Edge Function.
5. Structured workspace with the twelve sections.
6. Editable calendar, item by item.
7. Editing generated fields in every section.
8. Save and reopen with plan versioning.
9. Full CRUD for campaigns and calendar items.
10. Plain-language revision with Apply/Discard and locked sections.
11. Basic budget allocation that sums to the brief's total.
12. KPIs with targets and measurement without paid tools.
13. AI usage tracking (ledger) and per-user daily cap.
14. Responsive, accessible UI; workspace optimised for laptop.
15. Complete loading, empty, error, retry, and not-found states.

### Should have (only after the café scenario passes twice)

1. Campaign duplication.
2. Printable, PDF, or CSV export.
3. Campaign status labels on the dashboard.
4. Three seed briefs as templates (café, online store, local service).
5. Unsaved-change warning.
6. Calendar filters (channel, week, status).

### Could have (cheap after the Should-haves, never before)

1. Dark/light theme toggle (tokens already support it; near-black stays the default).
2. Keyboard shortcuts for moving between the twelve sections.
3. "Duplicate as template" from an existing campaign.
4. Copy-to-clipboard on copy and ad-script blocks.

### Won't have (out of scope)

Direct social publishing; live campaign analytics; complex CRM integrations; enterprise permissions; full project management; multiple autonomous agents; numerous external APIs; advanced reporting; ad-platform execution; real-time collaboration; streaming generation; image generation.

**One useful campaign beats ten unfinished features.**

## 10. Explicit assumptions

From the master prompt:

1. The deck and the Product Building Playbook are authorities on positioning and process; the master prompt (v2, 26 September 2026) wins on scope and technical decisions.
2. Pinned platform decisions: OpenAI Responses API with strict Structured Outputs; `gpt-6-sol` for `generate` and `revise`, `gpt-6-luna` for `brief_check`; Supabase publishable and secret keys, not legacy `anon` and `service_role`; `withSupabase` Edge Function pattern with a 45-minute fallback to the legacy pattern.
3. Three AI operations behind one Edge Function; pricing in `ai_model_pricing`; a ledger row for every attempt.
4. Frontend dependencies limited to `react-router-dom`, `@supabase/supabase-js`, `zod`, `date-fns`, `lucide-react`; no state-management or component library.
5. Email confirmation off for the hackathon, turned back on afterwards (`E-supabase/setup-steps.md`).
6. Bolt's native Supabase integration may be unavailable (Pro or Teams plan); fallback is the Supabase CLI on one laptop plus environment variables pasted into Bolt.

Team and environment:

7. Team of two to four with limited engineering experience; one teammate runs the terminal and Supabase CLI, the others use Bolt, the Supabase Dashboard, GitHub, and the OpenAI Dashboard.
8. Claude and Bolt are on plans with weekly usage limits; usage is budgeted like time (must-have flow, café twice, then Should-haves; see `J-three-day-plan.md`).
9. Supabase free plan; Edge Function wall-clock limit 150 seconds, so the `generate` timeout is 110 seconds.
10. OpenAI runs on prepaid credit; the daily cap (`AI_DAILY_LIMIT_PER_USER`, default 25) protects it on the public demo link.
11. Café defaults: currency SGD, market Singapore, 4 weeks from the first Monday of next month, assets Instagram account and a small email list.
12. Dates are ISO calendar dates (YYYY-MM-DD); the daily cap counts ledger rows by UTC day.
13. The live demo uses a seeded demo account with one saved café campaign, so it does not depend on a fresh generation under conference Wi-Fi.
