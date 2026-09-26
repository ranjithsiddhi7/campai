// PLACEHOLDERS (change set C1a). The teammate replaces these with the real section components on branch "teammate".
// Keep the export names and props identical (see ./types.ts); src/pages/Campaign.tsx imports them from "../components/workspace".

import { SECTION_FIELDS, SECTION_LABELS, type CampaignPlan, type SectionKey, type ValidationFlag } from "../../types/campaign";
import type { SectionProps } from "./types";

function pick(plan: CampaignPlan, key: SectionKey): Record<string, unknown> {
  return Object.fromEntries(SECTION_FIELDS[key].map((f) => [f, plan[f]]));
}

function JsonSection({ plan, section }: { plan: CampaignPlan; section: SectionKey }) {
  return (
    <section aria-labelledby={`sec-${section}`} className="rounded-lg border border-line bg-surface p-5">
      <h2 id={`sec-${section}`} className="text-h3 text-ink">
        {SECTION_LABELS[section]}
      </h2>
      <p className="mt-1 text-caption text-ink-muted">Placeholder view. The real section is coming.</p>
      <pre className="mt-4 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded bg-bg-sunken p-4 font-mono text-caption text-ink-secondary">
        {JSON.stringify(pick(plan, section), null, 2)}
      </pre>
    </section>
  );
}

export function OverviewSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="overview" />;
}
export function AudienceSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="audience" />;
}
export function StrategySection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="strategy" />;
}
export function MessagingSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="messaging" />;
}
export function ChannelsSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="channels" />;
}
export function ContentSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="content" />;
}
export function CopySection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="copy" />;
}
export function CreativeBriefsSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="creative_briefs" />;
}
export function BudgetSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="budget" />;
}
export function KpisSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="kpis" />;
}
export function AssumptionsSection({ plan }: SectionProps) {
  return <JsonSection plan={plan} section="assumptions" />;
}

export function FlagsNotice({ flags }: { flags: ValidationFlag[] }) {
  if (!flags.length) return null;
  return (
    <div role="note" className="rounded-md border border-state-warning/40 bg-state-warning/5 px-4 py-3 text-small text-ink-secondary">
      {flags.map((f, i) => (
        <p key={i}>{f.message}</p>
      ))}
    </div>
  );
}
