import { ArrowUp } from "lucide-react";
import type { MeterClass, MeterStatus, Transport } from "@/domain/types";
import { StatusBadge } from "@/components/primitives/status";
import { powerFlow } from "@/domain/format";
import { cn } from "@/lib/cn";

const TRANSPORT_LABEL: Record<Transport, string> = {
  modbus: "Modbus",
  wifi: "Wi-Fi",
  lorawan: "LoRaWAN",
};

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded border border-border bg-surface-2 px-1.5 py-px text-[10px] font-medium tracking-wide text-muted uppercase">
      {children}
    </span>
  );
}

export interface FeederRowData {
  name: string;
  code: string;
  cls: MeterClass;
  transport: Transport;
  status: MeterStatus;
  /** Signed kW (+import / −export). Undefined when no live reading. */
  powerKw?: number;
  pf?: number;
  depth?: number;
  derived?: boolean;
}

export function FeederRow({ row }: { row: FeederRowData }) {
  const flow = row.powerKw !== undefined ? powerFlow(row.powerKw) : null;
  const hasData = flow !== null && row.status !== "awaiting-data";

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2.5 pr-1 transition-colors hover:bg-surface-2/40",
        row.derived && "rounded-md bg-surface-2/30",
      )}
      style={{ paddingLeft: `${(row.depth ?? 0) * 20 + 4}px` }}
    >
      {/* identity */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {row.derived ? (
          <span className="text-export" aria-hidden>
            ∑
          </span>
        ) : null}
        <span className="truncate text-sm font-medium text-text">
          {row.name}
        </span>
        <span className="code hidden text-xs text-faint sm:inline">
          {row.code}
        </span>
        {!row.derived ? (
          <span className="hidden items-center gap-1 md:flex">
            <Tag>{row.cls}</Tag>
            <Tag>{TRANSPORT_LABEL[row.transport]}</Tag>
          </span>
        ) : null}
      </div>

      {/* live reading — export carries an arrow, not color alone */}
      <div className="num flex w-28 items-center justify-end gap-1 text-right">
        {hasData ? (
          <span
            className="inline-flex items-center gap-0.5 text-sm font-semibold"
            style={{
              color:
                flow.direction === "export" ? "var(--flow-export)" : undefined,
            }}
            title={flow.direction === "export" ? "Exporting (reverse flow)" : "Importing"}
          >
            {flow.direction === "export" ? (
              <ArrowUp className="size-3" aria-label="export" />
            ) : null}
            {flow.magnitude}
          </span>
        ) : (
          <span className="text-sm text-faint">—</span>
        )}
      </div>

      {/* power factor */}
      <div className="num hidden w-16 justify-end text-right text-xs text-muted sm:flex">
        {hasData && row.pf !== undefined ? `PF ${row.pf.toFixed(2)}` : ""}
      </div>

      {/* status */}
      <div className="flex w-32 justify-end">
        <StatusBadge status={row.status} />
      </div>
    </div>
  );
}
