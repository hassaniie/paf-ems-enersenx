import type { AlarmStore } from "@/data/client/alarm-repository";
import type { QuotaStore } from "@/data/client/quota-repository";
import type { ReportStore } from "@/data/client/report-repository";
import type { UserStore } from "@/data/client/user-repository";

export type AuditModule =
  "access" | "alarms" | "organization" | "quotas" | "reports" | "system";
export type AuditRisk = "routine" | "important" | "sensitive";

export interface AuditRecord {
  id: string;
  at: string;
  actor: string;
  action: string;
  module: AuditModule;
  target: string;
  detail: string;
  risk: AuditRisk;
  sourceId?: string;
  ip?: string;
}

const foundation: AuditRecord[] = [
  {
    id: "audit-org-1",
    at: "2026-09-23T14:18:00+05:00",
    actor: "A. Q. Niazi",
    action: "Meter configuration updated",
    module: "organization",
    target: "NASTP Delta Ph-III",
    detail: "Updated meter communication profile and confirmed Modbus mapping.",
    risk: "important",
    sourceId: "m-nastp",
    ip: "10.21.4.18",
  },
  {
    id: "audit-auth-1",
    at: "2026-09-23T13:52:00+05:00",
    actor: "A. Q. Niazi",
    action: "Administrator signed in",
    module: "access",
    target: "EnersenX command console",
    detail:
      "Successful authenticated session established with administrator privileges.",
    risk: "routine",
    ip: "10.21.4.18",
  },
  {
    id: "audit-system-1",
    at: "2026-09-23T12:00:00+05:00",
    actor: "System",
    action: "Telemetry health scan completed",
    module: "system",
    target: "PAF Base Lahore",
    detail:
      "Four of ten configured meters responded within the reporting window.",
    risk: "important",
  },
  {
    id: "audit-org-2",
    at: "2026-09-22T16:25:00+05:00",
    actor: "Duty Engineer",
    action: "Derived meter formula verified",
    module: "organization",
    target: "Lahore Site Total",
    detail: "Aggregation formula validated against active feeder hierarchy.",
    risk: "routine",
    sourceId: "lahore-site",
  },
];

export function buildAuditRecords(stores: {
  alarms: AlarmStore;
  quotas: QuotaStore;
  reports: ReportStore;
  users: UserStore;
}): AuditRecord[] {
  const alarmRecords = stores.alarms.alarms.flatMap((alarm) =>
    alarm.events.map((event) => ({
      id: `audit-alarm-${event.id}`,
      at: event.at,
      actor: event.actor,
      action: `Alarm ${event.action}`,
      module: "alarms" as const,
      target: alarm.nodeName,
      detail: event.detail,
      risk:
        alarm.severity === "critical"
          ? ("sensitive" as const)
          : ("important" as const),
      sourceId: alarm.id,
    })),
  );
  const quotaRecords = stores.quotas.quotas.flatMap((quota) =>
    quota.events.map((event) => ({
      id: `audit-quota-${event.id}`,
      at: event.at,
      actor: event.actor,
      action: `Quota ${event.action}`,
      module: "quotas" as const,
      target: quota.owner,
      detail: event.detail,
      risk:
        event.action === "approved" || event.action === "rejected"
          ? ("sensitive" as const)
          : ("important" as const),
      sourceId: quota.id,
    })),
  );
  const reportRecords = stores.reports.reports.map((report) => ({
    id: `audit-report-${report.id}`,
    at: report.generatedAt,
    actor: report.generatedBy,
    action:
      report.status === "archived" ? "Report archived" : "Report generated",
    module: "reports" as const,
    target: report.title,
    detail: `${report.scopeLabel} · ${report.range} reporting range · ${report.sizeKb} KB`,
    risk: "routine" as const,
    sourceId: report.id,
  }));
  const userRecords = stores.users.events.map((event) => ({
    id: `audit-user-${event.id}`,
    at: event.at,
    actor: event.actor,
    action: `User ${event.action}`,
    module: "access" as const,
    target: event.userId,
    detail: event.detail,
    risk:
      event.action === "updated" ||
      event.action === "removed" ||
      event.action === "suspended"
        ? ("sensitive" as const)
        : ("important" as const),
    sourceId: event.userId,
    ip: "10.21.4.18",
  }));
  return [
    ...foundation,
    ...alarmRecords,
    ...quotaRecords,
    ...reportRecords,
    ...userRecords,
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function filterAuditRecords(
  records: AuditRecord[],
  options: {
    query?: string;
    module?: AuditModule | "all";
    risk?: AuditRisk | "all";
    actor?: string | "all";
  },
) {
  const query = options.query?.trim().toLowerCase();
  return records.filter((record) => {
    if (
      options.module &&
      options.module !== "all" &&
      record.module !== options.module
    )
      return false;
    if (options.risk && options.risk !== "all" && record.risk !== options.risk)
      return false;
    if (
      options.actor &&
      options.actor !== "all" &&
      record.actor !== options.actor
    )
      return false;
    return (
      !query ||
      `${record.actor} ${record.action} ${record.target} ${record.detail}`
        .toLowerCase()
        .includes(query)
    );
  });
}

export function auditToCsv(records: AuditRecord[]) {
  const cell = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    "Timestamp,Actor,Module,Action,Target,Risk,Detail",
    ...records.map((record) =>
      [
        record.at,
        record.actor,
        record.module,
        record.action,
        record.target,
        record.risk,
        record.detail,
      ]
        .map(cell)
        .join(","),
    ),
  ].join("\n");
}
