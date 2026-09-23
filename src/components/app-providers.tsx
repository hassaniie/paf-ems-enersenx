"use client";

import type { ReactNode } from "react";
import { OrganizationProvider } from "@/features/organization/organization-provider";
import { AlarmProvider } from "@/features/alarms/alarm-provider";
import { ReportProvider } from "@/features/reports/report-provider";
import { QuotaProvider } from "@/features/quotas/quota-provider";
import { UserProvider } from "@/features/users/user-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <OrganizationProvider>
      <AlarmProvider>
        <ReportProvider>
          <QuotaProvider>
            <UserProvider>{children}</UserProvider>
          </QuotaProvider>
        </ReportProvider>
      </AlarmProvider>
    </OrganizationProvider>
  );
}
