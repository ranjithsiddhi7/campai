import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getUsageSummary, listRecentUsage, type UsageSummaryRow } from "../lib/campaigns";
import type { AiOperation, AiUsageEventRow, UsageStatus } from "../types/campaign";
import { PageHeader } from "../components/layout";
import { Badge, Button, Card, ErrorState, PageSpinner, type BadgeTone } from "../components/ui";

/** Shown next to "Calls today". Must match the AI_DAILY_LIMIT_PER_USER Edge Function secret. */
const DAILY_LIMIT = 10;

const OPERATION_LABEL: Record<AiOperation, string> = {
  brief_check: "Brief check",
  generate: "Generate",
  revise: "Revise",
};

const WARNING_STATUSES: UsageStatus[] = ["daily_limit_reached", "rate_limited", "timeout", "incomplete"];

function statusTone(s: UsageStatus): BadgeTone {
  if (s === "success") return "success";
  return WARNING_STATUSES.includes(s) ? "warning" : "danger";
}

const n = (v: unknown) => Number(v ?? 0);
const int = (v: unknown) => n(v).toLocaleString();
const usd = (v: unknown) => `US$${n(v).toFixed(4)}`;
const secs = (ms: number | null) => (ms === null || ms === undefined ? "—" : `${(n(ms) / 1000).toFixed(1)} s`);
const when = (iso: string) => format(parseISO(iso), "d MMM HH:mm");

function Figure({ label, value, caption }: { label: string; value: ReactNode; caption: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-bg-raised p-4">
      <dt className="text-caption text-ink-muted">{label}</dt>
      <dd className="mt-1 break-words text-h2 text-ink">{value}</dd>
      <dd className="mt-1 text-caption text-ink-secondary">{caption}</dd>
    </div>
  );
}

export default function Settings() {
  useDocumentTitle("Settings");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<UsageSummaryRow | null>(null);
  const [events, setEvents] = useState<AiUsageEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, e] = await Promise.all([getUsageSummary(), listRecentUsage(20)]);
      setSummary(s);
      setEvents(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your AI usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
    navigate("/", { replace: true });
  }

  let usage: ReactNode;
  if (loading && !summary) {
    usage = <PageSpinner label="Loading your AI usage…" />;
  } else if (error) {
    usage = <ErrorState title="We couldn't load your AI usage" message={error} onRetry={load} retrying={loading} />;
  } else if (!summary || summary.total_calls === 0) {
    usage = (
      <Card title="AI usage">
        <p className="text-small text-ink-muted">No AI calls yet.</p>
      </Card>
    );
  } else {
    usage = (
      <div className="flex flex-col gap-8">
        <Card title="AI usage">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Figure
              label="Calls"
              value={int(summary.total_calls)}
              caption={`${int(summary.successful_calls)} succeeded · ${int(summary.failed_calls)} failed`}
            />
            <Figure label="Calls today" value={int(summary.calls_today)} caption={`of ${DAILY_LIMIT} per day`} />
            <Figure
              label="Tokens"
              value={int(summary.total_tokens)}
              caption={`${int(summary.input_tokens)} in · ${int(summary.cached_input_tokens)} cached · ${int(summary.output_tokens)} out`}
            />
            <Figure
              label="Estimated cost"
              value={usd(summary.estimated_cost_usd)}
              caption="Estimated from list prices in USD (United States dollars) at the time of each call"
            />
          </dl>
        </Card>

        <section aria-labelledby="recent-activity">
          <h2 id="recent-activity" className="text-h3 text-ink">
            Recent activity
          </h2>
          {events.length === 0 ? (
            <p className="mt-3 text-small text-ink-muted">No AI calls yet.</p>
          ) : (
            <>
              {/* Table from md up */}
              <div className="mt-4 hidden overflow-x-auto rounded-lg border border-line md:block">
                <table className="w-full text-left text-small">
                  <thead className="bg-bg-raised text-caption text-ink-muted">
                    <tr>
                      {["Time", "Operation", "Model", "Status", "Tokens", "Cost", "Latency"].map((h) => (
                        <th key={h} scope="col" className={`px-4 py-3 font-medium ${["Tokens", "Cost", "Latency"].includes(h) ? "text-right" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {events.map((ev) => (
                      <tr key={ev.id} className="text-ink-secondary">
                        <td className="whitespace-nowrap px-4 py-3">{when(ev.created_at)}</td>
                        <td className="px-4 py-3 text-ink">{OPERATION_LABEL[ev.operation] ?? ev.operation}</td>
                        <td className="px-4 py-3 font-mono text-caption">{ev.model ?? "—"}</td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(ev.status)}>{ev.status.replace(/_/g, " ")}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{int(ev.total_tokens)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{usd(ev.estimated_cost_usd)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{secs(ev.latency_ms)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards below md */}
              <ul className="mt-4 flex flex-col gap-3 md:hidden">
                {events.map((ev) => (
                  <li key={ev.id} className="rounded-md border border-line bg-surface p-4 text-small">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-ink">{OPERATION_LABEL[ev.operation] ?? ev.operation}</span>
                      <Badge tone={statusTone(ev.status)}>{ev.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-1 text-caption text-ink-muted">
                      {when(ev.created_at)} · <span className="font-mono">{ev.model ?? "—"}</span>
                    </p>
                    <p className="mt-2 text-ink-secondary tabular-nums">
                      {int(ev.total_tokens)} tokens · {usd(ev.estimated_cost_usd)} · {secs(ev.latency_ms)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-3 text-caption text-ink-muted">Every attempt is recorded, including failures.</p>
        </section>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-8">
        <Card title="Account">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="break-words text-body text-ink">{user?.email}</p>
              <p className="mt-1 text-caption text-ink-muted">Signed in with email and password.</p>
            </div>
            <Button variant="secondary" onClick={onSignOut} busy={signingOut} busyLabel="Signing out…" icon={<LogOut className="h-4 w-4" aria-hidden="true" />}>
              Sign out
            </Button>
          </div>
        </Card>
        {usage}
      </div>
    </>
  );
}
