/*
 * Domain types — the canonical shapes the UI consumes.
 * These mirror docs/telemetry-contract.md §3. The mock data layer and any
 * future backend must both produce exactly these shapes.
 *
 * Sign convention (docs/domain-model.md §5): activePowerKw is signed,
 *   positive = import (into the subtree), negative = export (back out).
 */

export type Id = string;

// ---------------------------------------------------------------- config

export interface TenantBranding {
  logoUrl?: string;
  /** Brand accent only — never overrides safety-critical status colors. */
  accentHex?: string;
}

export interface Tenant {
  id: Id;
  name: string;
  branding: TenantBranding;
  tariffPkrPerKwh: number;
}

export type NodeType = "site" | "zone" | "building" | "feeder";

export interface OrgNode {
  id: Id;
  tenantId: Id;
  parentId: Id | null;
  name: string;
  type: NodeType;
  /** true → this node's main meter is the utility (grid) connection point. */
  isGridBoundary: boolean;
}

export type MeterClass = "HT" | "LT";
export type Transport = "modbus" | "wifi" | "lorawan";
export type MeterRole = "main" | "sub" | "derived";

export interface Derivation {
  op: "subtract" | "sum";
  /** Meter codes this derived meter is computed from. */
  operands: string[];
}

export interface Meter {
  id: Id;
  code: string;
  nodeId: Id;
  class: MeterClass;
  transport: Transport;
  role: MeterRole;
  nominalVoltage: number;
  derivation?: Derivation;
}

// ---------------------------------------------------------------- live state

export type MeterStatus =
  "online" | "stale" | "offline" | "faulty" | "awaiting-data";

export type PhaseTriple = readonly [number, number, number];

export interface MeterReading {
  meterId: Id;
  /** ISO-8601 with offset — when the meter sampled. */
  ts: string;
  /** Signed: + import, − export. */
  activePowerKw: number;
  reactiveKvar?: number;
  apparentKva?: number;
  powerFactor?: number;
  voltageV?: PhaseTriple;
  currentA?: PhaseTriple;
  frequencyHz?: number;
  voltageUnbalancePct?: number;
  energyImportKwh: number;
  energyExportKwh: number;
}

export interface MeterLiveState {
  meterId: Id;
  status: MeterStatus;
  lastReading?: MeterReading;
  lastReadingAt?: string;
}

// ---------------------------------------------------------------- aggregates

export type AggregateQuality = "complete" | "partial";

export interface NodeAggregate {
  nodeId: Id;
  netPowerKw: number;
  loadKw: number;
  energyImportKwh: number;
  energyExportKwh: number;
  quality: AggregateQuality;
  contributingMeters: number;
  reportingMeters: number;
}

// ---------------------------------------------------------------- alarms

export type AlarmSeverity = "critical" | "warning" | "info";
export type AlarmCategory =
  | "connectivity"
  | "power_quality"
  | "compliance"
  | "reverse_flow"
  | "sensor_fault";
export type AlarmLifecycle = "active" | "acknowledged" | "cleared";
export type AlarmClearMode = "auto" | "manual";

export type AlarmRuleId =
  "no_data" | "ct_fault" | "pf_low" | "reverse_flow" | "over_demand";

export interface Alarm {
  id: Id;
  meterId: Id;
  ruleId: AlarmRuleId;
  severity: AlarmSeverity;
  category: AlarmCategory;
  lifecycle: AlarmLifecycle;
  clearMode?: AlarmClearMode;
  message: string;
  raisedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: Id;
  clearedAt?: string;
}

// ---------------------------------------------------------------- snapshot

export interface TelemetrySnapshot {
  tenantId: Id;
  /** ISO-8601 — the coherency point of this snapshot. */
  asOf: string;
  nodes: OrgNode[];
  meters: Meter[];
  liveStates: MeterLiveState[];
  aggregates: NodeAggregate[];
  activeAlarms: Alarm[];
}

// ---------------------------------------------------------------- access

export type PlatformRole = "super_admin";
export type TenantRole = "base_commander" | "engineer" | "viewer";
export type Role = PlatformRole | TenantRole;
