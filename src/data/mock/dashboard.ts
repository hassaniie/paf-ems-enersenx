/*
 * Mock dashboard data for the PAF tenant — a hand-built, self-consistent
 * snapshot used until the mock simulator (Step 4) and backend exist.
 * Demonstrates the fixed model (docs/domain-model.md): correct site total,
 * explicit import/export, and "awaiting data" distinct from offline.
 */

import { Activity, Gauge, SunMedium, Zap } from "lucide-react";
import type { AlarmItemData } from "@/components/primitives/alarm-item";
import type { FeederRow } from "@/components/primitives/feeder-table";
import type { LoadPoint } from "@/components/charts/load-area";
import type { ProgressRowData } from "@/components/primitives/progress-list";
import type { StatCardProps } from "@/components/primitives/stat-card";

export const KPIS: StatCardProps[] = [
  {
    label: "Total Active Load",
    value: "553",
    unit: "kW",
    icon: Zap,
    delta: { text: "4%", dir: "up" },
    spark: {
      data: [420, 440, 460, 470, 510, 540, 560, 553],
      color: "var(--viz-1)",
    },
  },
  {
    label: "Energy Today",
    value: "8.74",
    unit: "MWh",
    icon: Activity,
    delta: { text: "2%", dir: "down", good: true },
    spark: {
      data: [0, 1.1, 2.6, 3.9, 5.3, 6.9, 7.9, 8.74],
      color: "var(--viz-3)",
    },
  },
  {
    label: "Grid Export Today",
    value: "160",
    unit: "kWh",
    icon: SunMedium,
    valueClassName: "text-export",
    spark: { data: [0, 0, 3, 18, 40, 32, 24, 18], color: "var(--flow-export)" },
  },
  {
    label: "Avg Power Factor",
    value: "0.930",
    icon: Gauge,
    statusColor: "var(--status-stale)",
    sub: "2 feeders below 0.90 — LESCO exposure",
  },
];

export const LOAD_SERIES: LoadPoint[] = [
  { t: "00:00", load: 420, solar: 0 },
  { t: "02:00", load: 440, solar: 0 },
  { t: "04:00", load: 460, solar: 0 },
  { t: "06:00", load: 470, solar: 3 },
  { t: "08:00", load: 512, solar: 18 },
  { t: "10:00", load: 540, solar: 32 },
  { t: "12:00", load: 560, solar: 40 },
  { t: "14:00", load: 552, solar: 24 },
  { t: "15:00", load: 553, solar: 18 },
];

export const FEEDER_LOAD: ProgressRowData[] = [
  {
    label: "NASTP Delta Ph-III",
    sub: "ND-HT-01",
    value: "544 kW",
    pct: 98,
    color: "var(--viz-1)",
  },
  {
    label: "CAC / CASS",
    sub: "exporting",
    value: "18 kW",
    pct: 4,
    color: "var(--flow-export)",
  },
  {
    label: "Iqbal Camp",
    sub: "IC-HT-01",
    value: "1 kW",
    pct: 1,
    color: "var(--viz-3)",
  },
];

export const FEEDERS: FeederRow[] = [
  {
    name: "Iqbal Camp",
    code: "IC-HT-01",
    cls: "HT",
    transport: "wifi",
    status: "online",
    powerKw: 1,
    pf: 0.86,
    depth: 0,
  },
  {
    name: "Officers Mess",
    code: "OM-HT-01",
    cls: "HT",
    transport: "wifi",
    status: "awaiting-data",
    depth: 0,
  },
  {
    name: "Officers Colony / Siddiqui",
    code: "SC-HT-01",
    cls: "HT",
    transport: "wifi",
    status: "awaiting-data",
    depth: 0,
  },
  {
    name: "Tech Area (Main)",
    code: "TA-HT-01",
    cls: "HT",
    transport: "modbus",
    status: "faulty",
    depth: 0,
  },
  {
    name: "NASTP Delta Ph-III",
    code: "ND-HT-01",
    cls: "HT",
    transport: "modbus",
    status: "online",
    powerKw: 544,
    pf: 0.95,
    depth: 1,
  },
  {
    name: "CAC / CASS",
    code: "CC-HT-01",
    cls: "HT",
    transport: "modbus",
    status: "online",
    powerKw: -18,
    pf: 0.34,
    depth: 2,
  },
  {
    name: "NASTP Delta (Net)",
    code: "ND − CC",
    cls: "HT",
    transport: "modbus",
    status: "online",
    powerKw: 562,
    pf: 0.95,
    depth: 1,
    derived: true,
  },
  {
    name: "Qureshi Camp (Main)",
    code: "QC-HT-01",
    cls: "HT",
    transport: "lorawan",
    status: "awaiting-data",
    depth: 0,
  },
  {
    name: "PAF Hospital LT-1",
    code: "PH-LT-01",
    cls: "LT",
    transport: "lorawan",
    status: "awaiting-data",
    depth: 1,
  },
  {
    name: "PAF Hospital LT-2",
    code: "PH-LT-02",
    cls: "LT",
    transport: "lorawan",
    status: "awaiting-data",
    depth: 1,
  },
  {
    name: "PAF Hospital LT-3",
    code: "PH-LT-03",
    cls: "LT",
    transport: "lorawan",
    status: "awaiting-data",
    depth: 1,
  },
];

export const ALARMS: AlarmItemData[] = [
  {
    severity: "critical",
    code: "CC-HT-01",
    message:
      "Power factor 0.34 sustained 30 min — below 0.80. LESCO fine exposure active; capacitor bank required.",
    time: "20 Sep, 23:32",
  },
  {
    severity: "warning",
    code: "TA-HT-01",
    message:
      "Voltage present, ~zero current for 6+ h — CT circuit fault suspected. Physical inspection required.",
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
