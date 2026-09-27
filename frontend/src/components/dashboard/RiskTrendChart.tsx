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

import type { TrendPoint } from "@/types/risk";

interface RiskTrendChartProps {
  trend: TrendPoint[];
}

const HAZARD_LINES = [
  { key: "flood_score" as const, label: "Flood", color: "#2563eb" },
  { key: "hurricane_score" as const, label: "Hurricane", color: "#7c3aed" },
  { key: "heat_score" as const, label: "Heat", color: "#dc2626" },
  { key: "wildfire_score" as const, label: "Wildfire", color: "#ea580c" },
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
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-brand-primary">Risk Outlook</h3>
        <p className="text-sm text-zinc-500">
          Only today&apos;s scores are assessed from data. Later years are simple linear
          projections from today&apos;s scores, not forecasts.
        </p>
      </div>

      <div className="h-80 w-full rounded-md border border-zinc-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              stroke="#71717a"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="#71717a"
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 12, fill: "#71717a" },
              }}
            />
            <Tooltip
              formatter={(value, name) => [value ?? "Not assessed", String(name)]}
              labelFormatter={(year) => `Year ${year}`}
            />
            <Legend />
            {currentYear !== undefined && (
              <ReferenceLine
                x={currentYear}
                stroke="#a1a1aa"
                strokeDasharray="4 4"
                label={{ value: "Today", position: "insideTopRight", fontSize: 11 }}
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

      <p className="text-xs text-zinc-500">
        The dashed line marks today. Projection slopes reflect each hazard&apos;s observed signal
        (e.g. the NOAA hot-day trend) and are illustrative only.
        {lines.length < HAZARD_LINES.length && " Hazards that could not be assessed are not shown."}
      </p>
    </section>
  );
}
