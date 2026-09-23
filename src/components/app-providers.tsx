"use client";

import type { ReactNode } from "react";
import { OrganizationProvider } from "@/features/organization/organization-provider";
import { AlarmProvider } from "@/features/alarms/alarm-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      <AlarmProvider>{children}</AlarmProvider>
    </OrganizationProvider>
  );
}
