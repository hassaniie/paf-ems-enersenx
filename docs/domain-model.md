# Domain Model

The conceptual model behind Enersenx EMS. This is deliberately independent of any UI
or framework — it describes *what exists in the world* the software monitors.

---

## 1. Tenancy

Enersenx is a **multi-tenant SaaS-style product** (though it may be deployed on
restrained / on-prem networks).

```
Enersenx (platform)
└── Tenant (customer)              e.g. "PAF"
    └── Org tree (nodes + meters)  configured per tenant
```

- A **Tenant** is a customer organisation. Data is isolated per tenant; a tenant user
  never sees another tenant's data. `[LOCKED]`
- **Enersenx staff** configure everything for a tenant at onboarding — the org tree,
  the nodes, the meters, the hierarchy. **Tenants do not edit structure themselves.**
  Structure is *admin-managed platform configuration.* `[LOCKED]`
- A tenant may be **white-labelled**: its own logo and brand accent appear in its
  dashboard. Branding rules are in §10. `[LOCKED]`

---

## 2. The Org Hierarchy

Each tenant has a **tree of Org Nodes**. The tree's *shape* varies per tenant (some
have sites → zones → buildings; others are flatter), but the tree is always
Enersenx-configured, not user-editable.

### Org Node

An organisational unit — a physical or logical grouping. Every node has:

| Field | Meaning |
|-------|---------|
| `id` | Stable unique id |
| `tenantId` | Owning tenant |
| `parentId` | Parent node (`null` at the tenant root) |
| `name` | Display name, e.g. "Tech Area", "NASTP Delta Ph-III" |
| `type` | A configurable classification: `site` \| `zone` \| `building` \| `feeder` (label set is per-tenant config) |
| `isGridBoundary` | `true` on the node whose main meter is the utility connection point (see §6). |

Meters attach to nodes (§3). A node may have **zero or many** meters and **zero or
many** child nodes. Depth is not fixed. `[LOCKED]`

### PAF example (from the live prototype)

```
PAF (tenant)
└── Lahore  (site, grid boundary)
    ├── Officers Mess              — meter OM-HT-01  (HT · WiFi)      awaiting-data
    ├── Iqbal Camp                 — meter IC-HT-01  (HT · WiFi)      online
    ├── Officers Colony / Siddiqui — meter SC-HT-01  (HT · WiFi)      awaiting-data
    ├── Tech Area                  — meter TA-HT-01  (HT · Modbus)    FAULTY (CT)
    │   ├── NASTP Delta Ph-III     — meter ND-HT-01  (HT · Modbus)    online
    │   │   └── CAC / CASS         — meter CC-HT-01  (HT · Modbus)    online (solar)
    │   └── [derived] NASTP Delta (Net) = ND-HT-01 − CC-HT-01
    └── Qureshi Camp               — meter QC-HT-01  (HT · LoRaWAN)   awaiting-data
        ├── PAF Hospital LT-1      — meter PH-LT-01  (LT · LoRaWAN)   awaiting-data
        ├── PAF Hospital LT-2      — meter PH-LT-02  (LT · LoRaWAN)   awaiting-data
        └── PAF Hospital LT-3      — meter PH-LT-03  (LT · LoRaWAN)   awaiting-data
```

> Note: "Lahore" is the grid-boundary site here. CAC/CASS sits **below** NASTP, so its
> solar export flows *up into NASTP* internally — it is **not** a grid export. Only the
> Lahore boundary meter defines export to LESCO. This distinction is the crux of §5–§6.

---

## 3. Meters

A **Meter** is a physical (or derived) metering point attached to an org node.

| Field | Meaning |
|-------|---------|
| `id` / `code` | e.g. `ND-HT-01` |
| `nodeId` | The org node it meters |
| `class` | `HT` (high-tension, ~11 kV) \| `LT` (low-tension, 230/400 V) |
| `transport` | `modbus` \| `wifi` \| `lorawan` — how readings arrive |
| `role` | `main` (the node's incomer) \| `sub` \| `derived` (computed, §4) |
| `nominalVoltage` | Reference voltage for plausibility checks |

`class`, `transport`, and `role` are the three badges the org view shows. They are
metadata, not status — status is derived from readings (§7). `[LOCKED]`

---

## 4. Derived (Virtual) Meters

Some metering points are **computed from others**, not physically installed. Example:
`NASTP Delta (Net) = ND-HT-01 − CC-HT-01` (what NASTP draws after CAC/CASS's solar is
subtracted).

A derived meter has `role: "derived"` and a **derivation formula** referencing other
meters:

```
derivation: { op: "subtract", operands: ["ND-HT-01", "CC-HT-01"] }
```

Derived meters are **display/analytics constructs** — never a source of raw import/export
registers, and never billed directly. `[ASSUMPTION]`

---

## 5. Sign & Flow Convention `[LOCKED]`

**One rule, everywhere:**

> **Positive = import** (power flowing *into* the metered subtree, i.e. downstream).
> **Negative = export** (power flowing *back up* out of the subtree).

This holds at every meter:

- **Internal sub-meter** (e.g. CAC/CASS): `+` = drawing from its parent NASTP; `−` =
  pushing solar up into NASTP. This is **internal reverse flow**.
- **Grid-boundary meter** (Lahore main): `+` = importing from LESCO; `−` = **exporting
  to the LESCO grid** (net metering).

The single word we use in the UI is **Import** / **Export**. Retired vocabulary that
caused the original confusion: *reverse-fed, feeding back, absorbed within, solar
feedback* — these are gone. "Reverse power flow" survives **only** as an alarm name (§9).

---

## 6. Energy Accounting & Netting

### Two registers, never merged at the source `[LOCKED]`

Every meter accumulates **two separate monotonic energy registers**:

- `energyImport_kWh` — accumulates while power > 0
- `energyExport_kWh` — accumulates while power < 0

### Net is always computed and labelled

- **Operational views** may show `net = import − export`, clearly labelled "Net".
- **Billing / compliance views** show Import and Export **separately** and never net
  them (net-metering settlement and internal load use different math). `[LOCKED]`

### Grid import/export

Only the **grid-boundary meter** (`isGridBoundary` node's main meter) produces
*grid* import/export — the numbers that matter for the LESCO bill. Internal reverse flow
between sub-meters is an operational fact, **not** a grid export. `[LOCKED]`

> `[ASSUMPTION — confirm]` Each site has exactly one grid-boundary main meter. If a site
> can have multiple utility connections, this generalises to a set of boundary meters.

---

## 7. Meter State Machine

The original UI collapsed every non-reporting meter into "no data", which hid the
difference between *never connected*, *comms lost*, and *sensor faulty*. We separate them.

Cadence is **~10 minutes** for all transports `[LOCKED]`, so thresholds are derived from
that (all values are **per-transport configurable**, these are defaults):

| State | Rule | Meaning |
|-------|------|---------|
| `online` | last reading ≤ 12 min ago (1 interval + grace) | Reporting normally |
| `stale` | last reading 12–25 min ago | One interval missed; watch it |
| `offline` | no reading > 25 min (≈2 missed intervals) | Comms lost — meter *was* connected |
| `faulty` | a plausibility rule tripped (e.g. CT fault, §9) | Comms fine, readings implausible → inspect |
| `awaiting-data` | node/meter configured but has **never** reported | Provisioned in config, feed not yet connected |

> Why not fire "offline" at exactly 10 min like the prototype? At a 10-min cadence a
> single late packet would false-alarm constantly. `stale` absorbs one missed interval;
> `offline` needs two. This is the kind of decision that was previously implicit and
> wrong. `[ASSUMPTION — tune per transport]`

**`awaiting-data` vs `offline` is the key fix:** the PAF camps showing "no data" today
are mostly `awaiting-data` (configured, meters not yet wired), *not* `offline`. The UI
must say which, because the operator action is completely different (finish provisioning
vs. dispatch someone to a dead link).

---

## 8. Aggregation Rules `[LOCKED]`

How a node's totals are computed from below:

1. **A node's load = sum of its children's signed net power** (recursively), *or* the
   node's own main-meter reading if it is a leaf.
2. **Faulty / missing parent → roll up from children.** Never let a faulty parent's `0`
   (or absent) reading zero out a healthy subtree. This is the bug that made the whole
   base read "1 kW" while NASTP pulled 544 kW.
3. **A node with both a main meter and children:** children are authoritative for the
   breakdown; the main meter is used for **reconciliation / loss detection**
   (main − Σchildren = distribution loss or unmetered load). `[ASSUMPTION]`
4. **Grid import/export totals** come only from grid-boundary meters (§6).
5. Aggregates carry a **quality flag**: `complete` (all descendants reporting) vs
   `partial` (some offline/awaiting) — a total computed over partial data must be
   labelled as such, never shown as if authoritative. `[ASSUMPTION]`

---

## 9. Alarms & Events

### Taxonomy

| Axis | Values |
|------|--------|
| Severity | `critical` \| `warning` \| `info` |
| Category | `connectivity` \| `power_quality` \| `compliance` \| `reverse_flow` \| `sensor_fault` |
| Lifecycle | `active` → `acknowledged` → `cleared` |
| Clear mode | `auto` (condition ended) \| `manual` (admin/engineer acknowledged & cleared) |

### Rule catalog (from the live prototype + our thresholds)

| Rule | Condition | Severity / Category | Sets meter state |
|------|-----------|---------------------|------------------|
| **No data** | No reading > offline threshold (§7) | warning / connectivity | → `offline` |
| **CT fault** | Voltage present **and** current ≈ 0, sustained ~6 h | warning / sensor_fault | → `faulty` |
| **PF low (fine exposure)** | PF < 0.80 sustained 30 min | **critical** / compliance | — |
| **PF sub-optimal** | PF < 0.90 (tracked as % time, not necessarily an alarm) | info / compliance | — |
| **Reverse power flow** | Net export sustained (15-min avg) | info / reverse_flow | — |
| **Over-demand (MDI)** | Demand approaching sanctioned load | warning / compliance | — `[OPEN]` |

- **PF matters because of LESCO penalties.** PF < 0.90 risks penalty; < 0.80 is active
  fine exposure and flags "capacitor bank required". `[LOCKED]`
- **Reverse power flow is `info`, not a fault** — at the grid boundary it's a normal
  net-metering export; internally it's expected solar behaviour. It auto-clears.

---

## 10. Multi-Tenant Theming (White-Label) `[LOCKED]`

- Each tenant may configure a **logo** and a **brand accent** color; these appear in the
  app chrome (header, nav highlight, links, primary buttons).
- **Branding never touches semantics.** Status colors — faulty, critical, warning,
  export, online, stale, awaiting-data — are **fixed platform tokens**, identical across
  all tenants. A customer's brand color cannot make a critical alarm look benign.
- Practically: two token layers — a **semantic/status layer** (constant) and a **brand
  layer** (per-tenant). The design system enforces the separation. Details land in the
  design-tokens spec (Step 3).

---

## 11. Roles & Access (RBAC)

Two tiers `[ASSUMPTION — names can change]`:

**Platform tier (Enersenx staff):**

| Role | Scope | Can |
|------|-------|-----|
| `super_admin` | All tenants | Everything: create/configure tenants, org trees, meters, users; cross-tenant. |

**Tenant tier (customer users, scoped to their tenant only):**

| Role | Can |
|------|-----|
| `base_commander` | Full visibility of the tenant; manage tenant users; acknowledge/clear alarms; export reports. Highest customer role. |
| `engineer` | Operational: view live status, acknowledge/clear alarms, drill into power quality, export. Cannot manage users or structure. |
| `viewer` | Read-only: dashboards, analytics, reports. No acknowledge, no export config, no admin. |

- Structure (org tree, meters) is **only** editable by `super_admin`. Customers never
  edit hierarchy. `[LOCKED]`
- The role names are provisional; "base_commander" is PAF-flavored and may be renamed to
  a generic tenant-admin label for other customers. `[OPEN]`

---

## 12. Compliance & Commercials (context that drives the product)

- **Tariff:** PKR 56 / kWh (per-tenant, per-period configurable). `[LOCKED for PAF]`
- **LESCO PF penalty:** the reason power factor is a first-class citizen.
- **MDI (Maximum Demand):** demand charges; peak demand is tracked and reported.
- **Net metering:** grid export earns credit; import and export are billed/settled
  separately (§6).

---

## 13. Assumptions to confirm

- §6 — one grid-boundary main meter per site (vs. multiple utility connections).
- §7 — the exact stale/offline thresholds at a 10-min cadence (proposed 12 / 25 min).
- §8.3 — whether main-vs-children reconciliation / loss is a feature you want surfaced.
- §9 — whether an over-demand (MDI) alarm is wanted, and at what threshold.
- §11 — final role names.
