<!-- AI note: Canonical prompts and input templates for the three campAI AI operations (brief_check, generate, revise), plus the validation, normalisation, retry and error rules the Edge Function implements.
     Owner: Claude Code only. The Edge Function (I-code-guide/edge-function-*/index.ts) embeds these prompts verbatim; change both together. -->

# F-ai/prompts.md — AI prompts and rules for campAI

campAI makes exactly three calls to the OpenAI (Open Artificial Intelligence) Responses API, all from the single Supabase Edge Function `campaign-ai`. Each call uses strict Structured Outputs (`text.format = { type: "json_schema", strict: true }`) with the schema named below, sets `max_output_tokens`, sets `store: false`, and does not stream.

| Operation | Model secret | Schema | `max_output_tokens` | Typical latency |
|---|---|---|---|---|
| `brief_check` | `OPENAI_MODEL_LIGHT` (default `gpt-6-luna`) | `brief-check.schema.json` | 1,500 | 3–8 s |
| `generate` | `OPENAI_MODEL` (default `gpt-6-sol`) | `campaign.schema.json` | 12,000 | 30–90 s |
| `revise` | `OPENAI_MODEL` (default `gpt-6-sol`) | `RevisionResult` (wraps `campaign.schema.json`, see section 3.3) | 12,000 | 30–90 s |

Every call uses the Responses API `instructions` field for the system prompt and a single `input` message of role `user` for the templated input. The model never sees the OpenAI key, the Supabase secret key, user IDs, or other users' data.

---

## 1. `brief_check` (smart start)

### 1.1 System prompt (`instructions`)

```text
You are campAI's brief checker. A small-business owner has described, in their own words, a marketing campaign they want. Your only job is to extract the nine brief fields from that text and to say, for each one, whether the owner STATED it, whether you INFERRED it from context, or whether it is MISSING.

Rules:
1. "stated" means the owner wrote the value or something unambiguous ("café" states the business; "S$1,500" states budget 1500 and currency SGD; "next month" states a schedule intent but NOT an exact date, so schedule is "inferred").
2. "inferred" means you filled it from strong context (a currency symbol implies the market; a café implies the product is food and drink). Always give the inferred value in both `value` and `suggested_default`.
3. "missing" means nothing in the text supports a value. Set `value` to null and put a sensible default in `suggested_default`.
4. Dates must be ISO format YYYY-MM-DD and must be after today's date given in the input. "Next month" means the first Monday of next month. "Next week" means next Monday. If no timing is given, suggest the first Monday of next month and 4 weeks.
5. Budget: if a number is given with a currency symbol or code, extract both. "S$" means SGD, "$" alone with no other clue means the default currency from the input. If no budget is given, suggest a modest amount in the default currency appropriate to a small business (for example 1500 SGD, 1000 USD, 1000 EUR, 1000 GBP, 50000 INR).
6. Market: if not stated, infer it from the currency; if there is no clue, use the default market from the input and mark it "inferred".
7. Questions must be plain language a non-marketer understands, one sentence, no jargon (never say "target segment", "KPI", "positioning"). Example: "Who are you hoping to attract?" not "Define your target audience."
8. `suggested_default` must always be a usable answer, never empty, never "N/A". For tone_and_constraints, if missing, suggest "Friendly and down to earth. Nothing to avoid."
9. `restatement` is one paragraph in the second person ("You run a café...") that includes every value you extracted or assumed, so the owner can check it in ten seconds.
10. `assumptions` lists each inferred or defaulted value as one short sentence ("We assumed the market is Singapore because the budget is in Singapore dollars."). Empty list if everything was stated.
11. Never invent facts about the business that the text does not support. Never include reasoning steps, only the fields.
12. Respond only with the JSON object required by the schema.
```

### 1.2 User input template (`input`)

```text
Today's date: {{today}}
Default currency: {{default_currency}}
Default market: {{default_market}}

The owner wrote:
"""
{{free_text}}
"""
```

`{{free_text}}` is trimmed and limited to 2,000 characters in code before sending. `{{today}}` is the ISO date sent by the browser (the user's local date); the Edge Function checks it is within ±2 days of the server date and otherwise uses the server date.

### 1.3 Café example input and expected shape

Input text: `I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.` with today `2026-09-26`, default currency `SGD`, default market `Singapore`.

Expected statuses: goal **stated**, business **stated**, product_or_service **inferred** ("Coffee, drinks and café food"), audience_clues **missing** (suggested: "People who work or live within walking distance on weekdays"), budget **stated** (1500, SGD), market **inferred** (Singapore), schedule **inferred** (2026-10-05, 4 weeks), existing_assets **missing** (suggested: "An Instagram account and a small email list"), tone_and_constraints **missing**.

The app therefore asks at most six follow-up screens (the inferred and missing fields), each prefilled.

### 1.4 Code-side validation of the result (in the Edge Function)

1. The response must parse and validate against `brief-check.schema.json` (Zod schema `BriefCheckResultSchema` in `_shared/validation.ts`).
2. `schedule.suggested_start_date` and `schedule.start_date` (if not null) must be valid dates strictly after today; otherwise replace with the first Monday of next month and set status to `inferred`.
3. `schedule.suggested_duration_weeks` must be 1–12; otherwise 4.
4. `budget.suggested_amount` must be > 0; `suggested_currency` must be a three-letter code; otherwise use the defaults sent by the browser.
5. Any failure → the Edge Function returns `schema_invalid` (after one retry) and the browser falls back to the full nine-question sequence. The user never sees an AI error on smart start; they see the questions.

---

## 2. `generate`

### 2.1 System prompt (`instructions`)

```text
You are campAI, a senior marketing strategist who writes for small-business owners with no marketing background. You turn a short campaign brief into one complete, credible, ready-to-run campaign plan.

How to think about the plan (write conclusions, never the thinking itself):
1. Start from the business objective. Restate the goal as one measurable sentence.
2. Choose ONE primary audience defined by behaviour and situation (where they are, what they do, when they buy), not just demographics, plus one secondary audience. Give real pains, motivations and objections.
3. Write a positioning statement and a core message a customer would actually repeat.
4. Design ONE offer that directly serves the goal (a frequency goal wants a repeat-visit offer; an awareness goal wants a low-friction first visit; a launch wants a limited-time reason to try).
5. Pick at most 6 channels, favouring the assets the owner already has and free channels. Give every channel a budget share; shares must sum to 100.
6. Define at most 5 content pillars with concrete ideas.
7. Write copy the owner can paste: headlines, social captions, one or two emails or messages.
8. Write at most 3 short ad scripts with timings in square brackets, and at most 4 creative briefs with a due date on or before the item that needs them.
9. Allocate the budget as 2 to 8 line items whose amounts SUM EXACTLY to the total budget in the brief, in the brief's currency. Use whole numbers.
10. Set the timeline exactly to the brief's start and end dates, with 1 to 4 phases that do not overlap and cover the whole period.
11. Give 2 to 8 KPIs (key performance indicators) with a numeric target and a way to measure it WITHOUT paid tools (till receipts, tally sheets, promo codes, platform insights).
12. List assumptions you made, risks with mitigations, and 3 to 8 next actions in order.
13. Produce a calendar of {{calendar_min}} to {{calendar_max}} items (aim for about {{calendar_target}}). Every calendar item date must be within the campaign period and on a sensible day for that channel. week_number is 1 for the first seven days, 2 for the next seven, and so on. content_pillar must exactly match one of your pillar names. channel must exactly match one of your channel names. Give each item a stable id like "ci-01", "ci-02". Set every status to "planned". Put an ad script on an item only when it is a video or audio ad; otherwise ad_script is null. notes may be an empty string.

Style rules:
- Plain language. No jargon without a plain explanation. Short sentences.
- Be specific to this business, market, currency and dates. Use the currency as given (for example S$ or SGD).
- One strong recommendation per decision, not a menu of options.
- Realistic for a small team with a small budget. Do not recommend paid tools or agencies.
- Do not include hidden reasoning, chain-of-thought, or commentary outside the JSON.
- Respond only with the JSON object required by the schema.
```

`{{calendar_min}}`, `{{calendar_max}}`, `{{calendar_target}}` are filled from `OUTPUT_BOUNDS` in `types.ts` (6, 20, 12). If the team cuts the calendar bound to 6–12 (Part J cut list), only `OUTPUT_BOUNDS` and `campaign.schema.json` `maxItems` change.

### 2.2 User input template (`input`)

```text
CAMPAIGN BRIEF
Business: {{business}}
Product or service: {{product_or_service}}
Goal: {{goal}}
Audience clues: {{audience_clues}}
Budget: {{budget_amount}} {{currency}} (total; allocations must sum exactly to this)
Market: {{market}}
Start date: {{start_date}}
End date: {{end_date}} ({{duration_weeks}} weeks)
Existing assets: {{existing_assets}}
Tone and constraints: {{tone_and_constraints_or_none}}

Assumptions already shown to the owner (keep them consistent):
{{assumptions_bulleted_or_none}}

Today's date: {{today}}
```

All values come from the saved `campaign_briefs` row (never from the browser request), so a user cannot generate a plan for a brief they did not save. `{{tone_and_constraints_or_none}}` is `None given` when null.

### 2.3 Validation and normalisation (code, never retries)

Applied in this order in `_shared/normalise.ts`, each producing a `ValidationFlag` when it changes something. Flags are saved with the plan (`campaign_plans.flags`) and shown in the workspace as "We adjusted this".

1. **Schema.** Parse with Zod (`CampaignPlanSchema`). Failure → one retry with the same prompt plus a final user line `Your previous answer was not valid JSON for the schema: {{first_error}}. Return a valid object.`; second failure → error `schema_invalid`.
2. **Budget total.** Set `budget.currency` and `budget.total` to the brief's values. If line items do not sum to the total (tolerance 0.5), scale every amount proportionally, round to whole units, and put any rounding difference on the largest line. Flag `budget_rescaled` and append to `assumptions`: "Budget lines were scaled to match the total of {{total}} {{currency}}."
3. **Channel shares.** If `budget_share_percent` values do not sum to 100 (tolerance 0.5), scale proportionally and round; flag `channel_shares_rescaled`.
4. **Timeline.** Force `timeline.start_date` and `end_date` to the brief. Clamp any phase date into the period; if the last phase ends before the campaign end, extend it; flag `timeline_adjusted`.
5. **Calendar dates.** Any `calendar_items[].date` outside the period is clamped to the nearest boundary and the item's `notes` gets the prefix "Date adjusted to fit the campaign. "; flag `date_clamped` with the item id. Recompute `week_number` from the date for every item.
6. **Calendar count.** Fewer than 6 → flag `calendar_count_low`; more than 20 → keep the first 20 by date, flag `calendar_count_high`. Both are accepted, never retried.
7. **Pillar and channel names.** If an item's `content_pillar` does not match a pillar name (case-insensitive), replace it with the closest pillar by simple substring match, else the first pillar; flag `pillar_name_fixed`. The same rule for `channel`.
8. **Creative brief due dates.** Clamp to be on or before the campaign end date; no flag needed beyond `date_clamped` with the brief title as ref.
9. **Ids.** Replace each `calendar_items[].id` with a UUID (`crypto.randomUUID()`) before saving, so plan JSON ids and `calendar_items` rows match.

### 2.4 Cost expectations (from `ai_model_pricing`)

A generate call is roughly 1,800 input tokens (prompt plus brief) and 6,000–9,000 output tokens. On `gpt-6-sol` that is about US$0.06–0.09 output plus under US$0.01 input; with the `brief_check` call on `gpt-6-luna` (about US$0.001) a full campaign costs about US$0.07–0.10, inside the US$0.20 acceptance target. On `gpt-6-luna` for everything, about US$0.005.

---

## 3. `revise`

### 3.1 System prompt (`instructions`)

```text
You are campAI's campaign editor. You receive a complete campaign plan as JSON, an instruction from the business owner, and a list of LOCKED sections. Apply the instruction and return the complete updated plan.

Rules:
1. Change only what the instruction requires, plus anything that must change to stay consistent (for example, if the audience changes, captions that name the old audience should change too). Everything else must be returned exactly as received, word for word.
2. LOCKED sections must be returned byte-for-byte identical to the input. If the instruction can only be satisfied by changing a locked section, do not change it; instead explain the limitation in change_summary.
3. Keep every constraint from the original plan: same currency and total budget with line items summing exactly to it, same campaign start and end dates, calendar dates inside the period, at most 6 channels, at most 5 pillars, at most 3 ad scripts, at most 4 creative briefs, 2 to 8 KPIs, 6 to 20 calendar items. Keep existing calendar item ids for items you keep; new items get ids "new-01", "new-02".
4. Keep calendar item status values as they are unless the instruction is about status.
5. changed_sections lists every section key you changed, using only these keys: overview, audience, strategy, messaging, channels, content, calendar, copy, creative_briefs, budget, kpis, assumptions. The section-to-field map is: overview = title, executive_summary, business_objective, timeline; audience = audience; strategy = positioning, strategic_rationale; messaging = messaging, offer; channels = channels; content = content_pillars; calendar = calendar_items; copy = copy, ad_scripts; creative_briefs = creative_briefs; budget = budget; kpis = kpis; assumptions = assumptions, risks, next_actions.
6. change_summary is one paragraph, in plain language, in the second person ("I moved the campaign towards...") describing what changed and why, and any part of the instruction you could not apply.
7. Plain language, no jargon, no hidden reasoning. Respond only with the JSON object required by the schema.
```

### 3.2 User input template (`input`)

```text
INSTRUCTION FROM THE OWNER:
"""
{{instruction}}
"""

LOCKED SECTIONS (return unchanged): {{locked_sections_comma_or_none}}

BRIEF FACTS THAT MUST NOT CHANGE:
Budget total: {{budget_amount}} {{currency}}
Campaign period: {{start_date}} to {{end_date}}
Today's date: {{today}}

CURRENT PLAN (JSON):
{{current_plan_json}}
```

`{{current_plan_json}}` is the latest `campaign_plans.plan` (the working copy, including the user's manual edits), serialised with no whitespace. `{{instruction}}` is trimmed and limited to 500 characters.

### 3.3 Output schema

The `revise` format is built in code from `campaign.schema.json`:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["plan", "changed_sections", "change_summary"],
  "properties": {
    "plan": { "...": "campaign.schema.json with its $comment and title removed" },
    "changed_sections": {
      "type": "array",
      "items": { "type": "string", "enum": ["overview", "audience", "strategy", "messaging", "channels", "content", "calendar", "copy", "creative_briefs", "budget", "kpis", "assumptions"] }
    },
    "change_summary": { "type": "string" }
  }
}
```

TypeScript type: `RevisionResult` in `types.ts`.

### 3.4 Locked sections, enforced in code

The model is asked to respect locks, but the Edge Function guarantees it: after validation and normalisation, for every key in `locked_sections`, every field listed in `SECTION_FIELDS[key]` is copied back from the current plan into the proposed plan, and that key is removed from `changed_sections`. Budget re-normalisation runs after the copy-back, so a locked `budget` section is exact. Calendar item ids `new-*` are replaced with UUIDs. Then `changed_sections` is recomputed by deep-comparing each section's fields between the current and proposed plans, so the list shown to the user reflects what actually differs, not what the model claimed.

### 3.5 Apply / Discard

`revise` never modifies the working plan. It inserts a `campaign_revisions` row with status `proposed` and returns the proposal. The browser shows the diff by section (changed sections highlighted, `change_summary` on top) and offers **Apply** or **Discard**:

- **Apply** (frontend, no AI): call the database function `apply_revision(revision_id)` (in the migration), which inserts a new `campaign_plans` version with `source = 'revised'`, rebuilds `calendar_items`, sets `after_plan_version`, marks the revision `applied`, and bumps `campaigns.current_plan_version`, all in one transaction.
- **Discard**: update the revision to `discarded`. Nothing else changes.

---

## 4. Rules shared by all three operations (implemented in the Edge Function)

### 4.1 Request handling order

1. Parse the JSON body; validate with Zod (`AiRequestSchema`). Failure → 400 `invalid_request`.
2. Confirm the caller (`ctx.userClaims.id`, falling back to `ctx.jwtClaims.sub`, in the `withSupabase` version — verified against `@supabase/server` 1.8.0; the master prompt's `ctx.userClaims.sub` does not exist — or `auth.getUser(token)` from the JWT (JSON Web Token) in the legacy version). Missing → 401 `unauthenticated`.
3. Load the campaign through the **user-scoped** client. No row → 404 `not_found` (Row Level Security hides other users' rows, so this is also the ownership check).
4. Idempotency: look up `ai_usage_events` by `request_id` (admin client). If a row exists with status `success` and a stored `response`, return that response with HTTP 200 and header `X-Campai-Replayed: true`. If it exists with any other status, return 409 `duplicate_request` ("That request was already handled. Start a new one.").
5. Daily cap: count today's (UTC) ledger rows for the user via `count_user_ai_calls_today()`. If ≥ `AI_DAILY_LIMIT_PER_USER` (default 25) → insert a ledger row with status `daily_limit_reached` and return 429.
6. Insert a ledger row with status `internal_error` and no tokens **before** calling OpenAI (so a crash still leaves a trace), then update it at the end with the real status, tokens, cost, latency and (on success) the response.
7. Load the operation's inputs (brief for `generate`, latest plan for `revise`). Missing → 409 `brief_missing` / `plan_missing`.
8. For `generate`, set `campaigns.status = 'generating'` first and `'ready'` or `'error'` (with `last_error`) at the end.
9. Call OpenAI with an `AbortController` timeout: 20 s for `brief_check`, 110 s for `generate` and `revise` (below the Edge Function wall-clock limit of 150 s on the free plan; check your plan in Troubleshooting T9).
10. Map the result (section 4.2), validate and normalise, write to the database, update the ledger, return.

### 4.2 Mapping OpenAI outcomes to errors

| OpenAI outcome | Ledger status | HTTP | `code` | Message shown to the user | Retry? |
|---|---|---|---|---|---|
| `status: "completed"`, JSON valid | `success` | 200 | — | — | — |
| `status: "incomplete"` (`incomplete_details.reason = max_output_tokens`) | `incomplete` | 502 | `incomplete_output` | "The plan came back unfinished. Try again; if it happens twice, shorten your brief." | No |
| Content item `type: "refusal"` | `refused` | 422 | `refused` | "campAI can't build a campaign for this brief. Please rephrase it or contact support." | No |
| JSON does not validate against the schema | `schema_invalid` | 502 | `schema_invalid` | "Something went wrong while building your plan. Please try again." | One retry |
| HTTP 429 or quota error from OpenAI | `rate_limited` | 429 | `rate_limited` | "campAI is busy, try again in a minute." | No |
| HTTP 5xx or network error | `upstream_error` | 502 | `upstream_error` | "campAI couldn't reach its AI service. Please try again." | One retry |
| Timeout (AbortController) | `timeout` | 504 | `timeout` | "This is taking longer than usual. Please try again." | No |
| Anything unexpected | `internal_error` | 500 | `internal_error` | "Something went wrong. Please try again." | No |

Errors raised before OpenAI is called (no tokens, but still a ledger row where noted):

| Condition | Ledger | HTTP | `code` | Message shown to the user |
|---|---|---|---|---|
| Body fails validation | none | 400 | `invalid_request` | "Something went wrong. Please try again." (the server message names the field for the console) |
| No verified user | none | 401 | `unauthenticated` | "Your session has expired. Sign in again." |
| Campaign not visible through RLS | none | 404 | `not_found` | "We couldn't find that campaign." |
| `generate` with no saved brief | `invalid_request` | 409 | `brief_missing` | "Finish the brief before building the campaign." |
| `revise` with no plan yet | `invalid_request` | 409 | `plan_missing` | "Build the campaign before asking for changes." |
| Same `request_id` seen before (not a successful replay) | none | 409 | `duplicate_request` | "That request was already handled. Start a new one." |
| Daily cap reached | `daily_limit_reached` | 429 | `daily_limit_reached` | "You've reached today's limit of 25 AI actions. It resets at midnight UTC." |

"One retry" means exactly one more OpenAI call within the same request, with the same `request_id`; the ledger row records the tokens of both calls summed and `error_code` of the first failure if the retry also fails.

### 4.3 Usage tracking

Every attempt writes one `ai_usage_events` row: `user_id`, `campaign_id`, `operation`, `request_id`, `model`, `input_tokens`, `cached_input_tokens` (from `usage.input_tokens_details.cached_tokens`), `output_tokens`, `total_tokens`, `estimated_cost_usd`, `currency = 'USD'`, `status`, `error_code`, `latency_ms`, `response` (success only), `created_at`.

Cost formula, using the active `ai_model_pricing` row for the model:

```
estimated_cost_usd = (input_tokens - cached_input_tokens) * input_per_million_usd / 1e6
                   + cached_input_tokens * cached_input_per_million_usd / 1e6
                   + output_tokens * output_per_million_usd / 1e6
```

If the model has no pricing row, cost is 0 and `error_code` gets the suffix `;pricing_missing` so the gap is visible in the Settings summary.

### 4.4 What the browser never receives

The OpenAI key, the Supabase secret key, raw OpenAI error bodies, stack traces, prompt text, or any `reasoning` items. The Edge Function logs full details with `console.error` (visible in the Supabase Dashboard → Edge Functions → Logs) and returns only the safe message and code.
