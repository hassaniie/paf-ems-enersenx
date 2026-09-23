import type { UserRole } from "@/components/layout/shell-context";

export type AppPermission =
  | "organization.manage"
  | "meters.operate"
  | "alarms.respond"
  | "reports.manage"
  | "quotas.manage"
  | "users.manage"
  | "audit.view";

const ALL: UserRole[] = ["Admin", "Commander", "Operator", "Viewer"];
const OPERATIONS: UserRole[] = ["Admin", "Commander", "Operator"];
const COMMAND: UserRole[] = ["Admin", "Commander"];

export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/": ALL,
  "/power-flow": ALL,
  "/organization": ALL,
  "/meters": ALL,
  "/alarms": ALL,
  "/power-quality": OPERATIONS,
  "/analytics": ALL,
  "/reports": OPERATIONS,
  "/quotas": COMMAND,
  "/users": ["Admin"],
  "/audit": COMMAND,
};

const PERMISSION_ROLES: Record<AppPermission, UserRole[]> = {
  "organization.manage": ["Admin"],
  "meters.operate": OPERATIONS,
  "alarms.respond": OPERATIONS,
  "reports.manage": COMMAND,
  "quotas.manage": COMMAND,
  "users.manage": ["Admin"],
  "audit.view": COMMAND,
};

export function hasRouteAccess(role: UserRole, pathname: string) {
  return (ROUTE_ROLES[pathname] ?? ALL).includes(role);
}

export function hasPermission(role: UserRole, permission: AppPermission) {
  return PERMISSION_ROLES[permission].includes(role);
}

export function resolveAccessibleNodeIds(
  role: UserRole,
  users: { role: UserRole; access: { allSites: boolean; nodeIds: string[] } }[],
  nodes: { id: string; parentId: string | null }[],
) {
  const previewUser = users.find((user) => user.role === role);
  if (!previewUser || previewUser.access.allSites) return null;
  const ids = new Set(previewUser.access.nodeIds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.parentId && ids.has(node.parentId) && !ids.has(node.id)) {
        ids.add(node.id);
        changed = true;
      }
    }
  }
  for (const scopedId of [...ids]) {
    let cursor = nodes.find((node) => node.id === scopedId);
    while (cursor?.parentId) {
      ids.add(cursor.parentId);
      cursor = nodes.find((node) => node.id === cursor?.parentId);
    }
  }
  return ids;
}
