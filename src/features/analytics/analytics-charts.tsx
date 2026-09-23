"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AnalyticsContribution,
  AnalyticsMetric,
  AnalyticsPoint,
} from "./analytics-data";

const metricConfig = {
  demand: {
    current: "demandKw",
    previous: "previousDemandKw",
    label: "Demand",
    unit: "kW",
  },
  energy: {
    current: "energyKwh",
    previous: "previousEnergyKwh",
    label: "Energy",
    unit: "kWh",
  },
  cost: {
    current: "costPkr",
    previous: "previousCostPkr",
    label: "Cost",
    unit: "PKR",
  },
} as const;

export function AnalyticsTrendChart({
  data,
  metric,
  compare,
}: {
  data: AnalyticsPoint[];
  metric: AnalyticsMetric;
  compare: boolean;
}) {
  const config = metricConfig[metric];
  return (
    <div className="analytics-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
        >
          <defs>
            <linearGradient id="analyticsCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickFormatter={(value) =>
              metric === "cost" && value >= 1000
                ? `${Math.round(value / 1000)}k`
                : String(value)
            }
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString()} ${config.unit}`,
              config.label,
            ]}
          />
          <Area
            type="monotone"
            dataKey={config.current}
            name={`Current ${config.label}`}
            stroke="var(--viz-1)"
            strokeWidth={2.4}
            fill="url(#analyticsCurrent)"
            dot={false}
          />
          {compare ? (
            <Area
              type="monotone"
              dataKey={config.previous}
              name={`Previous ${config.label}`}
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LoadProfileChart({ data }: { data: AnalyticsPoint[] }) {
  const normalized =
    data.length === 24
      ? data
      : Array.from({ length: 24 }, (_, index) => ({
          label: `${String(index).padStart(2, "0")}:00`,
          demandKw: Math.round(
            (data[index % data.length]?.demandKw ?? 0) *
              (0.7 + Math.sin((index / 24) * Math.PI) * 0.3),
          ),
          exportKw: Math.round(
            (data[index % data.length]?.exportKw ?? 0) *
              Math.max(0, Math.sin((index / 24) * Math.PI)),
          ),
        }));
  return (
    <div className="analytics-profile-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={normalized}
          margin={{ top: 8, right: 0, left: -28, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={3}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="demandKw"
            name="Demand kW"
            fill="var(--viz-1)"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="exportKw"
            name="Export kW"
            fill="var(--flow-export)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContributionChart({ data }: { data: AnalyticsContribution[] }) {
  return (
    <div className="analytics-contribution-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="energyKwh"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((item) => (
              <Cell key={item.meterId} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-control)",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${Number(value).toLocaleString()} kWh`,
              "Energy",
            ]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 10, color: "var(--muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
