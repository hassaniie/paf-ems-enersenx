import { ArrowUp } from "lucide-react";
import type { MeterClass, MeterStatus, Transport } from "@/domain/types";
import { StatusDot } from "@/components/primitives/status";
import { Badge } from "@/components/ui/badge";
import { powerFlow } from "@/domain/format";
import { cn } from "@/lib/cn";

const TRANSPORT_LABEL: Record<Transport, string> = {
  modbus: "Modbus",
  wifi: "Wi-Fi",
  lorawan: "LoRaWAN",
};

export interface SldNode {
  code: string;
  name: string;
  cls: MeterClass;
  transport: Transport;
  status: MeterStatus;
  /** Signed kW (+import / −export). Omit when the meter is awaiting data. */
  powerKw?: number;
  pf?: number;
  children?: SldNode[];
}

/**
 * The single-line diagram — the site's real topology, rendered as a schematic
 * bus-and-taps, not decoration. One continuous rail per branch group; each
 * feeder taps off it. (unslop "moment": a real object the product deals with,
 * built in code with real data, per the signature detail in the direction.)
 */
export function SiteDiagram({
  siteName,
  totalKw,
  onlineCount,
  totalCount,
  nodes,
}: {
  siteName: string;
  totalKw: number;
  onlineCount: number;
  totalCount: number;
  nodes: SldNode[];
}) {
  return (
    <div>
      {/* bus header — the grid-boundary node */}
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {siteName}
          </span>
          <span className="text-[13px] text-muted-foreground">
            grid boundary
          </span>
        </div>
        <span className="num text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">{totalKw} kW</span>
          <span className="mx-1.5 text-border">·</span>
          <span className="text-online">{onlineCount}</span>/{totalCount}{" "}
          online
        </span>
      </div>

      <div className="pt-1">
        <Branch nodes={nodes} depth={0} />
      </div>
    </div>
  );
}

function Branch({ nodes, depth }: { nodes: SldNode[]; depth: number }) {
  return (
    <div className={cn(depth > 0 && "ml-4 border-l border-border pl-4")}>
      {nodes.map((node) => (
        <div key={node.code} className="relative">
          {depth > 0 ? (
            <span className="absolute top-[19px] -left-4 h-px w-4 bg-border" />
          ) : null}
          <NodeRow node={node} />
          {node.children?.length ? (
            <Branch nodes={node.children} depth={depth + 1} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function NodeRow({ node }: { node: SldNode }) {
  const flow = node.powerKw !== undefined ? powerFlow(node.powerKw) : null;
  const hasData = flow !== null && node.status !== "awaiting-data";
  const pfLow = node.pf !== undefined && node.pf < 0.9;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <StatusDot status={node.status} className="shrink-0" />

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-[13px] font-medium text-foreground">
          {node.name}
        </span>
        <span className="code hidden text-xs text-muted-foreground sm:inline">
          {node.code}
        </span>
        <span className="hidden items-center gap-1 lg:flex">
          <Badge variant="outline">{node.cls}</Badge>
          <Badge variant="outline">{TRANSPORT_LABEL[node.transport]}</Badge>
        </span>
      </div>

      {hasData && flow ? (
        <div className="num flex items-baseline gap-2 whitespace-nowrap">
          {node.pf !== undefined ? (
            <span
              className="hidden text-xs text-muted-foreground sm:inline"
              style={{ color: pfLow ? "var(--sev-warning)" : undefined }}
            >
              pf {node.pf.toFixed(2)}
            </span>
          ) : null}
          <span
            className="inline-flex items-center gap-0.5 text-[13px] font-semibold"
            style={{
              color:
                flow.direction === "export" ? "var(--flow-export)" : undefined,
            }}
          >
            {flow.direction === "export" ? (
              <ArrowUp className="size-3" aria-label="export" />
            ) : null}
            {flow.magnitude}
          </span>
        </div>
      ) : (
        <span className="text-[13px] text-muted-foreground">
          {node.status === "faulty" ? "fault — inspect" : "awaiting data"}
        </span>
      )}
    </div>
  );
}
