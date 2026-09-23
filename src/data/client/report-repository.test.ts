import { describe, expect, it } from "vitest";
import {
  addGeneratedReport,
  createInitialReportStore,
  deleteGeneratedReport,
  duplicateGeneratedReport,
  renameGeneratedReport,
  setReportStatus,
  type GeneratedReport,
} from "./report-repository";

const report: GeneratedReport = {
  id: "test-report",
  title: "Test Report",
  type: "energy-summary",
  range: "7D",
  scopeMeterId: "all",
  scopeLabel: "PAF Base Lahore",
  includeComparison: true,
  includeNotes: true,
  generatedAt: "2026-09-23T12:00:00Z",
  generatedBy: "A. Q. Niazi",
  status: "ready",
  snapshot: {
    energyKwh: 100,
    peakDemandKw: 50,
    averageDemandKw: 30,
    estimatedCostPkr: 5875,
    exportKwh: 10,
    activeAlarms: 2,
    qualityCompliancePct: 75,
    reportingMeters: 4,
    totalMeters: 10,
  },
  sizeKb: 200,
};

describe("report repository", () => {
  it("adds, renames and archives generated reports", () => {
    let store = addGeneratedReport(createInitialReportStore(), report);
    store = renameGeneratedReport(store, report.id, "Renamed Report");
    store = setReportStatus(store, report.id, "archived");
    expect(store.reports[0]?.title).toBe("Renamed Report");
    expect(store.reports[0]?.status).toBe("archived");
  });

  it("rejects an empty report title", () => {
    expect(() =>
      renameGeneratedReport(
        createInitialReportStore(),
        "report-sep-energy",
        "  ",
      ),
    ).toThrow("required");
  });

  it("duplicates and deletes retained reports", () => {
    const initial = addGeneratedReport(createInitialReportStore(), report);
    const duplicated = duplicateGeneratedReport(initial, report.id);
    expect(duplicated.reports[0]?.title).toBe("Test Report Copy");
    const removed = deleteGeneratedReport(duplicated, report.id);
    expect(removed.reports.some((item) => item.id === report.id)).toBe(false);
  });
});
