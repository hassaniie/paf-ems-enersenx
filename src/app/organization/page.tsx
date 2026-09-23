import { AppShell } from "@/components/layout/app-shell";
import { OrganizationProvider } from "@/features/organization/organization-provider";
import { OrganizationWorkspace } from "@/features/organization/organization-workspace";

export default function OrganizationPage() {
  return (
    <AppShell
      title="Organization"
      subtitle="PAF Base, Lahore · Assets and telemetry"
    >
      <OrganizationProvider>
        <OrganizationWorkspace />
      </OrganizationProvider>
    </AppShell>
  );
}
