# Enersenx EMS — repo guide

Enersenx is a **multi-tenant energy monitoring system (EMS)**. PAF is one tenant.
This repo is a deliberate rebuild of an earlier AI-generated prototype; the goal is a
strong foundation, a real design system, and good UX — not a restyle.

## Read first

`docs/` is the source of truth. Read it before changing behavior:

- `docs/domain-model.md` — tenancy, org tree, meters, states, energy accounting, alarms, RBAC, theming.
- `docs/telemetry-contract.md` — the canonical data shapes (mirrored in `src/domain/types.ts`).
- `docs/glossary.md` — domain terms.

## Stack

- Next.js (App Router) + React + TypeScript **strict** (`tsconfig.json` adds `noUncheckedIndexedAccess` etc.).
- Tailwind CSS v4, CSS-first, driven by design tokens.
- Vitest for unit tests. ESLint (next config) + Prettier.

## Architecture / where things go

```
src/
  app/          Next routes (App Router)
  domain/       Pure domain logic + types. No React, no I/O. Unit-tested.
  config/       Tunable thresholds / tenant config (no magic numbers in code).
  styles/       tokens.css — the design-token source.
  components/    (Step 3+) shared design-system primitives
  features/      (Step 3+) feature modules (live-status, alarms, analytics, ...)
  data/          (Step 4+) data layer: mock simulator + client hooks (the swap point)
```

Rules of the rebuild:

1. **The UI never re-decides domain semantics.** Sign convention, unit scaling, and
   state derivation happen in `src/domain` / `src/config`, once. Screens consume results.
2. **Tokens, not hex.** Colors come from `src/styles/tokens.css` via Tailwind utilities
   (`bg-surface`, `text-muted`, `text-faulty`, …). No inline hex in components.
3. **Status colors are safety-critical and never themed.** Per-tenant branding may set
   `--brand-*` only. See tokens.css.
4. **One authoritative representation per fact per screen.** The prototype showed the same
   number three ways with three values; don't reintroduce that.

## Commands

- `npm run dev` — dev server
- `npm run check` — typecheck + lint + test (run before committing)
- `npm run build` — production build
- `npm run format` — Prettier write

## Attribution

Commits from Claude Code include the Co-Authored-By / Claude-Session trailers.
