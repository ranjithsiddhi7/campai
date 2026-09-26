import { useCampaign } from "../../hooks/useCampaign";

export function CalendarTable() {
  const { calendar } = useCampaign();
  return (
    <section aria-labelledby="sec-calendar" className="rounded-lg border border-line bg-surface p-5">
      <h2 id="sec-calendar" className="text-h3 text-ink">
        Calendar · {calendar.length} items
      </h2>
      <p className="mt-1 text-caption text-ink-muted">Placeholder view. The real calendar is coming.</p>
      <ul className="mt-4 divide-y divide-line text-small">
        {calendar.map((row) => (
          <li key={row.id} className="flex flex-wrap gap-x-4 gap-y-1 py-2">
            <span className="w-24 shrink-0 text-ink-muted">{row.date}</span>
            <span className="text-ink-secondary">{row.channel}</span>
            <span className="text-ink">{row.title}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
