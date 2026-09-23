import type { Meter, MeterLiveState, OrgNode } from "@/domain";
import type { OrganizationStore } from "@/data/client/organization-repository";

export interface MeterRecord {
  meter: Meter;
  node: OrgNode;
  parent?: OrgNode;
  live?: MeterLiveState;
}

export function selectMeterRecords(store: OrganizationStore): MeterRecord[] {
  const nodes = new Map(store.nodes.map((node) => [node.id, node]));
  const live = new Map(store.liveStates.map((state) => [state.meterId, state]));
  return store.meters.flatMap((meter) => {
    const node = nodes.get(meter.nodeId);
    if (!node) return [];
    return [
      {
        meter,
        node,
        parent: nodes.get(node.parentId ?? ""),
        live: live.get(meter.id),
      },
    ];
  });
}

export function selectEnergySummary(store: OrganizationStore) {
  const records = selectMeterRecords(store);
  const physical = records.filter(({ meter }) => meter.role !== "derived");
  const reporting = records.filter(({ live }) => live?.status === "online");
  const awaiting = records.filter(
    ({ live }) => live?.status === "awaiting-data",
  );
  const faulty = records.filter(({ live }) => live?.status === "faulty");
  const activeRecords = records.filter(
    ({ meter, live }) =>
      live?.status === "online" &&
      (meter.role === "main" || meter.role === "derived") &&
      live.lastReading,
  );
  const activeLoadKw = activeRecords.reduce(
    (sum, { live }) => sum + Math.max(0, live?.lastReading?.activePowerKw ?? 0),
    0,
  );
  const exportKw = records.reduce(
    (sum, { live }) =>
      sum + Math.abs(Math.min(0, live?.lastReading?.activePowerKw ?? 0)),
    0,
  );
  const energyImportKwh = records.reduce(
    (sum, { live }) => sum + (live?.lastReading?.energyImportKwh ?? 0),
    0,
  );
  const energyExportKwh = records.reduce(
    (sum, { live }) => sum + (live?.lastReading?.energyExportKwh ?? 0),
    0,
  );
  const pfValues = records
    .map(({ live }) => live?.lastReading?.powerFactor)
    .filter((value): value is number => value !== undefined);
  const averagePf = pfValues.length
    ? pfValues.reduce((sum, value) => sum + value, 0) / pfValues.length
    : 0;

  return {
    records,
    physicalCount: physical.length,
    reportingCount: reporting.length,
    awaitingCount: awaiting.length,
    faultyCount: faulty.length,
    activeLoadKw,
    exportKw,
    energyImportKwh,
    energyExportKwh,
    averagePf,
  };
}

export function findRecordByCode(store: OrganizationStore, code: string) {
  return selectMeterRecords(store).find(({ meter }) => meter.code === code);
}
