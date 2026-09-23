import { describe, expect, it } from "vitest";
import { createInitialOrganizationStore } from "@/data/client/organization-repository";
import {
  calculateVoltageUnbalance,
  selectPowerQualitySummary,
} from "./power-quality-selectors";

describe("power quality selectors", () => {
  it("classifies compliant, watch, critical and unavailable meters", () => {
    const summary = selectPowerQualitySummary(createInitialOrganizationStore());

    expect(summary.measuredCount).toBe(4);
    expect(summary.compliantCount).toBe(1);
    expect(summary.watchCount).toBe(1);
    expect(summary.criticalCount).toBe(2);
    expect(summary.unavailableCount).toBe(6);
  });

  it("calculates phase-voltage unbalance from the maximum deviation", () => {
    const value = calculateVoltageUnbalance({
      meterId: "test",
      ts: "2026-09-23T12:00:00Z",
      activePowerKw: 10,
      energyImportKwh: 20,
      energyExportKwh: 0,
      voltageV: [230, 230, 224],
    });

    expect(value).toBeCloseTo(1.75, 1);
  });
});
