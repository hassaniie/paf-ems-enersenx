"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AlarmLifecycle } from "@/domain";
import {
  addAlarmNote,
  assignAlarm,
  createInitialAlarmStore,
  loadAlarmStore,
  persistAlarmStore,
  reconcileAlarmSeeds,
  transitionAlarm,
  type AlarmActor,
  type AlarmSeed,
  type AlarmStore,
} from "@/data/client/alarm-repository";
import { selectMeterRecords } from "@/features/organization/energy-selectors";
import { useOrganization } from "@/features/organization/organization-provider";

interface AlarmContextValue {
  store: AlarmStore;
  ready: boolean;
  attentionCount: number;
  transition: (alarmId: string, lifecycle: AlarmLifecycle) => void;
  assign: (alarmId: string, actor?: AlarmActor) => void;
  addNote: (alarmId: string, note: string) => void;
  raise: (seed: AlarmSeed) => void;
}

const AlarmContext = createContext<AlarmContextValue | null>(null);

function buildAlarmSeeds(): AlarmSeed[] {
  return [
    {
      id: "alarm-pf-cc",
      meterId: "m-cc",
      meterCode: "CC-HT-01",
      nodeName: "CAC / CASS",
      ruleId: "pf_low",
      severity: "critical",
      category: "compliance",
      title: "Power factor penalty exposure",
      message:
        "Power factor is below the 0.80 commercial threshold. Inspect the capacitor bank and reactive load.",
      raisedAt: "2026-09-23T14:42:00+05:00",
    },
    {
      id: "alarm-ct-ta",
      meterId: "m-ta",
      meterCode: "TA-HT-01",
      nodeName: "Tech Area (Main)",
      ruleId: "ct_fault",
      severity: "warning",
      category: "sensor_fault",
      title: "Probable CT circuit fault",
      message:
        "Voltage is present with near-zero current. Physical inspection of the CT circuit is required.",
      raisedAt: "2026-09-23T14:57:00+05:00",
    },
    {
      id: "alarm-export-cc",
      meterId: "m-cc",
      meterCode: "CC-HT-01",
      nodeName: "CAC / CASS",
      ruleId: "reverse_flow",
      severity: "info",
      category: "reverse_flow",
      title: "Reverse power flow registered",
      message:
        "Export energy is being registered at CAC / CASS and offsetting downstream demand.",
      raisedAt: "2026-09-23T15:07:00+05:00",
      lifecycle: "acknowledged",
    },
  ];
}

export function AlarmProvider({ children }: { children: ReactNode }) {
  const { store: organization, ready: organizationReady } = useOrganization();
  const seeds = useMemo(() => buildAlarmSeeds(), []);
  const [store, setStore] = useState(() => createInitialAlarmStore(seeds));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setStore(
        reconcileAlarmSeeds(
          loadAlarmStore(createInitialAlarmStore(seeds)),
          seeds,
        ),
      );
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [seeds]);

  useEffect(() => {
    if (ready) persistAlarmStore(store);
  }, [ready, store]);

  useEffect(() => {
    if (!ready || !organizationReady) return;
    const records = selectMeterRecords(organization);
    const dynamicSeeds: AlarmSeed[] = [];
    for (const { meter, node, live } of records) {
      if (live?.status === "faulty")
        dynamicSeeds.push({
          id: meter.id === "m-ta" ? "alarm-ct-ta" : `alarm-fault-${meter.id}`,
          meterId: meter.id,
          meterCode: meter.code,
          nodeName: node.name,
          ruleId: "ct_fault",
          severity: "warning",
          category: "sensor_fault",
          title: "Meter fault requires inspection",
          message:
            "The meter is reporting a faulty state and requires field diagnosis.",
          raisedAt: new Date().toISOString(),
        });
      if (
        live?.lastReading?.powerFactor !== undefined &&
        live.lastReading.powerFactor < 0.8
      )
        dynamicSeeds.push({
          id: meter.id === "m-cc" ? "alarm-pf-cc" : `alarm-pf-${meter.id}`,
          meterId: meter.id,
          meterCode: meter.code,
          nodeName: node.name,
          ruleId: "pf_low",
          severity: "critical",
          category: "compliance",
          title: "Power factor penalty exposure",
          message: `Power factor ${live.lastReading.powerFactor.toFixed(3)} is below the 0.80 commercial threshold.`,
          raisedAt: new Date().toISOString(),
        });
    }
    const frame = window.requestAnimationFrame(() => {
      setStore((current) => reconcileAlarmSeeds(current, dynamicSeeds));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [organization, organizationReady, ready]);

  const value = useMemo<AlarmContextValue>(
    () => ({
      store,
      ready,
      attentionCount: store.alarms.filter(
        (alarm) => alarm.lifecycle === "active" && alarm.severity !== "info",
      ).length,
      transition: (alarmId, lifecycle) =>
        setStore((current) =>
          transitionAlarm(current, alarmId, lifecycle, "A. Q. Niazi"),
        ),
      assign: (alarmId, actor = "A. Q. Niazi") =>
        setStore((current) => assignAlarm(current, alarmId, actor)),
      addNote: (alarmId, note) =>
        setStore((current) =>
          addAlarmNote(current, alarmId, note, "A. Q. Niazi"),
        ),
      raise: (seed) =>
        setStore((current) => reconcileAlarmSeeds(current, [seed])),
    }),
    [ready, store],
  );

  return (
    <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>
  );
}

export function useAlarms() {
  const context = useContext(AlarmContext);
  if (!context) throw new Error("useAlarms must be used inside AlarmProvider");
  return context;
}
