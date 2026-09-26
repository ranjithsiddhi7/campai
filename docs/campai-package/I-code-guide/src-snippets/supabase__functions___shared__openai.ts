// AI note: The only place campAI talks to OpenAI: one Responses API call with strict Structured Outputs, a timeout, and outcome mapping.
// Destination: supabase/functions/_shared/openai.ts. Owner: Claude Code. Never log the API key or the full prompt.

export interface OpenAiUsage {
  input_tokens: number;
  cached_input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export type StructuredCallOutcome =
  | { kind: "ok"; text: string; usage: OpenAiUsage }
  | { kind: "incomplete"; reason: string; usage: OpenAiUsage }
  | { kind: "refusal"; usage: OpenAiUsage }
  | { kind: "rate_limited"; status: number }
  | { kind: "upstream_error"; status: number; detail: string }
  | { kind: "timeout" };

export interface StructuredCallArgs {
  apiKey: string;
  model: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
}

const ZERO_USAGE: OpenAiUsage = { input_tokens: 0, cached_input_tokens: 0, output_tokens: 0, total_tokens: 0 };

// deno-lint-ignore no-explicit-any
function readUsage(body: any): OpenAiUsage {
  const u = body?.usage ?? {};
  return {
    input_tokens: Number(u.input_tokens ?? 0),
    cached_input_tokens: Number(u.input_tokens_details?.cached_tokens ?? 0),
    output_tokens: Number(u.output_tokens ?? 0),
    total_tokens: Number(u.total_tokens ?? (Number(u.input_tokens ?? 0) + Number(u.output_tokens ?? 0))),
  };
}

export function sumUsage(a: OpenAiUsage, b: OpenAiUsage): OpenAiUsage {
  return {
    input_tokens: a.input_tokens + b.input_tokens,
    cached_input_tokens: a.cached_input_tokens + b.cached_input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    total_tokens: a.total_tokens + b.total_tokens,
  };
}

/**
 * POST /v1/responses with text.format = json_schema (strict). Not streamed, not stored.
 * Returns a discriminated outcome; never throws for expected failures.
 */
export async function callStructured(args: StructuredCallArgs): Promise<StructuredCallOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), args.timeoutMs);

  const payload = {
    model: args.model,
    instructions: args.instructions,
    input: [{ role: "user", content: args.input }],
    text: {
      format: {
        type: "json_schema",
        name: args.schemaName,
        schema: args.schema,
        strict: true,
      },
    },
    max_output_tokens: args.maxOutputTokens,
    store: false,
  };

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") return { kind: "timeout" };
    console.error("openai network error", String(err));
    return { kind: "upstream_error", status: 0, detail: "network" };
  }
  clearTimeout(timer);

  if (res.status === 429) {
    await res.text().catch(() => "");
    return { kind: "rate_limited", status: 429 };
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 500);
    console.error("openai http error", res.status, detail);
    // 400 "Invalid schema" and similar are our bug, not transient; still reported as upstream_error to the user.
    return { kind: "upstream_error", status: res.status, detail };
  }

  // deno-lint-ignore no-explicit-any
  const body: any = await res.json();
  const usage = readUsage(body);

  if (body.status === "incomplete") {
    return { kind: "incomplete", reason: String(body.incomplete_details?.reason ?? "unknown"), usage };
  }
  if (body.status && body.status !== "completed") {
    console.error("openai unexpected status", body.status, body.error ?? "");
    return { kind: "upstream_error", status: 200, detail: `status ${body.status}` };
  }

  const output: unknown[] = Array.isArray(body.output) ? body.output : [];
  let text = "";
  for (const item of output) {
    // deno-lint-ignore no-explicit-any
    const it = item as any;
    if (it?.type !== "message") continue; // skip reasoning items
    for (const part of it.content ?? []) {
      if (part?.type === "refusal") return { kind: "refusal", usage };
      if (part?.type === "output_text" && typeof part.text === "string") text += part.text;
    }
  }
  if (!text) {
    console.error("openai empty output");
    return { kind: "upstream_error", status: 200, detail: "empty output" };
  }
  return { kind: "ok", text, usage };
}

export { ZERO_USAGE };
