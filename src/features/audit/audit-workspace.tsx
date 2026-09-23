"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock3,
  Download,
  FileClock,
  Filter,
  Fingerprint,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useShell } from "@/components/layout/shell-context";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { useQuotas } from "@/features/quotas/quota-provider";
import { useReports } from "@/features/reports/report-provider";
import { useUsers } from "@/features/users/user-provider";
import { cn } from "@/lib/cn";
import {
  auditToCsv,
  buildAuditRecords,
  filterAuditRecords,
  type AuditModule,
  type AuditRecord,
  type AuditRisk,
} from "./audit-data";

const MODULES: (AuditModule | "all")[] = [
  "all",
  "access",
  "alarms",
  "organization",
  "quotas",
  "reports",
  "system",
];

export function AuditWorkspace() {
  const { role } = useShell();
  const { store: alarms } = useAlarms();
  const { store: quotas } = useQuotas();
  const { store: reports } = useReports();
  const { store: users } = useUsers();
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<AuditModule | "all">("all");
  const [risk, setRisk] = useState<AuditRisk | "all">("all");
  const [actor, setActor] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const records = useMemo(
    () => buildAuditRecords({ alarms, quotas, reports, users }),
    [alarms, quotas, reports, users],
  );
  const filtered = useMemo(
    () => filterAuditRecords(records, { query, module, risk, actor }),
    [actor, module, query, records, risk],
  );
  const selected = records.find((record) => record.id === selectedId);
  const actors = [...new Set(records.map((record) => record.actor))];

  if (role !== "Admin" && role !== "Commander")
    return (
      <Card className="audit-denied">
        <span>
          <LockKeyhole />
        </span>
        <Badge tone="var(--sev-critical)">Restricted</Badge>
        <h1>Audit activity is command-only.</h1>
        <p>
          Your {role} role does not include access to security and operational
          event history.
        </p>
      </Card>
    );

  const today = records.filter(
    (record) => record.at.slice(0, 10) === "2026-09-23",
  ).length;
  const sensitive = records.filter(
    (record) => record.risk === "sensitive",
  ).length;
  const system = records.filter((record) => record.actor === "System").length;
  const uniqueActors = new Set(records.map((record) => record.actor)).size;
  const metrics: MetricRibbonItem[] = [
    {
      label: "Events today",
      value: String(today),
      note: "All monitored modules",
      tone: "neutral",
    },
    {
      label: "Sensitive actions",
      value: String(sensitive),
      note: "Approval or access changes",
      tone: sensitive ? "warning" : "good",
    },
    {
      label: "Human actors",
      value: String(uniqueActors - (actors.includes("System") ? 1 : 0)),
      note: "Identified operators",
      tone: "info",
    },
    {
      label: "System events",
      value: String(system),
      note: "Automated activity",
      tone: "neutral",
    },
    {
      label: "Retention",
      value: "365",
      unit: "days",
      note: "Command policy",
      tone: "good",
    },
  ];

  const exportCsv = () => {
    const blob = new Blob([auditToCsv(filtered)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `enersenx-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`${filtered.length} audit events exported.`);
    window.setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="audit-page mx-auto max-w-[1680px]">
      <section className="audit-heading">
        <div>
          <div className="audit-eyebrow">
            <Fingerprint /> Traceability ledger
          </div>
          <h1>Every operational decision, accounted for.</h1>
          <p>
            A tamper-aware history of access, configuration, alarms, reports and
            command approvals.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={!filtered.length}
        >
          <Download /> Export CSV
        </Button>
      </section>
      <MetricRibbon items={metrics} label="Audit summary" />
      <section className="audit-retention">
        <ShieldCheck />
        <div>
          <strong>Audit retention is active</strong>
          <span>
            Events are retained for 365 days. Exported records preserve the
            current filtered view and timestamps.
          </span>
        </div>
        <Badge tone="var(--status-online)">
          <i className="status-dot" /> Policy compliant
        </Badge>
      </section>
      <div className="audit-layout">
        <Card className="audit-ledger">
          <div className="audit-toolbar">
            <label className="audit-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search actor, action, target or detail"
              />
            </label>
            <label>
              <Filter />
              <select
                value={module}
                onChange={(event) =>
                  setModule(event.target.value as AuditModule | "all")
                }
                aria-label="Filter by module"
              >
                {MODULES.map((item) => (
                  <option key={item} value={item}>
                    {item === "all" ? "All modules" : moduleLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <select
              value={risk}
              onChange={(event) =>
                setRisk(event.target.value as AuditRisk | "all")
              }
              aria-label="Filter by sensitivity"
            >
              <option value="all">All sensitivity</option>
              <option value="routine">Routine</option>
              <option value="important">Important</option>
              <option value="sensitive">Sensitive</option>
            </select>
            <select
              value={actor}
              onChange={(event) => setActor(event.target.value)}
              aria-label="Filter by actor"
            >
              <option value="all">All actors</option>
              {actors.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="audit-results">
            <span>
              {filtered.length} of {records.length} events
            </span>
            <span>Newest first · PKT timestamps</span>
          </div>
          <div className="audit-table-head">
            <span>Time</span>
            <span>Actor & action</span>
            <span>Module</span>
            <span>Target</span>
            <span>Sensitivity</span>
          </div>
          <div className="audit-table-body">
            {filtered.map((record) => (
              <button
                key={record.id}
                className={cn(
                  "audit-row",
                  selectedId === record.id && "selected",
                )}
                onClick={() => setSelectedId(record.id)}
              >
                <time>
                  {formatTime(record.at)}
                  <small>{formatDate(record.at)}</small>
                </time>
                <span className="audit-action">
                  <strong>{record.action}</strong>
                  <small>
                    <UserRound /> {record.actor}
                  </small>
                </span>
                <span>
                  <ModuleBadge module={record.module} />
                </span>
                <span className="audit-target">{record.target}</span>
                <span>
                  <RiskBadge risk={record.risk} />
                </span>
              </button>
            ))}
            {!filtered.length ? (
              <div className="audit-empty">
                <Search />
                <strong>No matching activity</strong>
                <span>Try clearing one or more filters.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setModule("all");
                    setRisk("all");
                    setActor("all");
                  }}
                >
                  Reset filters
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
        {selected ? (
          <AuditInspector record={selected} />
        ) : (
          <Card className="audit-selection-empty">
            <FileClock />
            <strong>Select an audit event</strong>
            <p>
              Inspect the actor, timestamp, source and complete recorded detail.
            </p>
          </Card>
        )}
      </div>
      {toast ? (
        <div className="organization-toast success">
          <Check />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function AuditInspector({ record }: { record: AuditRecord }) {
  return (
    <aside className="audit-inspector">
      <header>
        <div>
          <span>Event detail</span>
          <h2>{record.action}</h2>
          <p>{record.id}</p>
        </div>
        <RiskBadge risk={record.risk} />
      </header>
      <section className="audit-inspector-hero">
        <ModuleBadge module={record.module} />
        <strong>{record.target}</strong>
        <p>{record.detail}</p>
      </section>
      <section className="audit-detail-grid">
        <div>
          <UserRound />
          <span>Actor</span>
          <strong>{record.actor}</strong>
        </div>
        <div>
          <Clock3 />
          <span>Timestamp</span>
          <strong>
            {new Date(record.at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "medium",
            })}
          </strong>
        </div>
        <div>
          <Fingerprint />
          <span>Source ID</span>
          <strong>{record.sourceId ?? "System event"}</strong>
        </div>
        <div>
          <LockKeyhole />
          <span>Source IP</span>
          <strong>{record.ip ?? "Internal service"}</strong>
        </div>
      </section>
      <section className="audit-integrity">
        <ShieldCheck />
        <div>
          <strong>Integrity verified</strong>
          <p>
            This event is presented as an append-only operational record.
            Changes create a new event rather than rewriting this entry.
          </p>
        </div>
      </section>
      <footer>
        <Badge tone="var(--text-tertiary)">Retention until 23 Sep 2027</Badge>
      </footer>
    </aside>
  );
}

function ModuleBadge({ module }: { module: AuditModule }) {
  return (
    <Badge
      tone={
        module === "access"
          ? "var(--accent)"
          : module === "alarms"
            ? "var(--sev-critical)"
            : module === "quotas"
              ? "var(--sev-warning)"
              : module === "reports"
                ? "var(--status-online)"
                : "var(--text-tertiary)"
      }
    >
      {moduleLabel(module)}
    </Badge>
  );
}
function RiskBadge({ risk }: { risk: AuditRisk }) {
  return (
    <Badge
      tone={
        risk === "sensitive"
          ? "var(--sev-critical)"
          : risk === "important"
            ? "var(--sev-warning)"
            : "var(--text-tertiary)"
      }
    >
      {risk === "sensitive" ? (
        <AlertTriangle />
      ) : risk === "important" ? (
        <Clock3 />
      ) : (
        <Check />
      )}
      {risk}
    </Badge>
  );
}
function moduleLabel(module: AuditModule) {
  return (
    {
      access: "Access",
      alarms: "Alarms",
      organization: "Organization",
      quotas: "Quotas",
      reports: "Reports",
      system: "System",
    } as const
  )[module];
}
function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
