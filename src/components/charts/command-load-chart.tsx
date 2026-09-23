"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { time: "00:00", demand: 420, solar: 0, previous: 450 },
  { time: "02:00", demand: 440, solar: 0, previous: 445 },
  { time: "04:00", demand: 460, solar: 0, previous: 470 },
  { time: "06:00", demand: 470, solar: 3, previous: 492 },
  { time: "08:00", demand: 512, solar: 18, previous: 530 },
  { time: "10:00", demand: 540, solar: 32, previous: 562 },
  { time: "12:00", demand: 560, solar: 40, previous: 610 },
  { time: "14:00", demand: 552, solar: 24, previous: 594 },
  { time: "15:00", demand: 553, solar: 18, previous: 580 },
  { time: "16:00", demand: null, solar: null, previous: 570 },
  { time: "18:00", demand: null, solar: null, previous: 620 },
  { time: "20:00", demand: null, solar: null, previous: 548 },
  { time: "22:00", demand: null, solar: null, previous: 480 },
];

type TooltipPayload = {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
};

function CommandTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="command-tooltip">
      <span>{label}</span>
      {payload.map((item) => (
        <div key={String(item.dataKey)}>
          <i style={{ background: item.color }} />
          <small>
            {item.dataKey === "previous" ? "Yesterday" : item.dataKey}
          </small>
          <strong className="num">{item.value} kW</strong>
        </div>
      ))}
    </div>
  );
}

export function CommandLoadChart() {
  return (
    <div className="command-load-chart" aria-label="Demand and energy chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="commandDemand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="commandSolar" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--flow-export)"
                stopOpacity={0.34}
              />
              <stop
                offset="100%"
                stopColor="var(--flow-export)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="2 6"
          />
          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            interval={1}
            dy={10}
          />
          <YAxis
            domain={[0, 1050]}
            axisLine={false}
            tickLine={false}
            ticks={[0, 250, 500, 750, 1000]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <Tooltip
            content={<CommandTooltip />}
            cursor={{ stroke: "var(--border)" }}
          />
          <ReferenceLine
            y={1000}
            stroke="var(--sev-warning)"
            strokeDasharray="4 6"
            strokeOpacity={0.52}
          />
          <Area
            type="monotone"
            dataKey="demand"
            stroke="var(--viz-1)"
            strokeWidth={2.5}
            fill="url(#commandDemand)"
            connectNulls={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
          />
          <Area
            type="monotone"
            dataKey="solar"
            stroke="var(--flow-export)"
            strokeWidth={2}
            fill="url(#commandSolar)"
            connectNulls={false}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="previous"
            stroke="var(--muted-foreground)"
            strokeOpacity={0.48}
            strokeWidth={1.5}
            strokeDasharray="4 6"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
