import { describe, expect, it } from "vitest";
import { createInitialOrganizationStore } from "@/data/client/organization-repository";
import { findRecordByCode, selectEnergySummary } from "./energy-selectors";

describe("energy selectors", () => {
  it("joins meters with hierarchy and live state", () => {
    const store = createInitialOrganizationStore();
    const record = findRecordByCode(store, "ND-HT-01");

    expect(record?.node.name).toBe("NASTP Delta Ph-III");
    expect(record?.parent?.name).toBe("Tech Area (Main)");
    expect(record?.live?.status).toBe("online");
  });

  it("produces one shared operational summary", () => {
    const summary = selectEnergySummary(createInitialOrganizationStore());

    expect(summary.physicalCount).toBe(10);
    expect(summary.reportingCount).toBe(4);
    expect(summary.awaitingCount).toBe(6);
    expect(summary.faultyCount).toBe(1);
    expect(summary.activeLoadKw).toBe(513);
  });
});
