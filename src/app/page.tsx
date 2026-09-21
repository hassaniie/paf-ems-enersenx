import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MetricTile } from "@/components/primitives/metric-tile";
import { FeederRow } from "@/components/primitives/feeder-row";
import { AlarmItem } from "@/components/primitives/alarm-item";
import { ALARMS, FEEDERS, KPIS } from "@/data/mock/dashboard";

export default function OverviewPage() {
  return (
    <AppShell title="Overview" subtitle="PAF Base, Lahore · live metering">
      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((kpi) => (
          <MetricTile key={kpi.label} {...kpi} />
        ))}
      </section>

      {/* Main split */}
      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Sites & feeders */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sites & Feeders"
            subtitle="Live metering hierarchy"
            action={
              <span className="num text-xs text-muted">
                553 kW · <span className="text-online">4</span>/10 online
              </span>
            }
          />
          <CardBody className="pt-2">
            <div className="flex items-center gap-3 border-b border-border px-1 pb-2 text-[10px] font-semibold tracking-wider text-faint uppercase">
              <span className="flex-1">Feeder</span>
              <span className="w-28 text-right">Load</span>
              <span className="hidden w-16 text-right sm:block">PF</span>
              <span className="w-32 text-right">Status</span>
            </div>
            <div className="divide-y divide-border/60">
              {FEEDERS.map((row) => (
                <FeederRow key={row.code} row={row} />
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Active alarms */}
        <Card>
          <CardHeader
            title="Active Alarms"
            subtitle="2 active · 1 acknowledged"
            action={
              <a
                href="#"
                className="text-xs font-medium text-brand hover:text-brand-hover"
              >
                View all
              </a>
            }
          />
          <CardBody className="space-y-2.5">
            {ALARMS.map((alarm, i) => (
              <AlarmItem key={`${alarm.code}-${i}`} alarm={alarm} />
            ))}
          </CardBody>
        </Card>
      </section>

      <p className="mt-4 text-[11px] text-faint">
        Values are representative mock data implementing the telemetry contract —
        the live simulator and backend swap in behind the same shapes.
      </p>
    </AppShell>
  );
}
