import { AppShell } from "@/components/layout/app-shell";
import { AuditWorkspace } from "@/features/audit/audit-workspace";

export default function AuditPage() {
  return (
    <AppShell
      title="Audit Log"
      subtitle="PAF Base, Lahore · Activity assurance"
    >
      <AuditWorkspace />
    </AppShell>
  );
}
