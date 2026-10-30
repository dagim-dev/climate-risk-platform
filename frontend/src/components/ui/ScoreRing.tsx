import type { ReactNode } from "react";

interface ScoreRingProps {
  /** 0–100, or null when there is no score: then only a dashed empty track is drawn. */
  score: number | null;
  /** Stroke color class for the arc, e.g. from `severityFillClass`. */
  fillClass?: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
}

/**
 * Decorative score ring. It never invents a value: with `score === null` there is no arc
 * and no number, only a dashed track. Callers provide the accessible text.
 */
export function ScoreRing({
  score,
  fillClass = "",
  size = 96,
  strokeWidth = 8,
  children,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const clamped = score === null ? null : Math.max(0, Math.min(100, score));

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={clamped === null ? 2 : strokeWidth}
          strokeDasharray={clamped === null ? "4 6" : undefined}
          className="stroke-line"
        />
        {clamped !== null && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped / 100)}
            className={`transition-[stroke-dashoffset] duration-700 ${fillClass}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
