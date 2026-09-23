import { describe, expect, it } from "vitest";
import {
  addAlarmNote,
  assignAlarm,
  createInitialAlarmStore,
  reconcileAlarmSeeds,
  transitionAlarm,
  type AlarmSeed,
} from "./alarm-repository";

const seed: AlarmSeed = {
  id: "a-1",
  meterId: "m-1",
  meterCode: "TEST-01",
  nodeName: "Test feeder",
  ruleId: "pf_low",
  severity: "critical",
  category: "compliance",
  title: "Low power factor",
  message: "Power factor is below threshold.",
  raisedAt: "2026-09-23T12:00:00Z",
};

describe("alarm repository", () => {
  it("creates and reconciles alarms without duplicates", () => {
    const store = createInitialAlarmStore([seed]);
    expect(reconcileAlarmSeeds(store, [seed])).toBe(store);
    expect(store.alarms[0]?.events[0]?.action).toBe("raised");
  });

  it("records acknowledgement and resolution history", () => {
    const store = createInitialAlarmStore([seed]);
    const acknowledged = transitionAlarm(
      store,
      seed.id,
      "acknowledged",
      "A. Q. Niazi",
    );
    const cleared = transitionAlarm(
      acknowledged,
      seed.id,
      "cleared",
      "A. Q. Niazi",
    );
    expect(cleared.alarms[0]?.lifecycle).toBe("cleared");
    expect(cleared.alarms[0]?.events.map((event) => event.action)).toEqual([
      "raised",
      "acknowledged",
      "cleared",
    ]);
  });

  it("tracks assignment and investigation notes", () => {
    const store = assignAlarm(
      createInitialAlarmStore([seed]),
      seed.id,
      "Duty Engineer",
    );
    const noted = addAlarmNote(
      store,
      seed.id,
      "Capacitor bank inspection scheduled.",
      "Duty Engineer",
    );
    expect(noted.alarms[0]?.assignedTo).toBe("Duty Engineer");
    expect(noted.alarms[0]?.events.at(-1)?.detail).toContain("inspection");
  });
});
