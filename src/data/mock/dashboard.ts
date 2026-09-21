/*
 * Mock dashboard data for the PAF tenant — a hand-built, self-consistent
 * snapshot used until the mock simulator (Step 4) and backend exist.
 *
 * It deliberately demonstrates the FIXED model (docs/domain-model.md):
 *  - Site total is the sum of feeders (553 kW), not the faulty parent's 0
 *    that made the prototype read "1 kW".
 *  - Import vs export is explicit; CAC/CASS is exporting (reverse flow).
 *  - "Awaiting data" (configured, never reported) is distinct from offline.
 */

import type { AlarmItemData } from "@/components/primitives/alarm-item";
import type { FeederRowData } from "@/components/primitives/feeder-row";
import type { MetricDelta } from "@/components/primitives/metric-tile";

export interface KpiData {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  delta?: MetricDelta;
  spark?: { data: number[]; color?: string };
  valueClassName?: string;
}

export const KPIS: KpiData[] = [
  {
    label: "Total Active Load",
    value: "553",
    unit: "kW",
    sub: "Sum of all feeders",
    delta: { text: "4%", dir: "up" },
    spark: { data: [420, 460, 510, 505, 540, 548, 553], color: "var(--brand-accent)" },
  },
  {
    label: "Energy Today",
    value: "8.74",
    unit: "MWh",
    sub: "Net import since 00:00 PKT",
    delta: { text: "2%", dir: "down", good: true },
    spark: { data: [0, 1.2, 2.6, 3.9, 5.3, 7.0, 8.74], color: "var(--viz-1)" },
  },
  {
    label: "Avg Power Factor",
    value: "0.930",
    sub: "2 feeders below 0.90",
    delta: { text: "0.01", dir: "up", good: true },
  },
  {
    label: "Grid Export Today",
    value: "160",
    unit: "kWh",
    sub: "Net-metering credit",
    valueClassName: "text-export",
    spark: { data: [0, 0, 12, 40, 96, 140, 160], color: "var(--flow-export)" },
  },
  {
    label: "Peak Demand (MDI)",
    value: "777",
    unit: "kW",
    sub: "78% of 1,000 kW sanctioned",
  },
  {
    label: "Meters Online",
    value: "4 / 10",
    sub: "6 awaiting data",
  },
];

export const FEEDERS: FeederRowData[] = [
  { name: "Iqbal Camp", code: "IC-HT-01", cls: "HT", transport: "wifi", status: "online", powerKw: 1, pf: 0.86, depth: 0 },
  { name: "Officers Mess", code: "OM-HT-01", cls: "HT", transport: "wifi", status: "awaiting-data", depth: 0 },
  { name: "Officers Colony / Siddiqui", code: "SC-HT-01", cls: "HT", transport: "wifi", status: "awaiting-data", depth: 0 },
  { name: "Tech Area (Main)", code: "TA-HT-01", cls: "HT", transport: "modbus", status: "faulty", depth: 0 },
  { name: "NASTP Delta Ph-III", code: "ND-HT-01", cls: "HT", transport: "modbus", status: "online", powerKw: 544, pf: 0.95, depth: 1 },
  { name: "CAC / CASS", code: "CC-HT-01", cls: "HT", transport: "modbus", status: "online", powerKw: -18, pf: 0.34, depth: 2 },
  { name: "NASTP Delta (Net)", code: "ND − CC", cls: "HT", transport: "modbus", status: "online", powerKw: 562, pf: 0.95, depth: 1, derived: true },
  { name: "Qureshi Camp (Main)", code: "QC-HT-01", cls: "HT", transport: "lorawan", status: "awaiting-data", depth: 0 },
  { name: "PAF Hospital LT-1", code: "PH-LT-01", cls: "LT", transport: "lorawan", status: "awaiting-data", depth: 1 },
  { name: "PAF Hospital LT-2", code: "PH-LT-02", cls: "LT", transport: "lorawan", status: "awaiting-data", depth: 1 },
  { name: "PAF Hospital LT-3", code: "PH-LT-03", cls: "LT", transport: "lorawan", status: "awaiting-data", depth: 1 },
];

export const ALARMS: AlarmItemData[] = [
  {
    severity: "critical",
    code: "CC-HT-01",
    message:
      "Power factor 0.34 sustained 30 min — below 0.80. LESCO fine exposure active; reactive compensation (capacitor bank) required.",
    time: "20 Sep, 23:32",
  },
  {
    severity: "warning",
    code: "TA-HT-01",
    message:
      "Voltage present, ~zero current for 6+ h — CT circuit fault suspected. Meter unserviceable; physical inspection required.",
    time: "21 Sep, 12:57",
  },
  {
    severity: "info",
    code: "CC-HT-01",
    message: "Reverse power flow: exporting 18 kW (15-min average).",
    time: "21 Sep, 15:07",
    acknowledged: true,
  },
];
