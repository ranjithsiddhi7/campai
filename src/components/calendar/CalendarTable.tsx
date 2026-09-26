import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useCampaign } from "../../hooks/useCampaign";
import type { CalendarItemRow, CalendarItemStatus } from "../../types/campaign";
import { Badge, Button, Card, useToast, type BadgeTone } from "../ui";
import { CalendarItemDrawer, STATUS_OPTIONS, prettyDate } from "./CalendarItemDrawer";

const STATUS_TONE: Record<CalendarItemStatus, BadgeTone> = {
  planned: "neutral",
  in_progress: "info",
  done: "success",
  skipped: "warning",
};

function StatusPill({ status }: { status: CalendarItemStatus }) {
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;
}

/** No props: rows and edit helpers come from useCampaign(). Every write saves a new plan version on the server. */
export function CalendarTable() {
  const { calendar, plan, planVersion, saving, revising, proposal } = useCampaign();
  const { toast } = useToast();
  // null = closed, "new" = adding, otherwise the id of the row being edited.
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(
    () => [...calendar].sort((a, b) => (a.date === b.date ? a.sort_order - b.sort_order : a.date < b.date ? -1 : 1)),
    [calendar],
  );
  const editing: CalendarItemRow | null = open && open !== "new" ? (rows.find((r) => r.id === open) ?? null) : null;

  // Toast once the provider has reloaded and the new plan version is known.
  const pending = useRef<"saved" | "removed" | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    toast(pending.current === "removed" ? `Item removed · Version ${planVersion}` : `Saved · Version ${planVersion}`);
    pending.current = null;
  }, [planVersion, toast]);

  const locked = proposal !== null || revising;
  const actionsDisabled = locked || saving || !plan;

  return (
    <section aria-labelledby="sec-calendar" className="rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sec-calendar" tabIndex={-1} className="text-h3 text-ink focus:outline-none">
            Calendar · {rows.length} {rows.length === 1 ? "item" : "items"}
          </h2>
          {plan && (
            <p className="mt-1 text-caption text-ink-muted">
              {prettyDate(plan.timeline.start_date, "EEE d MMM yyyy")} to {prettyDate(plan.timeline.end_date, "EEE d MMM yyyy")}
            </p>
          )}
          {locked && <p className="mt-1 text-caption text-state-warning">Apply or discard the current proposal first.</p>}
        </div>
        <Button size="sm" icon={<Plus className="h-4 w-4" aria-hidden="true" />} onClick={() => setOpen("new")} disabled={actionsDisabled}>
          Add item
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 text-small text-ink-muted">No calendar items yet. Add the first one.</p>
      ) : (
        <>
          {/* md and above: table */}
          <div className="mt-4 hidden md:block">
            <table className="w-full table-fixed text-left text-small">
              <thead className="text-caption text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="w-24 py-2 pr-3 font-medium">Date</th>
                  <th scope="col" className="w-14 py-2 pr-3 font-medium">Week</th>
                  <th scope="col" className="w-32 py-2 pr-3 font-medium">Channel</th>
                  <th scope="col" className="w-28 py-2 pr-3 font-medium">Format</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Title</th>
                  <th scope="col" className="w-28 py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="w-16 py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="py-3 pr-3 whitespace-nowrap text-ink-secondary">{prettyDate(row.date)}</td>
                    <td className="py-3 pr-3 text-ink-secondary">{row.week_number}</td>
                    <td className="py-3 pr-3 break-words text-ink-secondary">{row.channel}</td>
                    <td className="py-3 pr-3 break-words text-ink-secondary">{row.format}</td>
                    <td className="py-3 pr-3 break-words text-ink">{row.title}</td>
                    <td className="py-3 pr-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setOpen(row.id)} disabled={actionsDisabled} aria-label={`Edit ${row.title}`}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* below md: cards */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <Card padded={false} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-caption text-ink-muted">
                      {prettyDate(row.date)} · Week {row.week_number}
                    </p>
                    <StatusPill status={row.status} />
                  </div>
                  <p className="mt-1 break-words text-body text-ink">{row.title}</p>
                  <p className="mt-1 break-words text-caption text-ink-secondary">
                    {row.channel} · {row.format}
                  </p>
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={() => setOpen(row.id)} disabled={actionsDisabled} aria-label={`Edit ${row.title}`}>
                      Edit
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && plan && (open === "new" || editing) && (
        <CalendarItemDrawer
          key={open}
          row={editing}
          onClose={() => setOpen(null)}
          onWrite={(kind) => {
            pending.current = kind;
          }}
        />
      )}
    </section>
  );
}
