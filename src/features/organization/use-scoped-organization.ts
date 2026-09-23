"use client";

import { useMemo } from "react";
import { useShell } from "@/components/layout/shell-context";
import { useOrganization } from "./organization-provider";

export function useScopedOrganization() {
  const organization = useOrganization();
  const { accessibleNodeIds } = useShell();
  const store = useMemo(() => {
    if (accessibleNodeIds === null) return organization.store;
    const nodes = organization.store.nodes.filter((node) =>
      accessibleNodeIds.has(node.id),
    );
    const nodeIds = new Set(nodes.map((node) => node.id));
    const meters = organization.store.meters.filter((meter) =>
      nodeIds.has(meter.nodeId),
    );
    const meterIds = new Set(meters.map((meter) => meter.id));
    return {
      ...organization.store,
      nodes,
      meters,
      liveStates: organization.store.liveStates.filter((state) =>
        meterIds.has(state.meterId),
      ),
    };
  }, [accessibleNodeIds, organization.store]);
  return { ...organization, store };
}
