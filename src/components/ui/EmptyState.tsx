import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-16 text-center">
      {icon && <div className="mb-4 text-ink-muted">{icon}</div>}
      <h2 className="text-h2 text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-prose text-body text-ink-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
