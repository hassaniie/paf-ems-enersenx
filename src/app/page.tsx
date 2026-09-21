/*
 * Foundation status page — a deliberate placeholder for Step 2.
 * Not the product UI. It exists to prove the scaffold renders and the design
 * tokens resolve (surfaces, text hierarchy, status palette, tabular numerals).
 * The real surfaces arrive from Step 3 (design system) onward.
 */

const meterStatuses = [
  { key: "online", label: "Online", cls: "bg-online" },
  { key: "stale", label: "Stale", cls: "bg-stale" },
  { key: "offline", label: "Offline", cls: "bg-offline" },
  { key: "faulty", label: "Faulty", cls: "bg-faulty" },
  { key: "awaiting-data", label: "Awaiting data", cls: "bg-awaiting" },
] as const;

const severities = [
  { label: "Critical", cls: "bg-critical" },
  { label: "Warning", cls: "bg-warning" },
  { label: "Info", cls: "bg-info" },
] as const;

function Swatch({ label, cls }: { label: string; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${cls}`} />
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default function FoundationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-medium tracking-widest text-brand uppercase">
        Enersenx EMS
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text">
        Foundation scaffold
      </h1>
      <p className="mt-2 max-w-prose text-sm text-muted">
        Next.js + TypeScript (strict) + Tailwind v4, wired to the two-layer
        token system. This page is a scaffold check, not the product — it
        confirms the design tokens resolve. Product surfaces are built from Step
        3 onward.
      </p>

      <section className="mt-10 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xs font-semibold tracking-wider text-faint uppercase">
          Meter status tokens (constant across tenants)
        </h2>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {meterStatuses.map((s) => (
            <Swatch key={s.key} label={s.label} cls={s.cls} />
          ))}
        </div>

        <h2 className="mt-8 text-xs font-semibold tracking-wider text-faint uppercase">
          Alarm severity tokens
        </h2>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          {severities.map((s) => (
            <Swatch key={s.label} label={s.label} cls={s.cls} />
          ))}
        </div>

        <h2 className="mt-8 text-xs font-semibold tracking-wider text-faint uppercase">
          Numeric readout (tabular)
        </h2>
        <div className="num mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-text">
          <span className="text-2xl font-semibold">544 kW</span>
          <span className="text-2xl font-semibold text-export">
            40 kW export
          </span>
          <span className="text-2xl font-semibold">0.956 PF</span>
          <span className="code text-sm text-muted">ND-HT-01</span>
        </div>
      </section>

      <p className="mt-8 text-xs text-faint">
        See <span className="code">docs/</span> for the domain model and
        telemetry contract this scaffold is built to serve.
      </p>
    </main>
  );
}
