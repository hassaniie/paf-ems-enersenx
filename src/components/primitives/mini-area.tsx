/*
 * Small line + soft area, ReUI/Atlas KPI-card style. Pure SVG (no client JS),
 * responsive width, 2px non-scaling stroke. A real trend line, not decoration.
 */
export function MiniArea({
  data,
  color = "var(--brand)",
  height = 40,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return null;
  const VW = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const h = height - pad * 2;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * VW;
    const y = pad + h - ((v - min) / span) * h;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `0,${height} ${line} ${VW},${height}`;
  const gid = `ma-${Math.abs(hash(line))}`;
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VW} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
      className="block overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
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
