import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export interface StatDelta {
  text: string;
  dir: "up" | "down";
  good?: boolean; // drives color, not arrow. omit → neutral.
}

export interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  /** What the figure compares against, e.g. "vs yesterday". Always shown. */
  sub?: string;
  icon?: LucideIcon;
  /** A CSS color for the corner status dot (e.g. "var(--status-faulty)"). */
  statusColor?: string;
  delta?: StatDelta;
  valueClassName?: string;
}

/**
 * A stat card is a number: label, figure, and what it compares to — nothing
 * added to fill it. (unslop pass: no sparkline/mini-chart decoration here —
 * the one real chart on the screen is the site-load area chart.)
 */
export function StatCard({
  label,
  value,
  unit,
  sub,
  icon: Icon,
  statusColor,
  delta,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        {Icon ? (
          <span className="grid size-9 place-items-center rounded-lg border border-border bg-elevated text-muted-foreground">
            <Icon className="size-4.5" />
          </span>
        ) : (
          <span className="text-[13px] font-medium text-muted-foreground">
            {label}
          </span>
        )}
        <div className="flex items-center gap-2">
          {delta ? <DeltaChip delta={delta} /> : null}
          {statusColor ? (
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
          ) : null}
        </div>
      </div>

      {Icon ? (
        <span className="mt-4 text-[13px] font-medium text-muted-foreground">
          {label}
        </span>
      ) : null}

      <div
        className={cn("num flex items-baseline gap-1", Icon ? "mt-1" : "mt-3")}
      >
        <span
          className={cn(
            "text-[28px] leading-none font-semibold tracking-tight text-foreground",
            valueClassName,
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-sm font-medium text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>

      {sub ? (
        <p className="mt-2 text-[13px] text-muted-foreground">{sub}</p>
      ) : null}
    </Card>
  );
}

function DeltaChip({ delta }: { delta: StatDelta }) {
  const color =
    delta.good === undefined
      ? "var(--muted-foreground)"
      : delta.good
        ? "var(--delta-up)"
        : "var(--delta-down)";
  const Icon = delta.dir === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="num inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[12px] font-medium"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      <Icon className="size-3.5" />
      {delta.text}
    </span>
  );
}
