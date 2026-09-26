// AI note: Typed browser client for the campaign-ai Edge Function: one function per operation, request_id idempotency, safe error mapping.
// Destination: src/lib/api.ts. Owner: Bolt creates it from this snippet in prompt H5; Claude Code may fix it while Bolt is idle.

import { FunctionsHttpError, FunctionsFetchError, FunctionsRelayError } from "@supabase/supabase-js";
import { CAMPAIGN_AI_FUNCTION, supabase } from "./supabase";
import type {
  AiErrorCode,
  AiRequest,
  BriefCheckResponse,
  GenerateResponse,
  ReviseResponse,
  SectionKey,
} from "../types/campaign";

/** Thrown for every failed AI call. `message` is always safe to show to the user. */
export class AiClientError extends Error {
  constructor(
    public readonly code: AiErrorCode | "network" | "unknown",
    message: string,
    public readonly status: number | null,
    public readonly requestId: string | null,
  ) {
    super(message);
    this.name = "AiClientError";
  }
}

const FRIENDLY: Record<string, string> = {
  network: "We couldn't reach campAI. Check your connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

/** Client-side timeouts: a little above the server's, so the server error arrives first when it can. */
const TIMEOUT_MS: Record<AiRequest["operation"], number> = {
  brief_check: 25_000,
  generate: 120_000,
  revise: 120_000,
};

export function newRequestId(): string {
  return crypto.randomUUID();
}

async function invoke<T>(body: AiRequest): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS[body.operation]);
  try {
    const { data, error } = await supabase.functions.invoke<T>(CAMPAIGN_AI_FUNCTION, {
      body,
      signal: controller.signal,
    });
    if (error) throw await toClientError(error, body.request_id);
    if (!data) throw new AiClientError("unknown", FRIENDLY.unknown, null, body.request_id);
    return data;
  } catch (err) {
    if (err instanceof AiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AiClientError("timeout", "This is taking longer than usual. Please try again.", null, body.request_id);
    }
    throw new AiClientError("network", FRIENDLY.network, null, body.request_id);
  } finally {
    clearTimeout(timer);
  }
}

async function toClientError(error: unknown, requestId: string): Promise<AiClientError> {
  // supabase-js wraps non-2xx responses in FunctionsHttpError with the raw Response in `context`.
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    try {
      const body = (await res.json()) as { error?: { code?: AiErrorCode; message?: string; request_id?: string | null } };
      const code = body?.error?.code ?? "unknown";
      const message = body?.error?.message ?? FRIENDLY.unknown;
      return new AiClientError(code, message, res.status, body?.error?.request_id ?? requestId);
    } catch {
      return new AiClientError("unknown", FRIENDLY.unknown, res?.status ?? null, requestId);
    }
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    return new AiClientError("network", FRIENDLY.network, null, requestId);
  }
  return new AiClientError("unknown", FRIENDLY.unknown, null, requestId);
}

// ---- The three operations ---------------------------------------------------

export function briefCheck(args: {
  campaignId: string;
  freeText: string;
  defaults: { today: string; currency: string; market: string };
  requestId?: string;
}): Promise<BriefCheckResponse> {
  return invoke<BriefCheckResponse>({
    operation: "brief_check",
    request_id: args.requestId ?? newRequestId(),
    campaign_id: args.campaignId,
    free_text: args.freeText.trim().slice(0, 2000),
    defaults: args.defaults,
  });
}

export function generateCampaign(args: { campaignId: string; requestId?: string }): Promise<GenerateResponse> {
  return invoke<GenerateResponse>({
    operation: "generate",
    request_id: args.requestId ?? newRequestId(),
    campaign_id: args.campaignId,
  });
}

export function reviseCampaign(args: {
  campaignId: string;
  instruction: string;
  lockedSections: SectionKey[];
  requestId?: string;
}): Promise<ReviseResponse> {
  return invoke<ReviseResponse>({
    operation: "revise",
    request_id: args.requestId ?? newRequestId(),
    campaign_id: args.campaignId,
    instruction: args.instruction.trim().slice(0, 500),
    locked_sections: args.lockedSections,
  });
}

/*
Usage in a component (the request id is created ONCE per user action and reused if the user retries the same action,
so a double click or a retry after a network blip never bills twice):

  const requestIdRef = useRef<string>(newRequestId());
  async function onBuild() {
    try {
      const res = await generateCampaign({ campaignId, requestId: requestIdRef.current });
      // res.plan, res.flags, res.plan_version
      requestIdRef.current = newRequestId(); // next action gets a fresh id
    } catch (e) {
      if (e instanceof AiClientError && e.code === "duplicate_request") { reload(); } // the earlier attempt finished
      else if (e instanceof AiClientError) { setError(e.message); }
    }
  }
*/
