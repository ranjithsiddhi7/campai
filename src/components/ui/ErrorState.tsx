import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  /** Extra buttons or links next to Retry. */
  actions?: ReactNode;
  compact?: boolean;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, retryLabel = "Retry", retrying, actions, compact }: ErrorStateProps) {
  return (
    <div role="alert" className={`rounded-lg border border-state-danger/40 bg-state-danger/5 ${compact ? "p-4" : "p-6 sm:p-8"}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-state-danger" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className={compact ? "text-body font-semibold text-ink" : "text-h3 text-ink"}>{title}</h2>
          {message && <div className="mt-1 text-small text-ink-secondary">{message}</div>}
          {(onRetry || actions) && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry} busy={retrying}>
                  {retryLabel}
                </Button>
              )}
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
