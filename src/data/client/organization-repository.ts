import type { Meter, MeterLiveState, OrgNode } from "@/domain";
import {
  ORGANIZATION_LIVE_STATES,
  ORGANIZATION_METERS,
  ORGANIZATION_NODES,
} from "@/data/mock/organization";

export interface OrganizationStore {
  nodes: OrgNode[];
  meters: Meter[];
  liveStates: MeterLiveState[];
  revision: number;
}

export interface OrganizationMutation {
  node: OrgNode;
  meter?: Meter;
}

export type OrganizationErrorCode =
  | "duplicate-code"
  | "duplicate-name"
  | "invalid-parent"
  | "circular-parent"
  | "protected-root"
  | "has-children"
  | "derived-dependency"
  | "not-found";

export class OrganizationValidationError extends Error {
  constructor(
    public readonly code: OrganizationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OrganizationValidationError";
  }
}

const STORAGE_KEY = "enersenx:paf-lahore:organization:v1";

export function createInitialOrganizationStore(): OrganizationStore {
  return {
    nodes: structuredClone(ORGANIZATION_NODES),
    meters: structuredClone(ORGANIZATION_METERS),
    liveStates: structuredClone(ORGANIZATION_LIVE_STATES),
    revision: 1,
  };
}

export function loadOrganizationStore(): OrganizationStore {
  if (typeof window === "undefined") return createInitialOrganizationStore();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return createInitialOrganizationStore();
  try {
    const parsed = JSON.parse(stored) as OrganizationStore;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.meters)) {
      return createInitialOrganizationStore();
    }
    return parsed;
  } catch {
    return createInitialOrganizationStore();
  }
}

export function persistOrganizationStore(store: OrganizationStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function validateMutation(
  store: OrganizationStore,
  mutation: OrganizationMutation,
  editingId?: string,
) {
  const { node, meter } = mutation;
  const normalizedName = node.name.trim().toLowerCase();
  if (
    store.nodes.some(
      (item) =>
        item.id !== editingId &&
        item.parentId === node.parentId &&
        item.name.trim().toLowerCase() === normalizedName,
    )
  ) {
    throw new OrganizationValidationError(
      "duplicate-name",
      "An asset with this name already exists under the selected parent.",
    );
  }
  if (node.parentId && !store.nodes.some((item) => item.id === node.parentId)) {
    throw new OrganizationValidationError(
      "invalid-parent",
      "The selected parent no longer exists.",
    );
  }
  if (editingId && node.parentId) {
    let cursor: string | null = node.parentId;
    while (cursor) {
      if (cursor === editingId) {
        throw new OrganizationValidationError(
          "circular-parent",
          "An asset cannot be moved beneath itself or one of its descendants.",
        );
      }
      cursor = store.nodes.find((item) => item.id === cursor)?.parentId ?? null;
    }
  }
  if (
    meter &&
    store.meters.some(
      (item) => item.nodeId !== editingId && item.code === meter.code.trim(),
    )
  ) {
    throw new OrganizationValidationError(
      "duplicate-code",
      "This meter code is already assigned to another asset.",
    );
  }
}

export function createOrganizationEntity(
  store: OrganizationStore,
  mutation: OrganizationMutation,
): OrganizationStore {
  validateMutation(store, mutation);
  return {
    ...store,
    nodes: [...store.nodes, mutation.node],
    meters: mutation.meter ? [...store.meters, mutation.meter] : store.meters,
    liveStates: mutation.meter
      ? [
          ...store.liveStates,
          { meterId: mutation.meter.id, status: "awaiting-data" },
        ]
      : store.liveStates,
    revision: store.revision + 1,
  };
}

export function updateOrganizationEntity(
  store: OrganizationStore,
  nodeId: string,
  mutation: OrganizationMutation,
): OrganizationStore {
  if (!store.nodes.some((item) => item.id === nodeId)) {
    throw new OrganizationValidationError("not-found", "Asset not found.");
  }
  validateMutation(store, mutation, nodeId);
  const existingMeter = store.meters.find((item) => item.nodeId === nodeId);
  const removedMeterId = !mutation.meter ? existingMeter?.id : undefined;
  return {
    ...store,
    nodes: store.nodes.map((item) =>
      item.id === nodeId ? mutation.node : item,
    ),
    meters: mutation.meter
      ? existingMeter
        ? store.meters.map((item) =>
            item.nodeId === nodeId ? mutation.meter! : item,
          )
        : [...store.meters, mutation.meter]
      : store.meters.filter((item) => item.nodeId !== nodeId),
    liveStates:
      mutation.meter && !existingMeter
        ? [
            ...store.liveStates,
            { meterId: mutation.meter.id, status: "awaiting-data" },
          ]
        : removedMeterId
          ? store.liveStates.filter((item) => item.meterId !== removedMeterId)
          : store.liveStates,
    revision: store.revision + 1,
  };
}

export function deleteOrganizationEntity(
  store: OrganizationStore,
  nodeId: string,
): OrganizationStore {
  const node = store.nodes.find((item) => item.id === nodeId);
  if (!node)
    throw new OrganizationValidationError("not-found", "Asset not found.");
  if (node.parentId === null) {
    throw new OrganizationValidationError(
      "protected-root",
      "The tenant root site cannot be deleted.",
    );
  }
  if (store.nodes.some((item) => item.parentId === nodeId)) {
    throw new OrganizationValidationError(
      "has-children",
      "Move or delete the child assets before deleting this asset.",
    );
  }
  const meter = store.meters.find((item) => item.nodeId === nodeId);
  if (
    meter &&
    store.meters.some((item) => item.derivation?.operands.includes(meter.code))
  ) {
    throw new OrganizationValidationError(
      "derived-dependency",
      "This meter is used by a derived calculation and cannot be deleted.",
    );
  }
  return {
    ...store,
    nodes: store.nodes.filter((item) => item.id !== nodeId),
    meters: store.meters.filter((item) => item.nodeId !== nodeId),
    liveStates: meter
      ? store.liveStates.filter((item) => item.meterId !== meter.id)
      : store.liveStates,
    revision: store.revision + 1,
  };
}

export function resetOrganizationStore() {
  window.localStorage.removeItem(STORAGE_KEY);
  return createInitialOrganizationStore();
}
