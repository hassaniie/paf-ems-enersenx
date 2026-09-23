"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Expand,
  Factory,
  Focus,
  Gauge,
  Layers3,
  Maximize2,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  SunMedium,
  UtilityPole,
  Waves,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NodeStatus = "online" | "awaiting" | "faulty" | "exporting";
type ViewMode = "live" | "fault" | "load" | "quality";
type EnergyNode = {
  id: string;
  label: string;
  code: string;
  voltage: string;
  value: string;
  status: NodeStatus;
  x: number;
  y: number;
  icon: typeof Building2;
  detail: string;
  energy: string;
  pf: string;
  packet: string;
};

const nodes: EnergyNode[] = [
  {
    id: "grid",
    label: "LESCO Grid",
    code: "GRID-IN-01",
    voltage: "11 kV supply",
    value: "553 kW",
    status: "online",
    x: 500,
    y: 34,
    icon: UtilityPole,
    detail: "Primary utility incomer",
    energy: "8.74 MWh",
    pf: "0.930",
    packet: "8 sec ago",
  },
  {
    id: "site",
    label: "Lahore Site",
    code: "MDB-01",
    voltage: "Main distribution bus",
    value: "553 kW",
    status: "online",
    x: 500,
    y: 174,
    icon: Factory,
    detail: "4 of 10 meters reporting",
    energy: "8.74 MWh",
    pf: "0.930",
    packet: "8 sec ago",
  },
  {
    id: "mess",
    label: "Officers Mess",
    code: "OM-HT-01",
    voltage: "11 kV · Wi-Fi",
    value: "No data",
    status: "awaiting",
    x: 22,
    y: 386,
    icon: Building2,
    detail: "Configured, awaiting first reading",
    energy: "—",
    pf: "—",
    packet: "Never",
  },
  {
    id: "iqbal",
    label: "Iqbal Camp",
    code: "IC-HT-01",
    voltage: "11 kV · Wi-Fi",
    value: "1 kW",
    status: "online",
    x: 260,
    y: 386,
    icon: Building2,
    detail: "Low, stable consumption",
    energy: "2 kWh",
    pf: "0.860",
    packet: "12 sec ago",
  },
  {
    id: "siddiqui",
    label: "Siddiqui Camp",
    code: "SC-HT-01",
    voltage: "11 kV · Wi-Fi",
    value: "No data",
    status: "awaiting",
    x: 500,
    y: 386,
    icon: Building2,
    detail: "Configured, awaiting first reading",
    energy: "—",
    pf: "—",
    packet: "Never",
  },
  {
    id: "tech",
    label: "Tech Area",
    code: "TA-HT-01",
    voltage: "11 kV · Modbus",
    value: "CT fault",
    status: "faulty",
    x: 740,
    y: 386,
    icon: AlertTriangle,
    detail: "Voltage present with near-zero current",
    energy: "0 kWh",
    pf: "1.000",
    packet: "18 sec ago",
  },
  {
    id: "qureshi",
    label: "Qureshi Camp",
    code: "QC-HT-01",
    voltage: "11 kV · LoRaWAN",
    value: "No data",
    status: "awaiting",
    x: 978,
    y: 386,
    icon: Building2,
    detail: "Hospital group nested below",
    energy: "—",
    pf: "—",
    packet: "Never",
  },
  {
    id: "nastp",
    label: "NASTP Delta Ph-III",
    code: "ND-HT-01",
    voltage: "11 kV · Modbus",
    value: "544 kW",
    status: "online",
    x: 740,
    y: 570,
    icon: Factory,
    detail: "Largest active site consumer",
    energy: "2.5 MWh",
    pf: "0.950",
    packet: "5 sec ago",
  },
  {
    id: "hospital",
    label: "PAF Hospital",
    code: "PH-LT-GRP",
    voltage: "3 × LT · LoRaWAN",
    value: "No data",
    status: "awaiting",
    x: 978,
    y: 570,
    icon: Building2,
    detail: "Three downstream meters awaiting data",
    energy: "—",
    pf: "—",
    packet: "Never",
  },
  {
    id: "solar",
    label: "CAC / CASS Solar",
    code: "CC-HT-01",
    voltage: "Reverse power flow",
    value: "−18 kW",
    status: "exporting",
    x: 740,
    y: 744,
    icon: SunMedium,
    detail: "Solar generation feeding NASTP",
    energy: "160 kWh",
    pf: "0.340",
    packet: "6 sec ago",
  },
];

const paths = [
  { id: "grid-site", d: "M600 132 L600 174", state: "live" },
  { id: "site-mess", d: "M600 274 C600 330 122 315 122 386", state: "idle" },
  { id: "site-iqbal", d: "M600 274 C600 330 360 315 360 386", state: "live" },
  { id: "site-siddiqui", d: "M600 274 L600 386", state: "idle" },
  { id: "site-tech", d: "M600 274 C600 330 840 315 840 386", state: "fault" },
  {
    id: "site-qureshi",
    d: "M600 274 C600 330 1078 315 1078 386",
    state: "idle",
  },
  { id: "tech-nastp", d: "M840 484 L840 570", state: "live" },
  { id: "qureshi-hospital", d: "M1078 484 L1078 570", state: "idle" },
  { id: "solar-nastp", d: "M840 744 L840 668", state: "export" },
] as const;

const modes: { id: ViewMode; label: string; icon: typeof Radio }[] = [
  { id: "live", label: "Live", icon: Radio },
  { id: "fault", label: "Faults", icon: AlertTriangle },
  { id: "load", label: "Load", icon: Activity },
  { id: "quality", label: "Power quality", icon: Waves },
];

export function SingleLineDiagram() {
  const [selected, setSelected] = useState<EnergyNode>(nodes[1]!);
  const [mode, setMode] = useState<ViewMode>("live");
  const [paused, setPaused] = useState(false);
  const [scale, setScale] = useState(1);
  const visibleNodes = useMemo(() => {
    if (mode === "fault") return new Set(["site", "tech", "solar", "nastp"]);
    if (mode === "quality") return new Set(["site", "iqbal", "solar", "nastp"]);
    return new Set(nodes.map((node) => node.id));
  }, [mode]);

  return (
    <div className="power-topology mx-auto max-w-[1720px]">
      <section className="topology-heading">
        <div>
          <div className="topology-live">
            <i /> Live network <span>Updated 8 seconds ago</span>
          </div>
          <h1>Energy distribution, in motion.</h1>
          <p>
            Trace grid import, site demand, solar reverse-feed and field health
            across PAF Base Lahore.
          </p>
        </div>
        <div className="topology-condition">
          <div className="condition-orbit">
            <CheckCircle2 />
          </div>
          <div>
            <small>Network condition</small>
            <strong>Stable with 2 exceptions</strong>
          </div>
        </div>
      </section>

      <section className="topology-summary" aria-label="Live energy summary">
        <div>
          <span>Net demand</span>
          <strong className="num">
            553 <small>kW</small>
          </strong>
          <em>55% of capacity</em>
        </div>
        <div>
          <span>Grid condition</span>
          <strong>Importing</strong>
          <em className="positive">
            <ArrowDownToLine /> Normal
          </em>
        </div>
        <div>
          <span>Solar contribution</span>
          <strong className="num export-reading">
            18 <small>kW</small>
          </strong>
          <em>160 kWh today</em>
        </div>
        <div>
          <span>Reporting</span>
          <strong className="num">4 / 10</strong>
          <em>6 awaiting data</em>
        </div>
        <div>
          <span>Active exceptions</span>
          <strong className="num exception-reading">2</strong>
          <em>1 commercial risk</em>
        </div>
      </section>

      <section className="topology-workspace">
        <header className="topology-toolbar">
          <div className="topology-modes" aria-label="Topology view mode">
            {modes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id)}
                  className={cn(mode === item.id && "active")}
                >
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="topology-tools">
            <button className="topology-search">
              <Search />
              <span>Find an asset</span>
              <kbd>⌘K</kbd>
            </button>
            <button onClick={() => setPaused((value) => !value)}>
              {paused ? <Play /> : <Pause />}
              <span>{paused ? "Resume" : "Pause"}</span>
            </button>
            <button title="Fit network" onClick={() => setScale(1)}>
              <Expand />
            </button>
            <button title="Fullscreen">
              <Maximize2 />
            </button>
          </div>
        </header>

        <div className="topology-body">
          <div className="topology-stage-wrap">
            <div className="topology-stage-viewport">
              <div
                className={cn(
                  "topology-stage",
                  paused && "is-paused",
                  `mode-${mode}`,
                )}
                style={{ transform: `scale(${scale})` }}
              >
                <div className="topology-grid" />
                <div className="stage-coordinate stage-coordinate-left">
                  ENERGY TOPOLOGY / 01
                </div>
                <div className="stage-coordinate stage-coordinate-right">
                  LIVE · PKT
                </div>
                <svg
                  className="topology-lines"
                  viewBox="0 0 1200 860"
                  aria-hidden
                >
                  <defs>
                    <filter id="topology-glow">
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
                      className="topology-path-base"
                    />
                  ))}
                  {paths.map((path) => (
                    <path
                      key={path.id}
                      id={`topology-${path.id}`}
                      d={path.d}
                      className={cn(
                        "topology-path",
                        `topology-path-${path.state}`,
                      )}
                    />
                  ))}
                  {paths
                    .filter(
                      (path) =>
                        path.state === "live" || path.state === "export",
                    )
                    .map((path) => (
                      <g
                        key={`${path.id}-particles`}
                        className="topology-particles"
                      >
                        {[0, 1, 2].map((particle) => (
                          <circle
                            key={particle}
                            r={particle === 1 ? 3.6 : 2.4}
                            className={
                              path.state === "export"
                                ? "topology-particle-export"
                                : "topology-particle"
                            }
                            filter="url(#topology-glow)"
                          >
                            <animateMotion
                              begin={`${particle * -0.9}s`}
                              dur={path.state === "export" ? "2.2s" : "2.8s"}
                              repeatCount="indefinite"
                            >
                              <mpath href={`#topology-${path.id}`} />
                            </animateMotion>
                          </circle>
                        ))}
                      </g>
                    ))}
                </svg>
                {nodes.map((node) => {
                  const Icon = node.icon;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelected(node)}
                      className={cn(
                        "topology-node",
                        `topology-node-${node.status}`,
                        selected.id === node.id && "selected",
                        !visibleNodes.has(node.id) && "deemphasized",
                      )}
                      style={{ left: node.x, top: node.y }}
                      aria-label={`${node.label}: ${node.value}, ${node.status}`}
                    >
                      <span className="topology-node-top">
                        <span className="topology-node-icon">
                          <Icon />
                        </span>
                        <span className="topology-node-state">
                          <i />
                          {node.status === "awaiting"
                            ? "Awaiting data"
                            : node.status}
                        </span>
                      </span>
                      <span className="topology-node-name">{node.label}</span>
                      <span className="topology-node-reading num">
                        {node.value}
                      </span>
                      <span className="topology-node-meta">
                        <code>{node.code}</code>
                        <span>{node.voltage}</span>
                      </span>
                    </button>
                  );
                })}
                <div className="topology-legend">
                  <span>
                    <i className="legend-live" />
                    Import
                  </span>
                  <span>
                    <i className="legend-export" />
                    Reverse flow
                  </span>
                  <span>
                    <i className="legend-fault" />
                    Fault
                  </span>
                  <span>
                    <i className="legend-idle" />
                    Awaiting
                  </span>
                </div>
              </div>
            </div>
            <div className="topology-zoom">
              <button
                onClick={() =>
                  setScale((value) => Math.min(1.16, value + 0.08))
                }
              >
                <Plus />
              </button>
              <span className="num">{Math.round(scale * 100)}%</span>
              <button
                onClick={() =>
                  setScale((value) => Math.max(0.76, value - 0.08))
                }
              >
                <Minus />
              </button>
            </div>
          </div>
          <AssetInspector node={selected} />
        </div>
      </section>

      <section className="topology-footrail">
        <article>
          <span className="footrail-icon warning">
            <Gauge />
          </span>
          <div>
            <small>Commercial exposure</small>
            <strong>Power factor below target</strong>
            <p>CAC / CASS is operating at 0.340 PF.</p>
          </div>
          <button>
            <ChevronRight />
          </button>
        </article>
        <article>
          <span className="footrail-icon export">
            <SunMedium />
          </span>
          <div>
            <small>Reverse flow</small>
            <strong>Solar feeding NASTP</strong>
            <p>18 kW is offsetting downstream demand.</p>
          </div>
          <button>
            <ChevronRight />
          </button>
        </article>
        <article>
          <span className="footrail-icon brand">
            <Layers3 />
          </span>
          <div>
            <small>Network confidence</small>
            <strong>40% telemetry coverage</strong>
            <p>Six configured meters await field data.</p>
          </div>
          <button>
            <ChevronRight />
          </button>
        </article>
      </section>
    </div>
  );
}

function AssetInspector({ node }: { node: EnergyNode }) {
  const Icon = node.icon;
  return (
    <aside className="topology-inspector" aria-live="polite">
      <div className="inspector-eyebrow">
        <span>Asset intelligence</span>
        <button title="Focus path">
          <Focus />
        </button>
      </div>
      <div className="inspector-identity">
        <span className={cn("inspector-asset-icon", `state-${node.status}`)}>
          <Icon />
        </span>
        <div>
          <code>{node.code}</code>
          <h2>{node.label}</h2>
          <p>{node.detail}</p>
        </div>
      </div>
      <div className={cn("inspector-live-reading", `state-${node.status}`)}>
        <span>
          <i />
          {node.status === "awaiting" ? "No live telemetry" : "Live reading"}
        </span>
        <strong className="num">{node.value}</strong>
        <small>{node.voltage}</small>
      </div>
      <div className="inspector-metrics">
        <div>
          <span>Energy today</span>
          <strong className="num">{node.energy}</strong>
        </div>
        <div>
          <span>Power factor</span>
          <strong className="num">{node.pf}</strong>
        </div>
        <div>
          <span>Last packet</span>
          <strong>{node.packet}</strong>
        </div>
        <div>
          <span>Connection</span>
          <strong>
            {node.status === "awaiting" ? "Not reporting" : "Healthy"}
          </strong>
        </div>
      </div>
      <div className="inspector-mini-trend">
        <div>
          <span>Last 60 minutes</span>
          <em>
            {node.status === "faulty"
              ? "Action needed"
              : node.status === "exporting"
                ? "Exporting"
                : "Stable"}
          </em>
        </div>
        <svg viewBox="0 0 240 54" preserveAspectRatio="none" aria-hidden>
          <path d="M0 43 C18 38 26 42 42 32 S72 25 88 31 S116 40 132 28 S159 17 177 23 S211 13 240 17" />
          <path
            className="trend-fill"
            d="M0 43 C18 38 26 42 42 32 S72 25 88 31 S116 40 132 28 S159 17 177 23 S211 13 240 17 L240 54 L0 54 Z"
          />
        </svg>
      </div>
      {node.status === "faulty" || node.pf === "0.340" ? (
        <div className="inspector-alert">
          <AlertTriangle />
          <span>
            <strong>
              {node.status === "faulty"
                ? "Inspection required"
                : "PF penalty exposure"}
            </strong>
            {node.status === "faulty"
              ? "Probable CT circuit issue detected."
              : "Capacitor-bank review recommended."}
          </span>
        </div>
      ) : null}
      <div className="inspector-actions">
        <button className="primary">
          <ArrowUpRight />
          Open asset detail
        </button>
        <button>
          <Clock3 />
          History
        </button>
      </div>
      <p className="inspector-help">
        <Zap />
        Select any node to inspect live telemetry and its position in the
        electrical hierarchy.
      </p>
    </aside>
  );
}
