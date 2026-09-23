"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import {
  permissionFor,
  ShellContext,
  type UserRole,
} from "@/components/layout/shell-context";
import { hasRouteAccess, resolveAccessibleNodeIds } from "@/config/permissions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUsers } from "@/features/users/user-provider";
import { useOrganization } from "@/features/organization/organization-provider";

export type { UserRole } from "@/components/layout/shell-context";

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("Commander");
  const [roleHydrated, setRoleHydrated] = useState(false);
  const pathname = usePathname();
  const { store: users } = useUsers();
  const { store: organization } = useOrganization();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem(
        "enersenx:preview-role",
      ) as UserRole | null;
      if (
        stored &&
        ["Admin", "Commander", "Operator", "Viewer"].includes(stored)
      )
        setRole(stored);
      setRoleHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (roleHydrated)
      window.localStorage.setItem("enersenx:preview-role", role);
  }, [role, roleHydrated]);
  const accessibleNodeIds = useMemo(() => {
    return resolveAccessibleNodeIds(role, users.users, organization.nodes);
  }, [organization.nodes, role, users.users]);
  const shellValue = useMemo(
    () => ({
      role,
      canManageOrganization: role === "Admin",
      can: permissionFor(role),
      accessibleNodeIds,
      canAccessNode: (nodeId: string) =>
        accessibleNodeIds === null || accessibleNodeIds.has(nodeId),
    }),
    [accessibleNodeIds, role],
  );
  const allowed = hasRouteAccess(role, pathname);

  return (
    <div className="app-canvas flex h-dvh overflow-hidden bg-background">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        role={role}
        onCollapse={() => setCollapsed((value) => !value)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <ShellContext.Provider value={shellValue}>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            role={role}
            onRoleChange={setRole}
            onMenu={() => setMobileOpen(true)}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7"
          >
            {!roleHydrated ? (
              <div
                className="shell-route-loading"
                aria-busy="true"
                aria-label="Loading permission state"
              >
                <span />
                <span />
                <span />
              </div>
            ) : allowed ? (
              children
            ) : (
              <RouteDenied role={role} />
            )}
          </main>
        </div>
      </ShellContext.Provider>
    </div>
  );
}

function RouteDenied({ role }: { role: UserRole }) {
  return (
    <Card className="route-denied">
      <span>
        <LockKeyhole />
      </span>
      <Badge tone="var(--sev-critical)">Permission required</Badge>
      <h1>This workspace is not available to {role}.</h1>
      <p>
        Your current preview role does not include this route. Use the account
        menu to switch roles or return to an available workspace.
      </p>
    </Card>
  );
}
