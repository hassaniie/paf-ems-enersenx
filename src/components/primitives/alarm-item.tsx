import type { AlarmSeverity } from "@/domain/types";
import { SeverityBadge } from "@/components/primitives/status";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-start gap-3 rounded-lg border border-border bg-elevated/40 p-3">
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alarm.severity} />
          <span className="code text-xs text-muted-foreground">
            {alarm.code}
          </span>
          <span className="num ml-auto text-[11px] whitespace-nowrap text-muted-foreground">
            {alarm.time}
          </span>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-foreground/90">
          {alarm.message}
        </p>
        {!alarm.acknowledged ? (
          <div className="mt-2.5">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
              Acknowledge
            </Button>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Acknowledged · auto-clears when resolved
          </p>
        )}
      </div>
    </div>
  );
}
