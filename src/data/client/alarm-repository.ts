import type {
  Alarm,
  AlarmCategory,
  AlarmLifecycle,
  AlarmRuleId,
  AlarmSeverity,
} from "@/domain";

export type AlarmActor = "System" | "A. Q. Niazi" | "Duty Engineer";

export interface AlarmEvent {
  id: string;
  at: string;
  actor: AlarmActor;
  action:
    "raised" | "acknowledged" | "assigned" | "noted" | "cleared" | "reopened";
  detail: string;
}

export interface OperationalAlarm extends Alarm {
  title: string;
  assignedTo?: AlarmActor;
  nodeName: string;
  meterCode: string;
  events: AlarmEvent[];
}

export interface AlarmStore {
  alarms: OperationalAlarm[];
  revision: number;
}

export interface AlarmSeed {
  id: string;
  meterId: string;
  meterCode: string;
  nodeName: string;
  ruleId: AlarmRuleId;
  severity: AlarmSeverity;
  category: AlarmCategory;
  title: string;
  message: string;
  raisedAt: string;
  lifecycle?: AlarmLifecycle;
}

const STORAGE_KEY = "enersenx:paf-lahore:alarms:v1";

export function createInitialAlarmStore(seeds: AlarmSeed[]): AlarmStore {
  return {
    alarms: seeds.map((seed) => ({
      ...seed,
      lifecycle: seed.lifecycle ?? "active",
      clearMode: seed.ruleId === "reverse_flow" ? "auto" : "manual",
      events: [
        {
          id: `${seed.id}-raised`,
          at: seed.raisedAt,
          actor: "System",
          action: "raised",
          detail: seed.message,
        },
      ],
    })),
    revision: 1,
  };
}

export function loadAlarmStore(fallback: AlarmStore): AlarmStore {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as AlarmStore | null;
    return parsed && Array.isArray(parsed.alarms) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function persistAlarmStore(store: AlarmStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function reconcileAlarmSeeds(
  store: AlarmStore,
  seeds: AlarmSeed[],
): AlarmStore {
  const existingIds = new Set(store.alarms.map((alarm) => alarm.id));
  const missing = createInitialAlarmStore(
    seeds.filter((seed) => !existingIds.has(seed.id)),
  ).alarms;
  return missing.length
    ? { alarms: [...store.alarms, ...missing], revision: store.revision + 1 }
    : store;
}

export function transitionAlarm(
  store: AlarmStore,
  alarmId: string,
  lifecycle: AlarmLifecycle,
  actor: AlarmActor,
): AlarmStore {
  const alarm = store.alarms.find((item) => item.id === alarmId);
  if (!alarm) return store;
  const action =
    lifecycle === "acknowledged"
      ? "acknowledged"
      : lifecycle === "cleared"
        ? "cleared"
        : "reopened";
  const now = new Date().toISOString();
  return {
    alarms: store.alarms.map((item) =>
      item.id === alarmId
        ? {
            ...item,
            lifecycle,
            acknowledgedAt:
              lifecycle === "acknowledged" ? now : item.acknowledgedAt,
            acknowledgedBy:
              lifecycle === "acknowledged" ? actor : item.acknowledgedBy,
            clearedAt: lifecycle === "cleared" ? now : undefined,
            events: [
              ...item.events,
              {
                id: crypto.randomUUID(),
                at: now,
                actor,
                action,
                detail:
                  lifecycle === "acknowledged"
                    ? "Alarm acknowledged and under investigation."
                    : lifecycle === "cleared"
                      ? "Alarm marked resolved after operational review."
                      : "Alarm reopened for further investigation.",
              },
            ],
          }
        : item,
    ),
    revision: store.revision + 1,
  };
}

export function assignAlarm(
  store: AlarmStore,
  alarmId: string,
  actor: AlarmActor,
): AlarmStore {
  const now = new Date().toISOString();
  return {
    alarms: store.alarms.map((alarm) =>
      alarm.id === alarmId
        ? {
            ...alarm,
            assignedTo: actor,
            events: [
              ...alarm.events,
              {
                id: crypto.randomUUID(),
                at: now,
                actor,
                action: "assigned",
                detail: `Assigned to ${actor}.`,
              },
            ],
          }
        : alarm,
    ),
    revision: store.revision + 1,
  };
}

export function addAlarmNote(
  store: AlarmStore,
  alarmId: string,
  note: string,
  actor: AlarmActor,
): AlarmStore {
  const now = new Date().toISOString();
  return {
    alarms: store.alarms.map((alarm) =>
      alarm.id === alarmId
        ? {
            ...alarm,
            events: [
              ...alarm.events,
              {
                id: crypto.randomUUID(),
                at: now,
                actor,
                action: "noted",
                detail: note.trim(),
              },
            ],
          }
        : alarm,
    ),
    revision: store.revision + 1,
  };
}
