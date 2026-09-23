import { AppShell } from "@/components/layout/app-shell";
import { QuotasWorkspace } from "@/features/quotas/quotas-workspace";

export default function QuotasPage() {
  return (
    <AppShell
      title="Energy Quotas"
      subtitle="PAF Base, Lahore · Allocation control"
    >
      <QuotasWorkspace />
    </AppShell>
  );
}
