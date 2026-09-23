/*
 * Tunable thresholds (docs/telemetry-contract.md §5, §7).
 * These are PAF defaults. In production they become per-tenant / per-transport
 * configuration — code should read them from here, never inline magic numbers.
 */

export const READING_INTERVAL_MIN = 10;

/** Meter freshness → state (domain-model §7). */
export const FRESHNESS = {
  /** ≤ this many minutes since last reading ⇒ online. */
  onlineMaxMin: 12,
  /** ≤ this ⇒ stale; beyond ⇒ offline (≈2 missed intervals). */
  staleMaxMin: 25,
} as const;

/** Power-factor compliance (LESCO). */
export const POWER_FACTOR = {
  /** Below this is tracked as sub-optimal (compliance %-time metric). */
  trackBelow: 0.9,
  /** Below this, sustained, is active fine exposure ⇒ critical alarm. */
  fineBelow: 0.8,
  /** Minutes the low-PF condition must persist before alarming. */
  sustainedMin: 30,
} as const;

/** CT-fault detection: voltage present but ~zero current, sustained. */
export const CT_FAULT = {
  zeroCurrentA: 0.5,
  sustainedHours: 6,
} as const;

/** Reverse power flow (info-level). */
export const REVERSE_FLOW = {
  /** Averaging window for the export judgement. */
  avgWindowMin: 15,
} as const;

/** Nominal grid frequency (Hz). */
export const NOMINAL_FREQUENCY_HZ = 50;

/** PAF power-quality operating bands. */
export const POWER_QUALITY = {
  voltageTolerancePct: 5,
  voltageUnbalanceWarningPct: 2,
  voltageUnbalanceCriticalPct: 3,
  frequencyMinHz: 49.5,
  frequencyMaxHz: 50.5,
} as const;
