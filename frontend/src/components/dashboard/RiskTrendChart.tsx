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
  if (!trend.length) {
    return null;
  }

  const currentYear = trend.find((point) => !point.is_projection)?.year
    ?? trend[Math.min(3, trend.length - 1)].year;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-brand-primary">Risk Trend Timeline</h3>
        <p className="text-sm text-zinc-500">
          Historical points (2000–present) are interpolated from the current score,
          not independent historical analyses. Future years are simple projections.
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
              formatter={(value, name) => [value ?? 0, String(name)]}
              labelFormatter={(year) => `Year ${year}`}
            />
            <Legend />
            <ReferenceLine
              x={currentYear}
              stroke="#a1a1aa"
              strokeDasharray="4 4"
              label={{ value: "Today", position: "insideTopRight", fontSize: 11 }}
            />
            {HAZARD_LINES.map(({ key, label, color }) => (
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
        Dashed reference line marks the current year. Projected years (2030–2050) are extrapolated
        from observed climate trends.
      </p>
    </section>
  );
}
