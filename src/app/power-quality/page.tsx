import { AppShell } from "@/components/layout/app-shell";
import { PowerQualityWorkspace } from "@/features/power-quality/power-quality-workspace";

export default function PowerQualityPage() {
  return (
    <AppShell
      title="Power Quality"
      subtitle="PAF Base, Lahore · Electrical health"
    >
      <PowerQualityWorkspace />
    </AppShell>
  );
}
