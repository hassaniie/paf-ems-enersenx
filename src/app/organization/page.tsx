import { AppShell } from "@/components/layout/app-shell";
import { OrganizationWorkspace } from "@/features/organization/organization-workspace";

export default function OrganizationPage() {
  return (
    <AppShell
      title="Organization"
      subtitle="PAF Base, Lahore · Assets and telemetry"
    >
      <OrganizationWorkspace />
    </AppShell>
  );
}
