import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/primitives/stat-card";
import { ProgressList } from "@/components/primitives/progress-list";
import { FeederTable } from "@/components/primitives/feeder-table";
import { AlarmItem } from "@/components/primitives/alarm-item";
import { LoadArea } from "@/components/charts/load-area";
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
      <div className="space-y-6">
        {/* KPI row */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} />
          ))}
        </section>

        {/* chart + load share */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Site load — today"
              subtitle="Import vs solar export · peak demand 777 kW (78% of sanctioned)"
              action={
                <div className="flex items-center gap-4">
                  <LegendDot color="var(--viz-1)" label="Site load" />
                  <LegendDot color="var(--flow-export)" label="Solar export" />
                </div>
              }
            />
            <CardBody>
              <LoadArea data={LOAD_SERIES} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Load by feeder"
              subtitle="Share of active load"
            />
            <CardBody>
              <ProgressList items={FEEDER_LOAD} />
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                6 feeders awaiting data — configured, meters not yet connected.
              </p>
            </CardBody>
          </Card>
        </section>

        {/* table + alarms */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Sites & Feeders"
              subtitle="Live metering hierarchy"
              action={
                <span className="num text-[13px] text-muted-foreground">
                  <span className="text-online">4</span> / 10 online
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
