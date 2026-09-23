import type { OrganizationStore } from "@/data/client/organization-repository";
import { selectEnergySummary } from "@/features/organization/energy-selectors";

export type AnalyticsRange = "24H" | "7D" | "30D" | "90D";
export type AnalyticsMetric = "demand" | "energy" | "cost";

export interface AnalyticsPoint {
  label: string;
  demandKw: number;
  previousDemandKw: number;
  exportKw: number;
  energyKwh: number;
  previousEnergyKwh: number;
  costPkr: number;
  previousCostPkr: number;
}

export interface AnalyticsContribution {
  meterId: string;
  name: string;
  code: string;
  energyKwh: number;
  previousEnergyKwh: number;
  sharePct: number;
  color: string;
}

const RANGE_CONFIG: Record<
  AnalyticsRange,
  { points: number; hours: number; label: (index: number) => string }
> = {
  "24H": {
    points: 24,
    hours: 1,
    label: (index) => `${String(index).padStart(2, "0")}:00`,
  },
  "7D": {
    points: 7,
    hours: 24,
    label: (index) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]!,
  },
  "30D": { points: 15, hours: 48, label: (index) => `${index * 2 + 1} Sep` },
  "90D": { points: 13, hours: 168, label: (index) => `W${index + 1}` },
};

export const ANALYTICS_TARIFF_PKR = 58.75;

export function buildAnalyticsDataset(
  store: OrganizationStore,
  range: AnalyticsRange,
) {
  const summary = selectEnergySummary(store);
  const config = RANGE_CONFIG[range];
  const baseDemand = Math.max(120, summary.activeLoadKw);
  const points: AnalyticsPoint[] = Array.from(
    { length: config.points },
    (_, index) => {
      const progress = index / Math.max(1, config.points - 1);
      const dailyWave =
        range === "24H"
          ? 0.66 + Math.sin(progress * Math.PI * 2 - Math.PI / 2) * 0.23
          : 0.91 + Math.sin(index * 1.17) * 0.09;
      const demandKw = Math.round(
        baseDemand * dailyWave * (1 + Math.sin(index * 2.41) * 0.035),
      );
      const previousDemandKw = Math.round(
        demandKw * (1.035 + Math.cos(index * 0.73) * 0.025),
      );
      const exportKw = Math.max(
        0,
        Math.round(
          summary.exportKw *
            (range === "24H"
              ? Math.max(0, Math.sin(progress * Math.PI))
              : 0.72 + Math.sin(index) * 0.18),
        ),
      );
      const energyKwh = Math.round(
        Math.max(0, demandKw - exportKw) * config.hours * 0.78,
      );
      const previousEnergyKwh = Math.round(
        previousDemandKw * config.hours * 0.8,
      );
      return {
        label: config.label(index),
        demandKw,
        previousDemandKw,
        exportKw,
        energyKwh,
        previousEnergyKwh,
        costPkr: Math.round(energyKwh * ANALYTICS_TARIFF_PKR),
        previousCostPkr: Math.round(previousEnergyKwh * ANALYTICS_TARIFF_PKR),
      };
    },
  );

  const palette = [
    "var(--viz-1)",
    "var(--viz-3)",
    "var(--flow-export)",
    "var(--viz-4)",
    "var(--viz-7)",
  ];
  const sourceRecords = summary.records
    .filter(({ meter, live }) => meter.role !== "derived" && live?.lastReading)
    .sort(
      (a, b) =>
        Math.abs(b.live?.lastReading?.activePowerKw ?? 0) -
        Math.abs(a.live?.lastReading?.activePowerKw ?? 0),
    );
  const weights = sourceRecords.map(({ live }) =>
    Math.max(1, Math.abs(live?.lastReading?.activePowerKw ?? 0)),
  );
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const totalEnergyKwh = points.reduce(
    (sum, point) => sum + point.energyKwh,
    0,
  );
  const contributions: AnalyticsContribution[] = sourceRecords.map(
    ({ meter, node }, index) => {
      const share = weights[index]! / totalWeight;
      const energyKwh = Math.round(totalEnergyKwh * share);
      return {
        meterId: meter.id,
        name: node.name,
        code: meter.code,
        energyKwh,
        previousEnergyKwh: Math.round(energyKwh * (1.02 + index * 0.012)),
        sharePct: share * 100,
        color: palette[index % palette.length]!,
      };
    },
  );

  const energyKwh = points.reduce((sum, point) => sum + point.energyKwh, 0);
  const previousEnergyKwh = points.reduce(
    (sum, point) => sum + point.previousEnergyKwh,
    0,
  );
  const peak = points.reduce(
    (best, point) => (point.demandKw > best.demandKw ? point : best),
    points[0]!,
  );
  const exportKwh = Math.round(
    points.reduce(
      (sum, point) => sum + point.exportKw * config.hours * 0.75,
      0,
    ),
  );
  return {
    points,
    contributions,
    energyKwh,
    previousEnergyKwh,
    costPkr: Math.round(energyKwh * ANALYTICS_TARIFF_PKR),
    previousCostPkr: Math.round(previousEnergyKwh * ANALYTICS_TARIFF_PKR),
    peakDemandKw: peak.demandKw,
    peakLabel: peak.label,
    exportKwh,
    averageDemandKw: Math.round(
      points.reduce((sum, point) => sum + point.demandKw, 0) / points.length,
    ),
  };
}

export function analyticsCsv(points: AnalyticsPoint[]) {
  const header =
    "Period,Demand kW,Previous demand kW,Export kW,Energy kWh,Previous energy kWh,Cost PKR";
  return [
    header,
    ...points.map((point) =>
      [
        point.label,
        point.demandKw,
        point.previousDemandKw,
        point.exportKw,
        point.energyKwh,
        point.previousEnergyKwh,
        point.costPkr,
      ].join(","),
    ),
  ].join("\n");
}
