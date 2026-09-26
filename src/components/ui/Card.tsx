import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Optional heading row rendered above the content. */
  title?: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}

export function Card({ title, actions, padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-lg border border-line bg-surface shadow-card ${padded ? "p-5 sm:p-6" : ""} ${className}`} {...rest}>
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          {title && <h3 className="text-h3 text-ink">{title}</h3>}
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
