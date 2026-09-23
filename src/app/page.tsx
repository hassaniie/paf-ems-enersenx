"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  CircleGauge,
  Radio,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Zap,
} from "lucide-react";
import { CommandLoadChart } from "@/components/charts/command-load-chart";
import { DashboardToolbar } from "@/components/dashboard-toolbar";
import { AppShell } from "@/components/layout/app-shell";
import {
  FeederTable,
  type FeederRow,
} from "@/components/primitives/feeder-table";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { selectEnergySummary } from "@/features/organization/energy-selectors";
import { useScopedOrganization } from "@/features/organization/use-scoped-organization";

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="section-link">
      <Link href={href}>
        {label}
        <ArrowRight />
      </Link>
    </Button>
  );
}

export default function OverviewPage() {
  const { store } = useScopedOrganization();
  const { store: alarmStore, attentionCount } = useAlarms();
  const summary = useMemo(() => selectEnergySummary(store), [store]);
  const load = Math.round(summary.activeLoadKw);
  const capacityPct = Math.min(100, (load / 1000) * 100);
  const headroom = Math.max(0, 1000 - load);
  const metrics: MetricRibbonItem[] = [
    {
      label: "Active load",
      value: String(load),
      unit: "kW",
      note: "Shared live snapshot",
      tone: "neutral",
    },
    {
      label: "Energy registered",
      value: (summary.energyImportKwh / 1000).toFixed(2),
      unit: "MWh",
      note: "Across reporting meters",
      tone: "good",
    },
    {
      label: "Export registered",
      value: summary.energyExportKwh.toFixed(0),
      unit: "kWh",
      note: `${summary.exportKw.toFixed(0)} kW live`,
      tone: "export",
    },
    {
      label: "Average PF",
      value: summary.averagePf.toFixed(3),
      note: "Across available readings",
      tone: summary.averagePf < 0.9 ? "warning" : "good",
    },
    {
      label: "Meters reporting",
      value: `${summary.reportingCount}/${summary.physicalCount}`,
      note: `${summary.awaitingCount} awaiting data`,
      tone: "info",
    },
  ];
  const feeders: FeederRow[] = summary.records.map(({ meter, node, live }) => {
    let depth = 0;
    let parentId = node.parentId;
    while (parentId && parentId !== "lahore-site") {
      depth += 1;
      parentId =
        store.nodes.find((item) => item.id === parentId)?.parentId ?? null;
    }
    return {
      name: node.name,
      code: meter.code,
      cls: meter.class,
      transport: meter.transport,
      status: live?.status ?? "awaiting-data",
      powerKw: live?.lastReading?.activePowerKw,
      pf: live?.lastReading?.powerFactor,
      depth,
      derived: meter.role === "derived",
    };
  });
  const contributions = summary.records
    .filter(
      ({ meter, live }) =>
        meter.role !== "derived" &&
        live?.status === "online" &&
        live.lastReading,
    )
    .sort(
      (a, b) =>
        Math.abs(b.live?.lastReading?.activePowerKw ?? 0) -
        Math.abs(a.live?.lastReading?.activePowerKw ?? 0),
    )
    .slice(0, 3)
    .map(({ node, meter, live }, index) => ({
      label: node.name,
      sub: meter.code,
      value: `${Math.abs(live?.lastReading?.activePowerKw ?? 0).toFixed(0)} kW`,
      pct: load
        ? Math.round(
            (Math.abs(live?.lastReading?.activePowerKw ?? 0) / load) * 100,
          )
        : 0,
      color:
        index === 1
          ? "var(--flow-export)"
          : index === 2
            ? "var(--viz-3)"
            : "var(--viz-1)",
    }));
  return (
    <AppShell
      title="Command Center"
      subtitle="PAF Base, Lahore · Energy operations"
    >
      <div className="command-center mx-auto max-w-[1680px] space-y-4">
        <section className="command-intro">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="var(--status-online)">
                <Radio className="size-3" />
                Live operations
              </Badge>
              <span className="text-xs text-muted-foreground">
                Refreshed 8 seconds ago
              </span>
            </div>
            <h1>Energy operations, at a glance.</h1>
            <p>
              What needs attention now, how demand is moving, and where every
              kilowatt is going across PAF Base Lahore.
            </p>
          </div>
          <div className="command-health">
            <span className="command-health-icon">
              <ShieldCheck />
            </span>
            <div>
              <small>System condition</small>
              <strong>
                {attentionCount
                  ? `Stable, with ${attentionCount} exceptions`
                  : "Stable, no active exceptions"}
              </strong>
            </div>
          </div>
        </section>

        <DashboardToolbar />

        <MetricRibbon items={metrics} />

        <section className="command-main-grid">
          <Card className="command-primary-card">
            <CardHeader
              title="Demand & energy balance"
              subtitle="Net demand, on-site solar and sanctioned capacity · today"
              action={<SectionLink href="/analytics" label="Open analytics" />}
            />
            <CardBody>
              <div className="demand-summary">
                <div className="demand-headline">
                  <span>Current net demand</span>
                  <div>
                    <strong className="num">{load}</strong>
                    <small>kW</small>
                  </div>
                  <p>
                    <span className="status-dot status-dot-online" />
                    Within expected operating range
                  </p>
                </div>
                <div
                  className="capacity-orbit"
                  style={{ "--capacity": `${capacityPct}%` } as CSSProperties}
                >
                  <div>
                    <strong className="num">{capacityPct.toFixed(0)}%</strong>
                    <span>of capacity</span>
                  </div>
                </div>
                <div className="demand-headroom">
                  <span>Available headroom</span>
                  <strong className="num">{headroom} kW</strong>
                  <small>Peak today 777 kW at 13:15</small>
                </div>
              </div>

              <div className="chart-legend" aria-label="Chart legend">
                <span>
                  <i className="legend-demand" />
                  Net demand
                </span>
                <span>
                  <i className="legend-solar" />
                  Solar export
                </span>
                <span>
                  <i className="legend-previous" />
                  Yesterday
                </span>
              </div>
              <CommandLoadChart />
              <div className="chart-footnotes">
                <span>
                  <CircleGauge />
                  1,000 kW sanctioned demand
                </span>
                <span>
                  <SunMedium />
                  Solar offsetting 3.2% of present load
                </span>
              </div>
            </CardBody>
          </Card>

          <aside className="decision-rail" aria-label="Requires attention">
            <div className="decision-rail-heading">
              <div>
                <span>Decision queue</span>
                <h2>Requires attention</h2>
              </div>
              <b>{attentionCount}</b>
            </div>

            <article className="decision-item decision-critical">
              <span className="decision-marker">
                <CircleAlert />
              </span>
              <div>
                <div className="decision-meta">
                  <span>Commercial risk</span>
                  <code>CC-HT-01</code>
                </div>
                <h3>PF penalty exposure is active</h3>
                <p>
                  Power factor 0.34 for 30 min. Inspect capacitor bank today.
                </p>
                <Link href="/power-quality">
                  Review power quality <ArrowRight />
                </Link>
              </div>
            </article>

            <article className="decision-item decision-warning">
              <span className="decision-marker">
                <Zap />
              </span>
              <div>
                <div className="decision-meta">
                  <span>Metering fault</span>
                  <code>TA-HT-01</code>
                </div>
                <h3>Probable CT circuit fault</h3>
                <p>
                  Voltage present with near-zero current for more than 6 hours.
                </p>
                <Link href="/alarms">
                  Open investigation <ArrowRight />
                </Link>
              </div>
            </article>

            <article className="decision-item decision-opportunity">
              <span className="decision-marker">
                <Sparkles />
              </span>
              <div>
                <div className="decision-meta">
                  <span>Opportunity</span>
                </div>
                <h3>Solar is covering local demand</h3>
                <p>
                  {summary.energyExportKwh.toFixed(0)} kWh registered. Review
                  dispatch and reverse-flow conditions.
                </p>
              </div>
            </article>

            <div className="decision-clear">
              <CheckCircle2 />
              <span>
                <strong>No capacity risk</strong>Demand remains {headroom} kW
                below the sanctioned limit.
              </span>
            </div>
          </aside>
        </section>

        <section className="command-secondary-grid">
          <Card>
            <CardHeader
              title="Site contribution"
              subtitle="Where active demand is concentrated right now"
              action={
                <SectionLink href="/power-flow" label="View power flow" />
              }
            />
            <CardBody>
              <div className="site-contribution-list">
                {contributions.map((item, index) => (
                  <div className="site-contribution-row" key={item.label}>
                    <span className="site-rank num">0{index + 1}</span>
                    <div className="site-copy">
                      <strong>{item.label}</strong>
                      <small>{item.sub}</small>
                    </div>
                    <div className="contribution-track">
                      <span
                        style={{
                          width: `${Math.max(item.pct, 2)}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                    <strong className="num contribution-value">
                      {item.value}
                    </strong>
                    <span className="num contribution-pct">{item.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="contribution-summary">
                <span>
                  {contributions[0]?.label ?? "No reporting feeder"} carries the
                  largest measured load
                </span>
                <strong className="num">{contributions[0]?.pct ?? 0}%</strong>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Operational pulse"
              subtitle="Most meaningful system events, newest first"
              action={<SectionLink href="/alarms" label="All events" />}
            />
            <CardBody>
              <div className="event-timeline">
                {alarmStore.alarms.slice(0, 3).map((alarm) => (
                  <article
                    className={`event-row event-${alarm.severity}`}
                    key={alarm.id}
                  >
                    <span className="event-node" />
                    <div>
                      <div className="event-meta">
                        <code>{alarm.meterCode}</code>
                        <time>{alarm.lifecycle}</time>
                      </div>
                      <p>{alarm.message}</p>
                    </div>
                  </article>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>

        <Card className="overflow-hidden">
          <CardHeader
            title="Metering network"
            subtitle="Live hierarchy, data confidence and field connectivity"
            action={
              <div className="metering-status">
                <span>
                  <i />
                  {summary.reportingCount} online
                </span>
                <span>{summary.awaitingCount} awaiting data</span>
              </div>
            }
          />
          <div className="border-t border-border">
            <FeederTable rows={feeders} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
