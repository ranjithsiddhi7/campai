// AI note: Canonical TypeScript types for campAI. They mirror F-ai/campaign.schema.json and F-ai/brief-check.schema.json exactly
// and define the Edge Function request/response contract. Owner: Claude Code only. Copied verbatim to src/types/campaign.ts and supabase/functions/_shared/types.ts.

// ---------------------------------------------------------------------------
// 1. Campaign plan (matches campaign.schema.json)
// ---------------------------------------------------------------------------

/** ISO 8601 calendar date, YYYY-MM-DD. */
export type IsoDate = string;

export type ChannelPriority = "primary" | "secondary" | "support";
export type BudgetCategory = "media" | "content" | "offer" | "tools" | "contingency";
export type KpiCadence = "daily" | "weekly" | "end_of_campaign";
export type Effort = "small" | "medium" | "large";
export type CalendarItemStatus = "planned" | "in_progress" | "done" | "skipped";

export interface AudienceSegment {
  name: string;
  description: string;
  pains: string[];
  motivations: string[];
  objections: string[];
}

export interface Audience {
  primary: AudienceSegment;
  secondary: AudienceSegment;
}

export interface Positioning {
  statement: string;
  differentiators: string[];
}

export interface Messaging {
  core_message: string;
  supporting_messages: string[];
}

export interface Offer {
  name: string;
  description: string;
  mechanics: string;
  terms: string | null;
}

export interface Channel {
  name: string;
  role: string;
  priority: ChannelPriority;
  /** 0-100. Shares across channels should sum to 100; code normalises if they do not. */
  budget_share_percent: number;
  why: string;
}

export interface ContentPillar {
  name: string;
  description: string;
  ideas: string[];
}

export interface EmailOrMessageCopy {
  purpose: string;
  subject: string;
  body: string;
}

export interface CampaignCopy {
  headline_options: string[];
  social_captions: string[];
  email_or_message_copy: EmailOrMessageCopy[];
}

export interface AdScript {
  title: string;
  channel: string;
  duration_seconds: number;
  script: string;
  visual_notes: string;
}

export interface CreativeBrief {
  title: string;
  purpose: string;
  format: string;
  key_message: string;
  visual_direction: string;
  deliverables: string[];
  due_date: IsoDate;
}

export interface BudgetLineItem {
  name: string;
  category: BudgetCategory;
  amount: number;
  notes: string;
}

export interface Budget {
  /** ISO 4217 code, for example "SGD". */
  currency: string;
  total: number;
  line_items: BudgetLineItem[];
}

export interface TimelinePhase {
  name: string;
  start_date: IsoDate;
  end_date: IsoDate;
  focus: string;
}

export interface Timeline {
  start_date: IsoDate;
  end_date: IsoDate;
  phases: TimelinePhase[];
}

export interface Kpi {
  name: string;
  target: string;
  how_to_measure: string;
  cadence: KpiCadence;
}

export interface Risk {
  risk: string;
  mitigation: string;
}

export interface NextAction {
  action: string;
  when: string;
  effort: Effort;
}

export interface CalendarItem {
  /** Model returns "ci-01" style ids; the app replaces them with UUIDs when saving to calendar_items. */
  id: string;
  date: IsoDate;
  week_number: number;
  channel: string;
  format: string;
  objective: string;
  content_pillar: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  creative_direction: string;
  ad_script: string | null;
  status: CalendarItemStatus;
  notes: string;
}

export interface CampaignPlan {
  title: string;
  executive_summary: string;
  business_objective: string;
  audience: Audience;
  positioning: Positioning;
  messaging: Messaging;
  offer: Offer;
  strategic_rationale: string;
  channels: Channel[];
  content_pillars: ContentPillar[];
  copy: CampaignCopy;
  ad_scripts: AdScript[];
  creative_briefs: CreativeBrief[];
  budget: Budget;
  timeline: Timeline;
  kpis: Kpi[];
  assumptions: string[];
  risks: Risk[];
  next_actions: NextAction[];
  calendar_items: CalendarItem[];
}

// ---------------------------------------------------------------------------
// 2. Workspace sections and locking (used by the UI and by `revise`)
// ---------------------------------------------------------------------------

/** The twelve workspace sections. One-to-one with the workspace navigation and with lockable sections in `revise`. */
export const SECTION_KEYS = [
  "overview",
  "audience",
  "strategy",
  "messaging",
  "channels",
  "content",
  "calendar",
  "copy",
  "creative_briefs",
  "budget",
  "kpis",
  "assumptions",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Which plan fields belong to which section. Locking a section restores exactly these fields after a revision. */
export const SECTION_FIELDS: Record<SectionKey, ReadonlyArray<keyof CampaignPlan>> = {
  overview: ["title", "executive_summary", "business_objective", "timeline"],
  audience: ["audience"],
  strategy: ["positioning", "strategic_rationale"],
  messaging: ["messaging", "offer"],
  channels: ["channels"],
  content: ["content_pillars"],
  calendar: ["calendar_items"],
  copy: ["copy", "ad_scripts"],
  creative_briefs: ["creative_briefs"],
  budget: ["budget"],
  kpis: ["kpis"],
  assumptions: ["assumptions", "risks", "next_actions"],
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  overview: "Overview",
  audience: "Audience",
  strategy: "Strategy",
  messaging: "Messaging and Offer",
  channels: "Channels",
  content: "Content Ideas",
  calendar: "Calendar",
  copy: "Copy and Ad Scripts",
  creative_briefs: "Creative Briefs",
  budget: "Budget",
  kpis: "KPIs",
  assumptions: "Assumptions and Risks",
};

// ---------------------------------------------------------------------------
// 3. Brief check (matches brief-check.schema.json)
// ---------------------------------------------------------------------------

export type FieldStatus = "stated" | "inferred" | "missing";

export interface TextField {
  value: string | null;
  status: FieldStatus;
  suggested_default: string;
  question: string;
}

export interface BudgetField {
  amount: number | null;
  currency: string | null;
  status: FieldStatus;
  suggested_amount: number;
  suggested_currency: string;
  question: string;
}

export interface ScheduleField {
  start_date: IsoDate | null;
  duration_weeks: number | null;
  status: FieldStatus;
  suggested_start_date: IsoDate;
  suggested_duration_weeks: number;
  question: string;
}

export interface BriefCheckFields {
  goal: TextField;
  business: TextField;
  product_or_service: TextField;
  audience_clues: TextField;
  budget: BudgetField;
  market: TextField;
  schedule: ScheduleField;
  existing_assets: TextField;
  tone_and_constraints: TextField;
}

export interface BriefCheckResult {
  restatement: string;
  assumptions: string[];
  fields: BriefCheckFields;
}

/** The nine brief questions, in the fixed order the app asks them. */
export const BRIEF_FIELD_ORDER = [
  "goal",
  "business",
  "product_or_service",
  "audience_clues",
  "budget",
  "market",
  "schedule",
  "existing_assets",
  "tone_and_constraints",
] as const;

export type BriefFieldKey = (typeof BRIEF_FIELD_ORDER)[number];

// ---------------------------------------------------------------------------
// 4. The structured brief the user confirms (stored in campaign_briefs)
// ---------------------------------------------------------------------------

export interface CampaignBrief {
  business: string;
  product_or_service: string;
  goal: string;
  audience_clues: string;
  budget_amount: number;
  /** ISO 4217 code. */
  currency: string;
  market: string;
  start_date: IsoDate;
  duration_weeks: number;
  /** Derived in code: start_date + duration_weeks * 7 - 1 day. */
  end_date: IsoDate;
  existing_assets: string;
  tone_and_constraints: string | null;
}

/** Stored in campaign_briefs.brief_check (JSONB). Records how the brief was produced. */
export interface BriefCheckRecord {
  used_ai: boolean;
  free_text: string | null;
  result: BriefCheckResult | null;
  /** Which fields the user confirmed or changed on the follow-up screens. */
  answered_fields: BriefFieldKey[];
  field_statuses: Record<BriefFieldKey, FieldStatus>;
}

// ---------------------------------------------------------------------------
// 5. Edge Function contract (supabase/functions/campaign-ai)
// ---------------------------------------------------------------------------

export type AiOperation = "brief_check" | "generate" | "revise";

export interface BriefCheckRequest {
  operation: "brief_check";
  /** UUID generated by the client; unique per attempt. */
  request_id: string;
  /** Campaign the brief belongs to (must be owned by the caller). */
  campaign_id: string;
  free_text: string;
  /** Client-side defaults, sent so the model can fill gaps consistently. */
  defaults: {
    today: IsoDate;
    currency: string;
    market: string;
  };
}

export interface GenerateRequest {
  operation: "generate";
  request_id: string;
  /** The Edge Function reads the saved brief for this campaign; the browser does not send it. */
  campaign_id: string;
}

export interface ReviseRequest {
  operation: "revise";
  request_id: string;
  campaign_id: string;
  /** Plain-language instruction from the user, 3-500 characters. */
  instruction: string;
  /** Sections that must not change. */
  locked_sections: SectionKey[];
}

export type AiRequest = BriefCheckRequest | GenerateRequest | ReviseRequest;

/** A note added by validation/normalisation code (never by the model). */
export interface ValidationFlag {
  code:
    | "budget_rescaled"
    | "channel_shares_rescaled"
    | "date_clamped"
    | "calendar_count_low"
    | "calendar_count_high"
    | "pillar_name_fixed"
    | "timeline_adjusted";
  message: string;
  /** Calendar item id or field path the flag refers to, if any. */
  ref: string | null;
}

export interface UsageSummary {
  model: string;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
}

export interface BriefCheckResponse {
  operation: "brief_check";
  request_id: string;
  result: BriefCheckResult;
  usage: UsageSummary;
}

export interface GenerateResponse {
  operation: "generate";
  request_id: string;
  campaign_id: string;
  /** The saved plan version (campaign_plans.version). */
  plan_version: number;
  plan: CampaignPlan;
  flags: ValidationFlag[];
  usage: UsageSummary;
}

/** What the model returns for `revise` (before the app restores locked sections). */
export interface RevisionResult {
  plan: CampaignPlan;
  changed_sections: SectionKey[];
  change_summary: string;
}

export interface ReviseResponse {
  operation: "revise";
  request_id: string;
  campaign_id: string;
  /** campaign_revisions.id; the client sends it back when applying or discarding. */
  revision_id: string;
  /** The version the revision was based on. */
  base_plan_version: number;
  proposed_plan: CampaignPlan;
  changed_sections: SectionKey[];
  change_summary: string;
  flags: ValidationFlag[];
  usage: UsageSummary;
}

export type AiResponse = BriefCheckResponse | GenerateResponse | ReviseResponse;

export type AiErrorCode =
  | "invalid_request"
  | "unauthenticated"
  | "not_found"
  | "brief_missing"
  | "plan_missing"
  | "daily_limit_reached"
  | "duplicate_request"
  | "rate_limited"
  | "refused"
  | "incomplete_output"
  | "schema_invalid"
  | "timeout"
  | "upstream_error"
  | "internal_error";

export interface AiError {
  error: {
    code: AiErrorCode;
    /** Safe, plain-language message shown to the user. */
    message: string;
    request_id: string | null;
  };
}

// ---------------------------------------------------------------------------
// 6. Database row types (mirror E-supabase/migration.sql)
// ---------------------------------------------------------------------------

export type CampaignStatus = "draft" | "generating" | "ready" | "error";
export type PlanSource = "generated" | "edited" | "revised";
export type RevisionStatus = "proposed" | "applied" | "discarded";
export type UsageStatus =
  | "success"
  | "invalid_request"
  | "refused"
  | "incomplete"
  | "schema_invalid"
  | "timeout"
  | "rate_limited"
  | "upstream_error"
  | "internal_error"
  | "daily_limit_reached";

export interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRow {
  id: string;
  user_id: string;
  title: string;
  status: CampaignStatus;
  current_plan_version: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignBriefRow extends CampaignBrief {
  id: string;
  campaign_id: string;
  user_id: string;
  brief_check: BriefCheckRecord | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignPlanRow {
  id: string;
  campaign_id: string;
  user_id: string;
  version: number;
  source: PlanSource;
  plan: CampaignPlan;
  flags: ValidationFlag[];
  created_at: string;
}

export interface CalendarItemRow {
  id: string;
  campaign_id: string;
  user_id: string;
  date: IsoDate;
  week_number: number;
  channel: string;
  format: string;
  objective: string;
  content_pillar: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  creative_direction: string;
  ad_script: string | null;
  status: CalendarItemStatus;
  notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignRevisionRow {
  id: string;
  campaign_id: string;
  user_id: string;
  request_id: string;
  instruction: string;
  locked_sections: SectionKey[];
  changed_sections: SectionKey[];
  change_summary: string;
  before_plan_version: number;
  after_plan_version: number | null;
  proposed_plan: CampaignPlan;
  status: RevisionStatus;
  created_at: string;
  updated_at: string;
}

export interface AiUsageEventRow {
  id: string;
  user_id: string;
  campaign_id: string | null;
  operation: AiOperation;
  request_id: string;
  model: string | null;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  currency: "USD";
  status: UsageStatus;
  error_code: string | null;
  latency_ms: number | null;
  /** Stored so a duplicate request_id can return the earlier result. */
  response: AiResponse | null;
  created_at: string;
}

export interface AiModelPricingRow {
  model: string;
  input_per_million_usd: number;
  cached_input_per_million_usd: number;
  output_per_million_usd: number;
  verified_on: IsoDate;
  active: boolean;
}

// ---------------------------------------------------------------------------
// 7. Output bounds (single place; the prompts and max_output_tokens follow these)
// ---------------------------------------------------------------------------

export const OUTPUT_BOUNDS = {
  calendarItemsMin: 6,
  calendarItemsMax: 20,
  calendarItemsTarget: 12,
  channelsMax: 6,
  contentPillarsMax: 5,
  adScriptsMax: 3,
  creativeBriefsMax: 4,
  kpisMax: 8,
  maxOutputTokens: {
    brief_check: 1500,
    generate: 12000,
    revise: 12000,
  },
} as const;
