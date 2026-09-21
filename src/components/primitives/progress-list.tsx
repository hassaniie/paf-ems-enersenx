import { cn } from "@/lib/cn";

export interface ProgressRowData {
  label: string;
  sub?: string;
  value: string;
  pct: number; // 0..100
  color: string; // CSS color
}

/** ReUI/Atlas "Active Lanes / Revenue by channel" pattern: label + value on
 * top, a thin colored track below. */
export function ProgressList({
  items,
  className,
}: {
  items: ProgressRowData[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-[13px] font-medium text-foreground">
                {item.label}
              </span>
              {item.sub ? (
                <span className="truncate text-xs text-muted-foreground">
                  {item.sub}
                </span>
              ) : null}
            </div>
            <span className="num shrink-0 text-[13px] font-semibold text-foreground">
              {item.value}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, Math.min(100, item.pct))}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="num w-9 shrink-0 text-right text-[11px] text-muted-foreground">
              {Math.round(item.pct)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
