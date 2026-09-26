import { useCallback, useEffect, useMemo, type ComponentType } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, Sparkles } from "lucide-react";
import { useCampaign } from "../hooks/useCampaign";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { renameCampaign } from "../lib/campaigns";
import { CampaignPlanSchema } from "../lib/validation";
import { SECTION_KEYS, SECTION_LABELS, type CampaignPlan, type SectionKey } from "../types/campaign";
import { PageHeader, WorkspaceNav } from "../components/layout";
import { Button, ErrorState, PageSpinner, StatusBadge, buttonClasses, useToast } from "../components/ui";
import { BriefSummary } from "../components/brief/BriefSummary";
import { GenerationProgress } from "../components/brief/GenerationProgress";
import {
  AssumptionsSection,
  AudienceSection,
  BudgetSection,
  ChannelsSection,
  ContentSection,
  CopySection,
  CreativeBriefsSection,
  FlagsNotice,
  KpisSection,
  MessagingSection,
  OverviewSection,
  StrategySection,
  type SectionProps,
} from "../components/workspace";
import { CalendarTable } from "../components/calendar";
import { ProposalDiff, ReviseBar } from "../components/revision";

const SECTIONS: Record<Exclude<SectionKey, "calendar">, ComponentType<SectionProps>> = {
  overview: OverviewSection,
  audience: AudienceSection,
  strategy: StrategySection,
  messaging: MessagingSection,
  channels: ChannelsSection,
  content: ContentSection,
  copy: CopySection,
  creative_briefs: CreativeBriefsSection,
  budget: BudgetSection,
  kpis: KpisSection,
  assumptions: AssumptionsSection,
};

const backToDashboard = (
  <Link to="/app" className="inline-flex items-center gap-1 rounded text-small text-ink-muted hover:text-ink focus:outline-none focus-visible:shadow-focus">
    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
    Dashboard
  </Link>
);

const RESETS_NOTE = "Your daily AI allowance resets at midnight UTC (Coordinated Universal Time).";

export default function Campaign() {
  const c = useCampaign();
  const { campaign, brief, plan, loading, notFound, error, generating, generate, generateError, reload } = c;
  useDocumentTitle(plan?.title ?? campaign?.title ?? "Campaign");

  const status = campaign?.status;

  // A reload mid-generation (status "generating" but no call from this tab): re-check every 5 seconds.
  useEffect(() => {
    if (status !== "generating" || generating) return;
    const timer = window.setInterval(() => void reload(), 5000);
    return () => window.clearInterval(timer);
  }, [status, generating, reload]);

  if (loading) return <PageSpinner label="Loading your campaign…" />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-prose py-10">
        <h1 className="text-h2 text-ink">We can't find that campaign</h1>
        <p className="mt-3 text-body text-ink-secondary">It may have been deleted, or it belongs to another account.</p>
        <Link to="/app" className={buttonClasses("primary", "md", "mt-8")}>
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (!campaign) {
    return (
      <>
        <div className="mb-8">{backToDashboard}</div>
        <ErrorState title="We couldn't load this campaign" message={error ?? undefined} onRetry={() => void reload()} />
      </>
    );
  }

  if (generating || status === "generating") return <GenerationProgress />;

  // A failed build from this tab (any status), or a campaign whose last build failed with no plan yet.
  if (generateError || (status === "error" && !plan)) {
    const code = generateError?.code ?? "unknown";
    const message = generateError?.message ?? campaign.last_error ?? "Something went wrong building your campaign.";
    return <GenerationError code={code} message={message} campaignId={campaign.id} onRetry={() => void generate()} />;
  }

  if (!plan) {
    if (!brief) {
      return (
        <div className="mx-auto max-w-prose py-10">
          <div className="mb-8">{backToDashboard}</div>
          <h1 className="text-h2 text-ink">Finish your brief</h1>
          <p className="mt-3 text-body text-ink-secondary">We need a few answers before we can build this campaign.</p>
          <Link to={`/app/new?campaign=${campaign.id}`} className={buttonClasses("primary", "md", "mt-8")}>
            Continue your brief
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow={backToDashboard}
          title={campaign.title}
          meta={<StatusBadge status={campaign.status} />}
          description="Here's your brief. When it looks right, we'll build the full campaign."
        />
        <BriefSummary brief={brief} />
        {error && (
          <div className="mt-6">
            <ErrorState compact title="Something went wrong" message={error} onRetry={() => void reload()} />
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => void generate()} disabled={generating} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
            Build my campaign
          </Button>
          <Link to={`/app/new?campaign=${campaign.id}`} className={buttonClasses("secondary", "lg")}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit brief
          </Link>
        </div>
      </div>
    );
  }

  return <Workspace />;
}

function GenerationError({ code, message, campaignId, onRetry }: { code: string; message: string; campaignId: string; onRetry: () => void }) {
  let actions;
  if (code === "daily_limit_reached") {
    actions = (
      <Link to="/app/settings" className={buttonClasses("secondary", "sm")}>
        See your usage
      </Link>
    );
  } else if (code === "refused") {
    actions = (
      <Link to={`/app/new?campaign=${campaignId}`} className={buttonClasses("secondary", "sm")}>
        Back to brief
      </Link>
    );
  } else {
    actions = (
      <>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
        <Link to="/app" className={buttonClasses("ghost", "sm")}>
          Back to dashboard
        </Link>
      </>
    );
  }
  return (
    <div className="mx-auto max-w-prose py-10">
      <ErrorState
        title="We couldn't build your campaign"
        message={
          <>
            <p>{message}</p>
            {code === "daily_limit_reached" && <p className="mt-2">{RESETS_NOTE}</p>}
          </>
        }
        actions={actions}
      />
    </div>
  );
}

function Workspace() {
  const { campaign, plan, planVersion, flags, saving, error, generate, saveSection, proposal, revising, reload } = useCampaign();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const raw = params.get("section");
  const active: SectionKey = (SECTION_KEYS as readonly string[]).includes(raw ?? "") ? (raw as SectionKey) : "overview";
  const select = useCallback(
    (key: SectionKey) => {
      const next = new URLSearchParams(params);
      next.set("section", key);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const parsed = useMemo(() => CampaignPlanSchema.safeParse(plan), [plan]);

  const onSave = useCallback(
    async (patch: Partial<CampaignPlan>) => {
      if (!campaign) return;
      // Rename first: saveSection reloads, so the header and dashboard pick up the new title.
      if (typeof patch.title === "string" && patch.title.trim()) await renameCampaign(campaign.id, patch.title);
      await saveSection(patch);
      toast("Saved");
    },
    [campaign, saveSection, toast],
  );

  if (!campaign) return null;

  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-prose py-10">
        <ErrorState
          title="This campaign's data looks damaged"
          message="We can rebuild it from your brief."
          onRetry={() => void generate()}
          retryLabel="Rebuild"
        />
      </div>
    );
  }

  const data = parsed.data as CampaignPlan;
  const disabled = saving || revising || proposal !== null;
  const Section = active === "calendar" ? null : SECTIONS[active];

  return (
    <div className="pb-28">
      <PageHeader
        eyebrow={backToDashboard}
        title={data.title}
        meta={
          <>
            <StatusBadge status={campaign.status} />
            <span aria-live="polite">{saving ? "Saving…" : `All changes saved · Version ${planVersion}`}</span>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <WorkspaceNav active={active} onSelect={select} />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <FlagsNotice flags={flags} />
          {error && <ErrorState compact title="Something went wrong" message={error} onRetry={() => void reload()} />}
          <ProposalDiff />
          <div aria-label={SECTION_LABELS[active]}>{Section ? <Section plan={data} disabled={disabled} onSave={onSave} /> : <CalendarTable />}</div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto max-w-content px-4 py-3 sm:px-6">
          <ReviseBar />
        </div>
      </div>
    </div>
  );
}
