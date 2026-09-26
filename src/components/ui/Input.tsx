import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

export const fieldClasses =
  "w-full rounded border border-line bg-bg-sunken px-3 text-body text-ink placeholder:text-ink-muted transition-colors duration-fast hover:border-line-strong focus:border-accent focus:outline-none focus-visible:shadow-focus disabled:opacity-50 aria-[invalid=true]:border-state-danger";

interface FieldWrapProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
  children: ReactNode;
}

/** Label + control + hint + inline error, shared by Input, Textarea and Select. */
export function FieldWrap({ id, label, hint, error, hideLabel, children }: FieldWrapProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-small font-medium text-ink"}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-caption text-state-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, hint?: ReactNode, error?: string | null): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, hideLabel, id, className = "", ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <FieldWrap id={inputId} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <input
        ref={ref}
        id={inputId}
        className={`${fieldClasses} h-11 ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, hint, error)}
        {...rest}
      />
    </FieldWrap>
  );
});
