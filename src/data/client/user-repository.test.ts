import { describe, expect, it } from "vitest";
import {
  CURRENT_USER_ID,
  createInitialUserStore,
  removeUser,
  saveUser,
  setUserStatus,
} from "./user-repository";

describe("user repository", () => {
  it("invites a scoped user and records the event", () => {
    const store = createInitialUserStore();
    const next = saveUser(store, {
      id: "new-user",
      name: "New Operator",
      email: "operator@paf.mil.pk",
      role: "Operator",
      status: "invited",
      access: { allSites: false, nodeIds: ["tech-area"] },
    });
    expect(next.users[0]?.email).toBe("operator@paf.mil.pk");
    expect(next.events[0]?.action).toBe("invited");
  });
  it("rejects duplicate emails and empty access", () => {
    const store = createInitialUserStore();
    expect(() =>
      saveUser(store, { ...store.users[1]!, id: "duplicate" }),
    ).toThrow(/email/i);
    expect(() =>
      saveUser(store, {
        ...store.users[1]!,
        id: "no-access",
        email: "unique@paf.mil.pk",
        access: { allSites: false, nodeIds: [] },
      }),
    ).toThrow(/area/i);
  });
  it("protects the current administrator", () => {
    const store = createInitialUserStore();
    expect(() => setUserStatus(store, CURRENT_USER_ID, "suspended")).toThrow(
      /own account/i,
    );
    expect(() => removeUser(store, CURRENT_USER_ID)).toThrow(/own account/i);
    expect(() =>
      saveUser(store, { ...store.users[0]!, role: "Viewer" }),
    ).toThrow(/administrator/i);
  });
});
