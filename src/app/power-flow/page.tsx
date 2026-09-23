import { AppShell } from "@/components/layout/app-shell";
import { SingleLineDiagram } from "@/components/power-flow/single-line-diagram";

export default function PowerFlowPage() {
  return (
    <AppShell
      title="Power Flow"
      subtitle="PAF Base, Lahore · Live energy topology"
    >
      <SingleLineDiagram />
    </AppShell>
  );
}
