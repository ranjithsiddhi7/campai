import { format, isValid, nextMonday, parseISO } from "date-fns";
import type { BriefDraft, DraftErrors, QuestionSpec } from "../../lib/brief";
import { endDateFor, firstMondayOfNextMonth, todayIso } from "../../lib/brief";
import { Input, Select, Textarea } from "../ui";

export const CURRENCIES = ["SGD", "USD", "EUR", "GBP", "AUD", "INR", "MYR", "IDR"];
const WEEKS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1} ${i === 0 ? "week" : "weeks"}` }));

/** Which validateDraft() error keys belong to each question. */
export function errorKeysFor(q: QuestionSpec): Array<keyof BriefDraft> {
  if (q.kind === "budget") return ["budget_amount", "currency"];
  if (q.kind === "schedule") return ["start_date", "duration_weeks"];
  return [q.key as keyof BriefDraft];
}

/** Turn an example chip into draft values. Text chips fill the field; budget and schedule chips are parsed. */
function exampleToPatch(q: QuestionSpec, example: string): Partial<BriefDraft> {
  if (q.kind === "budget") {
    const amount = example.replace(/[^\d.]/g, "");
    const currency = example.startsWith("US$") ? "USD" : example.startsWith("€") ? "EUR" : example.startsWith("S$") ? "SGD" : undefined;
    return currency ? { budget_amount: amount, currency } : { budget_amount: amount };
  }
  if (q.kind === "schedule") {
    const weeks = Number(example.match(/(\d+)\s*week/)?.[1] ?? 4);
    const lower = example.toLowerCase();
    let start = firstMondayOfNextMonth();
    if (lower.startsWith("next monday")) start = format(nextMonday(new Date()), "yyyy-MM-dd");
    const dayMonth = example.match(/^(\d{1,2})\s+([A-Za-z]+)/);
    if (dayMonth) {
      const year = new Date().getFullYear();
      for (const y of [year, year + 1]) {
        const d = new Date(`${dayMonth[2]} ${dayMonth[1]}, ${y}`);
        if (isValid(d) && format(d, "yyyy-MM-dd") > todayIso()) {
          start = format(d, "yyyy-MM-dd");
          break;
        }
      }
    }
    return { start_date: start, duration_weeks: weeks };
  }
  return { [q.key]: example } as Partial<BriefDraft>;
}

interface QuestionStepProps {
  question: QuestionSpec;
  draft: BriefDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<BriefDraft>) => void;
}

export function QuestionStep({ question: q, draft, errors, onChange }: QuestionStepProps) {
  const chips = (
    <div className="flex flex-wrap gap-2" aria-label="Examples">
      {q.examples.map((ex) => (
        <button
          key={ex}
          type="button"
          onClick={() => onChange(exampleToPatch(q, ex))}
          className="rounded-full border border-line-strong px-3 py-1 text-caption text-ink-secondary transition-colors duration-fast hover:border-accent hover:text-ink focus:outline-none focus-visible:shadow-focus"
        >
          {ex}
        </button>
      ))}
    </div>
  );

  let field;
  if (q.kind === "budget") {
    field = (
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Input
          label="Total budget"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder={q.placeholder}
          value={draft.budget_amount}
          onChange={(e) => onChange({ budget_amount: e.target.value })}
          error={errors.budget_amount}
          autoFocus
        />
        <Select label="Currency" options={CURRENCIES} value={draft.currency} onChange={(e) => onChange({ currency: e.target.value })} error={errors.currency} />
      </div>
    );
  } else if (q.kind === "schedule") {
    const start = parseISO(draft.start_date);
    const end = isValid(start) ? format(parseISO(endDateFor(draft.start_date, draft.duration_weeks)), "EEE d MMM yyyy") : null;
    field = (
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Input
          label="Start date"
          type="date"
          min={format(new Date(Date.now() + 86_400_000), "yyyy-MM-dd")}
          value={draft.start_date}
          onChange={(e) => onChange({ start_date: e.target.value })}
          error={errors.start_date}
          hint={end ? `Ends ${end}` : undefined}
          autoFocus
        />
        <Select
          label="Length"
          options={WEEKS}
          value={String(draft.duration_weeks)}
          onChange={(e) => onChange({ duration_weeks: Number(e.target.value) })}
          error={errors.duration_weeks}
        />
      </div>
    );
  } else {
    const key = q.key as keyof BriefDraft;
    field = (
      <Textarea
        label={q.label}
        hideLabel
        rows={3}
        placeholder={q.placeholder}
        value={String(draft[key] ?? "")}
        onChange={(e) => onChange({ [key]: e.target.value } as Partial<BriefDraft>)}
        error={errors[key]}
        autoFocus
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h2 text-ink sm:text-h1">{q.label}</h1>
        <p className="mt-3 text-body text-ink-secondary">
          {q.helper}
          {q.optional && <span className="ml-2 text-caption text-ink-muted">(optional)</span>}
        </p>
      </div>
      {field}
      <div>
        <p className="mb-2 text-caption text-ink-muted">Examples</p>
        {chips}
      </div>
    </div>
  );
}
