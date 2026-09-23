"use client";

import type { ReactNode } from "react";
import { OrganizationProvider } from "@/features/organization/organization-provider";
import { AlarmProvider } from "@/features/alarms/alarm-provider";
import { ReportProvider } from "@/features/reports/report-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      <AlarmProvider>
        <ReportProvider>{children}</ReportProvider>
      </AlarmProvider>
    </OrganizationProvider>
  );
}
