"use client";

import type { ReactNode } from "react";
import { OrganizationProvider } from "@/features/organization/organization-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return <OrganizationProvider>{children}</OrganizationProvider>;
}
