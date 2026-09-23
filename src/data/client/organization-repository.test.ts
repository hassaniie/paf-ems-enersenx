import { describe, expect, it } from "vitest";
import {
  createInitialOrganizationStore,
  createOrganizationEntity,
  deleteOrganizationEntity,
  updateOrganizationEntity,
} from "./organization-repository";

describe("organization repository", () => {
  it("creates a valid asset and pending telemetry state", () => {
    const store = createInitialOrganizationStore();
    const next = createOrganizationEntity(store, {
      node: {
        id: "new-feeder",
        tenantId: "paf-lahore",
        parentId: "tech-area",
        name: "New Feeder",
        type: "feeder",
        isGridBoundary: false,
      },
      meter: {
        id: "m-new",
        code: "NF-HT-01",
        nodeId: "new-feeder",
        class: "HT",
        transport: "modbus",
        role: "sub",
        nominalVoltage: 11000,
      },
    });

    expect(next.nodes).toHaveLength(store.nodes.length + 1);
    expect(next.liveStates.at(-1)).toEqual({
      meterId: "m-new",
      status: "awaiting-data",
    });
  });

  it("rejects duplicate meter codes", () => {
    const store = createInitialOrganizationStore();
    expect(() =>
      createOrganizationEntity(store, {
        node: {
          id: "duplicate-meter",
          tenantId: "paf-lahore",
          parentId: "lahore-site",
          name: "Duplicate Meter",
          type: "feeder",
          isGridBoundary: false,
        },
        meter: { ...store.meters[0]!, nodeId: "duplicate-meter" },
      }),
    ).toThrow("already assigned");
  });

  it("prevents circular hierarchy moves", () => {
    const store = createInitialOrganizationStore();
    const techArea = store.nodes.find((node) => node.id === "tech-area")!;
    expect(() =>
      updateOrganizationEntity(store, techArea.id, {
        node: { ...techArea, parentId: "nastp-delta" },
        meter: store.meters.find((meter) => meter.nodeId === techArea.id),
      }),
    ).toThrow("descendants");
  });

  it("detaches a physical meter and its live state", () => {
    const store = createInitialOrganizationStore();
    const iqbal = store.nodes.find((node) => node.id === "iqbal-camp")!;
    const next = updateOrganizationEntity(store, iqbal.id, { node: iqbal });

    expect(next.meters.some((meter) => meter.nodeId === iqbal.id)).toBe(false);
    expect(next.liveStates.some((state) => state.meterId === "m-ic")).toBe(
      false,
    );
  });

  it("protects parents and derived dependencies from deletion", () => {
    const store = createInitialOrganizationStore();
    expect(() => deleteOrganizationEntity(store, "tech-area")).toThrow(
      "child assets",
    );
    expect(() => deleteOrganizationEntity(store, "cac-cass")).toThrow(
      "derived calculation",
    );
  });
});
