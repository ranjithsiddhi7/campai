import type { ValidationFlag } from "../../types/campaign";

export function FlagsNotice({ flags }: { flags: ValidationFlag[] }) {
  if (!flags || !flags.length) return null;
  return (
    <div role="note" className="rounded-md border border-state-warning/40 bg-state-warning/5 px-4 py-3 text-small text-ink-secondary flex flex-col gap-1.5">
      {flags.map((f, i) => (
        <p key={i} className="text-small text-ink-secondary">
          {f.message}
          {f.ref && <span className="ml-2 font-mono text-caption text-ink-muted">({f.ref})</span>}
        </p>
      ))}
    </div>
  );
}
