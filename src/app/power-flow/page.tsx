import {
  Activity,
  AlertTriangle,
  Gauge,
  Radio,
  SunMedium,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SingleLineDiagram } from "@/components/power-flow/single-line-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";

const stats = [
  {
    label: "Active load",
    value: "553 kW",
    note: "55% of sanctioned",
    icon: Zap,
    tone: "brand" as const,
  },
  {
    label: "Energy today",
    value: "8.74 MWh",
    note: "Since 00:00 PKT",
    icon: Activity,
    tone: "brand" as const,
  },
  {
    label: "Average PF",
    value: "0.930",
    note: "2 feeders below 0.90",
    icon: Gauge,
    tone: "warning" as const,
  },
  {
    label: "Solar export",
    value: "160 kWh",
    note: "18 kW right now",
    icon: SunMedium,
    tone: "brand" as const,
  },
];

export default function PowerFlowPage() {
  return (
    <AppShell
      title="Live Power Flow"
      subtitle="PAF Base, Lahore · single-line energy view"
    >
      <div className="mx-auto max-w-[1660px] space-y-4">
        <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="var(--status-online)">
                <Radio className="size-3" />
                Live telemetry
              </Badge>
              <span className="text-xs text-muted-foreground">
                Updated 8 seconds ago
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[30px]">
              Lahore site energy network
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              Trace utility import, downstream demand, solar reverse-feed and
              meter health across the live distribution hierarchy.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Pause animation
            </Button>
            <Button size="sm">
              Open alarms <AlertTriangle />
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="power-stat">
              <IconTile icon={stat.icon} tone={stat.tone} />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="num mt-1 text-lg font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {stat.note}
                </p>
              </div>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden">
          <CardHeader
            title="Single-line energy flow"
            subtitle="Animated paths indicate active power direction. Select an asset for details."
            action={
              <div className="hidden items-center gap-2 sm:flex">
                <Badge variant="outline">10 meters</Badge>
                <Badge tone="var(--status-online)">4 reporting</Badge>
              </div>
            }
          />
          <CardBody className="pt-1">
            <SingleLineDiagram />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
