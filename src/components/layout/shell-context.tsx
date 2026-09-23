"use client";

import { createContext, useContext } from "react";

export type UserRole = "Admin" | "Commander" | "Operator" | "Viewer";

export interface ShellContextValue {
  role: UserRole;
  canManageOrganization: boolean;
}

export const ShellContext = createContext<ShellContextValue>({
  role: "Viewer",
  canManageOrganization: false,
});

export function useShell() {
  return useContext(ShellContext);
}
