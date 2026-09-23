export type MetricTone = "neutral" | "good" | "export" | "warning" | "info";

export interface MetricRibbonItem {
  label: string;
  value: string;
  unit?: string;
  note: string;
  tone?: MetricTone;
}

export function MetricRibbon({
  items,
  label = "Operational summary",
}: {
  items: readonly MetricRibbonItem[];
  label?: string;
}) {
  return (
    <section className="metric-ribbon" aria-label={label}>
      {items.map((metric) => (
        <article className="metric-ribbon-item" key={metric.label}>
          <span className="metric-label">{metric.label}</span>
          <div>
            <strong className="num">{metric.value}</strong>
            {metric.unit ? <span>{metric.unit}</span> : null}
          </div>
          <small data-tone={metric.tone ?? "neutral"}>{metric.note}</small>
        </article>
      ))}
    </section>
  );
}
