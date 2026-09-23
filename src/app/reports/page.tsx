import { AppShell } from "@/components/layout/app-shell";
import { ReportsWorkspace } from "@/features/reports/reports-workspace";

export default function ReportsPage() {
  return (
    <AppShell
      title="Command Reports"
      subtitle="PAF Base, Lahore · Formal reporting"
    >
      <ReportsWorkspace />
    </AppShell>
  );
}
