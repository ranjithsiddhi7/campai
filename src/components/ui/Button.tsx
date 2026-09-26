import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-fast focus:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-ink-inverse hover:bg-accent-hover",
  secondary: "border border-line-strong text-ink hover:bg-surface-hover",
  ghost: "text-ink-secondary hover:bg-surface-hover hover:text-ink",
  danger: "border border-state-danger/60 text-state-danger hover:bg-state-danger/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-small",
  md: "h-10 px-4 text-small",
  lg: "h-12 px-6 text-body",
};

/** Classes for links that should look like buttons (react-router <Link className={buttonClasses()} />). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = ""): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, disables the button and replaces the label with busyLabel when given. */
  busy?: boolean;
  busyLabel?: string;
  icon?: ReactNode;
}

export function Button({ variant = "primary", size = "md", busy = false, busyLabel, icon, className = "", disabled, children, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy ? <Spinner size="sm" /> : icon}
      <span>{busy && busyLabel ? busyLabel : children}</span>
    </button>
  );
}
