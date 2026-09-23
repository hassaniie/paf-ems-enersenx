import type { UserRole } from "@/components/layout/shell-context";

export type UserStatus = "active" | "invited" | "suspended";

export interface AccessScope {
  nodeIds: string[];
  allSites: boolean;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  serviceNumber?: string;
  role: UserRole;
  status: UserStatus;
  access: AccessScope;
  lastActiveAt?: string;
  invitedAt?: string;
}

export interface UserEvent {
  id: string;
  at: string;
  actor: string;
  userId: string;
  action: "invited" | "updated" | "suspended" | "reactivated" | "removed";
  detail: string;
}

export interface UserStore {
  users: ManagedUser[];
  events: UserEvent[];
  revision: number;
}

const STORAGE_KEY = "enersenx:paf-lahore:users:v1";
export const CURRENT_USER_ID = "user-aq-niazi";

export function createInitialUserStore(): UserStore {
  return {
    users: [
      {
        id: CURRENT_USER_ID,
        name: "Ahsan Qayyum Niazi",
        email: "aq.niazi@paf.mil.pk",
        serviceNumber: "PAF-21874",
        role: "Admin",
        status: "active",
        access: { allSites: true, nodeIds: [] },
        lastActiveAt: "2026-09-23T17:20:00+05:00",
      },
      {
        id: "user-base-commander",
        name: "Base Commander Lahore",
        email: "commander.lhr@paf.mil.pk",
        role: "Commander",
        status: "active",
        access: { allSites: true, nodeIds: [] },
        lastActiveAt: "2026-09-23T16:42:00+05:00",
      },
      {
        id: "user-tech-operator",
        name: "Hamza Rauf",
        email: "hamza.rauf@paf.mil.pk",
        serviceNumber: "PAF-30119",
        role: "Operator",
        status: "active",
        access: { allSites: false, nodeIds: ["tech-area", "nastp-delta"] },
        lastActiveAt: "2026-09-23T15:58:00+05:00",
      },
      {
        id: "user-energy-viewer",
        name: "Maryam Shah",
        email: "maryam.shah@paf.mil.pk",
        role: "Viewer",
        status: "invited",
        access: { allSites: false, nodeIds: ["iqbal-camp"] },
        invitedAt: "2026-09-22T11:30:00+05:00",
      },
      {
        id: "user-suspended",
        name: "Bilal Ahmed",
        email: "bilal.ahmed@paf.mil.pk",
        role: "Operator",
        status: "suspended",
        access: { allSites: false, nodeIds: ["qureshi-camp"] },
        lastActiveAt: "2026-09-10T09:12:00+05:00",
      },
    ],
    events: [],
    revision: 1,
  };
}

export function loadUserStore(): UserStore {
  const fallback = createInitialUserStore();
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as UserStore | null;
    return parsed && Array.isArray(parsed.users) && Array.isArray(parsed.events)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

export function persistUserStore(store: UserStore) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function audit(
  store: UserStore,
  userId: string,
  action: UserEvent["action"],
  detail: string,
): UserStore {
  return {
    ...store,
    revision: store.revision + 1,
    events: [
      {
        id: `user-event-${Date.now()}-${store.events.length}`,
        at: new Date().toISOString(),
        actor: "A. Q. Niazi",
        userId,
        action,
        detail,
      },
      ...store.events,
    ].slice(0, 100),
  };
}

export function saveUser(store: UserStore, candidate: ManagedUser): UserStore {
  const email = candidate.email.trim().toLowerCase();
  if (!candidate.name.trim()) throw new Error("Name is required.");
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (
    store.users.some(
      (user) => user.id !== candidate.id && user.email.toLowerCase() === email,
    )
  )
    throw new Error("A user with this email already exists.");
  if (!candidate.access.allSites && candidate.access.nodeIds.length === 0)
    throw new Error("Assign at least one area or grant all-site access.");
  const existing = store.users.find((user) => user.id === candidate.id);
  if (
    existing?.id === CURRENT_USER_ID &&
    (candidate.role !== "Admin" || candidate.status !== "active")
  )
    throw new Error("You cannot remove your own active administrator access.");
  const next = {
    ...candidate,
    email,
    name: candidate.name.trim(),
    serviceNumber: candidate.serviceNumber?.trim() || undefined,
  };
  const users = existing
    ? store.users.map((user) => (user.id === next.id ? next : user))
    : [next, ...store.users];
  return audit(
    { ...store, users },
    next.id,
    existing ? "updated" : "invited",
    existing
      ? `${next.name}'s role or access was updated.`
      : `${next.name} was invited as ${next.role}.`,
  );
}

export function setUserStatus(
  store: UserStore,
  id: string,
  status: "active" | "suspended",
): UserStore {
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error("User not found.");
  if (id === CURRENT_USER_ID && status === "suspended")
    throw new Error("You cannot suspend your own account.");
  const users = store.users.map((item) =>
    item.id === id ? { ...item, status } : item,
  );
  return audit(
    { ...store, users },
    id,
    status === "active" ? "reactivated" : "suspended",
    `${user.name} was ${status === "active" ? "reactivated" : "suspended"}.`,
  );
}

export function removeUser(store: UserStore, id: string): UserStore {
  const user = store.users.find((item) => item.id === id);
  if (!user) throw new Error("User not found.");
  if (id === CURRENT_USER_ID)
    throw new Error("You cannot remove your own account.");
  const activeAdmins = store.users.filter(
    (item) => item.role === "Admin" && item.status === "active",
  );
  if (
    user.role === "Admin" &&
    user.status === "active" &&
    activeAdmins.length <= 1
  )
    throw new Error("The last active administrator cannot be removed.");
  return audit(
    { ...store, users: store.users.filter((item) => item.id !== id) },
    id,
    "removed",
    `${user.name} was removed from EnersenX.`,
  );
}
