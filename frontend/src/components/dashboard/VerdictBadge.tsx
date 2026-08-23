import type { Verdict } from "@/types/risk";
import { verdictStyles } from "@/lib/risk-styles";

interface VerdictBadgeProps {
  verdict: Verdict;
  overallScore: number;
}

export function VerdictBadge({ verdict, overallScore }: VerdictBadgeProps) {
  const style = verdictStyles[verdict];
  const clampedScore = Math.max(0, Math.min(100, overallScore));

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl px-6 py-8 text-center shadow-md ${style.bg} ${style.text}`}
      role="status"
    >
      <div className="flex items-center gap-3 text-4xl font-bold sm:text-5xl">
        <span aria-hidden="true">{style.icon}</span>
        <span>{style.label}</span>
      </div>
      <p className="text-lg font-semibold">
        Overall Climate Risk Score: {clampedScore} / 100
      </p>
      <p className="max-w-xl text-sm opacity-90">{style.explanation}</p>
    </div>
  );
}
