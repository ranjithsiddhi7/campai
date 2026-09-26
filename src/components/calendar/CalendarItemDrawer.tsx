import { useEffect, useId, useRef, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { useCampaign } from "../../hooks/useCampaign";
import type { CalendarItemPatch } from "../../lib/campaigns";
import type { CalendarItemRow, CalendarItemStatus } from "../../types/campaign";
import { Button, Input, Modal, Select, Textarea } from "../ui";

export const STATUS_OPTIONS: { value: CalendarItemStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "skipped", label: "Skipped" },
];

/** Every editable CalendarItem field (all but id). ad_script is kept as "" in the form and saved as null when empty. */
interface Draft {
  date: string;
  week_number: string;
  channel: string;
  format: string;
  objective: string;
  content_pillar: string;
  title: string;
  hook: string;
  body: string;
  cta: string;
  creative_direction: string;
  ad_script: string;
  status: CalendarItemStatus;
  notes: string;
}

type Errors = Partial<Record<"date" | "channel" | "format" | "title" | "week_number", string>>;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function toDraft(row: CalendarItemRow | null, startDate: string): Draft {
  if (!row) {
    return {
      date: startDate,
      week_number: "1",
      channel: "",
      format: "",
      objective: "",
      content_pillar: "",
      title: "",
      hook: "",
      body: "",
      cta: "",
      creative_direction: "",
      ad_script: "",
      status: "planned",
      notes: "",
    };
  }
  return {
    date: row.date,
    week_number: String(row.week_number),
    channel: row.channel,
    format: row.format,
    objective: row.objective,
    content_pillar: row.content_pillar,
    title: row.title,
    hook: row.hook,
    body: row.body,
    cta: row.cta,
    creative_direction: row.creative_direction,
    ad_script: row.ad_script ?? "",
    status: row.status,
    notes: row.notes,
  };
}

function toItem(d: Draft): Required<CalendarItemPatch> {
  return {
    date: d.date,
    week_number: Number(d.week_number),
    channel: d.channel.trim(),
    format: d.format.trim(),
    objective: d.objective.trim(),
    content_pillar: d.content_pillar.trim(),
    title: d.title.trim(),
    hook: d.hook.trim(),
    body: d.body.trim(),
    cta: d.cta.trim(),
    creative_direction: d.creative_direction.trim(),
    ad_script: d.ad_script.trim() === "" ? null : d.ad_script.trim(),
    status: d.status,
    notes: d.notes.trim(),
  };
}

/** Only the fields that differ from the saved row. */
function diff(row: CalendarItemRow, next: Required<CalendarItemPatch>): CalendarItemPatch {
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (row[k as keyof CalendarItemRow] !== v) patch[k] = v;
  }
  return patch as CalendarItemPatch;
}

export function weekFor(date: string, startDate: string): number {
  return Math.max(1, Math.floor(differenceInCalendarDays(parseISO(date), parseISO(startDate)) / 7) + 1);
}

export function prettyDate(date: string, pattern = "EEE d MMM"): string {
  try {
    return format(parseISO(date), pattern);
  } catch {
    return date;
  }
}

interface Props {
  /** The row to edit, or null to add a new item. */
  row: CalendarItemRow | null;
  onClose: () => void;
  /** Called just before a write so the table can toast once the new plan version arrives. */
  onWrite: (kind: "saved" | "removed" | null) => void;
}

/** Right-side panel (full screen below md) editing one calendar item through the database helpers. */
export function CalendarItemDrawer({ row, onClose, onWrite }: Props) {
  const { plan, saving, revising, proposal, editCalendarItem, createCalendarItem, removeCalendarItem } = useCampaign();
  const start = plan?.timeline.start_date ?? "";
  const end = plan?.timeline.end_date ?? "";
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<Draft>(() => toDraft(row, start));
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ kind: "saved" | "removed"; work: () => Promise<void> } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const locked = proposal !== null || revising;
  const disabled = saving || locked;

  // Escape closes (not while saving or while the confirm dialog is open); Tab stays inside; focus returns to the opener.
  const state = useRef({ saving, confirmOpen, onClose });
  state.current = { saving, confirmOpen, onClose };
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKey(e: KeyboardEvent) {
      if (state.current.confirmOpen || !panel.current) return;
      if (e.key === "Escape" && !state.current.saving) {
        state.current.onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // After every cleanup has run: back to the Edit / Add button, or the section heading if that row is gone.
      requestAnimationFrame(() => {
        if (opener?.isConnected) opener.focus();
        else document.getElementById("sec-calendar")?.focus();
      });
    };
  }, []);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => {
      const next = { ...d, [key]: value };
      // A new date recomputes the week; the user can still override the week afterwards.
      if (key === "date" && start && typeof value === "string" && value) next.week_number = String(weekFor(value, start));
      return next;
    });
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(d: Draft): Errors {
    const e: Errors = {};
    if (!d.date) e.date = "Add a date.";
    else if ((start && d.date < start) || (end && d.date > end)) e.date = `Pick a date between ${prettyDate(start, "d MMM yyyy")} and ${prettyDate(end, "d MMM yyyy")}.`;
    if (!d.channel.trim()) e.channel = "Add a channel.";
    if (!d.format.trim()) e.format = "Add a format.";
    if (!d.title.trim()) e.title = "Add a title.";
    const w = Number(d.week_number);
    if (!Number.isInteger(w) || w < 1) e.week_number = "Use a whole week number from 1.";
    return e;
  }

  async function run(kind: "saved" | "removed", work: () => Promise<void>) {
    setSaveError(null);
    setLastAttempt({ kind, work });
    onWrite(kind);
    try {
      await work();
      onClose();
    } catch (e) {
      onWrite(null);
      setSaveError(e instanceof Error ? e.message : "Something went wrong saving your change.");
    }
  }

  function onSave() {
    const e = validate(draft);
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const item = toItem(draft);
    if (!row) {
      void run("saved", () => createCalendarItem(item));
      return;
    }
    const patch = diff(row, item);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    void run("saved", () => editCalendarItem(row.id, patch));
  }

  async function onRemove() {
    if (!row) return;
    setConfirmOpen(false);
    await run("removed", () => removeCalendarItem(row.id));
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => !saving && onClose()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full flex-col border-l border-line bg-bg-raised shadow-card md:max-w-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-h3 text-ink">
              {row ? "Edit calendar item" : "Add calendar item"}
            </h2>
            {row && <p className="mt-0.5 text-caption text-ink-muted">{prettyDate(row.date, "EEEE d MMMM yyyy")}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded p-1 text-ink-muted hover:text-ink focus:outline-none focus-visible:shadow-focus disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!disabled) onSave();
          }}
          noValidate
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {locked && (
              <p className="mb-4 rounded border border-state-warning/40 px-3 py-2 text-small text-state-warning" role="status">
                Apply or discard the current proposal first.
              </p>
            )}
            <fieldset disabled={disabled} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <legend className="sr-only">Calendar item fields</legend>
              <Input
                label="Date"
                type="date"
                required
                min={start || undefined}
                max={end || undefined}
                value={draft.date}
                onChange={(e) => set("date", e.target.value)}
                hint={start && end ? `Between ${prettyDate(start, "d MMM yyyy")} and ${prettyDate(end, "d MMM yyyy")}` : undefined}
                error={errors.date}
              />
              <Input
                label="Week"
                type="number"
                min={1}
                step={1}
                value={draft.week_number}
                onChange={(e) => set("week_number", e.target.value)}
                error={errors.week_number}
              />
              <Input label="Channel" required value={draft.channel} onChange={(e) => set("channel", e.target.value)} error={errors.channel} />
              <Input label="Format" required value={draft.format} onChange={(e) => set("format", e.target.value)} error={errors.format} />
              <Input label="Objective" value={draft.objective} onChange={(e) => set("objective", e.target.value)} />
              <Input label="Content pillar" value={draft.content_pillar} onChange={(e) => set("content_pillar", e.target.value)} />
              <div className="md:col-span-2">
                <Input label="Title" required value={draft.title} onChange={(e) => set("title", e.target.value)} error={errors.title} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Hook" rows={2} value={draft.hook} onChange={(e) => set("hook", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Body" rows={4} value={draft.body} onChange={(e) => set("body", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Input label="CTA (call to action)" value={draft.cta} onChange={(e) => set("cta", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Creative direction" rows={3} value={draft.creative_direction} onChange={(e) => set("creative_direction", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Ad script (optional)" rows={3} value={draft.ad_script} onChange={(e) => set("ad_script", e.target.value)} />
              </div>
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={draft.status}
                onChange={(e) => set("status", e.target.value as CalendarItemStatus)}
              />
              <div className="md:col-span-2">
                <Textarea label="Notes" rows={2} value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </fieldset>
          </div>

          <div className="border-t border-line px-5 py-4">
            {saveError && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-state-danger/40 px-3 py-2" role="alert">
                <p className="text-small text-state-danger">{saveError}</p>
                <Button size="sm" variant="secondary" disabled={disabled || !lastAttempt} onClick={() => lastAttempt && void run(lastAttempt.kind, lastAttempt.work)}>
                  Retry
                </Button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={locked} busy={saving} busyLabel="Saving…">
                Save
              </Button>
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              {row && (
                <Button variant="danger" className="ml-auto" onClick={() => setConfirmOpen(true)} disabled={disabled}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        busy={saving}
        title="Remove this calendar item?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void onRemove()}>
              Remove
            </Button>
          </>
        }
      >
        This can't be undone.
      </Modal>
    </div>
  );
}
