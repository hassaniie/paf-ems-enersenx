"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Gauge,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type {
  EnergyQuota,
  QuotaApproval,
  QuotaHealth,
} from "@/data/client/quota-repository";
import { quotaHealth } from "@/data/client/quota-repository";
import { useOrganization } from "@/features/organization/organization-provider";
import { useShell } from "@/components/layout/shell-context";
import {
  MetricRibbon,
  type MetricRibbonItem,
} from "@/components/primitives/metric-ribbon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEnergy } from "@/domain";
import { cn } from "@/lib/cn";
import { useQuotas } from "./quota-provider";

type QuotaFilter = "all" | QuotaHealth | QuotaApproval | "unconfigured";

export function QuotasWorkspace() {
  const { store, ready, save, transition, remove } = useQuotas();
  const { store: organization } = useOrganization();
  const { role, can } = useShell();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuotaFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EnergyQuota | "new" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const canManage = can("quotas.manage");
  const nodes = useMemo(
    () => new Map(organization.nodes.map((node) => [node.id, node])),
    [organization.nodes],
  );
  const rows = useMemo(
    () =>
      store.quotas
        .map((quota) => ({
          quota,
          node: nodes.get(quota.scopeNodeId),
          pacing: quotaHealth(quota),
        }))
        .filter(({ quota, node, pacing }) => {
          const text = `${node?.name ?? ""} ${quota.owner}`.toLowerCase();
          if (query && !text.includes(query.toLowerCase())) return false;
          if (filter === "all") return true;
          if (["draft", "pending", "approved", "rejected"].includes(filter))
            return quota.approval === filter;
          return pacing.health === filter;
        }),
    [filter, nodes, query, store.quotas],
  );
  const selected = store.quotas.find((quota) => quota.id === selectedId);
  const site = store.quotas.find(
    (quota) => quota.scopeNodeId === "lahore-site",
  )!;
  const sitePacing = quotaHealth(site);
  const pending = store.quotas.filter(
    (quota) => quota.approval === "pending",
  ).length;
  const risks = store.quotas.filter((quota) =>
    ["projected-overrun", "exceeded"].includes(quotaHealth(quota).health),
  ).length;
  const metrics: MetricRibbonItem[] = [
    {
      label: "Site allocation",
      value: formatEnergy(site.limitKwh).split(" ")[0]!,
      unit: formatEnergy(site.limitKwh).split(" ")[1],
      note: "Approved September quota",
      tone: "neutral",
    },
    {
      label: "Consumed",
      value: sitePacing.usedPct.toFixed(1),
      unit: "%",
      note: `${formatEnergy(sitePacing.remainingKwh)} remaining`,
      tone: sitePacing.usedPct > 85 ? "warning" : "good",
    },
    {
      label: "Forecast",
      value: sitePacing.forecastPct.toFixed(0),
      unit: "%",
      note: `${formatEnergy(sitePacing.forecastKwh)} projected`,
      tone: sitePacing.forecastPct > 100 ? "warning" : "good",
    },
    {
      label: "At risk",
      value: String(risks),
      note: "Projected overrun or exceeded",
      tone: risks ? "warning" : "good",
    },
    {
      label: "Pending approval",
      value: String(pending),
      note: "Awaiting command decision",
      tone: pending ? "info" : "neutral",
    },
  ];
  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2800);
  };
  if (!ready)
    return (
      <div className="quotas-loading">
        <div />
        <div />
        <div />
      </div>
    );
  return (
    <div className="quotas-page mx-auto max-w-[1680px]">
      <section className="quotas-heading">
        <div>
          <div className="quotas-eyebrow">
            <Target />
            Allocation control
          </div>
          <h1>Keep every area inside its energy envelope.</h1>
          <p>
            Allocate, monitor and approve consumption limits before pacing
            becomes an overrun.
          </p>
        </div>
        <div className="quotas-heading-actions">
          <Badge tone={risks ? "var(--sev-warning)" : "var(--status-online)"}>
            {risks ? <AlertTriangle /> : <ShieldCheck />}
            {risks ? `${risks} allocations at risk` : "All allocations on plan"}
          </Badge>
          {canManage ? (
            <Button onClick={() => setEditor("new")}>
              <Plus />
              New quota
            </Button>
          ) : (
            <Badge tone="var(--text-tertiary)">{role} · Read only</Badge>
          )}
        </div>
      </section>
      <MetricRibbon items={metrics} label="Quota summary" />
      <section className="quota-site-progress">
        <div className="quota-progress-copy">
          <span>September site pacing</span>
          <strong>
            {formatEnergy(site.consumedKwh)} of {formatEnergy(site.limitKwh)}
          </strong>
          <small>
            Day 23 of 30 · {formatEnergy(sitePacing.dailyBurnKwh)} daily burn
          </small>
        </div>
        <div className="quota-progress-track">
          <i style={{ width: `${Math.min(100, sitePacing.usedPct)}%` }} />
          <span style={{ left: `${(23 / 30) * 100}%` }} />
        </div>
        <div className="quota-progress-forecast">
          <TrendingUp />
          <span>
            <small>Forecast at month end</small>
            <strong>{formatEnergy(sitePacing.forecastKwh)}</strong>
          </span>
        </div>
      </section>
      <div className="quota-layout">
        <Card className="quota-list-card">
          <div className="quota-toolbar">
            <label>
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search area or owner"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear quota search"
                >
                  <X />
                </button>
              ) : null}
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as QuotaFilter)}
            >
              <option value="all">All allocations</option>
              <option value="healthy">Healthy</option>
              <option value="watch">Watch</option>
              <option value="projected-overrun">Projected overrun</option>
              <option value="exceeded">Exceeded</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="quota-list-head">
            <span>Area & owner</span>
            <span>Allocation</span>
            <span>Consumption</span>
            <span>Forecast</span>
            <span>Approval</span>
            <span />
          </div>
          <div className="quota-list">
            {rows.map(({ quota, node, pacing }) => (
              <button
                key={quota.id}
                className={cn(
                  "quota-row",
                  selectedId === quota.id && "selected",
                )}
                onClick={() => setSelectedId(quota.id)}
              >
                <span className="quota-identity">
                  <HealthIcon health={pacing.health} />
                  <span>
                    <strong>{node?.name ?? quota.scopeNodeId}</strong>
                    <small>{quota.owner}</small>
                  </span>
                </span>
                <span className="quota-value">
                  <strong>{formatEnergy(quota.limitKwh)}</strong>
                  <small>monthly quota</small>
                </span>
                <span className="quota-consumption">
                  <span>
                    <i style={{ width: `${Math.min(100, pacing.usedPct)}%` }} />
                  </span>
                  <strong className="num">{pacing.usedPct.toFixed(1)}%</strong>
                </span>
                <span
                  className={cn(
                    "quota-forecast",
                    pacing.forecastPct > 100 && "risk",
                  )}
                >
                  <strong className="num">
                    {pacing.forecastPct.toFixed(0)}%
                  </strong>
                  <small>{formatEnergy(pacing.forecastKwh)}</small>
                </span>
                <ApprovalPill approval={quota.approval} />
                <ChevronRight />
              </button>
            ))}
            {!rows.length ? (
              <div className="quotas-empty">
                <Search />
                <strong>No matching allocations</strong>
                <p>Try another search or quota state.</p>
                <Button
                  size="sm"
                  variant="outline"
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
          <QuotaInspector
            quota={selected}
            name={nodes.get(selected.scopeNodeId)?.name ?? selected.scopeNodeId}
            canManage={canManage}
            onEdit={() => setEditor(selected)}
            onTransition={(approval, reason) => {
              transition(selected.id, approval, reason);
              notify(`Quota ${approval}.`);
            }}
            onDelete={() => {
              try {
                if (window.confirm("Delete this draft quota?")) {
                  remove(selected.id);
                  setSelectedId(null);
                  notify("Draft quota deleted.");
                }
              } catch (error) {
                notify(
                  error instanceof Error
                    ? error.message
                    : "Unable to delete quota.",
                );
              }
            }}
          />
        ) : (
          <QuotaQueue
            quotas={store.quotas}
            names={nodes}
            onSelect={setSelectedId}
          />
        )}
      </div>
      {editor ? (
        <QuotaEditor
          existing={editor === "new" ? undefined : editor}
          nodes={organization.nodes}
          usedScopes={store.quotas.map((quota) => quota.scopeNodeId)}
          onClose={() => setEditor(null)}
          onSave={(quota, reason) => {
            try {
              save(quota, reason);
              setEditor(null);
              setSelectedId(quota.id);
              notify("Quota allocation saved.");
            } catch (error) {
              throw error;
            }
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

function QuotaInspector({
  quota,
  name,
  canManage,
  onEdit,
  onTransition,
  onDelete,
}: {
  quota: EnergyQuota;
  name: string;
  canManage: boolean;
  onEdit: () => void;
  onTransition: (approval: QuotaApproval, reason?: string) => void;
  onDelete: () => void;
}) {
  const pacing = quotaHealth(quota);
  return (
    <aside className="quota-inspector">
      <header>
        <div>
          <span>Allocation detail</span>
          <h2>{name}</h2>
          <p>{quota.owner} · September 2026</p>
        </div>
        <HealthPill health={pacing.health} />
      </header>
      <section className="quota-inspector-hero">
        <span>Monthly allocation</span>
        <strong>{formatEnergy(quota.limitKwh)}</strong>
        <p>
          {formatEnergy(pacing.remainingKwh)} remaining at the current reading
        </p>
      </section>
      <section className="quota-detail-grid">
        <div>
          <Zap />
          <span>Consumed</span>
          <strong>{formatEnergy(quota.consumedKwh)}</strong>
        </div>
        <div>
          <TrendingUp />
          <span>Forecast</span>
          <strong>{formatEnergy(pacing.forecastKwh)}</strong>
        </div>
        <div>
          <Gauge />
          <span>Daily burn</span>
          <strong>{formatEnergy(pacing.dailyBurnKwh)}</strong>
        </div>
        <div>
          <CircleGauge />
          <span>Forecast variance</span>
          <strong>{(pacing.forecastPct - 100).toFixed(1)}%</strong>
        </div>
      </section>
      {quota.note ? (
        <div className="quota-note">
          <strong>Allocation note</strong>
          <p>{quota.note}</p>
        </div>
      ) : null}
      <section className="quota-history">
        <div>
          <span>Approval history</span>
          <small>{quota.events.length} events</small>
        </div>
        {[...quota.events].reverse().map((event) => (
          <article key={event.id}>
            <i />
            <span>
              <strong>{event.actor}</strong>
              <small>{event.detail}</small>
            </span>
            <time>{event.action}</time>
          </article>
        ))}
      </section>
      {canManage ? (
        <footer>
          <Button variant="outline" onClick={onEdit}>
            <Pencil />
            Adjust
          </Button>
          {quota.approval === "draft" ? (
            <Button onClick={() => onTransition("pending")}>
              <Send />
              Submit
            </Button>
          ) : quota.approval === "pending" ? (
            <>
              <Button onClick={() => onTransition("approved")}>
                <Check />
                Approve
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  onTransition("rejected", "Returned for allocation review.")
                }
              >
                <XCircle />
                Reject
              </Button>
            </>
          ) : quota.approval === "rejected" ? (
            <Button onClick={() => onTransition("draft")}>
              <Pencil />
              Revise
            </Button>
          ) : null}
          {quota.approval !== "approved" ? (
            <Button
              variant="ghost"
              className="text-critical"
              onClick={onDelete}
            >
              <Trash2 />
              Delete
            </Button>
          ) : null}
        </footer>
      ) : null}
    </aside>
  );
}
function QuotaQueue({
  quotas,
  names,
  onSelect,
}: {
  quotas: EnergyQuota[];
  names: Map<string, { name: string }>;
  onSelect: (id: string) => void;
}) {
  const priority = quotas
    .filter(
      (quota) =>
        quota.approval === "pending" ||
        ["projected-overrun", "exceeded"].includes(quotaHealth(quota).health),
    )
    .slice(0, 4);
  return (
    <aside className="quota-queue">
      <header>
        <span>Command queue</span>
        <h2>Decisions and risks</h2>
        <p>Select an allocation to review pacing and approval history.</p>
      </header>
      {priority.map((quota) => (
        <button key={quota.id} onClick={() => onSelect(quota.id)}>
          <HealthIcon health={quotaHealth(quota).health} />
          <span>
            <strong>
              {names.get(quota.scopeNodeId)?.name ?? quota.scopeNodeId}
            </strong>
            <small>
              {quota.approval === "pending"
                ? "Awaiting approval"
                : `${quotaHealth(quota).forecastPct.toFixed(0)}% forecast`}
            </small>
          </span>
          <ChevronRight />
        </button>
      ))}
      {!priority.length ? (
        <div className="quota-all-clear">
          <CheckCircle2 />
          <strong>No decisions pending</strong>
          <p>All approved allocations are pacing within plan.</p>
        </div>
      ) : null}
    </aside>
  );
}
function QuotaEditor({
  existing,
  nodes,
  usedScopes,
  onClose,
  onSave,
}: {
  existing?: EnergyQuota;
  nodes: { id: string; name: string; type: string }[];
  usedScopes: string[];
  onClose: () => void;
  onSave: (quota: EnergyQuota, reason: string) => void;
}) {
  const [scope, setScope] = useState(
    existing?.scopeNodeId ??
      nodes.find((node) => !usedScopes.includes(node.id))?.id ??
      "",
  );
  const [limit, setLimit] = useState(String(existing?.limitKwh ?? 50000));
  const [owner, setOwner] = useState(existing?.owner ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    try {
      if (!owner.trim()) throw new Error("Quota owner is required.");
      onSave(
        {
          id: existing?.id ?? crypto.randomUUID(),
          scopeNodeId: scope,
          period: "2026-09",
          limitKwh: Number(limit),
          consumedKwh: existing?.consumedKwh ?? 0,
          approval:
            existing?.approval === "approved"
              ? "pending"
              : (existing?.approval ?? "draft"),
          owner: owner.trim(),
          note: note.trim(),
          events: existing?.events ?? [],
        },
        reason,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save quota.",
      );
    }
  };
  return (
    <div className="quota-editor-backdrop">
      <section className="quota-editor">
        <header>
          <div>
            <span>{existing ? "Allocation adjustment" : "New allocation"}</span>
            <h2>{existing ? "Adjust energy quota" : "Create energy quota"}</h2>
          </div>
          <button onClick={onClose} aria-label="Close quota editor">
            <X />
          </button>
        </header>
        <div className="quota-editor-body">
          <label>
            <span>Scope</span>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              disabled={Boolean(existing)}
            >
              {nodes
                .filter(
                  (node) =>
                    existing?.scopeNodeId === node.id ||
                    !usedScopes.includes(node.id),
                )
                .map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} · {node.type}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Monthly quota (kWh)</span>
            <input
              type="number"
              min="1"
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </label>
          <label>
            <span>Responsible owner</span>
            <input
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              placeholder="Area energy officer"
            />
          </label>
          <label>
            <span>Operational note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Context, constraints or assumptions…"
            />
          </label>
          <label>
            <span>{existing ? "Adjustment reason" : "Creation reason"}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Required for the audit trail…"
            />
          </label>
          {existing?.approval === "approved" ? (
            <div className="quota-editor-notice">
              <Clock3 />
              Changing an approved quota returns it to pending approval.
            </div>
          ) : null}
          {error ? (
            <div className="quota-editor-error">
              <AlertTriangle />
              {error}
            </div>
          ) : null}
        </div>
        <footer>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {existing ? "Save adjustment" : "Create draft"}
          </Button>
        </footer>
      </section>
    </div>
  );
}
function HealthIcon({ health }: { health: QuotaHealth }) {
  const Icon =
    health === "healthy"
      ? CheckCircle2
      : health === "watch"
        ? Clock3
        : AlertTriangle;
  return (
    <span className={cn("quota-health-icon", health)}>
      <Icon />
    </span>
  );
}
function HealthPill({ health }: { health: QuotaHealth }) {
  return (
    <span className={cn("quota-health-pill", health)}>
      <i />
      {health === "projected-overrun"
        ? "Projected overrun"
        : health.charAt(0).toUpperCase() + health.slice(1)}
    </span>
  );
}
function ApprovalPill({ approval }: { approval: QuotaApproval }) {
  return (
    <span className={cn("quota-approval", approval)}>
      {approval === "approved" ? (
        <Check />
      ) : approval === "pending" ? (
        <Clock3 />
      ) : approval === "rejected" ? (
        <XCircle />
      ) : (
        <Pencil />
      )}
      {approval}
    </span>
  );
}
