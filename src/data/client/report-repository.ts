import type { AnalyticsRange } from "@/features/analytics/analytics-data";

export type ReportType =
  "energy-summary" | "demand-analysis" | "alarm-register" | "power-quality";
export type ReportStatus = "ready" | "archived";

export interface ReportSnapshot {
  energyKwh: number;
  peakDemandKw: number;
  averageDemandKw: number;
  estimatedCostPkr: number;
  exportKwh: number;
  activeAlarms: number;
  qualityCompliancePct: number;
  reportingMeters: number;
  totalMeters: number;
}

export interface GeneratedReport {
  id: string;
  title: string;
  type: ReportType;
  range: AnalyticsRange;
  scopeMeterId: string;
  scopeLabel: string;
  includeComparison: boolean;
  includeNotes: boolean;
  generatedAt: string;
  generatedBy: string;
  status: ReportStatus;
  snapshot: ReportSnapshot;
  sizeKb: number;
}

export interface ReportStore {
  reports: GeneratedReport[];
  revision: number;
}

const STORAGE_KEY = "enersenx:paf-lahore:reports:v1";

export function createInitialReportStore(): ReportStore {
  return {
    reports: [
      {
        id: "report-sep-energy",
        title: "September Energy Command Summary",
        type: "energy-summary",
        range: "30D",
        scopeMeterId: "all",
        scopeLabel: "PAF Base Lahore",
        includeComparison: true,
        includeNotes: true,
        generatedAt: "2026-09-23T15:12:00+05:00",
        generatedBy: "A. Q. Niazi",
        status: "ready",
        snapshot: {
          energyKwh: 287420,
          peakDemandKw: 777,
          averageDemandKw: 486,
          estimatedCostPkr: 16885925,
          exportKwh: 4320,
          activeAlarms: 2,
          qualityCompliancePct: 25,
          reportingMeters: 4,
          totalMeters: 10,
        },
        sizeKb: 428,
      },
      {
        id: "report-weekly-alarms",
        title: "Weekly Alarm Register",
        type: "alarm-register",
        range: "7D",
        scopeMeterId: "all",
        scopeLabel: "PAF Base Lahore",
        includeComparison: false,
        includeNotes: true,
        generatedAt: "2026-09-22T09:30:00+05:00",
        generatedBy: "Duty Engineer",
        status: "ready",
        snapshot: {
          energyKwh: 66210,
          peakDemandKw: 732,
          averageDemandKw: 471,
          estimatedCostPkr: 3890000,
          exportKwh: 980,
          activeAlarms: 3,
          qualityCompliancePct: 25,
          reportingMeters: 4,
          totalMeters: 10,
        },
        sizeKb: 212,
      },
      {
        id: "report-pq-review",
        title: "Power Quality Exception Review",
        type: "power-quality",
        range: "30D",
        scopeMeterId: "m-cc",
        scopeLabel: "CAC / CASS",
        includeComparison: true,
        includeNotes: true,
        generatedAt: "2026-09-20T16:05:00+05:00",
        generatedBy: "A. Q. Niazi",
        status: "archived",
        snapshot: {
          energyKwh: 16800,
          peakDemandKw: 44,
          averageDemandKw: 28,
          estimatedCostPkr: 987000,
          exportKwh: 4160,
          activeAlarms: 1,
          qualityCompliancePct: 0,
          reportingMeters: 1,
          totalMeters: 1,
        },
        sizeKb: 305,
      },
    ],
    revision: 1,
  };
}

export function loadReportStore(): ReportStore {
  const fallback = createInitialReportStore();
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as ReportStore | null;
    return parsed && Array.isArray(parsed.reports) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function persistReportStore(store: ReportStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function addGeneratedReport(
  store: ReportStore,
  report: GeneratedReport,
): ReportStore {
  return { reports: [report, ...store.reports], revision: store.revision + 1 };
}

export function renameGeneratedReport(
  store: ReportStore,
  reportId: string,
  title: string,
): ReportStore {
  if (!title.trim()) throw new Error("Report title is required.");
  return {
    reports: store.reports.map((report) =>
      report.id === reportId ? { ...report, title: title.trim() } : report,
    ),
    revision: store.revision + 1,
  };
}

export function duplicateGeneratedReport(
  store: ReportStore,
  reportId: string,
): ReportStore {
  const source = store.reports.find((report) => report.id === reportId);
  if (!source) return store;
  return {
    reports: [
      {
        ...source,
        id: crypto.randomUUID(),
        title: `${source.title} Copy`,
        generatedAt: new Date().toISOString(),
        status: "ready",
      },
      ...store.reports,
    ],
    revision: store.revision + 1,
  };
}

export function setReportStatus(
  store: ReportStore,
  reportId: string,
  status: ReportStatus,
): ReportStore {
  return {
    reports: store.reports.map((report) =>
      report.id === reportId ? { ...report, status } : report,
    ),
    revision: store.revision + 1,
  };
}

export function deleteGeneratedReport(
  store: ReportStore,
  reportId: string,
): ReportStore {
  return {
    reports: store.reports.filter((report) => report.id !== reportId),
    revision: store.revision + 1,
  };
}
