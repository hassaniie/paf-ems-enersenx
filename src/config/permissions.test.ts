import { describe, expect, it } from "vitest";
import {
  hasPermission,
  hasRouteAccess,
  resolveAccessibleNodeIds,
} from "./permissions";

describe("permission policy", () => {
  it("protects administration routes", () => {
    expect(hasRouteAccess("Admin", "/users")).toBe(true);
    expect(hasRouteAccess("Commander", "/users")).toBe(false);
    expect(hasRouteAccess("Operator", "/audit")).toBe(false);
  });
  it("separates read and mutation access", () => {
    expect(hasRouteAccess("Viewer", "/alarms")).toBe(true);
    expect(hasPermission("Viewer", "alarms.respond")).toBe(false);
    expect(hasPermission("Operator", "meters.operate")).toBe(true);
    expect(hasPermission("Operator", "reports.manage")).toBe(false);
  });
  it("includes scoped descendants and their hierarchy context", () => {
    const ids = resolveAccessibleNodeIds(
      "Operator",
      [{ role: "Operator", access: { allSites: false, nodeIds: ["area"] } }],
      [
        { id: "site", parentId: null },
        { id: "area", parentId: "site" },
        { id: "meter", parentId: "area" },
        { id: "other", parentId: "site" },
      ],
    );
    expect([...ids!].sort()).toEqual(["area", "meter", "site"]);
  });
});
