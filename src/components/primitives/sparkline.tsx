/*
 * Minimal sparkline (inline SVG). Thin 2px line (non-scaling), soft area fill,
 * baseline-anchored — the dataviz mark spec at tile scale. Responsive: fills
 * its container width. Decorative context only; full interactive charts
 * (hover/crosshair) live on the Analytics screen.
 */
export function Sparkline({
  data,
  color = "var(--brand-accent)",
  height = 30,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const VW = 100; // internal coordinate width; SVG scales to container
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const w = VW - pad * 2;
  const h = height - pad * 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${height - pad} ${line} ${VW - pad},${height - pad}`;
  const gid = `spark-${Math.abs(hash(line))}`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VW} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className="block"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
