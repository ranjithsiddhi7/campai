import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { FieldWrap, describedBy, fieldClasses } from "./Input";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  options: SelectOption[] | string[];
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, hint, error, hideLabel, id, className = "", ...rest },
  ref,
) {
  const auto = useId();
  const selectId = id ?? auto;
  const opts: SelectOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <FieldWrap id={selectId} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`${fieldClasses} h-11 appearance-none pr-9 ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, hint, error)}
          {...rest}
        >
          {opts.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-raised">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
    </FieldWrap>
  );
});
