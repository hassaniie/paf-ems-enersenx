import type { AlarmSeverity } from "@/domain/types";
import { SeverityBadge } from "@/components/primitives/status";
import { cn } from "@/lib/cn";

export interface AlarmItemData {
  severity: AlarmSeverity;
  message: string;
  code: string;
  time: string;
  acknowledged?: boolean;
}

export function AlarmItem({ alarm }: { alarm: AlarmItemData }) {
  const color = `var(--sev-${alarm.severity})`;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-surface-2/40 px-3.5 py-3",
      )}
      style={{
        boxShadow: `inset 3px 0 0 0 ${color}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alarm.severity} />
          <span className="code text-xs text-faint">{alarm.code}</span>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-muted">
          {alarm.message}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="num text-[11px] whitespace-nowrap text-faint">
          {alarm.time}
        </span>
        {alarm.acknowledged ? (
          <span className="text-[11px] text-faint">Acked</span>
        ) : (
          <button
            type="button"
            className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
          >
            Ack
          </button>
        )}
      </div>
    </div>
  );
}
