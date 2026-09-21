# Telemetry Contract

The **interface** between data and UI. The backend does not exist yet; the frontend is
built against a **mock** that implements exactly this contract. When the real backend
(Modbus gateways → backend, ~10-min polling) is built, it must conform to these shapes,
and the mock is swapped out with **zero UI changes**.

Types are expressed in TypeScript because that is the frontend stack. They are the
normative description regardless of backend language.

---

## 1. Principles

- **The UI never sees raw meter/protocol data.** Modbus registers, LoRaWAN payloads, and
  WiFi meter quirks are normalised *before* this contract. The UI consumes only canonical
  shapes.
- **All ambiguity is resolved here, once.** Sign convention, units, and state derivation
  are applied at this boundary so no screen has to re-decide them.
- **Everything is timestamped and tenant-scoped.**
- **Cadence is ~10 min**, so this is a *snapshot + refresh* contract, not a
  high-frequency stream. A snapshot is a coherent picture as of `asOf`; the client
  refreshes on an interval and/or via a lightweight push signal.

---

## 2. Units & Canonical Quantities `[LOCKED]`

| Quantity | Unit | Type | Notes |
|----------|------|------|-------|
| Active power | **kW**, signed | `number` | `+` import, `−` export (domain-model §5) |
| Reactive power | **kVAR**, signed | `number` | |
| Apparent power | **kVA** | `number` | |
| Energy (import) | **kWh** | `number` | monotonic register |
| Energy (export) | **kWh** | `number` | monotonic register |
| Voltage | **V** (store base unit) | `number` | display kV for HT; format layer decides, not storage |
| Current | **A** | `number` | per phase |
| Power factor | unitless 0–1 | `number` | |
| Frequency | **Hz** | `number` | nominal 50 |
| Voltage unbalance | **%** | `number` | |
| Timestamp | ISO-8601 **with offset** | `string` | store UTC/offset; **display in PKT** |

> **Storage vs display:** store one base unit (W or kW, V) and let the format layer pick
> kW/MWh/kV and precision. The prototype mixed kW/kWh/MWh in storage and that is banned.

---

## 3. Core Types

```ts
// ---------- Identity & config ----------

type Id = string;

interface Tenant {
  id: Id;
  name: string;                 // "PAF"
  branding: TenantBranding;
  tariffPkrPerKwh: number;      // 56
}

interface TenantBranding {
  logoUrl?: string;
  accentHex?: string;           // brand accent only; never overrides status tokens
}

type NodeType = "site" | "zone" | "building" | "feeder";

interface OrgNode {
  id: Id;
  tenantId: Id;
  parentId: Id | null;          // null at tenant root
  name: string;
  type: NodeType;
  isGridBoundary: boolean;      // true → its main meter is the utility connection
}

type MeterClass = "HT" | "LT";
type Transport = "modbus" | "wifi" | "lorawan";
type MeterRole = "main" | "sub" | "derived";

interface Meter {
  id: Id;
  code: string;                 // "ND-HT-01"
  nodeId: Id;
  class: MeterClass;
  transport: Transport;
  role: MeterRole;
  nominalVoltage: number;       // V, for plausibility checks
  derivation?: Derivation;      // present iff role === "derived"
}

interface Derivation {
  op: "subtract" | "sum";
  operands: string[];           // meter codes
}

// ---------- Live state ----------

type MeterStatus =
  | "online"
  | "stale"
  | "offline"
  | "faulty"
  | "awaiting-data";

interface MeterReading {
  meterId: Id;
  ts: string;                   // ISO-8601 w/ offset — when the meter sampled
  activePowerKw: number;        // signed (+import / −export)
  reactiveKvar?: number;
  apparentKva?: number;
  powerFactor?: number;         // 0..1
  voltageV?: [number, number, number];   // per phase
  currentA?: [number, number, number];   // per phase
  frequencyHz?: number;
  voltageUnbalancePct?: number;
  energyImportKwh: number;      // cumulative register
  energyExportKwh: number;      // cumulative register
}

interface MeterLiveState {
  meterId: Id;
  status: MeterStatus;          // derived per §5
  lastReading?: MeterReading;   // absent when awaiting-data
  lastReadingAt?: string;       // for staleness display
}

// ---------- Aggregates ----------

type AggregateQuality = "complete" | "partial";

interface NodeAggregate {
  nodeId: Id;
  netPowerKw: number;           // signed; summed from children per domain-model §8
  loadKw: number;               // import portion for quick "load" display
  energyImportKwh: number;
  energyExportKwh: number;
  quality: AggregateQuality;    // partial → some descendants offline/awaiting
  contributingMeters: number;
  reportingMeters: number;
}

// ---------- Alarms ----------

type AlarmSeverity = "critical" | "warning" | "info";
type AlarmCategory =
  | "connectivity" | "power_quality" | "compliance"
  | "reverse_flow" | "sensor_fault";
type AlarmLifecycle = "active" | "acknowledged" | "cleared";

interface Alarm {
  id: Id;
  meterId: Id;
  ruleId: string;               // "no_data" | "ct_fault" | "pf_low" | "reverse_flow" | ...
  severity: AlarmSeverity;
  category: AlarmCategory;
  lifecycle: AlarmLifecycle;
  clearMode?: "auto" | "manual";
  message: string;              // human-readable, generated from the rule
  raisedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: Id;
  clearedAt?: string;
}

// ---------- The snapshot ----------

interface TelemetrySnapshot {
  tenantId: Id;
  asOf: string;                 // ISO-8601 — coherency point of this snapshot
  nodes: OrgNode[];
  meters: Meter[];
  liveStates: MeterLiveState[];
  aggregates: NodeAggregate[];
  activeAlarms: Alarm[];
}
```

---

## 4. Endpoints (contract, backend TBD) `[ASSUMPTION]`

| Purpose | Shape |
|---------|-------|
| Topology + latest snapshot | `GET /tenants/{id}/snapshot → TelemetrySnapshot` |
| A meter's history | `GET /meters/{code}/readings?from&to&interval → MeterReading[]` |
| Alarms (active + history) | `GET /tenants/{id}/alarms?state&from&to → Alarm[]` |
| Acknowledge an alarm | `POST /alarms/{id}/ack` |
| Live refresh signal | SSE/WebSocket `snapshot.updated` ping → client refetches snapshot |

At a 10-min cadence, plain polling of `/snapshot` is acceptable; the push channel is an
optimisation, not a requirement.

---

## 5. State Derivation (normative) `[ASSUMPTION — tune per transport]`

Given `now` and a meter's `lastReadingAt`:

```
if never reported            → "awaiting-data"
else if now − last ≤ 12 min  → "online"
else if now − last ≤ 25 min  → "stale"
else                         → "offline"

// overrides:
if a sensor-fault rule is active (e.g. CT fault) → "faulty"
```

`faulty` outranks freshness: a meter reporting voltage-present/zero-current is `faulty`,
not `online`, even though packets arrive.

---

## 6. Aggregate Computation (normative)

Per domain-model §8:

```
netPowerKw(node) =
  node is leaf   → mainMeter.activePowerKw
  otherwise      → Σ netPowerKw(child)           // ignore a faulty/absent parent meter

quality(node) = "complete" if every descendant meter is online|stale
                else "partial"
loadKw(node)  = max(netPowerKw(node), 0)          // import portion, for "load" chips
```

Grid import/export totals are computed **only** from `isGridBoundary` nodes.

---

## 7. Alarm Rules (normative thresholds)

| ruleId | Fires when | severity/category | clears |
|--------|-----------|-------------------|--------|
| `no_data` | status becomes `offline` | warning / connectivity | auto on data resume |
| `ct_fault` | V present & I≈0 for ≥ 6 h | warning / sensor_fault | manual (post-inspection) |
| `pf_low` | PF < 0.80 for ≥ 30 min | critical / compliance | auto when PF recovers |
| `reverse_flow` | net export (15-min avg) < 0 | info / reverse_flow | auto |
| `over_demand` | demand ≥ sanctioned load × k | warning / compliance | auto `[OPEN]` |

Thresholds live in **per-tenant config**, not code. The values above are PAF defaults.

---

## 8. Sample Snapshot (abridged, PAF)

```json
{
  "tenantId": "paf",
  "asOf": "2026-09-21T15:10:00+05:00",
  "meters": [
    { "id": "nd", "code": "ND-HT-01", "nodeId": "nastp", "class": "HT",
      "transport": "modbus", "role": "main", "nominalVoltage": 11000 },
    { "id": "cc", "code": "CC-HT-01", "nodeId": "cac", "class": "HT",
      "transport": "modbus", "role": "main", "nominalVoltage": 11000 }
  ],
  "liveStates": [
    { "meterId": "nd", "status": "online", "lastReadingAt": "2026-09-21T15:08:00+05:00",
      "lastReading": {
        "meterId": "nd", "ts": "2026-09-21T15:08:00+05:00",
        "activePowerKw": 544, "powerFactor": 0.956, "frequencyHz": 49.8,
        "voltageV": [10720, 10730, 10780], "currentA": [34.4, 32.4, 38.0],
        "reactiveKvar": 168.0, "energyImportKwh": 9120, "energyExportKwh": 0 } },
    { "meterId": "cc", "status": "online", "lastReadingAt": "2026-09-21T15:08:00+05:00",
      "lastReading": {
        "meterId": "cc", "ts": "2026-09-21T15:08:00+05:00",
        "activePowerKw": 32, "powerFactor": 0.34, "frequencyHz": 49.8,
        "energyImportKwh": 210, "energyExportKwh": 160 } }
  ],
  "activeAlarms": [
    { "id": "a1", "meterId": "ta", "ruleId": "ct_fault", "severity": "warning",
      "category": "sensor_fault", "lifecycle": "active",
      "message": "Voltage present, ~zero current for 6+ h — CT circuit fault suspected; physical inspection required.",
      "raisedAt": "2026-09-21T09:00:00+05:00" },
    { "id": "a2", "meterId": "cc", "ruleId": "pf_low", "severity": "critical",
      "category": "compliance", "lifecycle": "active",
      "message": "Power factor 0.34 sustained — below 0.80. LESCO fine exposure; capacitor bank required.",
      "raisedAt": "2026-09-20T23:32:45+05:00" }
  ]
}
```

---

## 9. Versioning

The snapshot carries an implicit contract version via the app; breaking changes bump a
`contractVersion` field (to be added when the first backend integration begins). Until
then the mock and the frontend evolve this doc together.
