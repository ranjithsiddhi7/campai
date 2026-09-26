interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  /** Visible sentence next to the spinner; also announced to screen readers. */
  label?: string;
  className?: string;
}

const dims = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };

export function Spinner({ size = "md", label, className = "" }: SpinnerProps) {
  const ring = <span aria-hidden="true" className={`inline-block animate-spin rounded-full border-line-strong border-t-accent ${dims[size]}`} />;
  if (!label) return ring;
  return (
    <div role="status" aria-live="polite" className={`flex items-center gap-3 text-small text-ink-secondary ${className}`}>
      {ring}
      <span>{label}</span>
    </div>
  );
}

/** Full-area loading state: never a blank page. */
export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
