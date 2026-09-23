"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function QualityTrendChart({
  powerFactor,
  frequency,
}: {
  powerFactor: number;
  frequency: number;
}) {
  const data = Array.from({ length: 13 }, (_, index) => ({
    time: `${String(index + 3).padStart(2, "0")}:00`,
    pf: Math.max(
      0.2,
      Math.min(1, powerFactor + Math.sin(index * 1.37) * 0.018),
    ),
    frequency: frequency + Math.sin(index * 0.82) * 0.035,
  }));
  return (
    <div
      className="quality-trend-chart"
      aria-label="Power factor and frequency trend"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            interval={2}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            yAxisId="pf"
            domain={[0.2, 1]}
            ticks={[0.4, 0.6, 0.8, 1]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <YAxis yAxisId="hz" orientation="right" domain={[49.5, 50.5]} hide />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              fontSize: 12,
            }}
          />
          <ReferenceLine
            yAxisId="pf"
            y={0.8}
            stroke="var(--sev-critical)"
            strokeDasharray="4 5"
          />
          <Line
            yAxisId="pf"
            type="monotone"
            dataKey="pf"
            name="Power factor"
            stroke="var(--viz-1)"
            strokeWidth={2.2}
            dot={false}
          />
          <Line
            yAxisId="hz"
            type="monotone"
            dataKey="frequency"
            name="Frequency"
            stroke="var(--viz-3)"
            strokeWidth={1.8}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
