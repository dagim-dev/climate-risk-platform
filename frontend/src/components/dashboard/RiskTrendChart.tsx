"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cardClass } from "@/lib/ui";
import type { TrendPoint } from "@/types/risk";

interface RiskTrendChartProps {
  trend: TrendPoint[];
}

const HAZARD_LINES = [
  { key: "flood_score" as const, label: "Flood", color: "var(--chart-flood)" },
  { key: "hurricane_score" as const, label: "Hurricane", color: "var(--chart-hurricane)" },
  { key: "heat_score" as const, label: "Heat", color: "var(--chart-heat)" },
  { key: "wildfire_score" as const, label: "Wildfire", color: "var(--chart-wildfire)" },
];

export function RiskTrendChart({ trend }: RiskTrendChartProps) {
  // Hazards that could not be assessed have no baseline and are left off the chart.
  const lines = HAZARD_LINES.filter(({ key }) => trend.some((point) => point[key] !== null));
  if (!trend.length || !lines.length) {
    return null;
  }

  const observed = trend.filter((point) => !point.is_projection);
  const currentYear = observed.length ? observed[observed.length - 1].year : undefined;

  return (
    <section className={`${cardClass} space-y-4 p-5 sm:p-6`}>
      <div>
        <h3 className="font-display text-3xl text-ink">Risk Outlook</h3>
        <p className="mt-1 text-sm leading-6 text-ink-muted">
          Only today&apos;s scores are assessed from data. Later years are simple linear
          projections from today&apos;s scores, not forecasts.
        </p>
      </div>

      <div className="h-72 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
              stroke="var(--chart-axis)"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
              stroke="var(--chart-axis)"
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "var(--chart-axis)" },
              }}
            />
            <Tooltip
              formatter={(value, name) => [value ?? "Not assessed", String(name)]}
              labelFormatter={(year) => `Year ${year}`}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                color: "var(--ink)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--ink)", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            {currentYear !== undefined && (
              <ReferenceLine
                x={currentYear}
                stroke="var(--chart-axis)"
                strokeDasharray="4 4"
                label={{
                  value: "Today",
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "var(--chart-axis)",
                }}
              />
            )}
            {lines.map(({ key, label, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs leading-5 text-ink-muted">
        The dashed line marks today. Projection slopes reflect each hazard&apos;s observed signal
        (e.g. the NOAA hot-day trend) and are illustrative only.
        {lines.length < HAZARD_LINES.length && " Hazards that could not be assessed are not shown."}
      </p>
    </section>
  );
}
