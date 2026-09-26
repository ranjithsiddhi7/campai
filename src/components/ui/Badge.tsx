import type { ReactNode } from "react";
import type { CampaignStatus } from "../../types/campaign";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border-line-strong text-ink-secondary",
  accent: "border-accent/40 bg-accent-soft text-accent",
  success: "border-state-success/40 text-state-success",
  warning: "border-state-warning/40 text-state-warning",
  danger: "border-state-danger/40 text-state-danger",
  info: "border-state-info/40 text-state-info",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-caption font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

const STATUS: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  generating: { label: "Building…", tone: "info" },
  ready: { label: "Ready", tone: "success" },
  error: { label: "Needs attention", tone: "danger" },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = STATUS[status] ?? STATUS.draft;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
