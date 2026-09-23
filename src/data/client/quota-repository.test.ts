import { describe, expect, it } from "vitest";
import {
  createInitialQuotaStore,
  deleteQuota,
  quotaHealth,
  saveQuota,
  transitionQuota,
} from "./quota-repository";

describe("quota repository", () => {
  it("calculates pacing and projected overruns", () => {
    const quota = createInitialQuotaStore().quotas.find(
      (item) => item.id === "quota-cac-sep",
    )!;
    const pacing = quotaHealth(quota);
    expect(pacing.usedPct).toBeCloseTo(93.33, 1);
    expect(pacing.health).toBe("projected-overrun");
    expect(pacing.forecastPct).toBeGreaterThan(100);
  });

  it("rejects duplicate scope periods and invalid limits", () => {
    const store = createInitialQuotaStore();
    const source = store.quotas[0]!;
    expect(() =>
      saveQuota(store, { ...source, id: "duplicate" }, "test"),
    ).toThrow("already exists");
    expect(() =>
      saveQuota(
        store,
        { ...source, id: "new", scopeNodeId: "officers-mess", limitKwh: 0 },
        "test",
      ),
    ).toThrow("greater than zero");
  });

  it("records approval transitions and protects approved quotas", () => {
    const store = createInitialQuotaStore();
    const draft = store.quotas.find((item) => item.approval === "draft")!;
    const pending = transitionQuota(store, draft.id, "pending");
    expect(
      pending.quotas.find((item) => item.id === draft.id)?.events.at(-1)
        ?.action,
    ).toBe("submitted");
    expect(() => deleteQuota(store, "quota-site-sep")).toThrow(
      "cannot be deleted",
    );
  });
});
