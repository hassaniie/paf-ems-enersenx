import { AppShell } from "@/components/layout/app-shell";
import { LiveMetersWorkspace } from "@/features/meters/live-meters-workspace";

export default function LiveMetersPage() {
  return (
    <AppShell title="Live Meters" subtitle="PAF Base, Lahore · Field telemetry">
      <LiveMetersWorkspace />
    </AppShell>
  );
}
