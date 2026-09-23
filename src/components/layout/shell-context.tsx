"use client";

import { createContext, useContext } from "react";
import { hasPermission, type AppPermission } from "@/config/permissions";

export type UserRole = "Admin" | "Commander" | "Operator" | "Viewer";

export interface ShellContextValue {
  role: UserRole;
  canManageOrganization: boolean;
  can: (permission: AppPermission) => boolean;
  accessibleNodeIds: ReadonlySet<string> | null;
  canAccessNode: (nodeId: string) => boolean;
}

export const ShellContext = createContext<ShellContextValue>({
  role: "Viewer",
  canManageOrganization: false,
  can: () => false,
  accessibleNodeIds: new Set(),
  canAccessNode: () => false,
});

export function useShell() {
  return useContext(ShellContext);
}

export function permissionFor(role: UserRole) {
  return (permission: AppPermission) => hasPermission(role, permission);
}
