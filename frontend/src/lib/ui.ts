type ButtonVariant = "primary" | "glow" | "secondary" | "ghost" | "onDark" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  // Navy in light mode, sky in dark mode.
  primary:
    "bg-brand-primary text-white hover:bg-space-800 dark:bg-brand-accent dark:text-space-950 dark:hover:bg-sky-300",
  // Sky pill with a glow, for the dark hero and chrome.
  glow: "bg-brand-accent text-space-950 shadow-[0_0_28px_rgb(56_189_248/0.45)] hover:bg-sky-300",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-accent-ink hover:bg-surface-2",
  onDark: "border border-white/25 text-white hover:bg-white/10",
  danger: "border border-line bg-surface text-risk-high-ink hover:bg-risk-high-soft",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return `${BUTTON_BASE} ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]}`;
}

export const cardClass = "rounded-2xl border border-line bg-surface shadow-sm";

export const eyebrowClass = "text-xs font-semibold uppercase tracking-[0.25em]";

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-muted outline-none transition focus:border-focus focus:ring-2 focus:ring-focus/30 disabled:cursor-not-allowed disabled:opacity-60";

export const linkClass =
  "font-medium text-accent-ink underline decoration-accent-ink/40 underline-offset-4 hover:decoration-accent-ink";
