/*
 * Formatting — the single place unit/precision decisions are made.
 *
 * The prototype mixed kW / kWh / MWh and inconsistent precision across
 * screens (docs/README "slop" #5). Storage is one base unit; ALL display
 * scaling and rounding happens here so every screen agrees.
 *
 * These functions return plain strings; apply the `.num` CSS class at the
 * render site for tabular figures.
 */

const PKT_TZ = "Asia/Karachi";

function nf(value: number, maxFrac: number, minFrac = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(value);
}

// ------------------------------------------------------------------ power

/** Active power in kW → auto-scaled kW/MW string. Magnitude only. */
export function formatPower(kw: number): string {
  const abs = Math.abs(kw);
  if (abs >= 1000) return `${nf(kw / 1000, 2)} MW`;
  // Sub-10 kW: keep one decimal of resolution (forced, for tabular width).
  if (abs < 10) return `${nf(kw, 1, 1)} kW`;
  return `${nf(kw, 0)} kW`;
}

export type FlowDirection = "import" | "export" | "idle";

export interface PowerFlow {
  direction: FlowDirection;
  /** Magnitude, already unit-scaled, e.g. "40 kW". */
  magnitude: string;
  /** UI label for the direction. */
  label: string;
}

/**
 * Turn a signed kW value into a direction + magnitude (domain-model §5).
 * The UI colors `export` with the export token and `import` neutrally —
 * this function is the ONLY place the sign convention is interpreted.
 */
export function powerFlow(kw: number, idleThresholdKw = 0.5): PowerFlow {
  if (Math.abs(kw) < idleThresholdKw) {
    return { direction: "idle", magnitude: formatPower(0), label: "Idle" };
  }
  if (kw < 0) {
    return {
      direction: "export",
      magnitude: formatPower(-kw),
      label: "Export",
    };
  }
  return { direction: "import", magnitude: formatPower(kw), label: "Import" };
}

// ------------------------------------------------------------------ energy

/** Energy in kWh → auto-scaled kWh/MWh string. */
export function formatEnergy(kwh: number): string {
  const abs = Math.abs(kwh);
  if (abs >= 1000) return `${nf(kwh / 1000, 2)} MWh`;
  return `${nf(kwh, 0)} kWh`;
}

// ------------------------------------------------------------------ electrical

/** Voltage in volts → V for LT, kV for HT. */
export function formatVoltage(volts: number): string {
  if (Math.abs(volts) >= 1000) return `${nf(volts / 1000, 2)} kV`;
  return `${nf(volts, 0)} V`;
}

export function formatCurrent(amps: number): string {
  return `${nf(amps, 1)} A`;
}

export function formatPowerFactor(pf: number): string {
  return nf(pf, 3, 3);
}

export function formatFrequency(hz: number): string {
  return `${nf(hz, 2, 2)} Hz`;
}

export function formatReactive(kvar: number): string {
  return `${nf(kvar, 1)} kVAR`;
}

export function formatPercent(pct: number, frac = 1): string {
  return `${nf(pct, frac)}%`;
}

/** Money (PKR) for tariff/billing readouts. */
export function formatPkr(amount: number): string {
  return `PKR ${nf(amount, 0)}`;
}

// ------------------------------------------------------------------ time

/** Wall-clock time in PKT, e.g. "15:10:52". */
export function formatTimePkt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PKT_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Date + time in PKT, e.g. "21 Sep 2026, 15:10". */
export function formatDateTimePkt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: PKT_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Compact "time since" for staleness, e.g. "just now", "3 min ago", "2 h ago".
 * `now` is injectable for testability.
 */
export function formatAge(iso: string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(iso).getTime();
  if (ms < 0) return "just now";
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  return `${days} d ago`;
}
