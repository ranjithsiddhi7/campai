import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { FieldWrap, describedBy, fieldClasses } from "./Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, id, rows = 4, className = "", ...rest },
  ref,
) {
  const auto = useId();
  const areaId = id ?? auto;
  return (
    <FieldWrap id={areaId} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        className={`${fieldClasses} resize-y py-2.5 ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(areaId, hint, error)}
        {...rest}
      />
    </FieldWrap>
  );
});
