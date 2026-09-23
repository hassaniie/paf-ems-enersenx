"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleGauge,
  Download,
  FileSpreadsheet,
  Gauge,
  Lightbulb,
  Scale,
  SunMedium,
} from "lucide-react";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatEnergy, formatPkr } from "@/domain";
import { useOrganization } from "@/features/organization/organization-provider";
import { cn } from "@/lib/cn";
import {
  AnalyticsTrendChart,
  ContributionChart,
  LoadProfileChart,
} from "./analytics-charts";
import {
  ANALYTICS_TARIFF_PKR,
  analyticsCsv,
  buildAnalyticsDataset,
  type AnalyticsMetric,
  type AnalyticsRange,
} from "./analytics-data";

const ranges: AnalyticsRange[] = ["24H", "7D", "30D", "90D"];
const metrics: { id: AnalyticsMetric; label: string }[] = [
  { id: "demand", label: "Demand" },
  { id: "energy", label: "Energy" },
  { id: "cost", label: "Cost" },
];

export function AnalyticsWorkspace() {
  const { store, ready } = useOrganization();
  const [range, setRange] = useState<AnalyticsRange>("30D");
  const [metric, setMetric] = useState<AnalyticsMetric>("demand");
  const [compare, setCompare] = useState(true);
  const [meterId, setMeterId] = useState("all");
  const [exported, setExported] = useState(false);
  const dataset = useMemo(
    () => buildAnalyticsDataset(store, range),
    [range, store],
  );
  const selectedContribution = dataset.contributions.find(
    (item) => item.meterId === meterId,
  );
  const share = selectedContribution ? selectedContribution.sharePct / 100 : 1;
  const points = useMemo(
    () =>
      meterId === "all"
        ? dataset.points
        : dataset.points.map((point) => ({
            ...point,
            demandKw: Math.round(point.demandKw * share),
            previousDemandKw: Math.round(point.previousDemandKw * share),
            exportKw: Math.round(point.exportKw * share),
            energyKwh: Math.round(point.energyKwh * share),
            previousEnergyKwh: Math.round(point.previousEnergyKwh * share),
            costPkr: Math.round(point.costPkr * share),
            previousCostPkr: Math.round(point.previousCostPkr * share),
          })),
    [dataset.points, meterId, share],
  );
  const energyKwh = Math.round(dataset.energyKwh * share);
  const previousEnergyKwh = Math.round(dataset.previousEnergyKwh * share);
  const costPkr = Math.round(dataset.costPkr * share);
  const deltaPct = previousEnergyKwh
    ? ((energyKwh - previousEnergyKwh) / previousEnergyKwh) * 100
    : 0;
  const peakDemand = Math.round(dataset.peakDemandKw * share);
  const averageDemand = Math.round(dataset.averageDemandKw * share);
  const ribbon: MetricRibbonItem[] = [
    {
      label: "Energy consumed",
      value: formatEnergy(energyKwh).split(" ")[0]!,
      unit: formatEnergy(energyKwh).split(" ")[1],
      note: `${Math.abs(deltaPct).toFixed(1)}% ${deltaPct <= 0 ? "below" : "above"} previous period`,
      tone: deltaPct <= 0 ? "good" : "warning",
    },
    {
      label: "Peak demand",
      value: String(peakDemand),
      unit: "kW",
      note: `${dataset.peakLabel} · 1,000 kW limit`,
      tone: peakDemand > 850 ? "warning" : "neutral",
    },
    {
      label: "Average demand",
      value: String(averageDemand),
      unit: "kW",
      note: `${Math.round(averageDemand / 10)}% average utilization`,
      tone: "info",
    },
    {
      label: "Estimated cost",
      value: `${Math.round(costPkr / 1000).toLocaleString()}k`,
      unit: "PKR",
      note: `At PKR ${ANALYTICS_TARIFF_PKR.toFixed(2)} / kWh`,
      tone: "neutral",
    },
    {
      label: "Energy exported",
      value: formatEnergy(Math.round(dataset.exportKwh * share)).split(" ")[0]!,
      unit: formatEnergy(Math.round(dataset.exportKwh * share)).split(" ")[1],
      note: "Registered reverse flow",
      tone: "export",
    },
  ];

  const exportData = () => {
    const blob = new Blob([analyticsCsv(points)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `enersenx-analytics-${range.toLowerCase()}-${meterId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2200);
  };

  if (!ready)
    return (
      <div className="analytics-loading">
        <div />
        <div />
        <div />
      </div>
    );

  return (
    <div className="analytics-page mx-auto max-w-[1680px]">
      <section className="analytics-heading">
        <div>
          <div className="analytics-eyebrow">
            <Activity />
            Historical intelligence
          </div>
          <h1>Understand the pattern behind the load.</h1>
          <p>
            Compare demand, energy and cost across time, areas and metering
            boundaries.
          </p>
        </div>
        <div className="analytics-heading-actions">
          <Badge tone="var(--status-online)">
            <Check />
            Dataset complete
          </Badge>
          <Button variant="outline" onClick={exportData}>
            {exported ? <Check /> : <Download />}
            {exported ? "CSV exported" : "Export CSV"}
          </Button>
        </div>
      </section>

      <section className="analytics-command-bar">
        <div className="analytics-ranges" aria-label="Analytics time range">
          {ranges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={cn(range === item && "active")}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="analytics-date">
          <CalendarDays />
          <span>
            {range === "24H"
              ? "23 Sep 2026"
              : range === "7D"
                ? "17–23 Sep 2026"
                : range === "30D"
                  ? "25 Aug–23 Sep 2026"
                  : "26 Jun–23 Sep 2026"}
          </span>
        </button>
        <label className="analytics-asset">
          <Building2 />
          <select
            value={meterId}
            onChange={(event) => setMeterId(event.target.value)}
          >
            <option value="all">All reporting meters</option>
            {dataset.contributions.map((item) => (
              <option key={item.meterId} value={item.meterId}>
                {item.name} · {item.code}
              </option>
            ))}
          </select>
        </label>
        <label className="analytics-compare">
          <input
            type="checkbox"
            checked={compare}
            onChange={(event) => setCompare(event.target.checked)}
          />
          <span>Compare previous period</span>
        </label>
      </section>

      <MetricRibbon items={ribbon} label="Analytics period summary" />

      <section className="analytics-primary-grid">
        <Card className="analytics-trend-card">
          <CardHeader
            title={`${selectedContribution?.name ?? "Site"} ${metric} trend`}
            subtitle={`${range} analysis · PKT · previous period ${compare ? "visible" : "hidden"}`}
            action={
              <div className="analytics-metric-tabs">
                {metrics.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMetric(item.id)}
                    className={cn(metric === item.id && "active")}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            }
          />
          <CardBody>
            <div className="analytics-chart-legend">
              <span>
                <i className="current" />
                Current period
              </span>
              {compare ? (
                <span>
                  <i className="previous" />
                  Previous period
                </span>
              ) : null}
              {metric === "demand" ? (
                <span>
                  <i className="export" />
                  Export tracked separately
                </span>
              ) : null}
            </div>
            <AnalyticsTrendChart
              data={points}
              metric={metric}
              compare={compare}
            />
          </CardBody>
        </Card>

        <Card className="analytics-insight-card">
          <CardHeader
            title="Period intelligence"
            subtitle="Automatically surfaced operating patterns"
          />
          <CardBody>
            <div className="analytics-insights">
              <Insight
                icon={deltaPct <= 0 ? ArrowDownRight : ArrowUpRight}
                tone={deltaPct <= 0 ? "good" : "warning"}
                label="Period change"
                title={`${Math.abs(deltaPct).toFixed(1)}% ${deltaPct <= 0 ? "less energy" : "more energy"}`}
                text={`Versus the previous ${range.toLowerCase()} comparison window.`}
              />
              <Insight
                icon={Gauge}
                tone="brand"
                label="Peak concentration"
                title={`${peakDemand} kW at ${dataset.peakLabel}`}
                text={`${Math.max(0, 1000 - peakDemand)} kW headroom remained below sanctioned demand.`}
              />
              <Insight
                icon={SunMedium}
                tone="export"
                label="Reverse flow"
                title={`${formatEnergy(Math.round(dataset.exportKwh * share))} exported`}
                text="Export remains concentrated around the daytime generation window."
              />
            </div>
            <div className="analytics-opportunity">
              <Lightbulb />
              <span>
                <strong>Optimization opportunity</strong>
                <p>
                  Shift discretionary loads away from the peak window to reduce
                  demand exposure.
                </p>
              </span>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="analytics-secondary-grid">
        <Card>
          <CardHeader
            title="Daily load profile"
            subtitle="Typical intraday demand and export shape"
          />
          <CardBody>
            <LoadProfileChart data={points} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Energy contribution"
            subtitle="Share of consumption by reporting meter"
          />
          <CardBody>
            <ContributionChart data={dataset.contributions} />
          </CardBody>
        </Card>
      </section>

      <Card className="analytics-breakdown">
        <CardHeader
          title="Meter performance"
          subtitle="Period consumption, share and movement versus previous period"
          action={
            <span className="analytics-table-note">
              <FileSpreadsheet />
              Export includes {points.length} period rows
            </span>
          }
        />
        <div className="analytics-breakdown-head">
          <span>Meter & asset</span>
          <span>Energy</span>
          <span>Share</span>
          <span>Previous period</span>
          <span>Movement</span>
          <span />
        </div>
        <div>
          {dataset.contributions.map((item) => {
            const change = item.previousEnergyKwh
              ? ((item.energyKwh - item.previousEnergyKwh) /
                  item.previousEnergyKwh) *
                100
              : 0;
            return (
              <button
                key={item.meterId}
                onClick={() => setMeterId(item.meterId)}
                className={cn(
                  "analytics-breakdown-row",
                  meterId === item.meterId && "selected",
                )}
              >
                <span className="analytics-meter">
                  <i style={{ background: item.color }} />
                  <span>
                    <strong>{item.name}</strong>
                    <code>{item.code}</code>
                  </span>
                </span>
                <strong className="num">{formatEnergy(item.energyKwh)}</strong>
                <span className="analytics-share">
                  <span>
                    <i
                      style={{
                        width: `${item.sharePct}%`,
                        background: item.color,
                      }}
                    />
                  </span>
                  <strong className="num">{item.sharePct.toFixed(1)}%</strong>
                </span>
                <span className="num">
                  {formatEnergy(item.previousEnergyKwh)}
                </span>
                <span
                  className={cn(
                    "analytics-movement",
                    change <= 0 ? "good" : "warning",
                  )}
                >
                  {change <= 0 ? <ArrowDownRight /> : <ArrowUpRight />}
                  {Math.abs(change).toFixed(1)}%
                </span>
                <ChevronRight />
              </button>
            );
          })}
        </div>
      </Card>

      <section className="analytics-method">
        <Scale />
        <span>
          <strong>Calculation context</strong>
          <p>
            Cost estimates use the configured demonstration tariff of{" "}
            {formatPkr(ANALYTICS_TARIFF_PKR)} per kWh. Production billing will
            apply tariff slabs, taxes and demand charges separately.
          </p>
        </span>
        <CircleGauge />
      </section>
    </div>
  );
}

function Insight({
  icon: Icon,
  tone,
  label,
  title,
  text,
}: {
  icon: typeof Gauge;
  tone: string;
  label: string;
  title: string;
  text: string;
}) {
  return (
    <article className={cn("analytics-insight", tone)}>
      <span>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </article>
  );
}
