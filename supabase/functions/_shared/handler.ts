// AI note: The campaign-ai request handler shared by BOTH Edge Function patterns (withSupabase and legacy): auth already done by the caller,
// then ownership via RLS, idempotency, daily cap, ledger, dispatch to brief_check / generate / revise. Destination: supabase/functions/_shared/handler.ts. Owner: Claude Code.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  AiErrorCode,
  AiOperation,
  AiResponse,
  BriefCheckResult,
  CampaignBrief,
  CampaignPlan,
  RevisionResult,
  UsageStatus,
  UsageSummary,
  ValidationFlag,
} from "./types.ts";
import { OUTPUT_BOUNDS } from "./types.ts";
import { AiRequestSchema, BriefCheckResultSchema, CampaignPlanSchema, RevisionResultSchema, type ParsedAiRequest } from "./validation.ts";
import {
  addDays,
  diffSections,
  endDateFor,
  firstMondayOfNextMonth,
  normalisePlan,
  parseIsoDate,
  restoreLockedSections,
  toIsoDate,
} from "./normalise.ts";
import {
  BRIEF_CHECK_INSTRUCTIONS,
  BRIEF_CHECK_SCHEMA_FOR_OPENAI,
  CAMPAIGN_SCHEMA_FOR_OPENAI,
  GENERATE_INSTRUCTIONS,
  REVISE_INSTRUCTIONS,
  REVISION_SCHEMA_FOR_OPENAI,
  briefCheckInput,
  generateInput,
  reviseInput,
  schemaRetrySuffix,
} from "./prompts.ts";
import { ZERO_USAGE, callStructured, sumUsage, type OpenAiUsage, type StructuredCallOutcome } from "./openai.ts";

// ---------------------------------------------------------------------------
// Context supplied by the pattern-specific index.ts
// ---------------------------------------------------------------------------

export interface HandlerContext {
  /** auth.users.id of the signed-in caller (already verified). */
  userId: string;
  /** RLS-scoped client acting as the user. Reads campaigns/briefs/plans; writes plans and revisions. */
  userClient: SupabaseClient;
  /** Secret-key client. Used ONLY for ai_usage_events and ai_model_pricing. */
  adminClient: SupabaseClient;
  /** Extra headers (CORS) the caller wants on every response. */
  responseHeaders?: HeadersInit;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class AiFailure extends Error {
  constructor(
    public readonly code: AiErrorCode,
    public readonly httpStatus: number,
    public readonly userMessage: string,
    public readonly ledgerStatus: UsageStatus,
    public readonly usage: OpenAiUsage = ZERO_USAGE,
  ) {
    super(`${code}: ${userMessage}`);
  }
}

const MESSAGES = {
  incomplete_output: "The plan came back unfinished. Try again; if it happens twice, shorten your brief.",
  refused: "campAI can't build a campaign for this brief. Please rephrase it or contact support.",
  schema_invalid: "Something went wrong while building your plan. Please try again.",
  rate_limited: "campAI is busy, try again in a minute.",
  upstream_error: "campAI couldn't reach its AI service. Please try again.",
  timeout: "This is taking longer than usual. Please try again.",
  internal_error: "Something went wrong. Please try again.",
} as const;

function json(body: unknown, status: number, extra?: HeadersInit, more?: HeadersInit): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  new Headers(extra ?? {}).forEach((v, k) => headers.set(k, v));
  new Headers(more ?? {}).forEach((v, k) => headers.set(k, v));
  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(code: AiErrorCode, status: number, message: string, requestId: string | null, headers?: HeadersInit): Response {
  return json({ error: { code, message, request_id: requestId } }, status, headers);
}

// ---------------------------------------------------------------------------
// Config from secrets
// ---------------------------------------------------------------------------

function config() {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY secret is not set");
  return {
    apiKey,
    model: Deno.env.get("OPENAI_MODEL") ?? "gpt-6-sol",
    modelLight: Deno.env.get("OPENAI_MODEL_LIGHT") ?? "gpt-6-luna",
    dailyLimit: Number(Deno.env.get("AI_DAILY_LIMIT_PER_USER") ?? "25") || 25,
  };
}

const TIMEOUTS_MS: Record<AiOperation, number> = { brief_check: 20_000, generate: 110_000, revise: 110_000 };

// ---------------------------------------------------------------------------
// Ledger helpers (admin client only)
// ---------------------------------------------------------------------------

async function estimateCost(admin: SupabaseClient, model: string, usage: OpenAiUsage): Promise<{ cost: number; pricingMissing: boolean }> {
  const { data } = await admin
    .from("ai_model_pricing")
    .select("input_per_million_usd, cached_input_per_million_usd, output_per_million_usd")
    .eq("model", model)
    .eq("active", true)
    .maybeSingle();
  if (!data) return { cost: 0, pricingMissing: true };
  const uncached = Math.max(0, usage.input_tokens - usage.cached_input_tokens);
  const cost =
    (uncached * Number(data.input_per_million_usd) +
      usage.cached_input_tokens * Number(data.cached_input_per_million_usd) +
      usage.output_tokens * Number(data.output_per_million_usd)) /
    1_000_000;
  return { cost: Math.round(cost * 1_000_000) / 1_000_000, pricingMissing: false };
}

interface LedgerUpdate {
  status: UsageStatus;
  model: string | null;
  usage: OpenAiUsage;
  error_code: string | null;
  latency_ms: number;
  response: AiResponse | null;
}

async function finishLedger(admin: SupabaseClient, requestId: string, u: LedgerUpdate): Promise<number> {
  let cost = 0;
  let errorCode = u.error_code;
  if (u.model) {
    const est = await estimateCost(admin, u.model, u.usage);
    cost = est.cost;
    if (est.pricingMissing) errorCode = `${errorCode ?? ""};pricing_missing`.replace(/^;/, "");
  }
  const { error } = await admin
    .from("ai_usage_events")
    .update({
      status: u.status,
      model: u.model,
      input_tokens: u.usage.input_tokens,
      cached_input_tokens: u.usage.cached_input_tokens,
      output_tokens: u.usage.output_tokens,
      total_tokens: u.usage.total_tokens,
      estimated_cost_usd: cost,
      error_code: errorCode,
      latency_ms: u.latency_ms,
      response: u.response,
    })
    .eq("request_id", requestId);
  if (error) console.error("ledger update failed", error.message);
  return cost;
}

// ---------------------------------------------------------------------------
// OpenAI call with the single allowed retry and outcome → failure mapping
// ---------------------------------------------------------------------------

interface CallSpec {
  model: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
}

/** Calls OpenAI, parses, validates with `parse`. One retry on schema failure or transient upstream error. */
async function callAndValidate<T>(apiKey: string, spec: CallSpec, parse: (raw: unknown) => { ok: true; value: T } | { ok: false; error: string }): Promise<{ value: T; usage: OpenAiUsage }> {
  let usage: OpenAiUsage = ZERO_USAGE;
  let firstError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const input = attempt === 0 || !firstError ? spec.input : spec.input + schemaRetrySuffix(firstError);
    const outcome: StructuredCallOutcome = await callStructured({ apiKey, ...spec, input });

    switch (outcome.kind) {
      case "timeout":
        throw new AiFailure("timeout", 504, MESSAGES.timeout, "timeout", usage);
      case "rate_limited":
        throw new AiFailure("rate_limited", 429, MESSAGES.rate_limited, "rate_limited", usage);
      case "refusal":
        usage = sumUsage(usage, outcome.usage);
        throw new AiFailure("refused", 422, MESSAGES.refused, "refused", usage);
      case "incomplete":
        usage = sumUsage(usage, outcome.usage);
        throw new AiFailure("incomplete_output", 502, MESSAGES.incomplete_output, "incomplete", usage);
      case "upstream_error": {
        const transient = outcome.status === 0 || outcome.status >= 500 || outcome.status === 200;
        if (transient && attempt === 0) {
          firstError = null; // retry same input
          continue;
        }
        throw new AiFailure("upstream_error", 502, MESSAGES.upstream_error, "upstream_error", usage);
      }
      case "ok": {
        usage = sumUsage(usage, outcome.usage);
        let raw: unknown;
        try {
          raw = JSON.parse(outcome.text);
        } catch {
          firstError = "output was not JSON";
          if (attempt === 0) continue;
          throw new AiFailure("schema_invalid", 502, MESSAGES.schema_invalid, "schema_invalid", usage);
        }
        const parsed = parse(raw);
        if (parsed.ok) return { value: parsed.value, usage };
        firstError = parsed.error;
        if (attempt === 0) continue;
        throw new AiFailure("schema_invalid", 502, MESSAGES.schema_invalid, "schema_invalid", usage);
      }
    }
  }
  throw new AiFailure("internal_error", 500, MESSAGES.internal_error, "internal_error", usage);
}

function zodParse<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } } }) {
  return (raw: unknown): { ok: true; value: T } | { ok: false; error: string } => {
    const r = schema.safeParse(raw);
    if (r.success) return { ok: true, value: r.data };
    const first = r.error.issues[0];
    return { ok: false, error: `${first?.path.join(".")}: ${first?.message}` };
  };
}

function usageSummary(model: string, usage: OpenAiUsage, cost: number, latency: number): UsageSummary {
  return { model, ...usage, estimated_cost_usd: cost, latency_ms: latency };
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

async function loadBrief(user: SupabaseClient, campaignId: string): Promise<CampaignBrief> {
  const { data, error } = await user.from("campaign_briefs").select("*").eq("campaign_id", campaignId).maybeSingle();
  if (error) throw new AiFailure("internal_error", 500, MESSAGES.internal_error, "internal_error");
  if (!data) throw new AiFailure("brief_missing", 409, "Finish the brief before building the campaign.", "invalid_request");
  return { ...data, budget_amount: Number(data.budget_amount), currency: String(data.currency).trim() } as CampaignBrief;
}

async function loadLatestPlan(user: SupabaseClient, campaignId: string): Promise<{ version: number; plan: CampaignPlan }> {
  const { data, error } = await user
    .from("campaign_plans")
    .select("version, plan")
    .eq("campaign_id", campaignId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AiFailure("internal_error", 500, MESSAGES.internal_error, "internal_error");
  if (!data) throw new AiFailure("plan_missing", 409, "Build the campaign first, then ask for changes.", "invalid_request");
  return { version: data.version as number, plan: data.plan as CampaignPlan };
}

function fixBriefCheckDates(result: BriefCheckResult, today: Date, defaults: { currency: string; market: string }): BriefCheckResult {
  const r = structuredClone(result);
  const s = r.fields.schedule;
  const fallback = toIsoDate(firstMondayOfNextMonth(today));
  const suggested = parseIsoDate(s.suggested_start_date);
  if (!suggested || suggested <= today) {
    s.suggested_start_date = fallback;
    s.status = s.status === "stated" ? "inferred" : s.status;
  }
  if (s.start_date !== null) {
    const d = parseIsoDate(s.start_date);
    if (!d || d <= today) {
      s.start_date = s.suggested_start_date;
      s.status = "inferred";
    }
  }
  if (!Number.isInteger(s.suggested_duration_weeks) || s.suggested_duration_weeks < 1 || s.suggested_duration_weeks > 12) {
    s.suggested_duration_weeks = 4;
  }
  if (s.duration_weeks !== null && (s.duration_weeks < 1 || s.duration_weeks > 12)) {
    s.duration_weeks = s.suggested_duration_weeks;
    s.status = "inferred";
  }
  const b = r.fields.budget;
  if (!(b.suggested_amount > 0)) b.suggested_amount = 1000;
  if (!/^[A-Z]{3}$/.test(b.suggested_currency ?? "")) b.suggested_currency = defaults.currency;
  if (b.currency !== null && !/^[A-Z]{3}$/.test(b.currency)) b.currency = b.suggested_currency;
  if (b.amount !== null && !(b.amount > 0)) {
    b.amount = null;
    b.status = "missing";
  }
  if (!r.fields.market.suggested_default.trim()) r.fields.market.suggested_default = defaults.market;
  return r;
}

async function runBriefCheck(ctx: HandlerContext, req: Extract<ParsedAiRequest, { operation: "brief_check" }>, cfg: ReturnType<typeof config>, started: number) {
  const serverToday = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const clientToday = parseIsoDate(req.defaults.today);
  const today = clientToday && Math.abs(clientToday.getTime() - serverToday.getTime()) <= 2 * 86_400_000 ? clientToday : serverToday;

  const { value, usage } = await callAndValidate<BriefCheckResult>(
    cfg.apiKey,
    {
      model: cfg.modelLight,
      instructions: BRIEF_CHECK_INSTRUCTIONS,
      input: briefCheckInput({ today: toIsoDate(today), currency: req.defaults.currency, market: req.defaults.market, freeText: req.free_text }),
      schemaName: "brief_check_result",
      schema: BRIEF_CHECK_SCHEMA_FOR_OPENAI,
      maxOutputTokens: OUTPUT_BOUNDS.maxOutputTokens.brief_check,
      timeoutMs: TIMEOUTS_MS.brief_check,
    },
    zodParse<BriefCheckResult>(BriefCheckResultSchema),
  );

  const result = fixBriefCheckDates(value, today, req.defaults);
  const latency = Date.now() - started;
  const cost = await finishLedger(ctx.adminClient, req.request_id, { status: "success", model: cfg.modelLight, usage, error_code: null, latency_ms: latency, response: null });
  const response: AiResponse = { operation: "brief_check", request_id: req.request_id, result, usage: usageSummary(cfg.modelLight, usage, cost, latency) };
  await ctx.adminClient.from("ai_usage_events").update({ response }).eq("request_id", req.request_id);
  return response;
}

async function runGenerate(ctx: HandlerContext, req: Extract<ParsedAiRequest, { operation: "generate" }>, cfg: ReturnType<typeof config>, started: number) {
  const brief = await loadBrief(ctx.userClient, req.campaign_id);
  const assumptions = briefCheckAssumptions(brief);

  await ctx.userClient.from("campaigns").update({ status: "generating", last_error: null }).eq("id", req.campaign_id);

  try {
    const { value, usage } = await callAndValidate<CampaignPlan>(
      cfg.apiKey,
      {
        model: cfg.model,
        instructions: GENERATE_INSTRUCTIONS,
        input: generateInput(brief, assumptions, toIsoDate(new Date())),
        schemaName: "campaign_plan",
        schema: CAMPAIGN_SCHEMA_FOR_OPENAI,
        maxOutputTokens: OUTPUT_BOUNDS.maxOutputTokens.generate,
        timeoutMs: TIMEOUTS_MS.generate,
      },
      zodParse<CampaignPlan>(CampaignPlanSchema),
    );

    const { plan, flags } = normalisePlan({ plan: value, brief });

    const { data: version, error } = await ctx.userClient.rpc("save_plan_version", {
      p_campaign_id: req.campaign_id,
      p_plan: plan,
      p_source: "generated",
      p_flags: flags,
    });
    if (error) {
      console.error("save_plan_version failed", error.message);
      throw new AiFailure("internal_error", 500, "Your plan was built but could not be saved. Please try again.", "internal_error", usage);
    }

    const latency = Date.now() - started;
    const cost = await finishLedger(ctx.adminClient, req.request_id, { status: "success", model: cfg.model, usage, error_code: null, latency_ms: latency, response: null });
    const response: AiResponse = {
      operation: "generate",
      request_id: req.request_id,
      campaign_id: req.campaign_id,
      plan_version: Number(version),
      plan,
      flags,
      usage: usageSummary(cfg.model, usage, cost, latency),
    };
    await ctx.adminClient.from("ai_usage_events").update({ response }).eq("request_id", req.request_id);
    return response;
  } catch (err) {
    const message = err instanceof AiFailure ? err.userMessage : MESSAGES.internal_error;
    // If a previous version exists the campaign is still usable; otherwise mark it as errored.
    const { data: existing } = await ctx.userClient.from("campaign_plans").select("version").eq("campaign_id", req.campaign_id).limit(1);
    await ctx.userClient
      .from("campaigns")
      .update({ status: existing && existing.length ? "ready" : "error", last_error: message })
      .eq("id", req.campaign_id);
    throw err;
  }
}

/** Assumptions the brief_check step already showed the user (stored in campaign_briefs.brief_check). */
// deno-lint-ignore no-explicit-any
function briefCheckAssumptions(brief: any): string[] {
  const rec = brief?.brief_check;
  const list = rec?.result?.assumptions;
  return Array.isArray(list) ? list.filter((x: unknown) => typeof x === "string") : [];
}

async function runRevise(ctx: HandlerContext, req: Extract<ParsedAiRequest, { operation: "revise" }>, cfg: ReturnType<typeof config>, started: number) {
  const [brief, current] = await Promise.all([loadBrief(ctx.userClient, req.campaign_id), loadLatestPlan(ctx.userClient, req.campaign_id)]);

  const { value, usage } = await callAndValidate<RevisionResult>(
    cfg.apiKey,
    {
      model: cfg.model,
      instructions: REVISE_INSTRUCTIONS,
      input: reviseInput({ instruction: req.instruction, locked: req.locked_sections, brief, plan: current.plan, today: toIsoDate(new Date()) }),
      schemaName: "revision_result",
      schema: REVISION_SCHEMA_FOR_OPENAI,
      maxOutputTokens: OUTPUT_BOUNDS.maxOutputTokens.revise,
      timeoutMs: TIMEOUTS_MS.revise,
    },
    zodParse<RevisionResult>(RevisionResultSchema),
  );

  // Locked sections are enforced in code, then normalisation runs so a locked budget stays exact.
  const restored = restoreLockedSections(current.plan, value.plan, req.locked_sections);
  const { plan: proposed, flags } = normalisePlan({ plan: restored, brief });
  const changed = diffSections(current.plan, proposed);

  const { data: rev, error } = await ctx.userClient
    .from("campaign_revisions")
    .insert({
      campaign_id: req.campaign_id,
      user_id: ctx.userId,
      request_id: req.request_id,
      instruction: req.instruction,
      locked_sections: req.locked_sections,
      changed_sections: changed,
      change_summary: value.change_summary,
      before_plan_version: current.version,
      proposed_plan: proposed,
      status: "proposed",
    })
    .select("id")
    .single();
  if (error || !rev) {
    console.error("revision insert failed", error?.message);
    throw new AiFailure("internal_error", 500, "The revision was built but could not be saved. Please try again.", "internal_error", usage);
  }

  const latency = Date.now() - started;
  const cost = await finishLedger(ctx.adminClient, req.request_id, { status: "success", model: cfg.model, usage, error_code: null, latency_ms: latency, response: null });
  const response: AiResponse = {
    operation: "revise",
    request_id: req.request_id,
    campaign_id: req.campaign_id,
    revision_id: rev.id as string,
    base_plan_version: current.version,
    proposed_plan: proposed,
    changed_sections: changed,
    change_summary: value.change_summary,
    flags: flags as ValidationFlag[],
    usage: usageSummary(cfg.model, usage, cost, latency),
  };
  await ctx.adminClient.from("ai_usage_events").update({ response }).eq("request_id", req.request_id);
  return response;
}

// ---------------------------------------------------------------------------
// Entry point used by both index.ts variants
// ---------------------------------------------------------------------------

export async function handleAiRequest(req: Request, ctx: HandlerContext): Promise<Response> {
  const H = ctx.responseHeaders;
  const started = Date.now();

  if (req.method !== "POST") return errorResponse("invalid_request", 405, "Use POST.", null, H);

  // 1. Parse and validate the body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid_request", 400, "The request body must be JSON.", null, H);
  }
  const parsed = AiRequestSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return errorResponse("invalid_request", 400, `Invalid request: ${first?.path.join(".")} ${first?.message}`.trim(), null, H);
  }
  const ai = parsed.data;

  // 2. Caller (already authenticated by index.ts)
  if (!ctx.userId) return errorResponse("unauthenticated", 401, "Please sign in.", ai.request_id, H);

  // 3. Ownership through RLS: a miss is a 404
  const { data: campaign, error: campaignErr } = await ctx.userClient.from("campaigns").select("id").eq("id", ai.campaign_id).maybeSingle();
  if (campaignErr) {
    console.error("campaign lookup failed", campaignErr.message);
    return errorResponse("internal_error", 500, MESSAGES.internal_error, ai.request_id, H);
  }
  if (!campaign) return errorResponse("not_found", 404, "We couldn't find that campaign.", ai.request_id, H);

  let cfg: ReturnType<typeof config>;
  try {
    cfg = config();
  } catch (e) {
    console.error(String(e));
    return errorResponse("internal_error", 500, MESSAGES.internal_error, ai.request_id, H);
  }

  // 4. Idempotency
  const { data: prior } = await ctx.adminClient.from("ai_usage_events").select("status, response, user_id").eq("request_id", ai.request_id).maybeSingle();
  if (prior) {
    if (prior.user_id === ctx.userId && prior.status === "success" && prior.response) {
      return json(prior.response, 200, H, { "X-Campai-Replayed": "true" });
    }
    return errorResponse("duplicate_request", 409, "That request was already handled. Start a new one.", ai.request_id, H);
  }

  // 5. Daily cap
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await ctx.adminClient
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.userId)
    .gte("created_at", dayStart.toISOString());
  if ((count ?? 0) >= cfg.dailyLimit) {
    await ctx.adminClient.from("ai_usage_events").insert({
      user_id: ctx.userId,
      campaign_id: ai.campaign_id,
      operation: ai.operation,
      request_id: ai.request_id,
      status: "daily_limit_reached",
      error_code: "daily_limit_reached",
      latency_ms: Date.now() - started,
    });
    return errorResponse("daily_limit_reached", 429, `You've reached today's limit of ${cfg.dailyLimit} AI actions. It resets at midnight UTC.`, ai.request_id, H);
  }

  // 6. Ledger row first (a crash still leaves a trace). Unique request_id catches a racing duplicate.
  const { error: ledgerErr } = await ctx.adminClient.from("ai_usage_events").insert({
    user_id: ctx.userId,
    campaign_id: ai.campaign_id,
    operation: ai.operation,
    request_id: ai.request_id,
    model: ai.operation === "brief_check" ? cfg.modelLight : cfg.model,
    status: "internal_error",
    error_code: "in_progress",
  });
  if (ledgerErr) {
    if (ledgerErr.code === "23505") return errorResponse("duplicate_request", 409, "That request is already being handled.", ai.request_id, H);
    console.error("ledger insert failed", ledgerErr.message);
    return errorResponse("internal_error", 500, MESSAGES.internal_error, ai.request_id, H);
  }

  // 7-10. Dispatch
  try {
    let response: AiResponse;
    switch (ai.operation) {
      case "brief_check":
        response = await runBriefCheck(ctx, ai, cfg, started);
        break;
      case "generate":
        response = await runGenerate(ctx, ai, cfg, started);
        break;
      case "revise":
        response = await runRevise(ctx, ai, cfg, started);
        break;
    }
    return json(response, 200, H);
  } catch (err) {
    const latency = Date.now() - started;
    if (err instanceof AiFailure) {
      await finishLedger(ctx.adminClient, ai.request_id, {
        status: err.ledgerStatus,
        model: ai.operation === "brief_check" ? cfg.modelLight : cfg.model,
        usage: err.usage,
        error_code: err.code,
        latency_ms: latency,
        response: null,
      });
      return errorResponse(err.code, err.httpStatus, err.userMessage, ai.request_id, H);
    }
    console.error("unhandled error", err instanceof Error ? err.stack ?? err.message : String(err));
    await finishLedger(ctx.adminClient, ai.request_id, {
      status: "internal_error",
      model: null,
      usage: ZERO_USAGE,
      error_code: "unhandled",
      latency_ms: latency,
      response: null,
    });
    return errorResponse("internal_error", 500, MESSAGES.internal_error, ai.request_id, H);
  }
}

// Re-exported for tests
export { addDays, endDateFor };
