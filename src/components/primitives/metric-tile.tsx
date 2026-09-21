import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/primitives/sparkline";
import { cn } from "@/lib/cn";

export interface MetricDelta {
  text: string;
  dir: "up" | "down" | "flat";
  /** Good drives color, not the arrow. Omit for a neutral (gray) delta. */
  good?: boolean;
}

export function MetricTile({
  label,
  value,
  unit,
  sub,
  delta,
  spark,
  valueClassName,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  delta?: MetricDelta;
  spark?: { data: number[]; color?: string };
  valueClassName?: string;
}) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] leading-tight font-medium tracking-wider text-faint uppercase">
          {label}
        </span>
        {delta ? <DeltaChip delta={delta} /> : null}
      </div>

      <div className="num mt-2.5 flex items-baseline gap-1">
        <span
          className={cn(
            "text-[26px] leading-none font-semibold text-text",
            valueClassName,
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-sm font-medium text-muted">{unit}</span>
        ) : null}
      </div>

      {sub ? <p className="mt-1.5 text-xs text-faint">{sub}</p> : null}

      {spark ? (
        <div className="mt-3 -mb-1">
          <Sparkline data={spark.data} color={spark.color} />
        </div>
      ) : null}
    </Card>
  );
}

function DeltaChip({ delta }: { delta: MetricDelta }) {
  const color =
    delta.dir === "flat" || delta.good === undefined
      ? "var(--text-faint)"
      : delta.good
        ? "var(--delta-up)"
        : "var(--delta-down)";
  const Icon =
    delta.dir === "up"
      ? ArrowUpRight
      : delta.dir === "down"
        ? ArrowDownRight
        : Minus;
  return (
    <span
      className="num inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      <Icon className="size-3" />
      {delta.text}
    </span>
  );
}
