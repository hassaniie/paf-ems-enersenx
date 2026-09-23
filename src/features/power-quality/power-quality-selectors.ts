import type { MeterReading } from "@/domain";
import type { OrganizationStore } from "@/data/client/organization-repository";
import { POWER_FACTOR, POWER_QUALITY } from "@/config/thresholds";
import {
  selectMeterRecords,
  type MeterRecord,
} from "@/features/organization/energy-selectors";

export type QualityState = "compliant" | "watch" | "critical" | "unavailable";

export interface PowerQualityRecord extends MeterRecord {
  averageVoltageV?: number;
  voltageDeviationPct?: number;
  voltageUnbalancePct?: number;
  frequencyHz?: number;
  powerFactor?: number;
  state: QualityState;
  issues: string[];
}

function average(values?: readonly number[]) {
  return values?.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : undefined;
}

export function calculateVoltageUnbalance(reading?: MeterReading) {
  const mean = average(reading?.voltageV);
  if (!mean || !reading?.voltageV) return undefined;
  return (
    (Math.max(...reading.voltageV.map((value) => Math.abs(value - mean))) /
      mean) *
    100
  );
}

export function selectPowerQualityRecords(
  store: OrganizationStore,
): PowerQualityRecord[] {
  return selectMeterRecords(store)
    .filter(({ meter }) => meter.role !== "derived")
    .map((record) => {
      const reading = record.live?.lastReading;
      if (!reading)
        return {
          ...record,
          state: "unavailable" as const,
          issues: ["No telemetry available"],
        };
      const averageVoltageV = average(reading.voltageV);
      const expectedPhaseVoltage = record.meter.nominalVoltage / Math.sqrt(3);
      const voltageDeviationPct = averageVoltageV
        ? (Math.abs(averageVoltageV - expectedPhaseVoltage) /
            expectedPhaseVoltage) *
          100
        : undefined;
      const voltageUnbalancePct =
        reading.voltageUnbalancePct ?? calculateVoltageUnbalance(reading);
      const powerFactor = reading.powerFactor;
      const frequencyHz = reading.frequencyHz;
      const issues: string[] = [];
      let state: QualityState = "compliant";

      if (record.live?.status === "faulty") {
        state = "critical";
        issues.push("Meter or CT circuit fault");
      }
      if (powerFactor !== undefined && powerFactor < POWER_FACTOR.fineBelow) {
        state = "critical";
        issues.push("PF below commercial threshold");
      } else if (
        powerFactor !== undefined &&
        powerFactor < POWER_FACTOR.trackBelow &&
        state !== "critical"
      ) {
        state = "watch";
        issues.push("PF below target");
      }
      if (
        voltageUnbalancePct !== undefined &&
        voltageUnbalancePct > POWER_QUALITY.voltageUnbalanceCriticalPct
      ) {
        state = "critical";
        issues.push("Critical voltage unbalance");
      } else if (
        voltageUnbalancePct !== undefined &&
        voltageUnbalancePct > POWER_QUALITY.voltageUnbalanceWarningPct &&
        state === "compliant"
      ) {
        state = "watch";
        issues.push("Voltage unbalance above target");
      }
      if (
        voltageDeviationPct !== undefined &&
        voltageDeviationPct > POWER_QUALITY.voltageTolerancePct
      ) {
        state = "critical";
        issues.push("Voltage outside tolerance");
      }
      if (
        frequencyHz !== undefined &&
        (frequencyHz < POWER_QUALITY.frequencyMinHz ||
          frequencyHz > POWER_QUALITY.frequencyMaxHz)
      ) {
        state = "critical";
        issues.push("Frequency outside operating band");
      }
      if (!issues.length) issues.push("All measured parameters within target");

      return {
        ...record,
        averageVoltageV,
        voltageDeviationPct,
        voltageUnbalancePct,
        frequencyHz,
        powerFactor,
        state,
        issues,
      };
    });
}

export function selectPowerQualitySummary(store: OrganizationStore) {
  const records = selectPowerQualityRecords(store);
  const measured = records.filter((record) => record.state !== "unavailable");
  const values = measured
    .map((record) => record.powerFactor)
    .filter((value): value is number => value !== undefined);
  const frequencyValues = measured
    .map((record) => record.frequencyHz)
    .filter((value): value is number => value !== undefined);
  return {
    records,
    measuredCount: measured.length,
    compliantCount: records.filter((record) => record.state === "compliant")
      .length,
    watchCount: records.filter((record) => record.state === "watch").length,
    criticalCount: records.filter((record) => record.state === "critical")
      .length,
    unavailableCount: records.filter((record) => record.state === "unavailable")
      .length,
    averagePf: values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0,
    averageFrequencyHz: frequencyValues.length
      ? frequencyValues.reduce((sum, value) => sum + value, 0) /
        frequencyValues.length
      : 0,
  };
}
