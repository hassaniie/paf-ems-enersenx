import { describe, expect, it } from "vitest";
import {
  formatAge,
  formatEnergy,
  formatPower,
  formatPowerFactor,
  formatVoltage,
  powerFlow,
} from "./format";

describe("formatPower", () => {
  it("keeps small loads in kW", () => {
    expect(formatPower(544)).toBe("544 kW");
    expect(formatPower(40)).toBe("40 kW");
  });
  it("shows sub-10 kW with one decimal", () => {
    expect(formatPower(1)).toBe("1.0 kW");
  });
  it("scales to MW past 1000 kW", () => {
    expect(formatPower(1200)).toBe("1.2 MW");
  });
});

describe("powerFlow (sign convention)", () => {
  it("positive is import", () => {
    expect(powerFlow(544)).toMatchObject({
      direction: "import",
      label: "Import",
    });
  });
  it("negative is export, magnitude is positive", () => {
    expect(powerFlow(-40)).toMatchObject({
      direction: "export",
      label: "Export",
      magnitude: "40 kW",
    });
  });
  it("near-zero is idle", () => {
    expect(powerFlow(0).direction).toBe("idle");
    expect(powerFlow(0.2).direction).toBe("idle");
  });
});

describe("formatEnergy", () => {
  it("shows kWh below a MWh", () => {
    expect(formatEnergy(480)).toBe("480 kWh");
  });
  it("scales to MWh", () => {
    expect(formatEnergy(9120)).toBe("9.12 MWh");
  });
});

describe("formatVoltage", () => {
  it("LT stays in volts", () => {
    expect(formatVoltage(230)).toBe("230 V");
  });
  it("HT shows kV", () => {
    expect(formatVoltage(10720)).toBe("10.72 kV");
  });
});

describe("formatPowerFactor", () => {
  it("always 3 decimals", () => {
    expect(formatPowerFactor(0.34)).toBe("0.340");
    expect(formatPowerFactor(0.956)).toBe("0.956");
  });
});

describe("formatAge", () => {
  const now = new Date("2026-09-21T15:10:00+05:00");
  it("recent is just now", () => {
    expect(formatAge("2026-09-21T15:09:40+05:00", now)).toBe("just now");
  });
  it("minutes", () => {
    expect(formatAge("2026-09-21T15:05:00+05:00", now)).toBe("5 min ago");
  });
  it("hours", () => {
    expect(formatAge("2026-09-21T13:10:00+05:00", now)).toBe("2 h ago");
  });
});
