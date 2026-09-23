import { describe, expect, it } from "vitest";
import { createInitialOrganizationStore } from "@/data/client/organization-repository";
import { analyticsCsv, buildAnalyticsDataset } from "./analytics-data";

describe("analytics dataset", () => {
  it("builds the expected period resolutions", () => {
    const store = createInitialOrganizationStore();
    expect(buildAnalyticsDataset(store, "24H").points).toHaveLength(24);
    expect(buildAnalyticsDataset(store, "7D").points).toHaveLength(7);
    expect(buildAnalyticsDataset(store, "30D").points).toHaveLength(15);
    expect(buildAnalyticsDataset(store, "90D").points).toHaveLength(13);
  });

  it("keeps contributions aligned with total period energy", () => {
    const data = buildAnalyticsDataset(createInitialOrganizationStore(), "30D");
    const contributionTotal = data.contributions.reduce(
      (sum, item) => sum + item.energyKwh,
      0,
    );

    expect(contributionTotal).toBeCloseTo(data.energyKwh, -1);
    expect(
      data.contributions.reduce((sum, item) => sum + item.sharePct, 0),
    ).toBeCloseTo(100, 5);
  });

  it("exports a CSV row for every analytics point", () => {
    const data = buildAnalyticsDataset(createInitialOrganizationStore(), "7D");
    const csv = analyticsCsv(data.points);

    expect(csv.split("\n")).toHaveLength(8);
    expect(csv).toContain("Demand kW");
    expect(csv).toContain("Cost PKR");
  });
});
