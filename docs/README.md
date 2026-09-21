# Enersenx EMS — Foundation Specs

This folder is the **source of truth** for the Enersenx Energy Monitoring System (EMS)
rebuild. Every product and design decision is written down here *before* it is built,
so the UI is a consequence of the model — not the other way around.

> Enersenx is a **multi-tenant product**. PAF (Pakistan Air Force) is one tenant.
> These docs describe the platform in general and use the PAF deployment as the
> running example.

## Read in this order

| Doc | What it defines |
|-----|-----------------|
| [`domain-model.md`](./domain-model.md) | The *what*: tenancy, the org hierarchy, meters, states, energy accounting, alarms, roles, theming. The conceptual model. |
| [`telemetry-contract.md`](./telemetry-contract.md) | The *interface*: the exact data shapes the backend must produce and the frontend consumes. TypeScript types, units, derivation rules, sample payloads. |
| [`glossary.md`](./glossary.md) | Every domain term (LESCO, MDI, CT, HT/LT, PF, net metering…) in one place. |

## Status of this rebuild

- **Backend:** does not exist yet. The frontend is built against a **mock data layer**
  that implements `telemetry-contract.md`. When a real backend is built (Modbus
  gateways → backend, ~10-minute polling), it must conform to the same contract and
  the mock is swapped out with no UI changes.
- **Scope decision:** we own the frontend **and** the canonical data contract.
- **Primary audiences:** operators/engineers (operational) and base command /
  executives (review & reporting), both on desktop.

## Decisions already locked (see domain-model.md for detail)

1. **Sign convention** — positive = import (power flowing in), negative = export (flowing back out). One signed number everywhere.
2. **Faulty-parent rollup** — when a parent meter is faulty/missing, aggregate from its children rather than trusting its reading.
3. **Netting policy** — operational views may show a labelled "Net"; billing/compliance views always show Import and Export separately and never merge them.
4. **Branding vs. safety** — per-tenant white-label theming affects chrome/accent only. It must **never** recolor safety-critical status (faulty / critical / warning / export).

## Conventions for these docs

- `[LOCKED]` — agreed, build on it.
- `[ASSUMPTION]` — my proposal, believed correct, flagged for confirmation.
- `[OPEN]` — genuinely undecided, needs an answer before it hardens into code.
