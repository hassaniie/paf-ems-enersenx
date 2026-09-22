import { ArrowUp } from "lucide-react";
import type { MeterClass, MeterStatus, Transport } from "@/domain/types";
import { StatusBadge } from "@/components/primitives/status";
import { Badge } from "@/components/ui/badge";
import { powerFlow } from "@/domain/format";
import { cn } from "@/lib/cn";

const TRANSPORT_LABEL: Record<Transport, string> = {
  modbus: "Modbus",
  wifi: "Wi-Fi",
  lorawan: "LoRaWAN",
};

export interface FeederRow {
  name: string;
  code: string;
  cls: MeterClass;
  transport: Transport;
  status: MeterStatus;
  powerKw?: number;
  pf?: number;
  depth?: number;
  derived?: boolean;
}

export function FeederTable({ rows }: { rows: FeederRow[] }) {
  const maxAbs = Math.max(
    1,
    ...rows.filter((r) => !r.derived).map((r) => Math.abs(r.powerKw ?? 0)),
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-elevated/45 text-left">
            <Th className="pl-5">Feeder</Th>
            <Th className="w-[220px]">Load</Th>
            <Th className="hidden w-24 sm:table-cell">Power factor</Th>
            <Th className="w-40 pr-5 text-right">Status</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const flow =
              row.powerKw !== undefined ? powerFlow(row.powerKw) : null;
            const hasData = flow !== null && row.status !== "awaiting-data";
            const pfLow = row.pf !== undefined && row.pf < 0.9;
            const pct = hasData
              ? (Math.abs(row.powerKw ?? 0) / maxAbs) * 100
              : 0;
            const barColor =
              flow?.direction === "export"
                ? "var(--flow-export)"
                : "var(--foreground)";
            return (
              <tr
                key={row.code}
                className={cn(
                  "border-b border-border/70 transition-colors last:border-0 hover:bg-accent/60",
                  row.derived && "bg-elevated/40",
                )}
              >
                {/* feeder */}
                <td className="py-3 pr-4 pl-5">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${(row.depth ?? 0) * 18}px` }}
                  >
                    {row.derived ? (
                      <span className="text-export" aria-hidden>
                        ∑
                      </span>
                    ) : null}
                    <span className="font-medium text-foreground">
                      {row.name}
                    </span>
                    <span className="code hidden text-xs text-muted-foreground md:inline">
                      {row.code}
                    </span>
                    {!row.derived ? (
                      <span className="hidden items-center gap-1 lg:flex">
                        <Badge variant="outline">{row.cls}</Badge>
                        <Badge variant="outline">
                          {TRANSPORT_LABEL[row.transport]}
                        </Badge>
                      </span>
                    ) : null}
                  </div>
                </td>

                {/* load + share bar */}
                <td className="py-3 pr-4">
                  {hasData && flow ? (
                    <div className="flex items-center gap-3">
                      <span
                        className="num inline-flex w-20 shrink-0 items-center gap-0.5 font-semibold"
                        style={{
                          color:
                            flow.direction === "export"
                              ? "var(--flow-export)"
                              : undefined,
                        }}
                      >
                        {flow.direction === "export" ? (
                          <ArrowUp className="size-3" aria-label="export" />
                        ) : null}
                        {flow.magnitude}
                      </span>
                      <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-elevated sm:block">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(3, pct)}%`,
                            backgroundColor: barColor,
                            opacity: row.derived ? 0.5 : 1,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* pf */}
                <td className="hidden py-3 pr-4 sm:table-cell">
                  {hasData && row.pf !== undefined ? (
                    <span
                      className="num"
                      style={{
                        color: pfLow ? "var(--sev-warning)" : undefined,
                      }}
                    >
                      {row.pf.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* status */}
                <td className="py-3 pr-5 text-right">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "py-2.5 pr-4 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}
