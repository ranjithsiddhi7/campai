import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  CAFE_EXAMPLE,
  allMissing,
  emptyDraft,
  questionsToAsk,
  toBriefCheckRecord,
  toCampaignBrief,
  validateDraft,
  type BriefDraft,
  type DraftErrors,
} from "../lib/brief";
import { createCampaign, getBrief, getCampaign, renameCampaign, upsertBrief } from "../lib/campaigns";
import type { CampaignBrief, CampaignBriefRow } from "../types/campaign";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { QuestionStep, errorKeysFor } from "../components/brief/QuestionStep";
import { BriefSummary } from "../components/brief/BriefSummary";
import { Button, ErrorState, PageSpinner, ProgressDots, Textarea, buttonClasses } from "../components/ui";

type Stage = "start" | "questions" | "review";

function draftFromBrief(b: CampaignBriefRow): BriefDraft {
  return {
    goal: b.goal,
    business: b.business,
    product_or_service: b.product_or_service,
    audience_clues: b.audience_clues,
    budget_amount: String(b.budget_amount),
    currency: b.currency,
    market: b.market,
    start_date: b.start_date,
    duration_weeks: b.duration_weeks,
    existing_assets: b.existing_assets,
    tone_and_constraints: b.tone_and_constraints ?? "",
  };
}

function safeBrief(d: BriefDraft): CampaignBrief | null {
  try {
    return toCampaignBrief(d);
  } catch {
    return null;
  }
}

export default function NewCampaign() {
  useDocumentTitle("New campaign");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const existingId = params.get("campaign");

  // Smart start is cut (FAST-TRACK): Continue behaves like Skip, so every question is asked.
  const questions = useMemo(() => questionsToAsk(null), []);
  const statuses = useMemo(() => allMissing(), []);

  const [stage, setStage] = useState<Stage>(existingId ? "questions" : "start");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<BriefDraft>(() => emptyDraft());
  const [errors, setErrors] = useState<DraftErrors>({});
  const [returnToReview, setReturnToReview] = useState(false);
  const [freeText, setFreeText] = useState("");

  const [campaignId, setCampaignId] = useState<string | null>(existingId);
  const creating = useRef<Promise<string> | null>(null);
  const [starting, setStarting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(existingId));
  const [pageError, setPageError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // /app/new?campaign=<id>: reuse that campaign and prefill from its saved brief.
  useEffect(() => {
    if (!existingId) return;
    let cancelled = false;
    (async () => {
      try {
        const c = await getCampaign(existingId);
        if (cancelled) return;
        if (!c) {
          setPageError("We can't find that campaign. It may have been deleted, or it belongs to another account.");
          return;
        }
        const b = await getBrief(existingId);
        if (cancelled) return;
        if (b) {
          setDraft(draftFromBrief(b));
          setStage("review");
        }
      } catch (e) {
        if (!cancelled) setPageError(e instanceof Error ? e.message : "Could not load this campaign.");
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [existingId]);

  /** Creates the campaign row once, on the first Continue or Skip. */
  async function ensureCampaign(): Promise<string> {
    if (campaignId) return campaignId;
    if (!creating.current) creating.current = createCampaign().then((c) => c.id);
    try {
      const id = await creating.current;
      setCampaignId(id);
      return id;
    } catch (e) {
      creating.current = null;
      throw e;
    }
  }

  async function begin() {
    setStarting(true);
    setPageError(null);
    try {
      await ensureCampaign();
      setStep(0);
      setStage("questions");
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Could not start a new campaign.");
    } finally {
      setStarting(false);
    }
  }

  function update(patch: Partial<BriefDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(patch)) delete next[k];
      return next;
    });
  }

  function onContinue(e: FormEvent) {
    e.preventDefault();
    const q = questions[step];
    const all = validateDraft(draft);
    const mine: DraftErrors = {};
    for (const k of errorKeysFor(q)) if (all[k]) mine[k] = all[k];
    if (Object.keys(mine).length) {
      setErrors(mine);
      return;
    }
    setErrors({});
    if (returnToReview || step === questions.length - 1) {
      setReturnToReview(false);
      setStage("review");
    } else {
      setStep(step + 1);
    }
  }

  function onBack() {
    setErrors({});
    if (returnToReview) {
      setReturnToReview(false);
      setStage("review");
    } else if (step > 0) setStep(step - 1);
    else if (!existingId) setStage("start");
  }

  function editQuestion(index: number) {
    setStep(index);
    setReturnToReview(true);
    setErrors({});
    setStage("questions");
  }

  async function onSave() {
    setSaveError(null);
    const all = validateDraft(draft);
    const firstBad = questions.findIndex((q) => errorKeysFor(q).some((k) => all[k]));
    if (firstBad >= 0) {
      const mine: DraftErrors = {};
      for (const k of errorKeysFor(questions[firstBad])) if (all[k]) mine[k] = all[k];
      setErrors(mine);
      setStep(firstBad);
      setReturnToReview(true);
      setStage("questions");
      return;
    }
    setSaving(true);
    try {
      const id = await ensureCampaign();
      await upsertBrief(
        id,
        toCampaignBrief(draft),
        toBriefCheckRecord({ usedAi: false, freeText: null, result: null, statuses, answered: questions.map((q) => q.key) }),
      );
      await renameCampaign(id, draft.goal.trim().slice(0, 80));
      navigate(`/app/campaigns/${id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save your brief.");
      setSaving(false);
    }
  }

  if (loadingExisting) return <PageSpinner label="Loading your brief…" />;

  const backLink = (
    <Link to={existingId ? `/app/campaigns/${existingId}` : "/app"} className="inline-flex items-center gap-1 rounded text-small text-ink-muted hover:text-ink focus:outline-none focus-visible:shadow-focus">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {existingId ? "Back to campaign" : "Back to dashboard"}
    </Link>
  );

  if (pageError && stage !== "start") {
    return (
      <div className="mx-auto max-w-prose">
        <div className="mb-8">{backLink}</div>
        <ErrorState title="Something went wrong" message={pageError} actions={<Link to="/app" className={buttonClasses("ghost", "sm")}>Go to dashboard</Link>} />
      </div>
    );
  }

  if (stage === "start") {
    return (
      <div className="mx-auto max-w-prose">
        <div className="mb-8">{backLink}</div>
        <h1 className="text-h2 text-ink sm:text-h1">Tell us what you want, in your own words</h1>
        <form
          className="mt-8 flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            void begin();
          }}
        >
          <Textarea
            label="What you want"
            hideLabel
            rows={5}
            placeholder={CAFE_EXAMPLE}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            hint="One or two sentences is enough. We'll ask about anything we can't work out."
            autoFocus
          />
          {pageError && <ErrorState compact title="We couldn't start your campaign" message={pageError} onRetry={begin} />}
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" busy={starting} busyLabel="Getting ready…">
              Continue
            </Button>
            <button
              type="button"
              onClick={() => void begin()}
              disabled={starting}
              className="rounded text-small text-ink-secondary underline-offset-4 hover:text-ink hover:underline focus:outline-none focus-visible:shadow-focus disabled:opacity-50"
            >
              Skip and answer questions instead
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (stage === "review") {
    const brief = safeBrief(draft);
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">{backLink}</div>
        <h1 className="text-h2 text-ink sm:text-h1">Here's what we understood</h1>
        <p className="mt-3 text-body text-ink-secondary">Check your answers. You can change anything before we build the plan.</p>
        <div className="mt-8">{brief && <BriefSummary brief={brief} onEdit={editQuestion} showBadges />}</div>
        {saveError && (
          <div className="mt-6">
            <ErrorState compact title="We couldn't save your brief" message={saveError} onRetry={onSave} retrying={saving} />
          </div>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onSave} busy={saving} busyLabel="Saving…">
            Save and continue
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[step];
  const isLast = step === questions.length - 1;
  return (
    <div className="mx-auto max-w-prose">
      <div className="mb-8 flex items-center justify-between gap-4">
        {backLink}
        <ProgressDots total={questions.length} current={step} />
      </div>
      <form onSubmit={onContinue} noValidate key={q.key}>
        <QuestionStep question={q} draft={draft} errors={errors} onChange={update} />
        <div className="mt-10 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBack} disabled={step === 0 && !returnToReview && Boolean(existingId)}>
            Back
          </Button>
          <Button type="submit" size="lg">
            {returnToReview ? "Back to review" : isLast ? "Review my brief" : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
