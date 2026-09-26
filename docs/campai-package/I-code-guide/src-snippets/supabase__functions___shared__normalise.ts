// AI note: Deterministic validation and normalisation of AI output (budget scaling, date clamping, count flags, name fixes, locked sections).
// Destination: supabase/functions/_shared/normalise.ts. Owner: Claude Code. Rules are specified in F-ai/prompts.md section 2.3 and 3.4.

import type { CampaignBrief, CampaignPlan, SectionKey, ValidationFlag } from "./types.ts";
import { OUTPUT_BOUNDS, SECTION_FIELDS, SECTION_KEYS } from "./types.ts";

// ---- Date helpers (UTC, no dependencies) -----------------------------------

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseIsoDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = ISO.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(d.getTime())) return null;
  // Reject 2026-02-31 style dates that JavaScript would silently roll over.
  return d.getUTCDate() === Number(m[3]) && d.getUTCMonth() === Number(m[2]) - 1 ? d : null;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** First Monday of the month after `today`. */
export function firstMondayOfNextMonth(today: Date): Date {
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  const dow = first.getUTCDay(); // 0 = Sunday, 1 = Monday
  const offset = (8 - dow) % 7;
  return addDays(first, offset);
}

export function endDateFor(start: Date, durationWeeks: number): Date {
  return addDays(start, durationWeeks * 7 - 1);
}

function clampDate(s: string, start: Date, end: Date): { date: string; changed: boolean } {
  const d = parseIsoDate(s);
  if (!d) return { date: toIsoDate(start), changed: true };
  if (d < start) return { date: toIsoDate(start), changed: true };
  if (d > end) return { date: toIsoDate(end), changed: true };
  return { date: s, changed: false };
}

// ---- Numeric helpers --------------------------------------------------------

/** Scale numbers proportionally to hit `target`, round to whole units, put rounding residue on the largest. */
function scaleToTotal(values: number[], target: number): number[] {
  const safe = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const sum = safe.reduce((a, b) => a + b, 0);
  let scaled: number[];
  if (sum <= 0) {
    const each = Math.floor(target / safe.length);
    scaled = safe.map(() => each);
  } else {
    scaled = safe.map((v) => Math.round((v / sum) * target));
  }
  const diff = Math.round(target - scaled.reduce((a, b) => a + b, 0));
  if (diff !== 0) {
    const i = scaled.indexOf(Math.max(...scaled));
    scaled[i] += diff;
  }
  return scaled;
}

function closestName(candidate: string, names: string[]): string {
  const c = candidate.trim().toLowerCase();
  const exact = names.find((n) => n.toLowerCase() === c);
  if (exact) return exact;
  const sub = names.find((n) => n.toLowerCase().includes(c) || c.includes(n.toLowerCase()));
  return sub ?? names[0];
}

// ---- Main normalisation -----------------------------------------------------

export interface NormaliseInput {
  plan: CampaignPlan;
  brief: Pick<CampaignBrief, "budget_amount" | "currency" | "start_date" | "end_date">;
}

export interface NormaliseOutput {
  plan: CampaignPlan;
  flags: ValidationFlag[];
}

export function normalisePlan({ plan: input, brief }: NormaliseInput): NormaliseOutput {
  const flags: ValidationFlag[] = [];
  const plan: CampaignPlan = structuredClone(input);
  const start = parseIsoDate(brief.start_date)!;
  const end = parseIsoDate(brief.end_date)!;
  const total = Number(brief.budget_amount);

  // 2. Budget total
  plan.budget.currency = brief.currency;
  plan.budget.total = total;
  if (plan.budget.line_items.length === 0) {
    plan.budget.line_items = [
      { name: "Media", category: "media", amount: 0, notes: "" },
      { name: "Contingency", category: "contingency", amount: 0, notes: "" },
    ];
  }
  const lineSum = plan.budget.line_items.reduce((a, li) => a + (Number(li.amount) || 0), 0);
  if (Math.abs(lineSum - total) > 0.5) {
    const scaled = scaleToTotal(plan.budget.line_items.map((li) => Number(li.amount) || 0), total);
    plan.budget.line_items.forEach((li, i) => (li.amount = scaled[i]));
    flags.push({
      code: "budget_rescaled",
      message: `Budget lines were scaled to match the total of ${total} ${brief.currency}.`,
      ref: "budget.line_items",
    });
    plan.assumptions.push(`Budget lines were scaled to match the total of ${total} ${brief.currency}.`);
  }

  // 3. Channel shares
  if (plan.channels.length > 0) {
    const shareSum = plan.channels.reduce((a, c) => a + (Number(c.budget_share_percent) || 0), 0);
    if (Math.abs(shareSum - 100) > 0.5) {
      const scaled = scaleToTotal(plan.channels.map((c) => Number(c.budget_share_percent) || 0), 100);
      plan.channels.forEach((c, i) => (c.budget_share_percent = scaled[i]));
      flags.push({ code: "channel_shares_rescaled", message: "Channel budget shares were adjusted to add up to 100%.", ref: "channels" });
    }
  }

  // 4. Timeline
  let timelineChanged = plan.timeline.start_date !== brief.start_date || plan.timeline.end_date !== brief.end_date;
  plan.timeline.start_date = brief.start_date;
  plan.timeline.end_date = brief.end_date;
  if (plan.timeline.phases.length === 0) {
    plan.timeline.phases = [{ name: "Campaign", start_date: brief.start_date, end_date: brief.end_date, focus: "Run the plan." }];
    timelineChanged = true;
  }
  for (const phase of plan.timeline.phases) {
    const s = clampDate(phase.start_date, start, end);
    const e = clampDate(phase.end_date, start, end);
    phase.start_date = s.date;
    phase.end_date = e.date;
    if (parseIsoDate(phase.end_date)! < parseIsoDate(phase.start_date)!) {
      phase.end_date = phase.start_date;
      timelineChanged = true;
    }
    if (s.changed || e.changed) timelineChanged = true;
  }
  const last = plan.timeline.phases[plan.timeline.phases.length - 1];
  if (last.end_date !== brief.end_date) {
    last.end_date = brief.end_date;
    timelineChanged = true;
  }
  if (timelineChanged) {
    flags.push({ code: "timeline_adjusted", message: "Timeline dates were aligned to the campaign period.", ref: "timeline" });
  }

  // 5. Calendar dates + week numbers
  for (const item of plan.calendar_items) {
    const c = clampDate(item.date, start, end);
    if (c.changed) {
      item.date = c.date;
      item.notes = `Date adjusted to fit the campaign. ${item.notes}`.trim();
      flags.push({ code: "date_clamped", message: `"${item.title}" was moved to ${c.date} to stay inside the campaign period.`, ref: item.id });
    }
    item.week_number = Math.floor(daysBetween(start, parseIsoDate(item.date)!) / 7) + 1;
  }
  plan.calendar_items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // 6. Calendar count
  if (plan.calendar_items.length < OUTPUT_BOUNDS.calendarItemsMin) {
    flags.push({
      code: "calendar_count_low",
      message: `The calendar has ${plan.calendar_items.length} items; we aimed for at least ${OUTPUT_BOUNDS.calendarItemsMin}. Add items in the Calendar tab.`,
      ref: "calendar_items",
    });
  }
  if (plan.calendar_items.length > OUTPUT_BOUNDS.calendarItemsMax) {
    plan.calendar_items = plan.calendar_items.slice(0, OUTPUT_BOUNDS.calendarItemsMax);
    flags.push({
      code: "calendar_count_high",
      message: `The calendar was trimmed to the first ${OUTPUT_BOUNDS.calendarItemsMax} items.`,
      ref: "calendar_items",
    });
  }

  // 7. Pillar and channel names
  const pillarNames = plan.content_pillars.map((p) => p.name);
  const channelNames = plan.channels.map((c) => c.name);
  for (const item of plan.calendar_items) {
    if (pillarNames.length && !pillarNames.includes(item.content_pillar)) {
      const fixed = closestName(item.content_pillar, pillarNames);
      flags.push({ code: "pillar_name_fixed", message: `"${item.title}" used an unknown content pillar; set to "${fixed}".`, ref: item.id });
      item.content_pillar = fixed;
    }
    if (channelNames.length && !channelNames.includes(item.channel)) {
      const fixed = closestName(item.channel, channelNames);
      flags.push({ code: "pillar_name_fixed", message: `"${item.title}" used an unknown channel; set to "${fixed}".`, ref: item.id });
      item.channel = fixed;
    }
  }

  // 8. Creative brief due dates: on or before campaign end (may be before start: prep work)
  for (const cb of plan.creative_briefs) {
    const d = parseIsoDate(cb.due_date);
    if (!d || d > end) {
      cb.due_date = toIsoDate(end);
      flags.push({ code: "date_clamped", message: `Creative brief "${cb.title}" due date moved inside the campaign.`, ref: cb.title });
    }
  }

  // 9. Ids: UUIDs so plan items and calendar_items rows match
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const item of plan.calendar_items) {
    if (!UUID.test(item.id)) item.id = crypto.randomUUID();
  }

  return { plan, flags };
}

// ---- Locked sections and changed-section detection (revise) -----------------

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Copy every field of each locked section from `current` into `proposed`. Returns a new plan. */
export function restoreLockedSections(current: CampaignPlan, proposed: CampaignPlan, locked: SectionKey[]): CampaignPlan {
  const out: CampaignPlan = structuredClone(proposed);
  for (const key of locked) {
    for (const field of SECTION_FIELDS[key]) {
      (out as unknown as Record<string, unknown>)[field] = structuredClone(
        (current as unknown as Record<string, unknown>)[field],
      );
    }
  }
  return out;
}

/** Sections whose fields actually differ between two plans. Calendar item ids are ignored for the comparison. */
export function diffSections(current: CampaignPlan, proposed: CampaignPlan): SectionKey[] {
  const strip = (p: CampaignPlan) => ({
    ...p,
    calendar_items: p.calendar_items.map(({ id: _id, ...rest }) => rest),
  });
  const a = strip(current) as unknown as Record<string, unknown>;
  const b = strip(proposed) as unknown as Record<string, unknown>;
  return SECTION_KEYS.filter((key) => SECTION_FIELDS[key].some((f) => stableStringify(a[f]) !== stableStringify(b[f])));
}
