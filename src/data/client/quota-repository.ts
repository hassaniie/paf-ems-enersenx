export type QuotaApproval = "draft" | "pending" | "approved" | "rejected";
export type QuotaHealth =
  "healthy" | "watch" | "projected-overrun" | "exceeded";

export interface QuotaEvent {
  id: string;
  at: string;
  actor: string;
  action: "created" | "adjusted" | "submitted" | "approved" | "rejected";
  detail: string;
}

export interface EnergyQuota {
  id: string;
  scopeNodeId: string;
  period: string;
  limitKwh: number;
  consumedKwh: number;
  approval: QuotaApproval;
  owner: string;
  note?: string;
  events: QuotaEvent[];
}

export interface QuotaStore {
  quotas: EnergyQuota[];
  revision: number;
}

const STORAGE_KEY = "enersenx:paf-lahore:quotas:v1";
const event = (
  id: string,
  action: QuotaEvent["action"],
  detail: string,
  actor = "A. Q. Niazi",
): QuotaEvent => ({
  id,
  at: "2026-09-23T10:00:00+05:00",
  actor,
  action,
  detail,
});

export function createInitialQuotaStore(): QuotaStore {
  return {
    quotas: [
      {
        id: "quota-site-sep",
        scopeNodeId: "lahore-site",
        period: "2026-09",
        limitKwh: 420000,
        consumedKwh: 287420,
        approval: "approved",
        owner: "Base Energy Cell",
        note: "September sanctioned operating allocation.",
        events: [
          event("qe-1", "created", "Monthly site quota created."),
          event(
            "qe-2",
            "approved",
            "Approved for September operations.",
            "Base Commander",
          ),
        ],
      },
      {
        id: "quota-tech-sep",
        scopeNodeId: "tech-area",
        period: "2026-09",
        limitKwh: 320000,
        consumedKwh: 252600,
        approval: "approved",
        owner: "Tech Area Energy Officer",
        events: [
          event("qe-3", "created", "Tech Area allocation created."),
          event("qe-4", "approved", "Allocation approved.", "Base Commander"),
        ],
      },
      {
        id: "quota-nastp-sep",
        scopeNodeId: "nastp-delta",
        period: "2026-09",
        limitKwh: 275000,
        consumedKwh: 232400,
        approval: "approved",
        owner: "NASTP Facilities",
        events: [
          event("qe-5", "created", "NASTP allocation created."),
          event(
            "qe-6",
            "adjusted",
            "Quota increased by 15,000 kWh for extended operations.",
          ),
          event("qe-7", "approved", "Adjustment approved.", "Base Commander"),
        ],
      },
      {
        id: "quota-cac-sep",
        scopeNodeId: "cac-cass",
        period: "2026-09",
        limitKwh: 18000,
        consumedKwh: 16800,
        approval: "approved",
        owner: "CAC/CASS Operations",
        events: [
          event("qe-8", "created", "CAC/CASS allocation created."),
          event("qe-9", "approved", "Allocation approved.", "Base Commander"),
        ],
      },
      {
        id: "quota-iqbal-sep",
        scopeNodeId: "iqbal-camp",
        period: "2026-09",
        limitKwh: 5000,
        consumedKwh: 2200,
        approval: "approved",
        owner: "Iqbal Camp Admin",
        events: [
          event("qe-10", "created", "Iqbal Camp allocation created."),
          event("qe-11", "approved", "Allocation approved.", "Base Commander"),
        ],
      },
      {
        id: "quota-qureshi-sep",
        scopeNodeId: "qureshi-camp",
        period: "2026-09",
        limitKwh: 62000,
        consumedKwh: 0,
        approval: "draft",
        owner: "Qureshi Camp Admin",
        note: "Awaiting meter commissioning confirmation.",
        events: [
          event(
            "qe-12",
            "created",
            "Draft quota prepared pending telemetry readiness.",
          ),
        ],
      },
    ],
    revision: 1,
  };
}

export function loadQuotaStore(): QuotaStore {
  const fallback = createInitialQuotaStore();
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as QuotaStore | null;
    return parsed && Array.isArray(parsed.quotas) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
export function persistQuotaStore(store: QuotaStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function quotaHealth(quota: EnergyQuota, elapsedRatio = 23 / 30) {
  const usedPct = quota.limitKwh
    ? (quota.consumedKwh / quota.limitKwh) * 100
    : 0;
  const forecastKwh = elapsedRatio
    ? quota.consumedKwh / elapsedRatio
    : quota.consumedKwh;
  const forecastPct = quota.limitKwh ? (forecastKwh / quota.limitKwh) * 100 : 0;
  const health: QuotaHealth =
    usedPct >= 100
      ? "exceeded"
      : forecastPct > 105
        ? "projected-overrun"
        : forecastPct > 92
          ? "watch"
          : "healthy";
  return {
    usedPct,
    remainingKwh: Math.max(0, quota.limitKwh - quota.consumedKwh),
    forecastKwh,
    forecastPct,
    dailyBurnKwh: quota.consumedKwh / Math.max(1, elapsedRatio * 30),
    health,
  };
}

export function saveQuota(
  store: QuotaStore,
  quota: EnergyQuota,
  reason: string,
): QuotaStore {
  if (!Number.isFinite(quota.limitKwh) || quota.limitKwh <= 0)
    throw new Error("Quota must be greater than zero.");
  const duplicate = store.quotas.some(
    (item) =>
      item.id !== quota.id &&
      item.scopeNodeId === quota.scopeNodeId &&
      item.period === quota.period,
  );
  if (duplicate)
    throw new Error("A quota already exists for this scope and period.");
  const existing = store.quotas.find((item) => item.id === quota.id);
  const action = existing ? "adjusted" : "created";
  const entry: QuotaEvent = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor: "A. Q. Niazi",
    action,
    detail:
      reason.trim() ||
      (existing ? "Quota allocation adjusted." : "Quota allocation created."),
  };
  const next = { ...quota, events: [...(existing?.events ?? []), entry] };
  return {
    quotas: existing
      ? store.quotas.map((item) => (item.id === quota.id ? next : item))
      : [next, ...store.quotas],
    revision: store.revision + 1,
  };
}

export function transitionQuota(
  store: QuotaStore,
  id: string,
  approval: QuotaApproval,
  reason = "",
): QuotaStore {
  const action =
    approval === "pending"
      ? "submitted"
      : approval === "approved"
        ? "approved"
        : approval === "rejected"
          ? "rejected"
          : "adjusted";
  const detail =
    reason.trim() ||
    (
      {
        submitted: "Submitted for command approval.",
        approved: "Quota approved for the selected period.",
        rejected: "Quota returned for revision.",
        adjusted: "Quota returned to draft.",
      } as const
    )[action];
  return {
    quotas: store.quotas.map((quota) =>
      quota.id === id
        ? {
            ...quota,
            approval,
            events: [
              ...quota.events,
              {
                id: crypto.randomUUID(),
                at: new Date().toISOString(),
                actor: "A. Q. Niazi",
                action,
                detail,
              },
            ],
          }
        : quota,
    ),
    revision: store.revision + 1,
  };
}

export function deleteQuota(store: QuotaStore, id: string): QuotaStore {
  const quota = store.quotas.find((item) => item.id === id);
  if (quota?.approval === "approved")
    throw new Error(
      "Approved quotas must be archived by the backend and cannot be deleted.",
    );
  return {
    quotas: store.quotas.filter((item) => item.id !== id),
    revision: store.revision + 1,
  };
}
