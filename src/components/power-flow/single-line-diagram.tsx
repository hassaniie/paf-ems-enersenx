"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Building2,
  Factory,
  Radio,
  SunMedium,
  UtilityPole,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NodeStatus = "online" | "offline" | "faulty" | "exporting";
type EnergyNode = {
  id: string;
  label: string;
  meta: string;
  value: string;
  status: NodeStatus;
  x: number;
  y: number;
  icon: typeof Building2;
  detail: string;
};

const nodes: EnergyNode[] = [
  {
    id: "grid",
    label: "LESCO Grid",
    meta: "11 kV HT supply",
    value: "553 kW",
    status: "online",
    x: 500,
    y: 28,
    icon: UtilityPole,
    detail: "Primary utility incomer · healthy",
  },
  {
    id: "site",
    label: "Lahore Site",
    meta: "Main distribution bus",
    value: "553 kW",
    status: "online",
    x: 500,
    y: 158,
    icon: Factory,
    detail: "4 of 10 meters reporting",
  },
  {
    id: "mess",
    label: "Officers Mess",
    meta: "OM-HT-01 · Wi-Fi",
    value: "No data",
    status: "offline",
    x: 20,
    y: 370,
    icon: Building2,
    detail: "Configured · awaiting first reading",
  },
  {
    id: "iqbal",
    label: "Iqbal Camp",
    meta: "PF 0.86 · IC-HT-01",
    value: "1 kW",
    status: "online",
    x: 260,
    y: 370,
    icon: Building2,
    detail: "2 kWh consumed today",
  },
  {
    id: "siddiqui",
    label: "Siddiqui Camp",
    meta: "SC-HT-01 · Wi-Fi",
    value: "No data",
    status: "offline",
    x: 500,
    y: 370,
    icon: Building2,
    detail: "Configured · awaiting first reading",
  },
  {
    id: "tech",
    label: "Tech Area",
    meta: "CT circuit inspection",
    value: "Faulty",
    status: "faulty",
    x: 740,
    y: 370,
    icon: AlertTriangle,
    detail: "Voltage present with near-zero current",
  },
  {
    id: "qureshi",
    label: "Qureshi Camp",
    meta: "QC-HT-01 · LoRaWAN",
    value: "No data",
    status: "offline",
    x: 980,
    y: 370,
    icon: Building2,
    detail: "Hospital group nested below",
  },
  {
    id: "nastp",
    label: "NASTP Delta Ph-III",
    meta: "2.5 MWh today",
    value: "544 kW",
    status: "online",
    x: 740,
    y: 555,
    icon: Factory,
    detail: "Net demand after solar contribution",
  },
  {
    id: "hospital",
    label: "PAF Hospital",
    meta: "3 × LT · LoRaWAN",
    value: "No data",
    status: "offline",
    x: 980,
    y: 555,
    icon: Building2,
    detail: "Three downstream meters awaiting data",
  },
  {
    id: "solar",
    label: "CAC / CASS Solar",
    meta: "160 kWh exported today",
    value: "−18 kW",
    status: "exporting",
    x: 740,
    y: 730,
    icon: SunMedium,
    detail: "Solar generation feeding NASTP",
  },
];

const paths = [
  { id: "grid-site", d: "M600 120 L600 158", state: "live" },
  { id: "site-mess", d: "M600 260 C600 315 120 300 120 370", state: "idle" },
  { id: "site-iqbal", d: "M600 260 C600 315 360 300 360 370", state: "live" },
  { id: "site-siddiqui", d: "M600 260 L600 370", state: "idle" },
  { id: "site-tech", d: "M600 260 C600 315 840 300 840 370", state: "fault" },
  {
    id: "site-qureshi",
    d: "M600 260 C600 315 1080 300 1080 370",
    state: "idle",
  },
  { id: "tech-nastp", d: "M840 468 L840 555", state: "live" },
  { id: "qureshi-hospital", d: "M1080 468 L1080 555", state: "idle" },
  { id: "solar-nastp", d: "M840 730 L840 653", state: "export" },
] as const;

export function SingleLineDiagram() {
  const [selected, setSelected] = useState<EnergyNode>(nodes[1]!);
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="power-flow-scroll">
        <div
          className="power-flow-canvas"
          aria-label="PAF Lahore live single-line energy flow diagram"
        >
          <div className="flow-grid" />
          <svg className="flow-lines" viewBox="0 0 1200 850" aria-hidden>
            <defs>
              <filter id="flow-glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {paths.map((path) => (
              <path
                key={`${path.id}-base`}
                d={path.d}
                className="flow-path-base"
              />
            ))}
            {paths.map((path) => (
              <path
                key={path.id}
                id={path.id}
                d={path.d}
                className={cn("flow-path", `flow-path-${path.state}`)}
              />
            ))}
            {paths
              .filter(
                (path) => path.state === "live" || path.state === "export",
              )
              .map((path) => (
                <circle
                  key={`${path.id}-pulse`}
                  r="4"
                  className={
                    path.state === "export" ? "flow-pulse-export" : "flow-pulse"
                  }
                  filter="url(#flow-glow)"
                >
                  <animateMotion
                    dur={path.state === "export" ? "2.2s" : "2.8s"}
                    repeatCount="indefinite"
                    rotate="auto"
                  >
                    <mpath href={`#${path.id}`} />
                  </animateMotion>
                </circle>
              ))}
          </svg>
          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <button
                key={node.id}
                onClick={() => setSelected(node)}
                className={cn(
                  "energy-node",
                  `energy-node-${node.status}`,
                  selected.id === node.id && "energy-node-selected",
                )}
                style={{ left: node.x, top: node.y }}
                aria-label={`${node.label}: ${node.value}, ${node.status}`}
              >
                <span className="energy-node-icon">
                  <Icon />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="energy-node-label">{node.label}</span>
                  <span className="energy-node-value">{node.value}</span>
                  <span className="energy-node-meta">{node.meta}</span>
                </span>
                <span className="energy-node-status">
                  {node.status === "offline" ? "Awaiting" : node.status}
                </span>
              </button>
            );
          })}
          <div className="flow-legend">
            <span>
              <i className="legend-live" />
              Import
            </span>
            <span>
              <i className="legend-export" />
              Solar export
            </span>
            <span>
              <i className="legend-fault" />
              Fault
            </span>
            <span>
              <i className="legend-idle" />
              Awaiting data
            </span>
          </div>
        </div>
      </div>
      <aside className="node-inspector" aria-live="polite">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Selected asset
          </p>
          <span
            className={cn("inspector-status", `inspector-${selected.status}`)}
          >
            <Radio />
            {selected.status}
          </span>
        </div>
        <div className="mt-5">
          <p className="text-lg font-semibold tracking-tight">
            {selected.label}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {selected.detail}
          </p>
        </div>
        <div className="inspector-reading">
          <span>Live reading</span>
          <strong>{selected.value}</strong>
          <small>{selected.meta}</small>
        </div>
        <dl className="inspector-list">
          <div>
            <dt>Connection</dt>
            <dd>
              {selected.status === "offline" ? "No telemetry" : "Healthy"}
            </dd>
          </div>
          <div>
            <dt>Last packet</dt>
            <dd>{selected.status === "offline" ? "Never" : "8 sec ago"}</dd>
          </div>
          <div>
            <dt>Trend</dt>
            <dd>
              {selected.status === "exporting"
                ? "Exporting"
                : selected.status === "faulty"
                  ? "Requires action"
                  : "Stable"}
            </dd>
          </div>
        </dl>
        {selected.status === "faulty" ? (
          <button className="inspector-action">
            <AlertTriangle />
            Open active alarm
          </button>
        ) : (
          <button className="inspector-action">
            <ArrowDownToLine />
            View meter detail
          </button>
        )}
        <p className="mt-auto pt-6 text-[11px] leading-relaxed text-muted-foreground">
          Select any asset in the diagram to inspect its current telemetry and
          connection state.
        </p>
      </aside>
    </div>
  );
}
