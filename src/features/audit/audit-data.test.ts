import { describe, expect, it } from "vitest";
import { createInitialAlarmStore } from "@/data/client/alarm-repository";
import { createInitialQuotaStore } from "@/data/client/quota-repository";
import { createInitialReportStore } from "@/data/client/report-repository";
import { createInitialUserStore } from "@/data/client/user-repository";
import {
  auditToCsv,
  buildAuditRecords,
  filterAuditRecords,
} from "./audit-data";

const records = buildAuditRecords({
  alarms: createInitialAlarmStore([]),
  quotas: createInitialQuotaStore(),
  reports: createInitialReportStore(),
  users: createInitialUserStore(),
});

describe("audit data", () => {
  it("combines and sorts module activity", () => {
    expect(records.length).toBeGreaterThan(10);
    expect(Date.parse(records[0]!.at)).toBeGreaterThanOrEqual(
      Date.parse(records.at(-1)!.at),
    );
  });
  it("filters by module and free text", () => {
    expect(
      filterAuditRecords(records, { module: "reports" }).every(
        (record) => record.module === "reports",
      ),
    ).toBe(true);
    expect(
      filterAuditRecords(records, { query: "telemetry" }).every((record) =>
        `${record.action} ${record.detail}`.toLowerCase().includes("telemetry"),
      ),
    ).toBe(true);
  });
  it("escapes records for CSV export", () => {
    const csv = auditToCsv([
      { ...records[0]!, detail: 'Changed "role", safely' },
    ]);
    expect(csv).toContain('"Changed ""role"", safely"');
  });
});
