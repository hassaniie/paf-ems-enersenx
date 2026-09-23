"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Filter,
  Gauge,
  History,
  Info,
  MessageSquarePlus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import type { AlarmCategory, AlarmLifecycle, AlarmSeverity } from "@/domain";
import type { OperationalAlarm } from "@/data/client/alarm-repository";
import { useShell } from "@/components/layout/shell-context";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useAlarms } from "./alarm-provider";

type AlarmFilter =
  "all" | AlarmSeverity | AlarmLifecycle | AlarmCategory | "unassigned";

export function AlarmsWorkspace() {
  const { store, ready, attentionCount, transition, assign, addNote } =
    useAlarms();
  const { role } = useShell();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AlarmFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const canRespond = role !== "Viewer";

  const alarms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return store.alarms
      .filter((alarm) => {
        if (
          normalized &&
          !`${alarm.title} ${alarm.message} ${alarm.meterCode} ${alarm.nodeName}`
            .toLowerCase()
            .includes(normalized)
        )
          return false;
        if (filter === "all") return true;
        if (filter === "critical" || filter === "warning" || filter === "info")
          return alarm.severity === filter;
        if (
          filter === "active" ||
          filter === "acknowledged" ||
          filter === "cleared"
        )
          return alarm.lifecycle === filter;
        if (filter === "unassigned") return !alarm.assignedTo;
        return alarm.category === filter;
      })
      .sort((a, b) => {
        if (a.lifecycle === "cleared" && b.lifecycle !== "cleared") return 1;
        if (b.lifecycle === "cleared" && a.lifecycle !== "cleared") return -1;
        return (
          severityOrder[a.severity] - severityOrder[b.severity] ||
          new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime()
        );
      });
  }, [filter, query, store.alarms]);

  const selected =
    store.alarms.find((alarm) => alarm.id === selectedId) ?? null;
  const counts = {
    critical: store.alarms.filter(
      (alarm) => alarm.severity === "critical" && alarm.lifecycle !== "cleared",
    ).length,
    warning: store.alarms.filter(
      (alarm) => alarm.severity === "warning" && alarm.lifecycle !== "cleared",
    ).length,
    acknowledged: store.alarms.filter(
      (alarm) => alarm.lifecycle === "acknowledged",
    ).length,
    cleared: store.alarms.filter((alarm) => alarm.lifecycle === "cleared")
      .length,
  };
  const metrics: MetricRibbonItem[] = [
    {
      label: "Requires attention",
      value: String(attentionCount),
      note: "Critical and warning alarms",
      tone: attentionCount ? "warning" : "good",
    },
    {
      label: "Critical",
      value: String(counts.critical),
      note: "Commercial or safety risk",
      tone: counts.critical ? "warning" : "good",
    },
    {
      label: "Warning",
      value: String(counts.warning),
      note: "Field investigation needed",
      tone: "info",
    },
    {
      label: "Acknowledged",
      value: String(counts.acknowledged),
      note: "Currently under review",
      tone: "neutral",
    },
    {
      label: "Resolved",
      value: String(counts.cleared),
      note: "Retained in alarm history",
      tone: "good",
    },
  ];

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  };

  if (!ready)
    return (
      <div className="alarms-loading">
        <div />
        <div />
        <div />
      </div>
    );

  return (
    <div className="alarms-page mx-auto max-w-[1680px]">
      <section className="alarms-heading">
        <div>
          <div className="alarms-eyebrow">
            <BellRing />
            Response center
          </div>
          <h1>Turn exceptions into accountable action.</h1>
          <p>
            Prioritize operational risk, assign ownership and preserve a
            complete response history.
          </p>
        </div>
        <div className="alarms-heading-actions">
          <Badge
            tone={
              attentionCount ? "var(--sev-warning)" : "var(--status-online)"
            }
          >
            {attentionCount ? <AlertTriangle /> : <CheckCircle2 />}
            {attentionCount ? `${attentionCount} require action` : "All clear"}
          </Badge>
          {canRespond &&
          store.alarms.some((alarm) => alarm.lifecycle === "active") ? (
            <Button
              variant="outline"
              onClick={() => {
                store.alarms
                  .filter((alarm) => alarm.lifecycle === "active")
                  .forEach((alarm) => transition(alarm.id, "acknowledged"));
                notify("All active alarms acknowledged.");
              }}
            >
              <Check />
              Acknowledge all
            </Button>
          ) : null}
        </div>
      </section>

      <MetricRibbon items={metrics} label="Alarm response summary" />

      <Card className="alarms-workspace">
        <div className="alarms-toolbar">
          <label className="alarms-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search alarm, asset or meter code"
            />
            {query ? (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X />
              </button>
            ) : (
              <kbd>⌘K</kbd>
            )}
          </label>
          <label className="alarms-filter">
            <Filter />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as AlarmFilter)}
            >
              <option value="all">All alarms</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="cleared">Resolved</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Information</option>
              <option value="unassigned">Unassigned</option>
              <option value="connectivity">Connectivity</option>
              <option value="power_quality">Power quality</option>
              <option value="compliance">Compliance</option>
              <option value="reverse_flow">Reverse flow</option>
              <option value="sensor_fault">Sensor fault</option>
            </select>
          </label>
          <span className="alarms-result-count">
            <strong className="num">{alarms.length}</strong> of{" "}
            {store.alarms.length} events
          </span>
        </div>

        <div className="alarms-list-head">
          <span>Priority & condition</span>
          <span>Asset</span>
          <span>Ownership</span>
          <span>Raised</span>
          <span>Lifecycle</span>
          <span />
        </div>
        <div className="alarms-list">
          {alarms.map((alarm) => (
            <AlarmRow
              key={alarm.id}
              alarm={alarm}
              onOpen={() => setSelectedId(alarm.id)}
            />
          ))}
          {!alarms.length ? (
            <div className="alarms-empty">
              <ShieldCheck />
              <strong>No alarms in this view</strong>
              <p>No events match the current search and filters.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Reset filters
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {selected ? (
        <AlarmDrawer
          alarm={selected}
          canRespond={canRespond}
          onClose={() => setSelectedId(null)}
          onAcknowledge={() => {
            transition(selected.id, "acknowledged");
            notify("Alarm acknowledged.");
          }}
          onAssign={() => {
            assign(selected.id);
            notify("Alarm assigned to A. Q. Niazi.");
          }}
          onClear={() => {
            transition(selected.id, "cleared");
            notify("Alarm marked resolved.");
          }}
          onReopen={() => {
            transition(selected.id, "active");
            notify("Alarm reopened.");
          }}
          onNote={(note) => {
            addNote(selected.id, note);
            notify("Investigation note added.");
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

function AlarmRow({
  alarm,
  onOpen,
}: {
  alarm: OperationalAlarm;
  onOpen: () => void;
}) {
  const Icon =
    alarm.severity === "critical"
      ? AlertOctagon
      : alarm.severity === "warning"
        ? AlertTriangle
        : Info;
  return (
    <button
      className={cn(
        "alarm-work-row",
        `severity-${alarm.severity}`,
        alarm.lifecycle === "cleared" && "is-cleared",
      )}
      onClick={onOpen}
    >
      <span className="alarm-work-identity">
        <span className="alarm-severity-icon">
          <Icon />
        </span>
        <span>
          <strong>{alarm.title}</strong>
          <small>
            {categoryLabel(alarm.category)} · {alarm.message}
          </small>
        </span>
      </span>
      <span className="alarm-asset">
        <strong>{alarm.nodeName}</strong>
        <code>{alarm.meterCode}</code>
      </span>
      <span className="alarm-owner">
        {alarm.assignedTo ? (
          <>
            <UserRound />
            <span>
              <strong>{alarm.assignedTo}</strong>
              <small>Owner</small>
            </span>
          </>
        ) : (
          <>
            <CircleDot />
            <span>
              <strong>Unassigned</strong>
              <small>Needs owner</small>
            </span>
          </>
        )}
      </span>
      <span className="alarm-raised">
        <strong>{relativeTime(alarm.raisedAt)}</strong>
        <small>{formatDate(alarm.raisedAt)}</small>
      </span>
      <LifecyclePill lifecycle={alarm.lifecycle} />
      <span className="alarm-open">
        <ChevronRight />
      </span>
    </button>
  );
}

function AlarmDrawer({
  alarm,
  canRespond,
  onClose,
  onAcknowledge,
  onAssign,
  onClear,
  onReopen,
  onNote,
}: {
  alarm: OperationalAlarm;
  canRespond: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  onAssign: () => void;
  onClear: () => void;
  onReopen: () => void;
  onNote: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const Icon =
    alarm.severity === "critical"
      ? AlertOctagon
      : alarm.severity === "warning"
        ? AlertTriangle
        : Info;
  return (
    <div
      className="alarm-drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="alarm-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${alarm.title} details`}
      >
        <header>
          <div>
            <span className="alarms-eyebrow">
              <Activity />
              Alarm intelligence
            </span>
            <h2>{alarm.title}</h2>
            <p>
              <code>{alarm.meterCode}</code> · {alarm.nodeName}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close alarm details">
            <X />
          </button>
        </header>
        <div className="alarm-drawer-status">
          <span className={cn("alarm-priority", alarm.severity)}>
            <Icon />
            {alarm.severity}
          </span>
          <LifecyclePill lifecycle={alarm.lifecycle} />
        </div>
        <section className="alarm-summary">
          <span>{categoryLabel(alarm.category)}</span>
          <p>{alarm.message}</p>
          <div>
            <Clock3 />
            <span>
              <strong>Raised {relativeTime(alarm.raisedAt)}</strong>
              <small>{formatDate(alarm.raisedAt)}</small>
            </span>
          </div>
        </section>
        <section className="alarm-context-grid">
          <div>
            <Gauge />
            <span>Source meter</span>
            <strong>{alarm.meterCode}</strong>
          </div>
          <div>
            <UserRound />
            <span>Assigned to</span>
            <strong>{alarm.assignedTo ?? "Unassigned"}</strong>
          </div>
          <div>
            <AlertTriangle />
            <span>Clear mode</span>
            <strong>{alarm.clearMode ?? "manual"}</strong>
          </div>
          <div>
            <History />
            <span>Rule</span>
            <strong>{ruleLabel(alarm.ruleId)}</strong>
          </div>
        </section>
        <section className="alarm-guidance">
          <div className="alarm-section-title">
            <span>Recommended response</span>
            <small>Operational guidance</small>
          </div>
          <ol>
            {guidance(alarm.ruleId).map((item, index) => (
              <li key={item}>
                <span className="num">{index + 1}</span>
                {item}
              </li>
            ))}
          </ol>
          <Button asChild variant="ghost" size="sm">
            <Link href="/meters">
              Inspect live meter <ArrowUpRight />
            </Link>
          </Button>
        </section>
        <section className="alarm-history">
          <div className="alarm-section-title">
            <span>Activity history</span>
            <small>{alarm.events.length} events</small>
          </div>
          {[...alarm.events].reverse().map((event) => (
            <article key={event.id}>
              <span className={cn("alarm-history-dot", event.action)} />
              <div>
                <div>
                  <strong>{event.actor}</strong>
                  <time>{relativeTime(event.at)}</time>
                </div>
                <p>{event.detail}</p>
              </div>
            </article>
          ))}
        </section>
        {canRespond ? (
          <section className="alarm-note">
            <label>
              <span>Add investigation note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Record checks, observations or next steps…"
              />
            </label>
            <Button
              size="sm"
              disabled={!note.trim()}
              onClick={() => {
                onNote(note);
                setNote("");
              }}
            >
              <MessageSquarePlus />
              Add note
            </Button>
          </section>
        ) : null}
        <footer>
          {canRespond ? (
            <>
              {!alarm.assignedTo ? (
                <Button variant="outline" onClick={onAssign}>
                  <UserRound />
                  Assign to me
                </Button>
              ) : null}
              {alarm.lifecycle === "active" ? (
                <Button onClick={onAcknowledge}>
                  <Check />
                  Acknowledge
                </Button>
              ) : alarm.lifecycle === "acknowledged" ? (
                <Button onClick={onClear}>
                  <CheckCircle2 />
                  Resolve alarm
                </Button>
              ) : (
                <Button onClick={onReopen}>
                  <BellRing />
                  Reopen
                </Button>
              )}
            </>
          ) : (
            <span className="alarm-permission-note">
              Viewer access is read only.
            </span>
          )}
        </footer>
      </aside>
    </div>
  );
}

function LifecyclePill({ lifecycle }: { lifecycle: AlarmLifecycle }) {
  return (
    <span className={cn("alarm-lifecycle", lifecycle)}>
      {lifecycle === "active" ? (
        <CircleDot />
      ) : lifecycle === "acknowledged" ? (
        <Check />
      ) : (
        <CheckCircle2 />
      )}
      {lifecycle === "cleared"
        ? "Resolved"
        : lifecycle.charAt(0).toUpperCase() + lifecycle.slice(1)}
    </span>
  );
}
function categoryLabel(value: AlarmCategory) {
  return {
    connectivity: "Connectivity",
    power_quality: "Power quality",
    compliance: "Commercial compliance",
    reverse_flow: "Reverse power flow",
    sensor_fault: "Sensor fault",
  }[value];
}
function ruleLabel(value: OperationalAlarm["ruleId"]) {
  return {
    no_data: "No data",
    ct_fault: "CT fault",
    pf_low: "Low power factor",
    reverse_flow: "Reverse flow",
    over_demand: "Over demand",
  }[value];
}
function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
function guidance(rule: OperationalAlarm["ruleId"]) {
  if (rule === "pf_low")
    return [
      "Verify the reading against the meter and recent trend.",
      "Inspect capacitor-bank stages and reactive load.",
      "Record corrective action before resolving the alarm.",
    ];
  if (rule === "ct_fault")
    return [
      "Confirm voltage is present and current remains near zero.",
      "Inspect CT wiring, polarity and terminal integrity.",
      "Restore telemetry and verify a stable packet before resolving.",
    ];
  if (rule === "reverse_flow")
    return [
      "Confirm export direction and sign convention.",
      "Check downstream solar generation and local demand.",
      "Escalate only if export exceeds the approved operating window.",
    ];
  return [
    "Inspect the source meter and communication path.",
    "Record findings and corrective action.",
    "Verify normal operation before resolving.",
  ];
}
