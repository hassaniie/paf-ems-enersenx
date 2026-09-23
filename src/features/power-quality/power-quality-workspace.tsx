"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Filter,
  Gauge,
  Info,
  Radio,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Waves,
  X,
  Zap,
} from "lucide-react";
import type { MeterClass } from "@/domain";
import { POWER_FACTOR, POWER_QUALITY } from "@/config/thresholds";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { useOrganization } from "@/features/organization/organization-provider";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { QualityTrendChart } from "./quality-trend-chart";
import {
  selectPowerQualitySummary,
  type PowerQualityRecord,
  type QualityState,
} from "./power-quality-selectors";

type QualityFilter = "all" | QualityState | MeterClass;

export function PowerQualityWorkspace() {
  const { store, ready } = useOrganization();
  const { store: alarmStore } = useAlarms();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QualityFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const summary = useMemo(() => selectPowerQualitySummary(store), [store]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return summary.records.filter((record) => {
      if (
        normalized &&
        !`${record.node.name} ${record.meter.code} ${record.parent?.name ?? ""}`
          .toLowerCase()
          .includes(normalized)
      )
        return false;
      if (filter === "all") return true;
      if (filter === "HT" || filter === "LT")
        return record.meter.class === filter;
      return record.state === filter;
    });
  }, [filter, query, summary.records]);
  const selected =
    summary.records.find((record) => record.meter.id === selectedId) ?? null;
  const selectedAlarm = selected
    ? alarmStore.alarms.find(
        (alarm) =>
          alarm.meterId === selected.meter.id && alarm.lifecycle !== "cleared",
      )
    : undefined;
  const compliancePct = summary.measuredCount
    ? Math.round((summary.compliantCount / summary.measuredCount) * 100)
    : 0;
  const metrics: MetricRibbonItem[] = [
    {
      label: "Quality compliance",
      value: String(compliancePct),
      unit: "%",
      note: `${summary.compliantCount} of ${summary.measuredCount} measured points`,
      tone: compliancePct >= 80 ? "good" : "warning",
    },
    {
      label: "Average PF",
      value: summary.averagePf.toFixed(3),
      note: `Target ≥ ${POWER_FACTOR.trackBelow.toFixed(2)}`,
      tone: summary.averagePf < POWER_FACTOR.trackBelow ? "warning" : "good",
    },
    {
      label: "Grid frequency",
      value: summary.averageFrequencyHz.toFixed(2),
      unit: "Hz",
      note: `${POWER_QUALITY.frequencyMinHz}–${POWER_QUALITY.frequencyMaxHz} Hz operating band`,
      tone: "good",
    },
    {
      label: "Needs intervention",
      value: String(summary.criticalCount),
      note: "Critical quality conditions",
      tone: summary.criticalCount ? "warning" : "good",
    },
    {
      label: "No measurement",
      value: String(summary.unavailableCount),
      note: "Awaiting valid telemetry",
      tone: "info",
    },
  ];

  if (!ready)
    return (
      <div className="quality-loading">
        <div />
        <div />
        <div />
      </div>
    );

  return (
    <div className="quality-page mx-auto max-w-[1680px]">
      <section className="quality-heading">
        <div>
          <div className="quality-eyebrow">
            <Waves />
            Electrical health
          </div>
          <h1>See degradation before it becomes disruption.</h1>
          <p>
            Compare phase balance, frequency and power factor across every
            reporting meter.
          </p>
        </div>
        <div className="quality-heading-actions">
          <Badge
            tone={
              summary.criticalCount
                ? "var(--sev-warning)"
                : "var(--status-online)"
            }
          >
            {summary.criticalCount ? <AlertTriangle /> : <ShieldCheck />}
            {summary.criticalCount
              ? `${summary.criticalCount} critical conditions`
              : "Quality within target"}
          </Badge>
          <Button asChild variant="outline">
            <Link href="/alarms">
              <TriangleAlert />
              Quality alarms
            </Link>
          </Button>
        </div>
      </section>

      <MetricRibbon items={metrics} label="Power quality summary" />

      <section className="quality-main-grid">
        <Card className="quality-ranking-card">
          <div className="quality-toolbar">
            <label className="quality-search">
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
            <label className="quality-filter">
              <Filter />
              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as QualityFilter)
                }
              >
                <option value="all">All quality points</option>
                <option value="critical">Critical</option>
                <option value="watch">Watch</option>
                <option value="compliant">Compliant</option>
                <option value="unavailable">No measurement</option>
                <option value="HT">HT meters</option>
                <option value="LT">LT meters</option>
              </select>
            </label>
          </div>
          <div className="quality-table-head">
            <span>Meter & condition</span>
            <span>Power factor</span>
            <span>Voltage</span>
            <span>Unbalance</span>
            <span>Frequency</span>
            <span />
          </div>
          <div className="quality-table">
            {filtered.map((record) => (
              <QualityRow
                key={record.meter.id}
                record={record}
                selected={selected?.meter.id === record.meter.id}
                onSelect={() => setSelectedId(record.meter.id)}
              />
            ))}
            {!filtered.length ? (
              <div className="quality-empty">
                <Search />
                <strong>No quality points match</strong>
                <p>Try another meter name, status, or class.</p>
                <Button
                  size="sm"
                  variant="outline"
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
        </Card>

        <Card className="quality-focus-card">
          {selected ? (
            <QualityInspector record={selected} alarmId={selectedAlarm?.id} />
          ) : (
            <QualityOverview
              records={summary.records}
              onSelect={setSelectedId}
            />
          )}
        </Card>
      </section>

      <section className="quality-thresholds">
        <Card>
          <CardHeader
            title="Operating thresholds"
            subtitle="Shared PAF quality policy used by telemetry and alarms"
          />
          <CardBody>
            <div className="quality-threshold-grid">
              <Threshold
                label="Power factor target"
                value={`≥ ${POWER_FACTOR.trackBelow.toFixed(2)}`}
                critical={`Critical below ${POWER_FACTOR.fineBelow.toFixed(2)}`}
                icon={CircleGauge}
              />
              <Threshold
                label="Voltage tolerance"
                value={`±${POWER_QUALITY.voltageTolerancePct}%`}
                critical="Outside nominal phase voltage"
                icon={Zap}
              />
              <Threshold
                label="Voltage unbalance"
                value={`≤ ${POWER_QUALITY.voltageUnbalanceWarningPct}%`}
                critical={`Critical above ${POWER_QUALITY.voltageUnbalanceCriticalPct}%`}
                icon={SlidersHorizontal}
              />
              <Threshold
                label="Grid frequency"
                value={`${POWER_QUALITY.frequencyMinHz}–${POWER_QUALITY.frequencyMaxHz} Hz`}
                critical="Outside operating band"
                icon={Waves}
              />
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function QualityRow({
  record,
  selected,
  onSelect,
}: {
  record: PowerQualityRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={cn("quality-row", selected && "selected")}
      onClick={onSelect}
    >
      <span className="quality-identity">
        <QualityIcon state={record.state} />
        <span>
          <strong>{record.node.name}</strong>
          <small>
            <code>{record.meter.code}</code> · {record.issues[0]}
          </small>
        </span>
      </span>
      <QualityValue
        value={record.powerFactor?.toFixed(3)}
        target="PF"
        warning={
          record.powerFactor !== undefined &&
          record.powerFactor < POWER_FACTOR.trackBelow
        }
      />
      <QualityValue value={record.averageVoltageV?.toFixed(0)} unit="V" />
      <QualityValue
        value={record.voltageUnbalancePct?.toFixed(2)}
        unit="%"
        warning={
          record.voltageUnbalancePct !== undefined &&
          record.voltageUnbalancePct > POWER_QUALITY.voltageUnbalanceWarningPct
        }
      />
      <QualityValue value={record.frequencyHz?.toFixed(2)} unit="Hz" />
      <span className="quality-open">
        <ChevronRight />
      </span>
    </button>
  );
}

function QualityInspector({
  record,
  alarmId,
}: {
  record: PowerQualityRecord;
  alarmId?: string;
}) {
  const reading = record.live?.lastReading;
  const voltages = reading?.voltageV ?? [];
  const currents = reading?.currentA ?? [];
  return (
    <div className="quality-inspector">
      <header>
        <div>
          <span>Selected quality point</span>
          <h2>{record.node.name}</h2>
          <p>
            <code>{record.meter.code}</code> · {record.meter.class} ·{" "}
            {record.parent?.name ?? "Lahore Site"}
          </p>
        </div>
        <QualityStatePill state={record.state} />
      </header>
      <section className="quality-score">
        <div className={cn("quality-score-ring", record.state)}>
          <strong>{scoreFor(record)}</strong>
          <span>/100</span>
        </div>
        <div>
          <span>Quality score</span>
          <strong>
            {record.state === "compliant"
              ? "Operating normally"
              : record.state === "unavailable"
                ? "Measurement unavailable"
                : "Corrective action advised"}
          </strong>
          <p>{record.issues.join(" · ")}</p>
        </div>
      </section>
      {reading ? (
        <>
          <section className="quality-chart-head">
            <div>
              <strong>12-hour stability</strong>
              <small>
                <i className="pf" />
                Power factor <i className="hz" />
                Frequency
              </small>
            </div>
            <span>PF threshold 0.80</span>
          </section>
          <QualityTrendChart
            powerFactor={record.powerFactor ?? 1}
            frequency={record.frequencyHz ?? 50}
          />
          <section className="quality-phase-bars">
            <div className="quality-section-title">
              <span>Phase comparison</span>
              <small>Live snapshot</small>
            </div>
            {["L1", "L2", "L3"].map((phase, index) => (
              <div key={phase}>
                <strong>{phase}</strong>
                <span>
                  <i
                    style={{
                      width: `${Math.min(100, ((voltages[index] ?? 0) / Math.max(...voltages, 1)) * 100)}%`,
                    }}
                  />
                </span>
                <em className="num">{voltages[index]?.toFixed(0)} V</em>
                <em className="num">{currents[index]?.toFixed(1)} A</em>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section className="quality-no-data">
          <Radio />
          <div>
            <strong>No valid quality packet</strong>
            <p>
              This meter is configured but cannot provide phase or frequency
              analysis yet.
            </p>
          </div>
        </section>
      )}
      <footer>
        {alarmId ? (
          <Button asChild>
            <Link href="/alarms">
              <AlertTriangle />
              Open active alarm
            </Link>
          </Button>
        ) : record.state === "compliant" ? (
          <span className="quality-ok-note">
            <CheckCircle2 />
            No corrective action required.
          </span>
        ) : (
          <Button asChild>
            <Link href="/meters">
              <Gauge />
              Inspect meter telemetry
            </Link>
          </Button>
        )}
      </footer>
    </div>
  );
}

function QualityOverview({
  records,
  onSelect,
}: {
  records: PowerQualityRecord[];
  onSelect: (id: string) => void;
}) {
  const priority = records
    .filter((record) => record.state === "critical" || record.state === "watch")
    .slice(0, 3);
  return (
    <div className="quality-overview">
      <header>
        <span>Quality focus</span>
        <h2>Priority conditions</h2>
        <p>
          Select a meter to inspect its phases, stability and corrective path.
        </p>
      </header>
      <div className="quality-priorities">
        {priority.map((record) => (
          <button
            key={record.meter.id}
            onClick={() => onSelect(record.meter.id)}
          >
            <QualityIcon state={record.state} />
            <span>
              <strong>{record.node.name}</strong>
              <small>{record.issues[0]}</small>
            </span>
            <ChevronRight />
          </button>
        ))}
        {!priority.length ? (
          <div className="quality-all-clear">
            <CheckCircle2 />
            <strong>All measured points are compliant</strong>
            <p>No corrective action is currently required.</p>
          </div>
        ) : null}
      </div>
      <div className="quality-coverage">
        <Activity />
        <span>
          <strong>
            {records.filter((record) => record.state !== "unavailable").length}{" "}
            measured points
          </strong>
          <small>
            {records.filter((record) => record.state === "unavailable").length}{" "}
            awaiting telemetry
          </small>
        </span>
      </div>
    </div>
  );
}

function QualityIcon({ state }: { state: QualityState }) {
  const Icon =
    state === "critical"
      ? AlertTriangle
      : state === "watch"
        ? Info
        : state === "compliant"
          ? CheckCircle2
          : Radio;
  return (
    <span className={cn("quality-state-icon", state)}>
      <Icon />
    </span>
  );
}
function QualityStatePill({ state }: { state: QualityState }) {
  return (
    <span className={cn("quality-state-pill", state)}>
      <i />
      {state === "unavailable"
        ? "No measurement"
        : state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  );
}
function QualityValue({
  value,
  unit,
  target,
  warning,
}: {
  value?: string;
  unit?: string;
  target?: string;
  warning?: boolean;
}) {
  return (
    <span className={cn("quality-value", warning && "warning")}>
      <strong className="num">{value ?? "—"}</strong>
      <small>{value ? (unit ?? target) : "No data"}</small>
    </span>
  );
}
function scoreFor(record: PowerQualityRecord) {
  if (record.state === "unavailable") return "—";
  let score = 100;
  if ((record.powerFactor ?? 1) < 0.9)
    score -= Math.round((0.9 - (record.powerFactor ?? 1)) * 100);
  if ((record.voltageUnbalancePct ?? 0) > 2) score -= 12;
  if (record.live?.status === "faulty") score -= 25;
  return Math.max(0, score);
}
function Threshold({
  label,
  value,
  critical,
  icon: Icon,
}: {
  label: string;
  value: string;
  critical: string;
  icon: typeof Gauge;
}) {
  return (
    <div>
      <span>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{critical}</p>
      </div>
    </div>
  );
}
