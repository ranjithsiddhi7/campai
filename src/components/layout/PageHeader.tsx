import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  /** Small line above the title, for example a back link. */
  eyebrow?: ReactNode;
  /** Line under the title: badges, version, save status. */
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, meta, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-3 text-small text-ink-muted">{eyebrow}</div>}
        <h1 className="break-words text-h2 text-ink sm:text-h1">{title}</h1>
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-small text-ink-secondary">{meta}</div>}
        {description && <p className="mt-3 max-w-prose text-body text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
