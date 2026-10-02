import { useId } from "react";

// One arc per hazard, clockwise from the top-right quadrant.
const HAZARD_ARCS = [
  { label: "heat", color: "#fbbf24" },
  { label: "wildfire", color: "#f97316" },
  { label: "flood", color: "#3b82f6" },
  { label: "hurricane", color: "#a78bfa" },
] as const;

const RING_RADIUS = 14;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ARC_LENGTH = 16;

/**
 * The ClimateRisk mark: an address pin whose head holds a home ringed by the
 * four hazards we score (heat, wildfire, flood, hurricane).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path
        d="M32 61C32 61 9 41 9 26a23 23 0 0 1 46 0c0 15-23 35-23 35Z"
        fill={`url(#${gradientId})`}
      />
      <circle cx="32" cy="26" r="18" fill="#1e3a5f" />
      {HAZARD_ARCS.map(({ label, color }, index) => (
        <circle
          key={label}
          cx="32"
          cy="26"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${RING_CIRCUMFERENCE - ARC_LENGTH}`}
          transform={`rotate(${-90 + 9 + index * 90} 32 26)`}
        />
      ))}
      <path d="M24.5 27.5 32 20.5l7.5 7V33h-15Z" fill="#ffffff" />
      <rect x="30.25" y="28.5" width="3.5" height="4.5" rx="0.6" fill="#1e3a5f" />
    </svg>
  );
}

const WORDMARK_TONES = {
  dark: { climate: "", risk: "text-brand-accent" },
  light: { climate: "text-brand-primary", risk: "text-sky-600" },
} as const;

/**
 * Mark plus "ClimateRisk" wordmark. `tone="dark"` is for the navy site chrome,
 * `tone="light"` for white pages such as the printable report.
 */
export function Logo({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: keyof typeof WORDMARK_TONES;
}) {
  const colors = WORDMARK_TONES[tone];

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0 drop-shadow-sm" />
      <span className="text-xl tracking-tight">
        <span className={`font-light ${colors.climate}`}>Climate</span>
        <span className={`font-bold ${colors.risk}`}>Risk</span>
      </span>
    </span>
  );
}
