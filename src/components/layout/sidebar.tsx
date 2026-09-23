"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  Network,
  ScrollText,
  Settings,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import type { UserRole } from "@/components/layout/app-shell";
import { cn } from "@/lib/cn";
import { useAlarms } from "@/features/alarms/alarm-provider";
import { selectEnergySummary } from "@/features/organization/energy-selectors";
import { useScopedOrganization } from "@/features/organization/use-scoped-organization";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  roles: UserRole[];
  state?: "ready" | "planned";
}

const ALL_ROLES: UserRole[] = ["Admin", "Commander", "Operator", "Viewer"];
const OPERATORS: UserRole[] = ["Admin", "Commander", "Operator"];

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Command",
    items: [
      {
        label: "Command Center",
        icon: LayoutDashboard,
        href: "/",
        roles: ALL_ROLES,
        state: "ready",
      },
      {
        label: "Power Flow",
        icon: Zap,
        href: "/power-flow",
        roles: ALL_ROLES,
        state: "ready",
      },
    ],
  },
  {
    title: "Monitoring",
    items: [
      {
        label: "Organization",
        icon: Network,
        href: "/organization",
        roles: ALL_ROLES,
        state: "ready",
      },
      {
        label: "Live Meters",
        icon: Gauge,
        href: "/meters",
        roles: ALL_ROLES,
        state: "ready",
      },
      {
        label: "Alarms",
        icon: Bell,
        href: "/alarms",
        roles: ALL_ROLES,
        state: "ready",
      },
      {
        label: "Power Quality",
        icon: Gauge,
        href: "/power-quality",
        roles: OPERATORS,
        state: "ready",
      },
    ],
  },
  {
    title: "Analysis",
    items: [
      {
        label: "Analytics",
        icon: Activity,
        href: "/analytics",
        roles: ALL_ROLES,
        state: "ready",
      },
      {
        label: "Command Reports",
        icon: FileText,
        href: "/reports",
        roles: OPERATORS,
        state: "ready",
      },
      {
        label: "Energy Quotas",
        icon: Target,
        href: "/quotas",
        roles: ["Admin", "Commander"],
        state: "ready",
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Users & Roles",
        icon: Users,
        href: "/users",
        roles: ["Admin"],
        state: "ready",
      },
      {
        label: "Audit Log",
        icon: ScrollText,
        href: "/audit",
        roles: ["Admin", "Commander"],
        state: "ready",
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  mobileOpen,
  role,
  onCollapse,
  onMobileClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  role: UserRole;
  onCollapse: () => void;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const { store: alarmStore } = useAlarms();
  const { store } = useScopedOrganization();
  const accessibleTargets = new Set([
    ...store.nodes.map((node) => node.id),
    ...store.meters.map((meter) => meter.id),
  ]);
  const attentionCount = alarmStore.alarms.filter(
    (alarm) =>
      accessibleTargets.has(alarm.meterId) &&
      alarm.lifecycle !== "cleared" &&
      alarm.severity !== "info",
  ).length;
  const energy = selectEnergySummary(store);
  return (
    <>
      {mobileOpen ? (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={cn(
          "app-sidebar sidebar-surface",
          collapsed && "is-collapsed",
          mobileOpen && "is-mobile-open",
        )}
      >
        <div className="sidebar-brand">
          <span className="brand-mark">
            <Activity />
          </span>
          <div className="sidebar-brand-copy">
            <strong>
              Enersen<span>X</span>
            </strong>
            <small>Energy Intelligence</small>
          </div>
          <button
            className="sidebar-mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>

        <button className="workspace-switcher" aria-label="Switch site">
          <span className="workspace-icon">
            <Building2 />
          </span>
          <span className="workspace-copy">
            <strong>PAF Base Lahore</strong>
            <small>
              <i />
              {energy.reportingCount} of {energy.physicalCount} meters online
            </small>
          </span>
          <ChevronDown className="workspace-chevron" />
        </button>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {GROUPS.map((group) => (
            <div className="sidebar-group" key={group.title}>
              <p>{group.title}</p>
              <ul>
                {group.items.map((item) => {
                  const permitted = item.roles.includes(role);
                  const active =
                    item.state === "ready" && pathname === item.href;
                  return (
                    <li key={item.label}>
                      <a
                        href={permitted ? item.href : undefined}
                        aria-current={active ? "page" : undefined}
                        aria-disabled={!permitted}
                        title={collapsed ? item.label : undefined}
                        onClick={(event) => {
                          if (!permitted) event.preventDefault();
                          if (item.state === "ready") onMobileClose();
                        }}
                        className={cn(
                          "sidebar-link",
                          active && "active",
                          !permitted && "disabled",
                        )}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                        {item.label === "Alarms" && attentionCount ? (
                          <b className="sidebar-badge num">{attentionCount}</b>
                        ) : item.badge ? (
                          <b className="sidebar-badge num">{item.badge}</b>
                        ) : null}
                        {!permitted ? (
                          <LockKeyhole className="sidebar-lock" />
                        ) : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            disabled
            title="Settings are unavailable in preview mode"
          >
            <Settings />
            <span>Settings</span>
          </button>
          <div className="sidebar-role-note">
            <span>{role.slice(0, 1)}</span>
            <div>
              <strong>{role} access</strong>
              <small>
                {role === "Admin"
                  ? "Full workspace control"
                  : role === "Commander"
                    ? "Command & oversight"
                    : role === "Operator"
                      ? "Operate & investigate"
                      : "Read-only monitoring"}
              </small>
            </div>
          </div>
        </div>
        <button
          className="sidebar-collapse"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </aside>
    </>
  );
}
