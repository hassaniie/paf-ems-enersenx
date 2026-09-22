import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/primitives/stat-card";
import { ProgressList } from "@/components/primitives/progress-list";
import { FeederTable } from "@/components/primitives/feeder-table";
import { AlarmItem } from "@/components/primitives/alarm-item";
import { LoadArea } from "@/components/charts/load-area";
import { DashboardToolbar } from "@/components/dashboard-toolbar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Building2,
  CircleGauge,
  Radio,
  ShieldCheck,
} from "lucide-react";
import {
  ALARMS,
  FEEDERS,
  FEEDER_LOAD,
  KPIS,
  LOAD_SERIES,
} from "@/data/mock/dashboard";

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

export default function OverviewPage() {
  return (
    <AppShell title="Overview" subtitle="PAF Base, Lahore · live metering">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <section className="overview-hero">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="var(--status-online)">
                <Radio className="size-3" />
                Telemetry healthy
              </Badge>
              <span className="text-xs text-muted-foreground">
                Last packet 8s ago
              </span>
            </div>
            <h2 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[30px]">
              Energy command overview
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Live operational picture across PAF Base Lahore, with load,
              generation, power quality and risk in one decision layer.
            </p>
          </div>
          <div className="hero-summary hidden xl:grid">
            <div>
              <Building2 />
              <span>
                <b>10</b> assets
              </span>
            </div>
            <div>
              <CircleGauge />
              <span>
                <b>55%</b> capacity
              </span>
            </div>
            <div>
              <ShieldCheck />
              <span>
                <b>2</b> need action
              </span>
            </div>
          </div>
        </section>

        <DashboardToolbar />

        {/* KPI row */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </section>

        {/* chart + load share */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,.75fr)]">
          <Card>
            <CardHeader
              title="Site load — today"
              subtitle="Import vs solar export · peak demand 777 kW (78% of sanctioned)"
              action={
                <div className="hidden items-center gap-4 sm:flex">
                  <LegendDot color="var(--viz-1)" label="Site load" />
                  <LegendDot color="var(--flow-export)" label="Solar export" />
                </div>
              }
            />
            <CardBody>
              <LoadArea data={LOAD_SERIES} />
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Load by feeder"
              subtitle="Share of active load"
            />
            <CardBody>
              <ProgressList items={FEEDER_LOAD} />
              <div className="mt-5 rounded-lg border border-border bg-elevated/50 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Sanctioned demand
                  </span>
                  <span className="num text-sm font-semibold">1,000 kW</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                  <div className="h-full w-[55.3%] rounded-full bg-brand" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                  <span>553 kW used</span>
                  <span>447 kW headroom</span>
                </div>
              </div>
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                6 feeders awaiting data — configured, meters not yet connected.
              </p>
            </CardBody>
          </Card>
        </section>

        {/* table + alarms */}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,.75fr)]">
          <Card className="overflow-hidden">
            <CardHeader
              title="Sites & Feeders"
              subtitle="Live metering hierarchy"
              action={
                <span className="num inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <span className="text-online">4</span> / 10 online
                  <ArrowUpRight className="size-3.5" />
                </span>
              }
            />
            <div className="border-t border-border">
              <FeederTable rows={FEEDERS} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Active Alarms"
              subtitle="2 active · 1 acknowledged"
              action={
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                  View all
                </Button>
              }
            />
            <CardBody className="space-y-3">
              {ALARMS.map((alarm, i) => (
                <AlarmItem key={`${alarm.code}-${i}`} alarm={alarm} />
              ))}
            </CardBody>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
