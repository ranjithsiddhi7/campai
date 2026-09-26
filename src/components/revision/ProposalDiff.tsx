import { useEffect, useRef, type ReactNode } from "react";
import { useCampaign } from "../../hooks/useCampaign";
import { SECTION_FIELDS, SECTION_LABELS, type CampaignPlan, type SectionKey } from "../../types/campaign";
import { Badge, Button, Card, useToast } from "../ui";

/** "creative_briefs" → "Creative briefs" */
function humanise(key: string): string {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deeper than one level of nesting: flatten to a single line so the diff stays compact. */
function inline(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.map(inline).join("; ");
  if (isPlainObject(value)) return Object.entries(value).map(([k, v]) => `${humanise(k)}: ${inline(v)}`).join(", ");
  return String(value);
}

function DefinitionList({ obj, depth }: { obj: Record<string, unknown>; depth: number }) {
  return (
    <dl className="flex flex-col gap-1">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k}>
          <dt className="inline font-medium text-ink">{humanise(k)}: </dt>
          <dd className="inline">{depth < 1 && (Array.isArray(v) || isPlainObject(v)) ? <Readable value={v} depth={depth + 1} /> : inline(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Strings as paragraphs, string arrays as bullets, objects (and arrays of objects) as key: value lines, nested one level. */
function Readable({ value, depth = 0 }: { value: unknown; depth?: number }): ReactNode {
  if (value === null || value === undefined || value === "") return <p className="text-ink-muted">—</p>;
  if (typeof value !== "object") return <p className="whitespace-pre-line">{String(value)}</p>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-ink-muted">None</p>;
    if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
      return (
        <ul className="list-disc space-y-1 pl-5">
          {value.map((v, i) => (
            <li key={i}>{inline(v)}</li>
          ))}
        </ul>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {value.map((v, i) => (
          <div key={i} className={i > 0 ? "border-t border-line pt-3" : ""}>
            {isPlainObject(v) ? <DefinitionList obj={v} depth={depth} /> : <p>{inline(v)}</p>}
          </div>
        ))}
      </div>
    );
  }
  return <DefinitionList obj={value as Record<string, unknown>} depth={depth} />;
}

function FieldDiff({ field, current, proposed }: { field: string; current: unknown; proposed: unknown }) {
  return (
    <div>
      <h4 className="mb-2 text-small font-semibold text-ink">{humanise(field)}</h4>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded border border-line bg-bg-sunken p-3 text-small text-ink-secondary">
          <p className="mb-1 text-caption uppercase tracking-wide text-ink-muted">Current</p>
          <Readable value={current} />
        </div>
        <div className="rounded border border-accent/40 bg-accent-soft/40 p-3 text-small text-ink">
          <p className="mb-1 text-caption uppercase tracking-wide text-accent">Proposed</p>
          <Readable value={proposed} />
        </div>
      </div>
    </div>
  );
}

function CalendarDiff({ current, proposed }: { current: CampaignPlan["calendar_items"]; proposed: CampaignPlan["calendar_items"] }) {
  // Compare by title: saved rows have UUID ids while the model may return fresh "ci-01" style ids.
  const before = new Set(current.map((i) => i.title));
  const after = new Set(proposed.map((i) => i.title));
  const added = proposed.filter((i) => !before.has(i.title)).map((i) => i.title);
  const removed = current.filter((i) => !after.has(i.title)).map((i) => i.title);
  return (
    <div className="text-small text-ink-secondary">
      <p>
        Calendar: {current.length} items → {proposed.length} items
      </p>
      {added.length > 0 && <p className="mt-1">Added: {added.join("; ")}</p>}
      {removed.length > 0 && <p className="mt-1">Removed: {removed.join("; ")}</p>}
    </div>
  );
}

function SectionDiff({ section, plan, proposed }: { section: SectionKey; plan: CampaignPlan; proposed: CampaignPlan }) {
  if (section === "calendar") return <CalendarDiff current={plan.calendar_items} proposed={proposed.calendar_items} />;
  const fields = SECTION_FIELDS[section].filter((f) => JSON.stringify(plan[f]) !== JSON.stringify(proposed[f]));
  if (fields.length === 0) return <p className="text-small text-ink-muted">No visible differences.</p>;
  return (
    <div className="flex flex-col gap-4">
      {fields.map((f) => (
        <FieldDiff key={f} field={f} current={plan[f]} proposed={proposed[f]} />
      ))}
    </div>
  );
}

/** The open revision proposal: current vs proposed, with Apply / Discard. No props: everything comes from useCampaign(). */
export function ProposalDiff() {
  const { plan, planVersion, proposal, saving, applyProposal, discardProposal } = useCampaign();
  const { toast } = useToast();
  const applying = useRef(false);

  // Toast after the provider reloads the new plan version, so the number shown is the saved one.
  useEffect(() => {
    if (!applying.current) return;
    applying.current = false;
    toast(`Revision applied · Version ${planVersion}`);
  }, [planVersion, toast]);

  if (!proposal || !plan) return null;

  const onApply = async () => {
    applying.current = true;
    try {
      await applyProposal();
    } catch {
      applying.current = false;
      toast("We couldn't apply the revision.", "error");
    }
  };

  const onDiscard = async () => {
    try {
      await discardProposal();
      toast("Revision discarded", "info");
    } catch {
      toast("We couldn't discard the revision.", "error");
    }
  };

  return (
    <Card title="Proposed changes" className="border-accent/40" aria-live="polite">
      <p className="text-body text-ink-secondary">{proposal.change_summary}</p>
      {proposal.changed_sections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {proposal.changed_sections.map((s) => (
            <Badge key={s} tone="accent">
              {SECTION_LABELS[s]}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {proposal.changed_sections.map((s) => (
          <section key={s}>
            <h3 className="mb-3 text-h3 text-ink">{SECTION_LABELS[s]}</h3>
            <SectionDiff section={s} plan={plan} proposed={proposal.proposed_plan} />
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={() => void onApply()} disabled={saving} busy={saving && applying.current} busyLabel="Applying…">
          Apply changes
        </Button>
        <Button variant="secondary" onClick={() => void onDiscard()} disabled={saving}>
          Discard
        </Button>
      </div>
    </Card>
  );
}
