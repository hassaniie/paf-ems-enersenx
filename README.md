# Enersenx EMS

Multi-tenant **Energy Monitoring System**. A deliberate rebuild of an earlier
prototype — foundations, design system, and UX first.

> PAF (Pakistan Air Force) is the running example tenant. Enersenx is the product.

## Status

Foundation stage. The backend does not exist yet; the frontend is being built against a
canonical data contract (`docs/telemetry-contract.md`) with a mock data layer to follow.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run check      # typecheck + lint + test
npm run build      # production build
npm run format     # Prettier
```

Requires Node 22 (see `.nvmrc`).

## Where things are

- **`docs/`** — source of truth: domain model, telemetry contract, glossary. Start here.
- **`src/domain/`** — pure domain types & logic (unit-tested).
- **`src/config/`** — tunable thresholds.
- **`src/styles/tokens.css`** — the two-layer design-token system.
- **`CLAUDE.md`** — architecture rules and conventions for contributors.

## Tech

Next.js (App Router) · React · TypeScript (strict) · Tailwind v4 · Vitest.
