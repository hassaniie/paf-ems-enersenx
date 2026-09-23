"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ShellContext, type UserRole } from "@/components/layout/shell-context";

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

  return (
    <div className="app-canvas flex h-dvh overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        role={role}
        onCollapse={() => setCollapsed((value) => !value)}
        onMobileClose={() => setMobileOpen(false)}
      />
      <ShellContext.Provider
        value={{ role, canManageOrganization: role === "Admin" }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            role={role}
            onRoleChange={setRole}
            onMenu={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </main>
        </div>
      </ShellContext.Provider>
    </div>
  );
}
