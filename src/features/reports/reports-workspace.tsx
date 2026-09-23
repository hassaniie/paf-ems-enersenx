"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  BellRing,
  Check,
  ChevronRight,
  CircleGauge,
  Copy,
  Download,
  FileBarChart,
  FileText,
  Gauge,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Waves,
  X,
} from "lucide-react";
import type { AnalyticsRange } from "@/features/analytics/analytics-data";
import type {
  GeneratedReport,
  ReportType,
} from "@/data/client/report-repository";
import { buildAnalyticsDataset } from "@/features/analytics/analytics-data";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { useScopedOrganization } from "@/features/organization/use-scoped-organization";
import { selectEnergySummary } from "@/features/organization/energy-selectors";
import { selectPowerQualitySummary } from "@/features/power-quality/power-quality-selectors";
import { useShell } from "@/components/layout/shell-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatEnergy, formatPkr, formatPower } from "@/domain";
import { cn } from "@/lib/cn";
import { useReports } from "./report-provider";

const templates: {
  type: ReportType;
  title: string;
  description: string;
  icon: typeof FileText;
  sections: string[];
}[] = [
  {
    type: "energy-summary",
    title: "Energy Command Summary",
    description:
      "Executive consumption, cost, export and site contribution overview.",
    icon: FileBarChart,
    sections: ["Executive KPIs", "Period comparison", "Meter contribution"],
  },
  {
    type: "demand-analysis",
    title: "Demand Analysis",
    description:
      "Peak behavior, average load, headroom and demand-risk review.",
    icon: BarChart3,
    sections: ["Peak demand", "Load profile", "Capacity headroom"],
  },
  {
    type: "alarm-register",
    title: "Alarm Register",
    description:
      "Formal record of active, acknowledged and resolved operational alarms.",
    icon: BellRing,
    sections: ["Alarm summary", "Lifecycle register", "Ownership history"],
  },
  {
    type: "power-quality",
    title: "Power Quality Review",
    description:
      "Power factor, voltage balance, frequency and exception analysis.",
    icon: Waves,
    sections: ["Compliance score", "Meter exceptions", "Threshold context"],
  },
];

export function ReportsWorkspace() {
  const { store: organization, ready: organizationReady } =
    useScopedOrganization();
  const { store: alarms } = useAlarms();
  const { store, ready, add, rename, duplicate, setStatus, remove } =
    useReports();
  const { can, accessibleNodeIds } = useShell();
  const [builderType, setBuilderType] = useState<ReportType | null>(null);
  const [preview, setPreview] = useState<GeneratedReport | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ready" | "archived"
  >("all");
  const [toast, setToast] = useState<string | null>(null);
  const canManage = can("reports.manage");
  const filteredReports = useMemo(
    () =>
      store.reports.filter(
        (report) =>
          (accessibleNodeIds === null ||
            (report.scopeMeterId !== "all" &&
              organization.meters.some(
                (meter) => meter.id === report.scopeMeterId,
              ))) &&
          (!query ||
            `${report.title} ${report.scopeLabel}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (statusFilter === "all" || report.status === statusFilter),
      ),
    [
      accessibleNodeIds,
      organization.meters,
      query,
      statusFilter,
      store.reports,
    ],
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };
  if (!ready || !organizationReady)
    return (
      <div className="reports-loading">
        <div />
        <div />
        <div />
      </div>
    );

  return (
    <div className="reports-page mx-auto max-w-[1680px]">
      <section className="reports-heading">
        <div>
          <div className="reports-eyebrow">
            <FileText />
            Reporting center
          </div>
          <h1>Turn operational data into command-ready records.</h1>
          <p>
            Configure, preview, generate and retain formal reports from one
            trusted data layer.
          </p>
        </div>
        <div className="reports-heading-actions">
          <Badge tone="var(--status-online)">
            <ShieldCheck />
            {
              store.reports.filter((report) => report.status === "ready").length
            }{" "}
            reports ready
          </Badge>
          <Button onClick={() => setBuilderType("energy-summary")}>
            <Plus />
            Create report
          </Button>
        </div>
      </section>

      <section className="report-templates">
        <div className="report-section-heading">
          <div>
            <span>Report templates</span>
            <h2>Start from an approved structure</h2>
          </div>
          <small>
            All templates use the current PAF hierarchy and permissions.
          </small>
        </div>
        <div className="report-template-grid">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.type} className="report-template">
                <CardBody>
                  <span className="report-template-icon">
                    <Icon />
                  </span>
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <ul>
                    {template.sections.map((section) => (
                      <li key={section}>
                        <Check />
                        {section}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="outline"
                    onClick={() => setBuilderType(template.type)}
                  >
                    Configure <ChevronRight />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <Card className="report-library">
        <CardHeader
          title="Generated report library"
          subtitle="Retained command records and downloadable report snapshots"
          action={
            <div className="report-library-count">
              <strong className="num">{filteredReports.length}</strong>
              <span>total reports</span>
            </div>
          }
        />
        <div className="report-library-toolbar">
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reports or scope"
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear report search"
              >
                <X />
              </button>
            ) : null}
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as typeof statusFilter)
            }
          >
            <option value="all">All statuses</option>
            <option value="ready">Ready</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="report-list-head">
          <span>Report</span>
          <span>Scope & period</span>
          <span>Generated</span>
          <span>Size</span>
          <span>Status</span>
          <span />
        </div>
        <div className="report-list">
          {filteredReports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              canManage={canManage}
              onPreview={() => setPreview(report)}
              onDownload={() => {
                downloadReport(report);
                notify("Report downloaded.");
              }}
              onRename={() => {
                const title = window.prompt("Rename report", report.title);
                if (title) {
                  rename(report.id, title);
                  notify("Report renamed.");
                }
              }}
              onDuplicate={() => {
                duplicate(report.id);
                notify("Report duplicated.");
              }}
              onArchive={() => {
                setStatus(
                  report.id,
                  report.status === "ready" ? "archived" : "ready",
                );
                notify(
                  report.status === "ready"
                    ? "Report archived."
                    : "Report restored.",
                );
              }}
              onDelete={() => {
                if (
                  window.confirm(
                    `Delete “${report.title}”? This only removes the retained report file.`,
                  )
                ) {
                  remove(report.id);
                  notify("Report deleted.");
                }
              }}
            />
          ))}
          {!filteredReports.length ? (
            <div className="reports-empty">
              <Search />
              <strong>No reports found</strong>
              <p>Try another title, scope, or status.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {builderType ? (
        <ReportBuilder
          initialType={builderType}
          organization={organization}
          alarmCount={
            alarms.alarms.filter((alarm) => alarm.lifecycle !== "cleared")
              .length
          }
          onClose={() => setBuilderType(null)}
          onPreview={setPreview}
          onGenerate={(report) => {
            add(report);
            setBuilderType(null);
            setPreview(report);
            notify("Report generated and retained.");
          }}
        />
      ) : null}
      {preview ? (
        <ReportPreview
          report={preview}
          onClose={() => setPreview(null)}
          onDownload={() => {
            downloadReport(preview);
            notify("Report downloaded.");
          }}
        />
      ) : null}
      {toast ? (
        <div className="organization-toast success">
          <Check />
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ReportBuilder({
  initialType,
  organization,
  alarmCount,
  onClose,
  onPreview,
  onGenerate,
}: {
  initialType: ReportType;
  organization: ReturnType<typeof useScopedOrganization>["store"];
  alarmCount: number;
  onClose: () => void;
  onPreview: (report: GeneratedReport) => void;
  onGenerate: (report: GeneratedReport) => void;
}) {
  const [type, setType] = useState(initialType);
  const [range, setRange] = useState<AnalyticsRange>("30D");
  const [scopeMeterId, setScopeMeterId] = useState("all");
  const [title, setTitle] = useState(
    templates.find((item) => item.type === initialType)?.title ??
      "Command Report",
  );
  const [includeComparison, setIncludeComparison] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const energy = selectEnergySummary(organization);
  const quality = selectPowerQualitySummary(organization);
  const analytics = buildAnalyticsDataset(organization, range);
  const selected = energy.records.find(
    ({ meter }) => meter.id === scopeMeterId,
  );
  const contribution = analytics.contributions.find(
    (item) => item.meterId === scopeMeterId,
  );
  const share = contribution ? contribution.sharePct / 100 : 1;
  const createReport = (): GeneratedReport => ({
    id: crypto.randomUUID(),
    title: title.trim() || "Untitled Command Report",
    type,
    range,
    scopeMeterId,
    scopeLabel: selected?.node.name ?? "PAF Base Lahore",
    includeComparison,
    includeNotes,
    generatedAt: new Date().toISOString(),
    generatedBy: "A. Q. Niazi",
    status: "ready",
    snapshot: {
      energyKwh: Math.round(analytics.energyKwh * share),
      peakDemandKw: Math.round(analytics.peakDemandKw * share),
      averageDemandKw: Math.round(analytics.averageDemandKw * share),
      estimatedCostPkr: Math.round(analytics.costPkr * share),
      exportKwh: Math.round(analytics.exportKwh * share),
      activeAlarms: scopeMeterId === "all" ? alarmCount : 0,
      qualityCompliancePct: quality.measuredCount
        ? Math.round((quality.compliantCount / quality.measuredCount) * 100)
        : 0,
      reportingMeters:
        scopeMeterId === "all"
          ? energy.reportingCount
          : selected?.live?.status === "online"
            ? 1
            : 0,
      totalMeters: scopeMeterId === "all" ? energy.physicalCount : 1,
    },
    sizeKb: Math.round(
      180 + analytics.points.length * 9 + (includeNotes ? 42 : 0),
    ),
  });
  return (
    <div
      className="report-builder-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="report-builder" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>Report configuration</span>
            <h2>Create command report</h2>
            <p>Choose the reporting structure, scope and content.</p>
          </div>
          <button onClick={onClose} aria-label="Close report builder">
            <X />
          </button>
        </header>
        <div className="report-builder-body">
          <label>
            <span>Report title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <div className="report-form-grid">
            <label>
              <span>Report type</span>
              <select
                value={type}
                onChange={(event) => {
                  const next = event.target.value as ReportType;
                  setType(next);
                  setTitle(
                    templates.find((item) => item.type === next)?.title ??
                      title,
                  );
                }}
              >
                {templates.map((item) => (
                  <option value={item.type} key={item.type}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Reporting period</span>
              <select
                value={range}
                onChange={(event) =>
                  setRange(event.target.value as AnalyticsRange)
                }
              >
                <option value="24H">Last 24 hours</option>
                <option value="7D">Last 7 days</option>
                <option value="30D">Last 30 days</option>
                <option value="90D">Last 90 days</option>
              </select>
            </label>
          </div>
          <label>
            <span>Asset scope</span>
            <select
              value={scopeMeterId}
              onChange={(event) => setScopeMeterId(event.target.value)}
            >
              <option value="all">
                PAF Base Lahore · All reporting meters
              </option>
              {energy.records
                .filter(({ meter }) => meter.role !== "derived")
                .map(({ meter, node }) => (
                  <option value={meter.id} key={meter.id}>
                    {node.name} · {meter.code}
                  </option>
                ))}
            </select>
          </label>
          <div className="report-options">
            <label>
              <input
                type="checkbox"
                checked={includeComparison}
                onChange={(event) => setIncludeComparison(event.target.checked)}
              />
              <span>
                <strong>Previous-period comparison</strong>
                <small>Include movement and variance context.</small>
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(event) => setIncludeNotes(event.target.checked)}
              />
              <span>
                <strong>Command notes section</strong>
                <small>Add a signed observations area.</small>
              </span>
            </label>
          </div>
          <div className="report-builder-summary">
            <Activity />
            <span>
              <strong>{analytics.points.length} reporting intervals</strong>
              <small>
                {selected?.node.name ?? "Entire monitored site"} · {alarmCount}{" "}
                open alarms · {quality.measuredCount} quality measurements
              </small>
            </span>
          </div>
        </div>
        <footer>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onPreview(createReport())}>
            <FileText />
            Preview
          </Button>
          <Button onClick={() => onGenerate(createReport())}>
            <FileBarChart />
            Generate report
          </Button>
        </footer>
      </section>
    </div>
  );
}

function ReportRow({
  report,
  canManage,
  onPreview,
  onDownload,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  report: GeneratedReport;
  canManage: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const Icon =
    report.type === "alarm-register"
      ? BellRing
      : report.type === "power-quality"
        ? Waves
        : report.type === "demand-analysis"
          ? BarChart3
          : FileBarChart;
  return (
    <div className="report-row">
      <button className="report-identity" onClick={onPreview}>
        <span>
          <Icon />
        </span>
        <span>
          <strong>{report.title}</strong>
          <small>
            {typeLabel(report.type)} · by {report.generatedBy}
          </small>
        </span>
      </button>
      <span className="report-scope">
        <strong>{report.scopeLabel}</strong>
        <small>{rangeLabel(report.range)}</small>
      </span>
      <span className="report-generated">
        <strong>{formatDate(report.generatedAt)}</strong>
        <small>{relativeDate(report.generatedAt)}</small>
      </span>
      <span className="report-size num">{report.sizeKb} KB</span>
      <span className={cn("report-status", report.status)}>
        <i />
        {report.status}
      </span>
      <div className="report-actions">
        <button onClick={onDownload} title="Download">
          <Download />
        </button>
        <button onClick={onPreview} title="Preview">
          <ChevronRight />
        </button>
        {canManage ? (
          <details>
            <summary>
              <MoreHorizontal />
            </summary>
            <div>
              <button onClick={onRename}>
                <Pencil />
                Rename
              </button>
              <button onClick={onDuplicate}>
                <Copy />
                Duplicate
              </button>
              <button onClick={onArchive}>
                <Archive />
                {report.status === "ready" ? "Archive" : "Restore"}
              </button>
              <button onClick={onDelete} className="danger">
                <Trash2 />
                Delete
              </button>
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function ReportPreview({
  report,
  onClose,
  onDownload,
}: {
  report: GeneratedReport;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="report-preview-backdrop">
      <section className="report-preview-shell">
        <header>
          <div>
            <span>Report preview</span>
            <strong>{report.title}</strong>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download />
              Download HTML
            </Button>
            <button onClick={onClose} aria-label="Close report preview">
              <X />
            </button>
          </div>
        </header>
        <ReportDocument report={report} />
      </section>
    </div>
  );
}
function ReportDocument({ report }: { report: GeneratedReport }) {
  const s = report.snapshot;
  return (
    <article className="report-document">
      <header>
        <div className="report-document-brand">
          <span>
            <Activity />
          </span>
          <div>
            <strong>EnersenX</strong>
            <small>ENERGY INTELLIGENCE</small>
          </div>
        </div>
        <div>
          <span>PAF BASE LAHORE</span>
          <strong>COMMAND REPORT</strong>
        </div>
      </header>
      <section className="report-document-title">
        <small>{typeLabel(report.type)}</small>
        <h1>{report.title}</h1>
        <p>
          {report.scopeLabel} · {rangeLabel(report.range)} · Generated{" "}
          {formatDate(report.generatedAt)}
        </p>
      </section>
      <section className="report-document-kpis">
        <div>
          <span>Energy</span>
          <strong>{formatEnergy(s.energyKwh)}</strong>
        </div>
        <div>
          <span>Peak demand</span>
          <strong>{formatPower(s.peakDemandKw)}</strong>
        </div>
        <div>
          <span>Estimated cost</span>
          <strong>{formatPkr(s.estimatedCostPkr)}</strong>
        </div>
        <div>
          <span>Export</span>
          <strong>{formatEnergy(s.exportKwh)}</strong>
        </div>
      </section>
      <section className="report-document-section">
        <h2>Executive assessment</h2>
        <p>
          The monitored scope recorded an average demand of{" "}
          {formatPower(s.averageDemandKw)} with a peak of{" "}
          {formatPower(s.peakDemandKw)}. {s.activeAlarms} operational alarms
          remain open, while {s.reportingMeters} of {s.totalMeters} configured
          meters contributed live data.
        </p>
        <div className="report-document-health">
          <div>
            <CircleGauge />
            <span>
              <small>Quality compliance</small>
              <strong>{s.qualityCompliancePct}%</strong>
            </span>
          </div>
          <div>
            <Gauge />
            <span>
              <small>Telemetry coverage</small>
              <strong>
                {Math.round(
                  (s.reportingMeters / Math.max(1, s.totalMeters)) * 100,
                )}
                %
              </strong>
            </span>
          </div>
          <div>
            <BellRing />
            <span>
              <small>Open alarms</small>
              <strong>{s.activeAlarms}</strong>
            </span>
          </div>
        </div>
      </section>
      <section className="report-document-section">
        <h2>Command observations</h2>
        {report.includeNotes ? (
          <div className="report-notes-lines">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <p>Notes were excluded from this report configuration.</p>
        )}
      </section>
      <footer>
        <span>Generated by {report.generatedBy}</span>
        <span>EnersenX · PAF Base Lahore</span>
        <span>Report ID {report.id.slice(0, 8).toUpperCase()}</span>
      </footer>
    </article>
  );
}

function downloadReport(report: GeneratedReport) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;padding:48px;max-width:900px;margin:auto}header{display:flex;justify-content:space-between;border-bottom:2px solid #17202a;padding-bottom:20px}h1{font-size:30px;margin:36px 0 8px}.meta{color:#65717e}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0}.grid div{border:1px solid #dce1e5;padding:16px}.grid span{font-size:11px;color:#65717e;text-transform:uppercase}.grid strong{display:block;font-size:18px;margin-top:8px}section{margin-top:32px}footer{margin-top:60px;border-top:1px solid #dce1e5;padding-top:16px;font-size:11px;color:#65717e}</style></head><body><header><strong>EnersenX</strong><span>PAF BASE LAHORE · COMMAND REPORT</span></header><h1>${escapeHtml(report.title)}</h1><p class="meta">${escapeHtml(report.scopeLabel)} · ${rangeLabel(report.range)} · ${formatDate(report.generatedAt)}</p><div class="grid"><div><span>Energy</span><strong>${formatEnergy(report.snapshot.energyKwh)}</strong></div><div><span>Peak demand</span><strong>${formatPower(report.snapshot.peakDemandKw)}</strong></div><div><span>Estimated cost</span><strong>${formatPkr(report.snapshot.estimatedCostPkr)}</strong></div><div><span>Open alarms</span><strong>${report.snapshot.activeAlarms}</strong></div></div><section><h2>Executive assessment</h2><p>Average demand was ${formatPower(report.snapshot.averageDemandKw)}. Quality compliance was ${report.snapshot.qualityCompliancePct}% and ${report.snapshot.reportingMeters} of ${report.snapshot.totalMeters} meters supplied live data.</p></section><section><h2>Command observations</h2><p>${report.includeNotes ? "________________________________________________________________________________" : "Notes excluded from this configuration."}</p></section><footer>Generated by ${escapeHtml(report.generatedBy)} · Report ID ${report.id.slice(0, 8).toUpperCase()}</footer></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        char
      ]!,
  );
}
function typeLabel(type: ReportType) {
  return {
    "energy-summary": "Energy command summary",
    "demand-analysis": "Demand analysis",
    "alarm-register": "Alarm register",
    "power-quality": "Power quality review",
  }[type];
}
function rangeLabel(range: AnalyticsRange) {
  return {
    "24H": "Last 24 hours",
    "7D": "Last 7 days",
    "30D": "Last 30 days",
    "90D": "Last 90 days",
  }[range];
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
function relativeDate(value: string) {
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86400000),
  );
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}
