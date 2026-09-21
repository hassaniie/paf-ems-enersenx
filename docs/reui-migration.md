# ReUI migration — handoff & plan

**Status:** the UI is currently built on a *hand-reproduced* ReUI/Atlas design system,
because `reui.io` was blocked by the sandbox network policy in the previous session.
This environment now has **Full network access**, so we can install the **real ReUI
components** and swap them in over the tokens we already set up.

The design language target is the **ReUI "Atlas" admin dashboard** (neutral near-black
+ light, Geist type, icon-square KPI cards, real charts, progress-bar lists, clean data
tables). Screenshots of Atlas and of our current build were shared by the user.

---

## Step 1 — Verify `reui.io` is reachable

```bash
curl -sS -m 25 -o /dev/null -w "%{http_code}\n" https://reui.io/r/base-nova/button.json
# expect 200 (or at least NOT "403 CONNECT tunnel failed" / "connect_rejected")
```

If it still 403s, the session is not on the Full-network environment — stop and tell the
user (this must run in a session started on an environment with **Network access = Full**,
or Custom incl. `reui.io`).

## Step 2 — Confirm the install pipeline

`components.json` is already wired for the `@reui` registry (no auth header — free tier):

```bash
npx shadcn@latest add @reui/button --yes
```

- Free items (the 22 components + `c-*` examples) need **no license**.
- If the CLI asks for `REUI_LICENSE_KEY`, the header was re-added — remove it from
  `components.json` (free items don't need it).
- The **ReUI MCP** is available in-session. Use it to get exact item names + APIs:
  `get_agent_skill` → `search` → `get_component` (read the real API) → `get_install_command`
  → `get_examples`. Always install non-interactively with `--yes`.

## Step 3 — Install the components we actually need (free)

Priority is the **heavy** components (the ones not worth hand-rolling). Get exact names
via the ReUI MCP `search`, then install. Expected set:

| Need | ReUI item |
|---|---|
| Sites & Meters, Users, Audit Log, Alarms history tables | **data-grid** (sort/filter/paginate/virtualize/expand) |
| Analytics / Reports | **chart**, **date-selector** (range), **filters** |
| Base primitives (prefer ReUI's over ours where better) | button, badge, card, avatar, tabs, breadcrumb, dropdown-menu, tooltip, progress, sheet, skeleton |

Install into `src/components/ui` (the `components.json` alias). Don't fight the CLI —
let it resolve deps from npm (allowed).

## Step 4 — Swap our hand-built components for the real ones

Replace, keeping our data + domain wiring intact:

| Our component | Replace with | Notes |
|---|---|---|
| `src/components/primitives/feeder-table.tsx` | ReUI **data-grid** | hierarchy = expandable rows; keep status pills, load bar, HT/LT + transport badges, `powerFlow()` sign logic |
| `src/components/ui/button.tsx` | ReUI **button** | ours is a close shadcn clone; adopt ReUI's for parity |
| `src/components/ui/badge.tsx` | ReUI **badge** | keep our `tone` status-pill usage |
| `src/components/charts/load-area.tsx` (Recharts) | ReUI **chart** *or* keep Recharts | ReUI charts wrap Recharts; only swap if it improves consistency |
| `stat-card`, `progress-list`, `alarm-item`, `status` | keep (they match Atlas) or align to ReUI equivalents | these are fine as-is; re-skin only if ReUI has a cleaner primitive |

**Do not lose** any of the correctness/UX work: the corrected aggregation (site total =
sum of feeders, not the faulty parent's 0), explicit import/export with a non-color cue,
the `online/stale/offline/faulty/awaiting-data` state model, and one authoritative
representation per fact.

## Step 5 — Theming

Our tokens (`src/styles/tokens.css`) already use the shadcn/ReUI neutral convention
(`--background/--card/--primary/--muted/--border/--ring/--radius` + our domain tokens
`--status-*`, `--sev-*`, `--flow-export`, `--viz-1..8`). ReUI components should inherit.
After installing, check whether ReUI expects any extra CSS vars (e.g. `--chart-1..5`,
sidebar vars); if so, add them mapped to our `--viz-*` / neutrals rather than introducing
new hexes. Keep **light + dark** working (`:root[data-theme="light"]`). Status colors stay
constant across tenants (never themed) — see `domain-model.md` §10.

## Step 6 — Then build the remaining screens on the real library

Order: **Overview** (refine with data-grid) → **Sites & Meters** → **Alarms** →
**Power Quality** → **Analytics** (full charts) → **Users** / **Audit Log**.
Each screen: real domain data (mock for now, per `telemetry-contract.md`), all states
(loading / awaiting / offline / faulty / error), responsive, both themes.

## Guardrails

- `npm run check` (typecheck + lint + test) before committing; `npm run build` must pass.
- Tokens, not hex. One surface mode (ReUI: pick **card** vs **frame** and hold it).
- Commit in focused steps; push to the working branch; **no PR unless the user asks**.
- The dataviz method (`/dataviz` skill) governs any new chart colors — validate palettes.

## Context (what already exists — don't redo)

- `docs/domain-model.md`, `docs/telemetry-contract.md`, `docs/glossary.md` — the model.
- `src/domain/` — types + `format.ts` (unit scaling, `powerFlow` sign convention) + tests.
- `src/config/thresholds.ts` — freshness/PF/CT thresholds.
- `src/data/mock/dashboard.ts` — self-consistent PAF mock for the Overview.
- Current Overview (`src/app/page.tsx`) composes: 4 StatCards → LoadArea chart + ProgressList
  → FeederTable + AlarmItem list, inside `AppShell` (Sidebar + Topbar).
