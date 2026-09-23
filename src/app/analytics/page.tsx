import { AppShell } from "@/components/layout/app-shell";
import { AnalyticsWorkspace } from "@/features/analytics/analytics-workspace";

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Analytics"
      subtitle="PAF Base, Lahore · Historical intelligence"
    >
      <AnalyticsWorkspace />
    </AppShell>
  );
}
