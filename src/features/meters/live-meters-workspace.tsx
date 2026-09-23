"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  Check,
  ChevronRight,
  CircleGauge,
  Clock3,
  Gauge,
  MoreHorizontal,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Search,
  Settings2,
  Signal,
  Sigma,
  SlidersHorizontal,
  Unplug,
  Waves,
  X,
  Zap,
} from "lucide-react";
import type { MeterClass, MeterStatus, Transport } from "@/domain";
import { useShell } from "@/components/layout/shell-context";
import { MetricRibbon } from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  selectEnergySummary,
  type MeterRecord,
} from "@/features/organization/energy-selectors";
import { useOrganization } from "@/features/organization/organization-provider";

type MeterFilter = "all" | MeterStatus | MeterClass | Transport | "derived";

export function LiveMetersWorkspace() {
  const {
    store,
    ready,
    simulationRunning,
    setSimulationRunning,
    setMeterStatus,
    refreshMeter,
  } = useOrganization();
  const { role, canManageOrganization } = useShell();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MeterFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const summary = useMemo(() => selectEnergySummary(store), [store]);
  const canOperate = role !== "Viewer";

  const records = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return summary.records.filter(({ meter, node, parent, live }) => {
      const matchesQuery =
        !normalized ||
        `${node.name} ${meter.code} ${parent?.name ?? ""}`
          .toLowerCase()
          .includes(normalized);
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      if (filter === "derived") return meter.role === "derived";
      if (filter === "HT" || filter === "LT") return meter.class === filter;
      if (filter === "modbus" || filter === "wifi" || filter === "lorawan")
        return meter.transport === filter;
      return live?.status === filter;
    });
  }, [filter, query, summary.records]);

  const selected =
    summary.records.find(({ meter }) => meter.id === selectedId) ?? null;
  const metrics = [
    {
      label: "Active demand",
      value: summary.activeLoadKw.toFixed(0),
      unit: "kW",
      note: "Shared operational snapshot",
      tone: "neutral",
    },
    {
      label: "Reporting",
      value: `${summary.reportingCount}/${summary.physicalCount}`,
      unit: "",
      note: `${summary.awaitingCount} awaiting data`,
      tone: "good",
    },
    {
      label: "Average PF",
      value: summary.averagePf.toFixed(3),
      unit: "",
      note: "Across available readings",
      tone: summary.averagePf < 0.9 ? "warning" : "good",
    },
    {
      label: "Export live",
      value: summary.exportKw.toFixed(0),
      unit: "kW",
      note: `${summary.energyExportKwh.toFixed(0)} kWh registered`,
      tone: "export",
    },
    {
      label: "Exceptions",
      value: String(summary.faultyCount),
      unit: "",
      note: "Meters requiring action",
      tone: summary.faultyCount ? "warning" : "good",
    },
  ] as const;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  if (!ready)
    return (
      <div className="meters-loading">
        <div />
        <div />
        <div />
      </div>
    );

  return (
    <div className="meters-page mx-auto max-w-[1680px]">
      <section className="meters-heading">
        <div>
          <div className="meters-eyebrow">
            <Radio />
            Telemetry network
          </div>
          <h1>Every meter, one operational view.</h1>
          <p>
            Inspect readings, communication health and field exceptions without
            losing hierarchy context.
          </p>
        </div>
        <div className="meters-heading-actions">
          <Badge
            tone={
              simulationRunning ? "var(--status-online)" : "var(--status-stale)"
            }
          >
            {simulationRunning ? <Signal /> : <Pause />}
            {simulationRunning ? "Live updates" : "Updates paused"}
          </Badge>
          <Button
            variant="outline"
            onClick={() => setSimulationRunning(!simulationRunning)}
          >
            {simulationRunning ? <Pause /> : <Play />}
            {simulationRunning ? "Pause" : "Resume"}
          </Button>
        </div>
      </section>

      <MetricRibbon items={metrics} label="Meter network summary" />

      <Card className="meters-workspace">
        <div className="meters-toolbar">
          <label className="meters-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meter, asset or area"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X />
              </button>
            ) : (
              <kbd>⌘K</kbd>
            )}
          </label>
          <label className="meters-filter">
            <SlidersHorizontal />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as MeterFilter)}
            >
              <option value="all">All meters</option>
              <option value="online">Online</option>
              <option value="faulty">Faulty</option>
              <option value="stale">Stale</option>
              <option value="offline">Offline</option>
              <option value="awaiting-data">Awaiting data</option>
              <option value="HT">HT meters</option>
              <option value="LT">LT meters</option>
              <option value="modbus">Modbus</option>
              <option value="wifi">Wi-Fi</option>
              <option value="lorawan">LoRaWAN</option>
              <option value="derived">Derived points</option>
            </select>
          </label>
          <span className="meters-result-count">
            <strong className="num">{records.length}</strong> of{" "}
            {summary.records.length} points
          </span>
          {canManageOrganization ? (
            <Button asChild>
              <Link href="/organization">
                <Settings2 />
                Manage meters
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="meters-table-wrap">
          <div className="meters-table-head">
            <span>Meter & asset</span>
            <span>Connection</span>
            <span>Power</span>
            <span>Quality</span>
            <span>Last packet</span>
            <span>Status</span>
            <span />
          </div>
          <div className="meters-table" role="table">
            {records.map((record) => (
              <MeterRow
                key={record.meter.id}
                record={record}
                onOpen={() => setSelectedId(record.meter.id)}
              />
            ))}
            {!records.length ? (
              <div className="meters-empty">
                <Search />
                <strong>No meters match this view</strong>
                <p>
                  Clear the search or choose another status, class or transport.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      {selected ? (
        <MeterDrawer
          record={selected}
          canOperate={canOperate}
          canConfigure={canManageOrganization}
          onClose={() => setSelectedId(null)}
          onReconnect={() => {
            refreshMeter(selected.meter.id);
            notify(`${selected.meter.code} connection checked.`);
          }}
          onStatus={(status) => {
            setMeterStatus(selected.meter.id, status);
            notify(`${selected.meter.code} marked ${status}.`);
          }}
        />
      ) : null}
      {toast ? (
        <div className="organization-toast success">
          <Check />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function MeterRow({
  record,
  onOpen,
}: {
  record: MeterRecord;
  onOpen: () => void;
}) {
  const reading = record.live?.lastReading;
  return (
    <button className="meters-row" onClick={onOpen} role="row">
      <span className="meter-identity">
        <span
          className={cn(
            "meter-icon",
            record.meter.role === "derived" && "derived",
          )}
        >
          {record.meter.role === "derived" ? <Sigma /> : <Gauge />}
        </span>
        <span>
          <strong>{record.node.name}</strong>
          <small>
            <code>{record.meter.code}</code> ·{" "}
            {record.parent?.name ?? "Lahore Site"}
          </small>
        </span>
      </span>
      <span className="meter-connection">
        <strong>{transportLabel(record.meter.transport)}</strong>
        <small>
          {record.meter.class} · {formatVoltage(record.meter.nominalVoltage)}
        </small>
      </span>
      <span className="meter-value">
        <strong className="num">
          {reading
            ? reading.activePowerKw.toFixed(reading.activePowerKw % 1 ? 1 : 0)
            : "—"}
        </strong>
        <small>kW</small>
      </span>
      <span className="meter-quality">
        <strong
          className={cn((reading?.powerFactor ?? 1) < 0.9 && "text-warning")}
        >
          {reading?.powerFactor?.toFixed(3) ?? "—"}
        </strong>
        <small>power factor</small>
      </span>
      <span className="meter-packet">
        <Clock3 />
        <span>
          <strong>{relativePacket(record.live?.lastReadingAt)}</strong>
          <small>{record.live?.lastReadingAt ? "received" : "no packet"}</small>
        </span>
      </span>
      <MeterStatusPill
        status={record.live?.status}
        derived={record.meter.role === "derived"}
      />
      <span className="meter-open">
        <ChevronRight />
      </span>
    </button>
  );
}

function MeterDrawer({
  record,
  canOperate,
  canConfigure,
  onClose,
  onReconnect,
  onStatus,
}: {
  record: MeterRecord;
  canOperate: boolean;
  canConfigure: boolean;
  onClose: () => void;
  onReconnect: () => void;
  onStatus: (status: MeterStatus) => void;
}) {
  const reading = record.live?.lastReading;
  const phaseVoltage = reading?.voltageV ?? ([6350, 6360, 6342] as const);
  const phaseCurrent = reading?.currentA ?? ([29.1, 30.4, 28.8] as const);
  return (
    <div
      className="meter-drawer-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        className="meter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${record.meter.code} details`}
      >
        <header>
          <div>
            <span className="meters-eyebrow">
              <Activity />
              Live meter detail
            </span>
            <h2>{record.node.name}</h2>
            <p>
              <code>{record.meter.code}</code> ·{" "}
              {record.parent?.name ?? "Lahore Site"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close meter details">
            <X />
          </button>
        </header>
        <div className="meter-drawer-status">
          <MeterStatusPill
            status={record.live?.status}
            derived={record.meter.role === "derived"}
          />
          <span>Last packet {relativePacket(record.live?.lastReadingAt)}</span>
        </div>
        <section className="meter-hero-reading">
          <span>Active power</span>
          <div>
            <strong className="num">
              {reading?.activePowerKw.toFixed(1) ?? "—"}
            </strong>
            <small>kW</small>
          </div>
          <p>
            {reading
              ? reading.activePowerKw < 0
                ? "Reverse power flow detected"
                : "Importing into this asset"
              : "Waiting for the first valid telemetry packet"}
          </p>
        </section>
        <section className="meter-detail-grid">
          <div>
            <CircleGauge />
            <span>Power factor</span>
            <strong className="num">
              {reading?.powerFactor?.toFixed(3) ?? "—"}
            </strong>
          </div>
          <div>
            <Waves />
            <span>Frequency</span>
            <strong className="num">
              {reading?.frequencyHz?.toFixed(2) ?? "50.00"} Hz
            </strong>
          </div>
          <div>
            <ArrowDownLeft />
            <span>Import energy</span>
            <strong className="num">
              {reading ? `${reading.energyImportKwh.toFixed(0)} kWh` : "—"}
            </strong>
          </div>
          <div>
            <Zap />
            <span>Export energy</span>
            <strong className="num">
              {reading ? `${reading.energyExportKwh.toFixed(0)} kWh` : "—"}
            </strong>
          </div>
        </section>
        {reading ? (
          <section className="meter-phase-panel">
            <div className="meter-section-title">
              <span>Three-phase snapshot</span>
              <small>Phase-to-neutral</small>
            </div>
            <div className="phase-head">
              <span>Phase</span>
              <span>Voltage</span>
              <span>Current</span>
            </div>
            {["L1", "L2", "L3"].map((phase, index) => (
              <div className="phase-row" key={phase}>
                <strong>{phase}</strong>
                <span className="num">{phaseVoltage[index]?.toFixed(0)} V</span>
                <span className="num">{phaseCurrent[index]?.toFixed(1)} A</span>
              </div>
            ))}
          </section>
        ) : (
          <section className="meter-no-telemetry">
            <Unplug />
            <div>
              <strong>No telemetry available</strong>
              <p>
                The configuration exists, but the meter has not supplied a valid
                reading.
              </p>
            </div>
          </section>
        )}
        <section className="meter-config">
          <div className="meter-section-title">
            <span>Configuration</span>
          </div>
          <dl>
            <div>
              <dt>Meter class</dt>
              <dd>{record.meter.class}</dd>
            </div>
            <div>
              <dt>Transport</dt>
              <dd>{transportLabel(record.meter.transport)}</dd>
            </div>
            <div>
              <dt>Nominal voltage</dt>
              <dd>{formatVoltage(record.meter.nominalVoltage)}</dd>
            </div>
            <div>
              <dt>Point type</dt>
              <dd>{record.meter.role}</dd>
            </div>
          </dl>
        </section>
        {record.live?.status === "faulty" ? (
          <div className="meter-fault-callout">
            <AlertTriangle />
            <span>
              <strong>Field inspection required</strong>Voltage is present with
              near-zero current. Check the CT circuit and meter wiring.
            </span>
          </div>
        ) : null}
        <footer>
          {canOperate ? (
            <>
              <Button variant="outline" onClick={onReconnect}>
                <RefreshCw />
                Check connection
              </Button>
              {record.live?.status === "offline" ? (
                <Button onClick={() => onStatus("online")}>
                  <Radio />
                  Return online
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => onStatus("offline")}>
                  <Unplug />
                  Mark offline
                </Button>
              )}
            </>
          ) : (
            <span className="meter-permission-note">
              Viewer access is read only.
            </span>
          )}
          {canConfigure ? (
            <Button asChild variant="ghost">
              <Link href="/organization">
                <MoreHorizontal />
                Edit configuration
              </Link>
            </Button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

function MeterStatusPill({
  status = "awaiting-data",
  derived,
}: {
  status?: MeterStatus;
  derived?: boolean;
}) {
  if (derived)
    return (
      <span className="meter-status derived">
        <Sigma />
        Derived
      </span>
    );
  return (
    <span className={cn("meter-status", status)}>
      <i />
      {statusLabel(status)}
    </span>
  );
}
function statusLabel(status: MeterStatus) {
  return status === "awaiting-data"
    ? "Awaiting data"
    : status.charAt(0).toUpperCase() + status.slice(1);
}
function transportLabel(value: Transport) {
  return value === "lorawan"
    ? "LoRaWAN"
    : value === "wifi"
      ? "Wi-Fi"
      : "Modbus";
}
function formatVoltage(value: number) {
  return value >= 1000 ? `${value / 1000} kV` : `${value} V`;
}
function relativePacket(value?: string) {
  if (!value) return "Never";
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
