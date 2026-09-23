import { AppShell } from "@/components/layout/app-shell";
import { AlarmsWorkspace } from "@/features/alarms/alarms-workspace";

export default function AlarmsPage() {
  return (
    <AppShell title="Alarms" subtitle="PAF Base, Lahore · Operational response">
      <AlarmsWorkspace />
    </AppShell>
  );
}
