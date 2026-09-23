"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  Edit3,
  Network,
  Plus,
  Radio,
  RotateCcw,
  Search,
  Sigma,
  Trash2,
  X,
} from "lucide-react";
import type {
  Meter,
  MeterClass,
  MeterStatus,
  NodeType,
  OrgNode,
  Transport,
} from "@/domain";
import {
  OrganizationValidationError,
  type OrganizationMutation,
} from "@/data/client/organization-repository";
import { useShell } from "@/components/layout/shell-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useOrganization } from "./organization-provider";

type Filter = "all" | MeterStatus | Transport | MeterClass | "derived";

export function OrganizationWorkspace() {
  const { store, ready, create, update, remove, reset } = useOrganization();
  const { role, canManageOrganization } = useShell();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState(
    () => new Set(["lahore-site", "tech-area", "nastp-delta", "qureshi-camp"]),
  );
  const [selectedId, setSelectedId] = useState("lahore-site");
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    node?: OrgNode;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgNode | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const metersByNode = useMemo(
    () => new Map(store.meters.map((meter) => [meter.nodeId, meter])),
    [store.meters],
  );
  const liveByMeter = useMemo(
    () => new Map(store.liveStates.map((state) => [state.meterId, state])),
    [store.liveStates],
  );
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, OrgNode[]>();
    for (const node of store.nodes)
      map.set(node.parentId, [...(map.get(node.parentId) ?? []), node]);
    return map;
  }, [store.nodes]);

  const matches = useCallback(
    (node: OrgNode) => {
      const meter = metersByNode.get(node.id);
      const live = meter ? liveByMeter.get(meter.id) : undefined;
      const text = `${node.name} ${meter?.code ?? ""}`.toLowerCase();
      if (query && !text.includes(query.toLowerCase())) return false;
      if (filter === "all") return true;
      if (filter === "derived") return meter?.role === "derived";
      if (filter === "HT" || filter === "LT") return meter?.class === filter;
      if (filter === "wifi" || filter === "modbus" || filter === "lorawan")
        return meter?.transport === filter;
      return live?.status === filter;
    },
    [filter, liveByMeter, metersByNode, query],
  );

  const visibleIds = useMemo(() => {
    if (!query && filter === "all") return null;
    const ids = new Set<string>();
    for (const node of store.nodes) {
      if (!matches(node)) continue;
      let cursor: OrgNode | undefined = node;
      while (cursor) {
        ids.add(cursor.id);
        cursor = store.nodes.find((item) => item.id === cursor?.parentId);
      }
    }
    return ids;
  }, [filter, matches, query, store.nodes]);

  const selected =
    store.nodes.find((node) => node.id === selectedId) ?? store.nodes[0];
  const selectedMeter = selected ? metersByNode.get(selected.id) : undefined;
  const selectedLive = selectedMeter
    ? liveByMeter.get(selectedMeter.id)
    : undefined;

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const showMessage = (tone: "success" | "error", text: string) => {
    setMessage({ tone, text });
    window.setTimeout(() => setMessage(null), 3200);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    try {
      remove(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedId("lahore-site");
      showMessage("success", "Asset removed from the organization.");
    } catch (error) {
      showMessage(
        "error",
        error instanceof Error ? error.message : "Unable to delete asset.",
      );
      setDeleteTarget(null);
    }
  };

  if (!ready) return <OrganizationSkeleton />;

  return (
    <div className="organization-page mx-auto max-w-[1680px]">
      <section className="organization-heading">
        <div>
          <div className="organization-eyebrow">
            <Network />
            Hierarchy source
          </div>
          <h1>Organization structure</h1>
          <p>
            One operational model for every area, meter, calculation and
            downstream view.
          </p>
        </div>
        <div className="organization-heading-actions">
          <Badge tone="var(--status-online)">
            <Radio className="size-3" />
            {
              store.liveStates.filter((item) => item.status === "online").length
            }{" "}
            reporting
          </Badge>
          {canManageOrganization ? (
            <Button onClick={() => setEditor({ mode: "create" })}>
              <Plus />
              Add asset
            </Button>
          ) : (
            <Badge variant="outline">{role} · read only</Badge>
          )}
        </div>
      </section>

      <section className="organization-summary">
        <div>
          <span>Assets</span>
          <strong className="num">{store.nodes.length}</strong>
          <small>1 root site</small>
        </div>
        <div>
          <span>Physical meters</span>
          <strong className="num">
            {store.meters.filter((item) => item.role !== "derived").length}
          </strong>
          <small>HT and LT combined</small>
        </div>
        <div>
          <span>Derived points</span>
          <strong className="num">
            {store.meters.filter((item) => item.role === "derived").length}
          </strong>
          <small>Formula-backed</small>
        </div>
        <div>
          <span>Needs attention</span>
          <strong className="num text-warning">
            {
              store.liveStates.filter(
                (item) => item.status === "faulty" || item.status === "stale",
              ).length
            }
          </strong>
          <small>Faulty or stale</small>
        </div>
      </section>

      <div className="organization-layout">
        <Card className="organization-tree-card">
          <div className="organization-toolbar">
            <label className="organization-search">
              <Search />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by asset or meter code"
              />
              {query ? (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X />
                </button>
              ) : null}
            </label>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              aria-label="Filter organization"
            >
              <option value="all">All assets</option>
              <option value="online">Online</option>
              <option value="faulty">Faulty</option>
              <option value="awaiting-data">Awaiting data</option>
              <option value="modbus">Modbus</option>
              <option value="wifi">Wi-Fi</option>
              <option value="lorawan">LoRaWAN</option>
              <option value="HT">HT meters</option>
              <option value="LT">LT meters</option>
              <option value="derived">Derived points</option>
            </select>
            {canManageOrganization ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (
                    window.confirm(
                      "Reset all organization changes to the PAF reference structure?",
                    )
                  ) {
                    reset();
                    setSelectedId("lahore-site");
                    showMessage(
                      "success",
                      "Organization reset to reference data.",
                    );
                  }
                }}
              >
                <RotateCcw />
                Reset
              </Button>
            ) : null}
          </div>
          <div className="organization-tree-header">
            <span>Asset hierarchy</span>
            <span>Meter & transport</span>
            <span>Live state</span>
            <span>Reading</span>
          </div>
          <div className="organization-tree" role="tree">
            {(childrenByParent.get(null) ?? []).map((node) => (
              <TreeBranch
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                expanded={expanded}
                visibleIds={visibleIds}
                childrenByParent={childrenByParent}
                metersByNode={metersByNode}
                liveByMeter={liveByMeter}
                onSelect={setSelectedId}
                onToggle={toggle}
              />
            ))}
            {visibleIds?.size === 0 ? (
              <div className="organization-empty">
                <Search />
                <strong>No matching assets</strong>
                <p>Try a different name, code or filter.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        {selected ? (
          <aside className="organization-inspector">
            <div className="organization-inspector-head">
              <span
                className={cn(
                  "organization-type-icon",
                  selectedMeter?.role === "derived" && "derived",
                )}
              >
                {selectedMeter?.role === "derived" ? <Sigma /> : <Building2 />}
              </span>
              <div>
                <small>
                  {selected.type}{" "}
                  {selectedMeter ? `· ${selectedMeter.role} meter` : ""}
                </small>
                <h2>{selected.name}</h2>
                <p>{selectedMeter?.code ?? "Organizational group"}</p>
              </div>
            </div>
            <div className="organization-reading">
              <span>Current reading</span>
              <strong className="num">
                {selectedLive?.lastReading
                  ? `${selectedLive.lastReading.activePowerKw} kW`
                  : "No data"}
              </strong>
              <small>{statusLabel(selectedLive?.status)}</small>
            </div>
            <dl className="organization-details">
              <div>
                <dt>Parent</dt>
                <dd>
                  {store.nodes.find((item) => item.id === selected.parentId)
                    ?.name ?? "Root tenant"}
                </dd>
              </div>
              <div>
                <dt>Meter class</dt>
                <dd>{selectedMeter?.class ?? "—"}</dd>
              </div>
              <div>
                <dt>Transport</dt>
                <dd>
                  {selectedMeter
                    ? transportLabel(selectedMeter.transport)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Nominal voltage</dt>
                <dd>
                  {selectedMeter
                    ? `${selectedMeter.nominalVoltage >= 1000 ? selectedMeter.nominalVoltage / 1000 : selectedMeter.nominalVoltage} ${selectedMeter.nominalVoltage >= 1000 ? "kV" : "V"}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Power factor</dt>
                <dd
                  className={cn(
                    selectedLive?.lastReading?.powerFactor &&
                      selectedLive.lastReading.powerFactor < 0.9 &&
                      "text-warning",
                  )}
                >
                  {selectedLive?.lastReading?.powerFactor?.toFixed(3) ?? "—"}
                </dd>
              </div>
              <div>
                <dt>Last packet</dt>
                <dd>{selectedLive?.lastReadingAt ? "8 sec ago" : "Never"}</dd>
              </div>
            </dl>
            {selectedMeter?.derivation ? (
              <div className="organization-formula">
                <Sigma />
                <div>
                  <span>Derived calculation</span>
                  <strong>
                    {selectedMeter.derivation.operands.join(" − ")}
                  </strong>
                  <small>
                    Computed automatically and protected from manual readings.
                  </small>
                </div>
              </div>
            ) : null}
            <div className="organization-inspector-actions">
              {canManageOrganization ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditor({ mode: "edit", node: selected })}
                  >
                    <Edit3 />
                    Edit asset
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-critical"
                    onClick={() => setDeleteTarget(selected)}
                    disabled={selected.parentId === null}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </>
              ) : (
                <div className="organization-readonly">
                  <Check />
                  You have read-only access to organization configuration.
                </div>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {editor ? (
        <AssetEditor
          mode={editor.mode}
          existing={editor.node}
          nodes={store.nodes}
          meters={store.meters}
          onClose={() => setEditor(null)}
          onSave={(mutation) => {
            try {
              if (editor.mode === "edit" && editor.node)
                update(editor.node.id, mutation);
              else create(mutation);
              setEditor(null);
              setSelectedId(mutation.node.id);
              setExpanded((current) =>
                new Set(current).add(mutation.node.parentId ?? "lahore-site"),
              );
              showMessage(
                "success",
                editor.mode === "edit"
                  ? "Asset changes saved."
                  : "Asset added to the organization.",
              );
            } catch (error) {
              throw error;
            }
          }}
        />
      ) : null}
      {deleteTarget ? (
        <div className="dialog-backdrop">
          <div className="confirm-dialog" role="alertdialog">
            <span className="confirm-dialog-icon">
              <AlertTriangle />
            </span>
            <h2>Delete {deleteTarget.name}?</h2>
            <p>
              This removes its configuration and meter assignment. Historical
              operational records should remain immutable in a production
              backend.
            </p>
            <div>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete asset
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {message ? (
        <div className={cn("organization-toast", message.tone)}>
          {message.tone === "success" ? <Check /> : <AlertTriangle />}
          {message.text}
        </div>
      ) : null}
    </div>
  );
}

function TreeBranch({
  node,
  depth,
  selectedId,
  expanded,
  visibleIds,
  childrenByParent,
  metersByNode,
  liveByMeter,
  onSelect,
  onToggle,
}: {
  node: OrgNode;
  depth: number;
  selectedId: string;
  expanded: Set<string>;
  visibleIds: Set<string> | null;
  childrenByParent: Map<string | null, OrgNode[]>;
  metersByNode: Map<string, Meter>;
  liveByMeter: Map<
    string,
    {
      status: MeterStatus;
      lastReading?: { activePowerKw: number; powerFactor?: number };
    }
  >;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  if (visibleIds && !visibleIds.has(node.id)) return null;
  const children = childrenByParent.get(node.id) ?? [];
  const meter = metersByNode.get(node.id);
  const live = meter ? liveByMeter.get(meter.id) : undefined;
  const open = expanded.has(node.id) || visibleIds !== null;
  return (
    <>
      {
        <button
          role="treeitem"
          aria-expanded={children.length ? open : undefined}
          aria-selected={selectedId === node.id}
          className={cn(
            "organization-row",
            selectedId === node.id && "selected",
            meter?.role === "derived" && "derived",
          )}
          onClick={() => onSelect(node.id)}
        >
          <span
            className="organization-row-name"
            style={{ paddingLeft: `${depth * 24 + 10}px` }}
          >
            {children.length ? (
              <span
                className="tree-toggle"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle(node.id);
                }}
              >
                {open ? <ChevronDown /> : <ChevronRight />}
              </span>
            ) : (
              <span className="tree-spacer" />
            )}
            {meter?.role === "derived" ? (
              <Sigma />
            ) : depth === 0 ? (
              <Network />
            ) : (
              <Building2 />
            )}
            <span>
              <strong>{node.name}</strong>
              <small>{node.type}</small>
            </span>
          </span>
          <span className="organization-meter-cell">
            {meter ? (
              <>
                <code>{meter.code}</code>
                <small>
                  {meter.class} · {transportLabel(meter.transport)}
                </small>
              </>
            ) : (
              <small>Organizational group</small>
            )}
          </span>
          <span>
            <StatusPill
              status={live?.status}
              derived={meter?.role === "derived"}
            />
          </span>
          <span className="organization-row-reading">
            <strong className="num">
              {live?.lastReading ? `${live.lastReading.activePowerKw} kW` : "—"}
            </strong>
            {live?.lastReading?.powerFactor !== undefined ? (
              <small
                className={cn(
                  live.lastReading.powerFactor < 0.9 && "text-warning",
                )}
              >
                PF {live.lastReading.powerFactor.toFixed(2)}
              </small>
            ) : null}
          </span>
        </button>
      }
      {open
        ? children.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expanded={expanded}
              visibleIds={visibleIds}
              childrenByParent={childrenByParent}
              metersByNode={metersByNode}
              liveByMeter={liveByMeter}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))
        : null}
    </>
  );
}

function StatusPill({
  status,
  derived,
}: {
  status?: MeterStatus;
  derived?: boolean;
}) {
  if (derived)
    return (
      <span className="organization-status derived">
        <Sigma />
        Derived
      </span>
    );
  const value = status ?? "awaiting-data";
  return (
    <span className={cn("organization-status", value)}>
      <i />
      {statusLabel(value)}
    </span>
  );
}
function statusLabel(status?: MeterStatus) {
  return status === "awaiting-data" || !status
    ? "Awaiting data"
    : status.charAt(0).toUpperCase() + status.slice(1);
}
function transportLabel(value: Transport) {
  return value === "lorawan"
    ? "LoRaWAN"
    : value === "wifi"
      ? "Wi-Fi"
      : "Modbus";
}

function AssetEditor({
  mode,
  existing,
  nodes,
  meters,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  existing?: OrgNode;
  nodes: OrgNode[];
  meters: Meter[];
  onClose: () => void;
  onSave: (mutation: OrganizationMutation) => void;
}) {
  const existingMeter = existing
    ? meters.find((item) => item.nodeId === existing.id)
    : undefined;
  const [name, setName] = useState(existing?.name ?? "");
  const [type, setType] = useState<NodeType>(existing?.type ?? "feeder");
  const [parentId, setParentId] = useState(existing?.parentId ?? "lahore-site");
  const [hasMeter, setHasMeter] = useState(Boolean(existingMeter) || !existing);
  const [code, setCode] = useState(existingMeter?.code ?? "");
  const [meterClass, setMeterClass] = useState<MeterClass>(
    existingMeter?.class ?? "HT",
  );
  const [transport, setTransport] = useState<Transport>(
    existingMeter?.transport ?? "modbus",
  );
  const [error, setError] = useState<string | null>(null);
  const derived = existingMeter?.role === "derived";
  const submit = () => {
    if (!name.trim()) return setError("Asset name is required.");
    if (hasMeter && !code.trim())
      return setError("Meter code is required when a meter is assigned.");
    const nodeId = existing?.id ?? crypto.randomUUID();
    const node: OrgNode = {
      id: nodeId,
      tenantId: "paf-lahore",
      parentId: type === "site" ? null : parentId,
      name: name.trim(),
      type,
      isGridBoundary: existing?.isGridBoundary ?? false,
    };
    const meter: Meter | undefined = hasMeter
      ? {
          id: existingMeter?.id ?? crypto.randomUUID(),
          code: code.trim().toUpperCase(),
          nodeId,
          class: meterClass,
          transport,
          role: existingMeter?.role ?? "sub",
          nominalVoltage: meterClass === "HT" ? 11000 : 400,
          derivation: existingMeter?.derivation,
        }
      : undefined;
    try {
      onSave({ node, meter });
    } catch (caught) {
      setError(
        caught instanceof OrganizationValidationError
          ? caught.message
          : "Unable to save this asset.",
      );
    }
  };
  return (
    <div className="dialog-backdrop">
      <div className="asset-editor" role="dialog" aria-modal="true">
        <header>
          <div>
            <small>
              {mode === "create" ? "New hierarchy item" : "Edit configuration"}
            </small>
            <h2>{mode === "create" ? "Add asset" : existing?.name}</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        <div className="asset-editor-body">
          {derived ? (
            <div className="editor-notice">
              <Sigma />
              Derived points keep their calculation and cannot be converted to
              physical meters.
            </div>
          ) : null}
          <label>
            <span>Asset name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </label>
          <div className="editor-grid">
            <label>
              <span>Entity type</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as NodeType)}
                disabled={existing?.parentId === null}
              >
                <option value="site">Site</option>
                <option value="zone">Area / zone</option>
                <option value="building">Building</option>
                <option value="feeder">Feeder</option>
              </select>
            </label>
            <label>
              <span>Parent</span>
              <select
                value={parentId ?? ""}
                onChange={(event) => setParentId(event.target.value)}
                disabled={type === "site"}
              >
                <option value="">No parent</option>
                {nodes
                  .filter((item) => item.id !== existing?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="editor-checkbox">
            <input
              type="checkbox"
              checked={hasMeter}
              onChange={(event) => setHasMeter(event.target.checked)}
              disabled={derived}
            />
            <span>
              <strong>Attach a meter</strong>
              <small>Create a telemetry point for this asset.</small>
            </span>
          </label>
          {hasMeter ? (
            <div className="editor-meter-fields">
              <label>
                <span>Meter code</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="e.g. TA-HT-02"
                  disabled={derived}
                />
              </label>
              <div className="editor-grid">
                <label>
                  <span>Meter class</span>
                  <select
                    value={meterClass}
                    onChange={(event) =>
                      setMeterClass(event.target.value as MeterClass)
                    }
                    disabled={derived}
                  >
                    <option value="HT">HT · 11 kV</option>
                    <option value="LT">LT · 400 V</option>
                  </select>
                </label>
                <label>
                  <span>Transport</span>
                  <select
                    value={transport}
                    onChange={(event) =>
                      setTransport(event.target.value as Transport)
                    }
                    disabled={derived}
                  >
                    <option value="modbus">Modbus</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="lorawan">LoRaWAN</option>
                  </select>
                </label>
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="editor-error">
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
            {mode === "create" ? "Add asset" : "Save changes"}
          </Button>
        </footer>
      </div>
    </div>
  );
}

function OrganizationSkeleton() {
  return (
    <div className="organization-skeleton">
      <div />
      <div />
      <div />
    </div>
  );
}
