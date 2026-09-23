import Link from "next/link";
import type { CSSProperties } from "react";
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
import { FeederTable } from "@/components/primitives/feeder-table";
import { MetricRibbon } from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ALARMS, FEEDERS, FEEDER_LOAD } from "@/data/mock/dashboard";

const metrics = [
  {
    label: "Active load",
    value: "553",
    unit: "kW",
    note: "+4.1% vs yesterday",
    tone: "neutral",
  },
  {
    label: "Energy today",
    value: "8.74",
    unit: "MWh",
    note: "−2.3% vs baseline",
    tone: "good",
  },
  {
    label: "Solar export",
    value: "160",
    unit: "kWh",
    note: "18 kW live",
    tone: "export",
  },
  {
    label: "Average PF",
    value: "0.930",
    unit: "",
    note: "2 feeders below target",
    tone: "warning",
  },
  {
    label: "Meters reporting",
    value: "4/10",
    unit: "",
    note: "6 awaiting data",
    tone: "info",
  },
] as const;

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
              <strong>Stable, with 2 exceptions</strong>
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
                    <strong className="num">553</strong>
                    <small>kW</small>
                  </div>
                  <p>
                    <span className="status-dot status-dot-online" />
                    Within expected operating range
                  </p>
                </div>
                <div
                  className="capacity-orbit"
                  style={{ "--capacity": "55.3%" } as CSSProperties}
                >
                  <div>
                    <strong className="num">55%</strong>
                    <span>of capacity</span>
                  </div>
                </div>
                <div className="demand-headroom">
                  <span>Available headroom</span>
                  <strong className="num">447 kW</strong>
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
              <b>2</b>
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
                <button>
                  Review power quality <ArrowRight />
                </button>
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
                <button>
                  Open investigation <ArrowRight />
                </button>
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
                  160 kWh exported today. Review dispatch window after 14:00.
                </p>
              </div>
            </article>

            <div className="decision-clear">
              <CheckCircle2 />
              <span>
                <strong>No capacity risk</strong>Demand remains 447 kW below the
                sanctioned limit.
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
                {FEEDER_LOAD.map((item, index) => (
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
                <span>NASTP Delta carries nearly all current site load</span>
                <strong className="num">98%</strong>
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
                {ALARMS.map((alarm, index) => (
                  <article
                    className={`event-row event-${alarm.severity}`}
                    key={`${alarm.code}-${index}`}
                  >
                    <span className="event-node" />
                    <div>
                      <div className="event-meta">
                        <code>{alarm.code}</code>
                        <time>{alarm.time}</time>
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
                  <i />4 online
                </span>
                <span>6 awaiting data</span>
              </div>
            }
          />
          <div className="border-t border-border">
            <FeederTable rows={FEEDERS} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
