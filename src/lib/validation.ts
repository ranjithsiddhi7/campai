// AI note: Browser copy of the Zod schemas (identical to supabase/functions/_shared/validation.ts except the two import lines). Used to validate plans loaded from the database before rendering.
// Destination: src/lib/validation.ts. Owner: Claude Code (keep in sync with the _shared copy in the same change set); Bolt may import it, not edit it.

import { z } from "zod";
import { SECTION_KEYS } from "../types/campaign";

// Structural validation only. Array counts and date ranges are handled by normalise.ts (flag, never fail),
// because OpenAI strict mode already enforces the schema bounds and we never retry on count problems.

const isoDate = z.string().min(1);
const str = z.string();
const strArr = z.array(z.string());

const AudienceSegmentSchema = z.object({
  name: str,
  description: str,
  pains: strArr,
  motivations: strArr,
  objections: strArr,
});

export const CalendarItemSchema = z.object({
  id: str,
  date: isoDate,
  week_number: z.number().int(),
  channel: str,
  format: str,
  objective: str,
  content_pillar: str,
  title: str,
  hook: str,
  body: str,
  cta: str,
  creative_direction: str,
  ad_script: z.string().nullable(),
  status: z.enum(["planned", "in_progress", "done", "skipped"]),
  notes: str,
});

export const CampaignPlanSchema = z.object({
  title: str,
  executive_summary: str,
  business_objective: str,
  audience: z.object({ primary: AudienceSegmentSchema, secondary: AudienceSegmentSchema }),
  positioning: z.object({ statement: str, differentiators: strArr }),
  messaging: z.object({ core_message: str, supporting_messages: strArr }),
  offer: z.object({ name: str, description: str, mechanics: str, terms: z.string().nullable() }),
  strategic_rationale: str,
  channels: z.array(
    z.object({
      name: str,
      role: str,
      priority: z.enum(["primary", "secondary", "support"]),
      budget_share_percent: z.number(),
      why: str,
    }),
  ),
  content_pillars: z.array(z.object({ name: str, description: str, ideas: strArr })),
  copy: z.object({
    headline_options: strArr,
    social_captions: strArr,
    email_or_message_copy: z.array(z.object({ purpose: str, subject: str, body: str })),
  }),
  ad_scripts: z.array(
    z.object({ title: str, channel: str, duration_seconds: z.number().int(), script: str, visual_notes: str }),
  ),
  creative_briefs: z.array(
    z.object({
      title: str,
      purpose: str,
      format: str,
      key_message: str,
      visual_direction: str,
      deliverables: strArr,
      due_date: isoDate,
    }),
  ),
  budget: z.object({
    currency: str,
    total: z.number(),
    line_items: z.array(
      z.object({
        name: str,
        category: z.enum(["media", "content", "offer", "tools", "contingency"]),
        amount: z.number(),
        notes: str,
      }),
    ),
  }),
  timeline: z.object({
    start_date: isoDate,
    end_date: isoDate,
    phases: z.array(z.object({ name: str, start_date: isoDate, end_date: isoDate, focus: str })),
  }),
  kpis: z.array(
    z.object({
      name: str,
      target: str,
      how_to_measure: str,
      cadence: z.enum(["daily", "weekly", "end_of_campaign"]),
    }),
  ),
  assumptions: strArr,
  risks: z.array(z.object({ risk: str, mitigation: str })),
  next_actions: z.array(z.object({ action: str, when: str, effort: z.enum(["small", "medium", "large"]) })),
  calendar_items: z.array(CalendarItemSchema),
});

export const SectionKeySchema = z.enum(SECTION_KEYS);

export const RevisionResultSchema = z.object({
  plan: CampaignPlanSchema,
  changed_sections: z.array(SectionKeySchema),
  change_summary: str,
});

const fieldStatus = z.enum(["stated", "inferred", "missing"]);

const TextFieldSchema = z.object({
  value: z.string().nullable(),
  status: fieldStatus,
  suggested_default: str,
  question: str,
});

export const BriefCheckResultSchema = z.object({
  restatement: str,
  assumptions: strArr,
  fields: z.object({
    goal: TextFieldSchema,
    business: TextFieldSchema,
    product_or_service: TextFieldSchema,
    audience_clues: TextFieldSchema,
    budget: z.object({
      amount: z.number().nullable(),
      currency: z.string().nullable(),
      status: fieldStatus,
      suggested_amount: z.number(),
      suggested_currency: str,
      question: str,
    }),
    market: TextFieldSchema,
    schedule: z.object({
      start_date: z.string().nullable(),
      duration_weeks: z.number().int().nullable(),
      status: fieldStatus,
      suggested_start_date: str,
      suggested_duration_weeks: z.number().int(),
      question: str,
    }),
    existing_assets: TextFieldSchema,
    tone_and_constraints: TextFieldSchema,
  }),
});

// ---- Request contract ------------------------------------------------------

const uuid = z.string().uuid();

export const AiRequestSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("brief_check"),
    request_id: uuid,
    campaign_id: uuid,
    free_text: z.string().trim().min(3).max(2000),
    defaults: z.object({
      today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      currency: z.string().regex(/^[A-Z]{3}$/),
      market: z.string().min(1).max(100),
    }),
  }),
  z.object({
    operation: z.literal("generate"),
    request_id: uuid,
    campaign_id: uuid,
  }),
  z.object({
    operation: z.literal("revise"),
    request_id: uuid,
    campaign_id: uuid,
    instruction: z.string().trim().min(3).max(500),
    locked_sections: z.array(SectionKeySchema).max(SECTION_KEYS.length),
  }),
]);

export type ParsedAiRequest = z.infer<typeof AiRequestSchema>;
