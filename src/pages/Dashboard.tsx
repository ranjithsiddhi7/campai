import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Megaphone, Plus } from "lucide-react";
import { listCampaigns } from "../lib/campaigns";
import type { CampaignRow } from "../types/campaign";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout";
import { EmptyState, ErrorState, PageSpinner, StatusBadge, buttonClasses } from "../components/ui";

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const [campaigns, setCampaigns] = useState<CampaignRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCampaigns(await listCampaigns());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !campaigns) return <PageSpinner label="Loading your campaigns…" />;

  if (error) {
    return (
      <>
        <PageHeader title="Campaigns" />
        <ErrorState title="We couldn't load your campaigns" message={error} onRetry={load} retrying={loading} />
      </>
    );
  }

  const list = campaigns ?? [];

  return (
    <>
      <PageHeader
        title={
          <>
            Campaigns {list.length > 0 && <span className="text-ink-muted">({list.length})</span>}
          </>
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" aria-hidden="true" />}
          title="No campaigns yet"
          description="Tell us what you want in your own words and we'll build the plan."
          action={
            <Link to="/app/new" className={buttonClasses("primary", "md")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Start your first campaign
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <li key={c.id}>
              <Link
                to={`/app/campaigns/${c.id}`}
                className="group flex h-full flex-col rounded-lg border border-line bg-surface p-5 shadow-card transition-colors duration-base hover:border-line-strong hover:bg-surface-hover focus:outline-none focus-visible:shadow-focus"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="line-clamp-2 min-w-0 break-words text-h3 text-ink">{c.title}</h2>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-auto pt-6 text-caption text-ink-muted">
                  Updated {formatDistanceToNow(parseISO(c.updated_at), { addSuffix: true })}
                  {c.status === "ready" && c.current_plan_version > 0 && ` · Version ${c.current_plan_version}`}
                </p>
                {c.status === "error" && <span className="mt-2 text-caption text-state-danger">Retry build</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
