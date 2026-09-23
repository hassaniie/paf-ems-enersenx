# EnersenX UI System Contract

This contract applies to every product screen. Page-level styles may control composition, but they must not redefine shared component appearance.

## Foundations

- The minimum interface font size is `--text-2xs` (10px). Use it only for tertiary annotations, codes and timestamps.
- Labels, navigation and controls use `--text-xs` (12px) or larger.
- Use only the shared `--space-*` tokens for new margins, padding and gaps.
- Controls use `--radius-control`, nested surfaces use `--radius-panel`, and cards/dialogs use `--radius-card`.
- Use `--control-sm`, `--control-md` and `--control-lg` for interactive control heights.
- Colors must come from semantic tokens in `src/styles/tokens.css`. Status colors retain the same meaning everywhere.

## Shared components

- KPIs use `MetricRibbon`. Do not recreate KPI markup inside a page.
- Buttons use the shared `Button` component and its existing variants.
- Panels use `Card`, `CardHeader` and `CardBody`.
- Status labels use `Badge` or the established status primitive.
- New dropdowns, searches and dialogs must reuse the shell control geometry and type scale.

## Density

Compact variants may reduce padding and whitespace. They may not introduce smaller typography, new radii, alternate colors or different component anatomy.

## States

Interactive components must account for default, hover, focus-visible, active, disabled and permission-restricted states. Data surfaces must distinguish loading, empty, no-data, stale, offline, fault and error states when relevant.

## Change rule

If an existing component cannot support a new requirement, propose the new component or token before implementing it. Do not solve the requirement with page-specific styling.
