import { format, parseISO, isValid } from "date-fns";
import type { CampaignBrief } from "../../types/campaign";
import { Badge } from "../ui";

function niceDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE d MMM yyyy") : iso;
}

export interface BriefRow {
  /** Question index in QUESTIONS, used by the Edit link. */
  index: number;
  label: string;
  value: string;
}

/** The nine brief values as rows, in the fixed question order. */
export function briefRows(b: CampaignBrief): BriefRow[] {
  return [
    { index: 0, label: "Goal", value: b.goal },
    { index: 1, label: "Business", value: b.business },
    { index: 2, label: "Promoting", value: b.product_or_service },
    { index: 3, label: "Who you want to attract", value: b.audience_clues },
    { index: 4, label: "Total budget", value: `${b.currency} ${Number(b.budget_amount).toLocaleString()}` },
    { index: 5, label: "Where your customers are", value: b.market },
    {
      index: 6,
      label: "Schedule",
      value: `${niceDate(b.start_date)} to ${niceDate(b.end_date)} (${b.duration_weeks} ${b.duration_weeks === 1 ? "week" : "weeks"})`,
    },
    { index: 7, label: "What you already have", value: b.existing_assets },
    { index: 8, label: "Tone and things to avoid", value: b.tone_and_constraints || "Nothing specified" },
  ];
}

interface BriefSummaryProps {
  brief: CampaignBrief;
  /** When given, each row gets an "Edit" link jumping to that question. */
  onEdit?: (index: number) => void;
  /** Show the "You told us" badge (all answers come from the user now that smart start is cut). */
  showBadges?: boolean;
}

export function BriefSummary({ brief, onEdit, showBadges }: BriefSummaryProps) {
  return (
    <dl className="divide-y divide-line rounded-lg border border-line bg-surface">
      {briefRows(brief).map((row) => (
        <div key={row.label} className="grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr_auto] sm:items-start sm:gap-6">
          <dt className="text-small text-ink-muted">{row.label}</dt>
          <dd className="min-w-0 whitespace-pre-line break-words text-body text-ink">{row.value}</dd>
          <dd className="flex items-center gap-3 sm:justify-end">
            {showBadges && <Badge tone="neutral">You told us</Badge>}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row.index)}
                className="rounded text-small text-accent underline-offset-4 hover:underline focus:outline-none focus-visible:shadow-focus"
                aria-label={`Edit ${row.label.toLowerCase()}`}
              >
                Edit
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
