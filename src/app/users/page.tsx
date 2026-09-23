import { AppShell } from "@/components/layout/app-shell";
import { UsersWorkspace } from "@/features/users/users-workspace";

export default function UsersPage() {
  return (
    <AppShell
      title="Users & Roles"
      subtitle="PAF Base, Lahore · Access control"
    >
      <UsersWorkspace />
    </AppShell>
  );
}
