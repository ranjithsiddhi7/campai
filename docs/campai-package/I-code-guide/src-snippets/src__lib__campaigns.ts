// AI note: All database reads and writes the frontend makes (CRUD via supabase-js under Row Level Security, plus the SQL helper functions). No AI calls here.
// Destination: src/lib/campaigns.ts. Owner: Bolt creates it from this snippet in prompts H2/H7/H8/H9; Claude Code may fix it while Bolt is idle.

import { supabase } from "./supabase";
import type {
  AiUsageEventRow,
  BriefCheckRecord,
  CalendarItem,
  CalendarItemRow,
  CampaignBrief,
  CampaignBriefRow,
  CampaignPlan,
  CampaignPlanRow,
  CampaignRevisionRow,
  CampaignRow,
  ValidationFlag,
} from "../types/campaign";

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  if (res.data === null || res.data === undefined) throw new Error(`${what}: not found`);
  return res.data;
}

// ---- Campaigns --------------------------------------------------------------

export async function listCampaigns(): Promise<CampaignRow[]> {
  return must(await supabase.from("campaigns").select("*").order("updated_at", { ascending: false }), "Loading campaigns");
}

export async function createCampaign(title = "Untitled campaign"): Promise<CampaignRow> {
  // user_id defaults to auth.uid() in the database.
  return must(await supabase.from("campaigns").insert({ title }).select("*").single(), "Creating campaign");
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const { data, error } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Loading campaign: ${error.message}`);
  return data;
}

export async function renameCampaign(id: string, title: string): Promise<void> {
  const { error } = await supabase.from("campaigns").update({ title: title.trim().slice(0, 120) || "Untitled campaign" }).eq("id", id);
  if (error) throw new Error(`Renaming campaign: ${error.message}`);
}

/** Hard delete; briefs, plans, calendar items and revisions cascade. Ledger rows keep a null campaign_id. */
export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw new Error(`Deleting campaign: ${error.message}`);
}

// ---- Brief ------------------------------------------------------------------

export async function getBrief(campaignId: string): Promise<CampaignBriefRow | null> {
  const { data, error } = await supabase.from("campaign_briefs").select("*").eq("campaign_id", campaignId).maybeSingle();
  if (error) throw new Error(`Loading brief: ${error.message}`);
  return data ? { ...data, budget_amount: Number(data.budget_amount), currency: String(data.currency).trim() } : null;
}

export async function upsertBrief(campaignId: string, brief: CampaignBrief, record: BriefCheckRecord): Promise<CampaignBriefRow> {
  return must(
    await supabase
      .from("campaign_briefs")
      .upsert({ campaign_id: campaignId, ...brief, brief_check: record }, { onConflict: "campaign_id" })
      .select("*")
      .single(),
    "Saving brief",
  );
}

// ---- Plans (versioned) -------------------------------------------------------

export async function getLatestPlan(campaignId: string): Promise<CampaignPlanRow | null> {
  const { data, error } = await supabase
    .from("campaign_plans")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Loading plan: ${error.message}`);
  return data;
}

export async function listPlanVersions(campaignId: string): Promise<Pick<CampaignPlanRow, "id" | "version" | "source" | "created_at">[]> {
  return must(
    await supabase.from("campaign_plans").select("id, version, source, created_at").eq("campaign_id", campaignId).order("version", { ascending: false }),
    "Loading versions",
  );
}

/** Save the whole working plan as a new version (used after a section edit). Returns the new version number. */
export async function savePlan(campaignId: string, plan: CampaignPlan, flags: ValidationFlag[] = []): Promise<number> {
  const { data, error } = await supabase.rpc("save_plan_version", {
    p_campaign_id: campaignId,
    p_plan: plan,
    p_source: "edited",
    p_flags: flags,
  });
  if (error) throw new Error(`Saving plan: ${error.message}`);
  return Number(data);
}

// ---- Calendar items ------------------------------------------------------------

export async function listCalendarItems(campaignId: string): Promise<CalendarItemRow[]> {
  return must(
    await supabase.from("calendar_items").select("*").eq("campaign_id", campaignId).order("date").order("sort_order"),
    "Loading calendar",
  );
}

export type CalendarItemPatch = Partial<Omit<CalendarItem, "id">>;

/** Edits one item in both the rows and the plan JSON, saving a new plan version. */
export async function updateCalendarItem(itemId: string, patch: CalendarItemPatch): Promise<number> {
  const { data, error } = await supabase.rpc("update_calendar_item", { p_item_id: itemId, p_patch: patch });
  if (error) throw new Error(`Saving calendar item: ${error.message}`);
  return Number(data);
}

export async function addCalendarItem(campaignId: string, item: CalendarItemPatch): Promise<string> {
  const { data, error } = await supabase.rpc("add_calendar_item", { p_campaign_id: campaignId, p_item: item });
  if (error) throw new Error(`Adding calendar item: ${error.message}`);
  return String(data);
}

export async function deleteCalendarItem(itemId: string): Promise<number> {
  const { data, error } = await supabase.rpc("delete_calendar_item", { p_item_id: itemId });
  if (error) throw new Error(`Deleting calendar item: ${error.message}`);
  return Number(data);
}

// ---- Revisions -----------------------------------------------------------------

export async function listRevisions(campaignId: string): Promise<CampaignRevisionRow[]> {
  return must(
    await supabase.from("campaign_revisions").select("*").eq("campaign_id", campaignId).order("created_at", { ascending: false }),
    "Loading revisions",
  );
}

export async function applyRevision(revisionId: string): Promise<number> {
  const { data, error } = await supabase.rpc("apply_revision", { p_revision_id: revisionId });
  if (error) throw new Error(`Applying revision: ${error.message}`);
  return Number(data);
}

export async function discardRevision(revisionId: string): Promise<void> {
  const { error } = await supabase.from("campaign_revisions").update({ status: "discarded" }).eq("id", revisionId).eq("status", "proposed");
  if (error) throw new Error(`Discarding revision: ${error.message}`);
}

// ---- Usage (Settings page) -------------------------------------------------------

export interface UsageSummaryRow {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  calls_today: number;
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export async function getUsageSummary(): Promise<UsageSummaryRow> {
  const { data, error } = await supabase.rpc("my_ai_usage_summary");
  if (error) throw new Error(`Loading usage: ${error.message}`);
  const row = (Array.isArray(data) ? data[0] : data) ?? {};
  return {
    total_calls: Number(row.total_calls ?? 0),
    successful_calls: Number(row.successful_calls ?? 0),
    failed_calls: Number(row.failed_calls ?? 0),
    calls_today: Number(row.calls_today ?? 0),
    input_tokens: Number(row.input_tokens ?? 0),
    cached_input_tokens: Number(row.cached_input_tokens ?? 0),
    output_tokens: Number(row.output_tokens ?? 0),
    total_tokens: Number(row.total_tokens ?? 0),
    estimated_cost_usd: Number(row.estimated_cost_usd ?? 0),
  };
}

export async function listRecentUsage(limit = 20): Promise<AiUsageEventRow[]> {
  return must(
    await supabase
      .from("ai_usage_events")
      .select("id, user_id, campaign_id, operation, request_id, model, input_tokens, cached_input_tokens, output_tokens, total_tokens, estimated_cost_usd, currency, status, error_code, latency_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    "Loading usage events",
  ) as unknown as AiUsageEventRow[];
}
