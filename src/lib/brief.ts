// AI note: Brief logic that needs no AI: the nine questions (labels, helper text, examples, defaults), date defaults, brief_check → question list, and building the CampaignBrief to save.
// Destination: src/lib/brief.ts. Owner: Bolt creates it from this snippet in prompts H3/H4; Claude Code may fix it while Bolt is idle.

import { addDays, format, nextMonday, startOfMonth, addMonths, isMonday, parseISO, isValid } from "date-fns";
import type { BriefCheckRecord, BriefCheckResult, BriefFieldKey, CampaignBrief, FieldStatus } from "../types/campaign";
import { BRIEF_FIELD_ORDER } from "../types/campaign";

// ---- Defaults ---------------------------------------------------------------

export const DEFAULT_CURRENCY = "SGD";
export const DEFAULT_MARKET = "Singapore";
export const DEFAULT_DURATION_WEEKS = 4;

export const CAFE_EXAMPLE = "I run a café. I want more customers during weekdays. My budget is S$1,500. I want to start next month.";

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** First Monday of next month, as YYYY-MM-DD. */
export function firstMondayOfNextMonth(from: Date = new Date()): string {
  const first = startOfMonth(addMonths(from, 1));
  return format(isMonday(first) ? first : nextMonday(first), "yyyy-MM-dd");
}

export function endDateFor(startDate: string, durationWeeks: number): string {
  return format(addDays(parseISO(startDate), durationWeeks * 7 - 1), "yyyy-MM-dd");
}

export function isFutureIsoDate(s: string): boolean {
  const d = parseISO(s);
  return isValid(d) && format(d, "yyyy-MM-dd") > todayIso();
}

// ---- The nine questions (fixed order; UX copy is final, see C-ux-spec.md) ----

export interface QuestionSpec {
  key: BriefFieldKey;
  label: string;
  helper: string;
  placeholder: string;
  examples: string[];
  optional: boolean;
  kind: "text" | "budget" | "schedule";
}

export const QUESTIONS: QuestionSpec[] = [
  {
    key: "goal",
    label: "What do you want this campaign to achieve?",
    helper: "Say it the way you'd say it to a friend. We'll turn it into a plan.",
    placeholder: "More customers during weekdays",
    examples: ["More customers during weekdays", "Sell out our new product launch", "Get 50 people to our opening event"],
    optional: false,
    kind: "text",
  },
  {
    key: "business",
    label: "What's your business?",
    helper: "A sentence is plenty.",
    placeholder: "A small café near the business district",
    examples: ["A small café near the business district", "An online store selling handmade candles", "A mobile dog-grooming service"],
    optional: false,
    kind: "text",
  },
  {
    key: "product_or_service",
    label: "What are you promoting?",
    helper: "The product, service or event this campaign is about.",
    placeholder: "Coffee, drinks and lunch",
    examples: ["Coffee, drinks and lunch", "Our new autumn candle collection", "Full grooming packages"],
    optional: false,
    kind: "text",
  },
  {
    key: "audience_clues",
    label: "Who are you hoping to attract?",
    helper: "Don't worry about marketing terms. Who buys from you, or who should?",
    placeholder: "People who work nearby on weekdays",
    examples: ["People who work nearby on weekdays", "Gift shoppers aged 25 to 45", "Dog owners within 10 km"],
    optional: false,
    kind: "text",
  },
  {
    key: "budget",
    label: "How much can you spend in total?",
    helper: "Include ads, offers and any content costs. We'll split it for you.",
    placeholder: "1500",
    examples: ["S$1,500", "US$800", "€2,000"],
    optional: false,
    kind: "budget",
  },
  {
    key: "market",
    label: "Where are your customers?",
    helper: "A city, a neighbourhood, or a country.",
    placeholder: "Singapore",
    examples: ["Singapore", "Tanjong Pagar, Singapore", "Australia-wide, online"],
    optional: false,
    kind: "text",
  },
  {
    key: "schedule",
    label: "When should it start, and for how long?",
    helper: "We suggest starting on a Monday. Four weeks is a good first campaign.",
    placeholder: "",
    examples: ["Next month, 4 weeks", "Next Monday, 2 weeks", "1 November, 6 weeks"],
    optional: false,
    kind: "schedule",
  },
  {
    key: "existing_assets",
    label: "What do you already have?",
    helper: "Social accounts, an email list, a website, photos, a shopfront. Anything we can use.",
    placeholder: "An Instagram account and a small email list",
    examples: ["An Instagram account and a small email list", "A website and a Facebook page", "Nothing yet"],
    optional: false,
    kind: "text",
  },
  {
    key: "tone_and_constraints",
    label: "Anything about tone, or anything to avoid?",
    helper: "Optional. For example: friendly and warm; no discounts over 20%; no TikTok.",
    placeholder: "Friendly and down to earth. Nothing to avoid.",
    examples: ["Friendly and down to earth", "Premium and calm; never use exclamation marks", "No discounts, we compete on quality"],
    optional: true,
    kind: "text",
  },
];

// ---- Working state of the brief while the user answers -----------------------

export interface BriefDraft {
  goal: string;
  business: string;
  product_or_service: string;
  audience_clues: string;
  budget_amount: string; // string while editing
  currency: string;
  market: string;
  start_date: string;
  duration_weeks: number;
  existing_assets: string;
  tone_and_constraints: string;
}

export function emptyDraft(): BriefDraft {
  return {
    goal: "",
    business: "",
    product_or_service: "",
    audience_clues: "",
    budget_amount: "",
    currency: DEFAULT_CURRENCY,
    market: DEFAULT_MARKET,
    start_date: firstMondayOfNextMonth(),
    duration_weeks: DEFAULT_DURATION_WEEKS,
    existing_assets: "",
    tone_and_constraints: "",
  };
}

export type FieldStatuses = Record<BriefFieldKey, FieldStatus>;

export function allMissing(): FieldStatuses {
  return Object.fromEntries(BRIEF_FIELD_ORDER.map((k) => [k, "missing"])) as FieldStatuses;
}

/** Turn a brief_check result into a prefilled draft plus per-field statuses. */
export function draftFromBriefCheck(result: BriefCheckResult): { draft: BriefDraft; statuses: FieldStatuses } {
  const f = result.fields;
  const text = (v: { value: string | null; suggested_default: string }) => (v.value ?? v.suggested_default) || "";
  const draft: BriefDraft = {
    goal: text(f.goal),
    business: text(f.business),
    product_or_service: text(f.product_or_service),
    audience_clues: text(f.audience_clues),
    budget_amount: String(f.budget.amount ?? f.budget.suggested_amount),
    currency: (f.budget.currency ?? f.budget.suggested_currency).toUpperCase(),
    market: text(f.market),
    start_date: isFutureIsoDate(f.schedule.start_date ?? "") ? (f.schedule.start_date as string) : f.schedule.suggested_start_date,
    duration_weeks: f.schedule.duration_weeks ?? f.schedule.suggested_duration_weeks,
    existing_assets: text(f.existing_assets),
    tone_and_constraints: f.tone_and_constraints.value ?? "",
  };
  const statuses: FieldStatuses = {
    goal: f.goal.status,
    business: f.business.status,
    product_or_service: f.product_or_service.status,
    audience_clues: f.audience_clues.status,
    budget: f.budget.status,
    market: f.market.status,
    schedule: f.schedule.status,
    existing_assets: f.existing_assets.status,
    tone_and_constraints: f.tone_and_constraints.status,
  };
  return { draft, statuses };
}

/** Which questions to show after smart start: only inferred or missing fields, in the fixed order. Fallback: all nine. */
export function questionsToAsk(statuses: FieldStatuses | null): QuestionSpec[] {
  if (!statuses) return QUESTIONS;
  return QUESTIONS.filter((q) => statuses[q.key] !== "stated");
}

/** The question text: the model's plain-language question when available, else our fixed label. */
export function questionLabel(q: QuestionSpec, result: BriefCheckResult | null): string {
  const fromModel = result?.fields[q.key]?.question?.trim();
  return fromModel && fromModel.length > 5 ? fromModel : q.label;
}

// ---- Validation of the draft (plain code) -----------------------------------

export interface DraftErrors {
  [key: string]: string | undefined;
}

export function validateDraft(d: BriefDraft): DraftErrors {
  const e: DraftErrors = {};
  const need = (k: keyof BriefDraft, label: string, max = 500) => {
    const v = String(d[k] ?? "").trim();
    if (!v) e[k] = `Please add ${label}.`;
    else if (v.length > max) e[k] = `Keep this under ${max} characters.`;
  };
  need("goal", "your goal");
  need("business", "your business");
  need("product_or_service", "what you're promoting");
  need("audience_clues", "who you want to attract", 1000);
  need("market", "where your customers are", 200);
  need("existing_assets", "what you already have (or write 'nothing yet')", 1000);
  const amount = Number(String(d.budget_amount).replace(/[^\d.]/g, ""));
  if (!(amount > 0)) e.budget_amount = "Enter a budget greater than zero.";
  if (!/^[A-Z]{3}$/.test(d.currency)) e.currency = "Use a three-letter currency code like SGD or USD.";
  if (!isFutureIsoDate(d.start_date)) e.start_date = "Pick a start date after today.";
  if (!(d.duration_weeks >= 1 && d.duration_weeks <= 12)) e.duration_weeks = "Choose between 1 and 12 weeks.";
  if (d.tone_and_constraints.length > 1000) e.tone_and_constraints = "Keep this under 1000 characters.";
  return e;
}

/** Build the row to upsert into campaign_briefs. */
export function toCampaignBrief(d: BriefDraft): CampaignBrief {
  const amount = Number(String(d.budget_amount).replace(/[^\d.]/g, ""));
  return {
    business: d.business.trim(),
    product_or_service: d.product_or_service.trim(),
    goal: d.goal.trim(),
    audience_clues: d.audience_clues.trim(),
    budget_amount: Math.round(amount * 100) / 100,
    currency: d.currency.toUpperCase(),
    market: d.market.trim(),
    start_date: d.start_date,
    duration_weeks: d.duration_weeks,
    end_date: endDateFor(d.start_date, d.duration_weeks),
    existing_assets: d.existing_assets.trim(),
    tone_and_constraints: d.tone_and_constraints.trim() || null,
  };
}

export function toBriefCheckRecord(args: {
  usedAi: boolean;
  freeText: string | null;
  result: BriefCheckResult | null;
  statuses: FieldStatuses;
  answered: BriefFieldKey[];
}): BriefCheckRecord {
  return {
    used_ai: args.usedAi,
    free_text: args.freeText,
    result: args.result,
    answered_fields: args.answered,
    field_statuses: args.statuses,
  };
}
