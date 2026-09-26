interface ProgressDotsProps {
  total: number;
  /** Zero-based index of the current step. */
  current: number;
  /** Visible label, for example "Question 2 of 6". Defaults to that wording. */
  label?: string;
}

export function ProgressDots({ total, current, label }: ProgressDotsProps) {
  const text = label ?? `Question ${current + 1} of ${total}`;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-base ${i === current ? "w-6 bg-accent" : i < current ? "w-1.5 bg-ink-secondary" : "w-1.5 bg-line-strong"}`}
          />
        ))}
      </div>
      <span className="text-caption text-ink-muted">{text}</span>
    </div>
  );
}
