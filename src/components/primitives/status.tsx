import type { CSSProperties } from "react";
import type { AlarmSeverity, MeterStatus } from "@/domain/types";
import { cn } from "@/lib/cn";

/* Presentational metadata for domain states. The color is a CSS var so the
 * safety-critical status tokens are the single source (never a hardcoded hex). */

const STATUS_META: Record<
  MeterStatus,
  { label: string; varName: string; hollow?: boolean }
> = {
  online: { label: "Online", varName: "--status-online" },
  stale: { label: "Stale", varName: "--status-stale" },
  offline: { label: "Offline", varName: "--status-offline" },
  faulty: { label: "Faulty", varName: "--status-faulty" },
  "awaiting-data": {
    label: "Awaiting data",
    varName: "--status-awaiting",
    hollow: true,
  },
};

const SEVERITY_META: Record<AlarmSeverity, { label: string; varName: string }> =
  {
    critical: { label: "Critical", varName: "--sev-critical" },
    warning: { label: "Warning", varName: "--sev-warning" },
    info: { label: "Info", varName: "--sev-info" },
  };

/** Small state dot. Filled for live states; hollow ring for awaiting-data. */
export function StatusDot({
  status,
  className,
}: {
  status: MeterStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const color = `var(${meta.varName})`;
  const style: CSSProperties = meta.hollow
    ? { boxShadow: `inset 0 0 0 1.5px ${color}` }
    : { backgroundColor: color };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={style}
    />
  );
}

/** Dot + label pill. Status is never color-alone (always carries the label). */
export function StatusBadge({
  status,
  className,
}: {
  status: MeterStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  const color = `var(${meta.varName})`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
    >
      <StatusDot status={status} />
      {meta.label}
    </span>
  );
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: AlarmSeverity;
  className?: string;
}) {
  const meta = SEVERITY_META[severity];
  const color = `var(${meta.varName})`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        className,
      )}
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
      }}
    >
      {meta.label}
    </span>
  );
}
