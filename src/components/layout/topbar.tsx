"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronDown,
  Command,
  Gauge,
  HelpCircle,
  LogOut,
  Menu,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import type { UserRole } from "@/components/layout/app-shell";
import { LiveClock } from "@/components/layout/live-clock";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/cn";
import { useAlarms } from "@/features/alarms/alarm-provider";
import type { OperationalAlarm } from "@/data/client/alarm-repository";
import { useScopedOrganization } from "@/features/organization/use-scoped-organization";

const roles: { value: UserRole; description: string }[] = [
  { value: "Admin", description: "Full configuration and access" },
  { value: "Commander", description: "Command decisions and oversight" },
  { value: "Operator", description: "Monitor, investigate and respond" },
  { value: "Viewer", description: "Read-only system visibility" },
];

export function Topbar({
  title,
  subtitle,
  role,
  onRoleChange,
  onMenu,
}: {
  title: string;
  subtitle?: string;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const { store: alarmStore } = useAlarms();
  const { store: organization } = useScopedOrganization();
  const accessibleTargets = new Set([
    ...organization.nodes.map((node) => node.id),
    ...organization.meters.map((meter) => meter.id),
  ]);
  const scopedAlarms = alarmStore.alarms.filter((alarm) =>
    accessibleTargets.has(alarm.meterId),
  );
  const attentionCount = scopedAlarms.filter(
    (alarm) => alarm.lifecycle !== "cleared" && alarm.severity !== "info",
  ).length;
  const [panel, setPanel] = useState<"search" | "alerts" | "profile" | null>(
    null,
  );
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const context =
    (
      {
        "/": "Operational overview",
        "/power-flow": "Live topology",
        "/organization": "Asset hierarchy",
        "/meters": "Field telemetry",
        "/alarms": "Response workflow",
        "/power-quality": "Electrical health",
        "/analytics": "Historical intelligence",
        "/reports": "Formal reporting",
        "/quotas": "Allocation control",
        "/users": "Access control",
        "/audit": "Activity assurance",
      } as Record<string, string>
    )[pathname] ?? "Energy operations";
  return (
    <>
      <header className="app-topbar topbar">
        <div className="topbar-page">
          <button
            className="mobile-menu-trigger"
            onClick={onMenu}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div className="topbar-title">
            <div>
              <h1>{title}</h1>
              <span className="topbar-context">{context}</span>
            </div>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="global-search"
            onClick={() => setPanel("search")}
            aria-label="Open command search"
          >
            <Search />
            <span>Search or jump to…</span>
            <kbd>
              <Command />K
            </kbd>
          </button>
          <div className="live-status">
            <i />
            <span>Live</span>
            <LiveClock />
          </div>
          <ThemeToggle />
          <button
            className={cn("topbar-icon-button", panel === "alerts" && "active")}
            onClick={() => setPanel(panel === "alerts" ? null : "alerts")}
            aria-label="Open notifications"
          >
            <Bell />
            {attentionCount ? <b>{attentionCount}</b> : null}
          </button>
          <button
            className={cn("profile-trigger", panel === "profile" && "active")}
            onClick={() => setPanel(panel === "profile" ? null : "profile")}
          >
            <span>AN</span>
            <div>
              <strong>A. Q. Niazi</strong>
              <small>{role}</small>
            </div>
            <ChevronDown />
          </button>
        </div>
      </header>

      {panel ? (
        <button
          className="shell-popover-scrim"
          aria-label="Close menu"
          onClick={() => setPanel(null)}
        />
      ) : null}
      {panel === "search" ? (
        <SearchPalette
          onClose={() => setPanel(null)}
          attentionCount={attentionCount}
        />
      ) : null}
      {panel === "alerts" ? (
        <AlertsMenu onClose={() => setPanel(null)} alarms={scopedAlarms} />
      ) : null}
      {panel === "profile" ? (
        <ProfileMenu
          role={role}
          onRoleChange={onRoleChange}
          onClose={() => setPanel(null)}
        />
      ) : null}
    </>
  );
}

function SearchPalette({
  onClose,
  attentionCount,
}: {
  onClose: () => void;
  attentionCount: number;
}) {
  const [query, setQuery] = useState("");
  const entries = [
    { href: "/", label: "Command Center", meta: "Overview", icon: Gauge },
    {
      href: "/power-flow",
      label: "Power Flow",
      meta: "Live topology",
      icon: Radio,
    },
    {
      href: "/alarms",
      label: "Open active alarms",
      meta: `${attentionCount} exceptions`,
      icon: TriangleAlert,
    },
  ].filter((entry) =>
    `${entry.label} ${entry.meta}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div
      className="command-palette"
      role="dialog"
      aria-modal="true"
      aria-label="Command search"
    >
      <div className="palette-input">
        <Search />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search meters, sites, pages or commands…"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="palette-content">
        <p>Quick navigation</p>
        {entries.map((entry) => {
          const Icon = entry.icon;
          return (
            <Link href={entry.href} onClick={onClose} key={entry.href}>
              <span>
                <Icon />
                {entry.label}
              </span>
              <small>{entry.meta}</small>
            </Link>
          );
        })}
        {!entries.length ? (
          <div className="palette-empty">No matching pages or commands.</div>
        ) : null}
      </div>
      <footer>
        <span>Type to filter available destinations</span>
        <span>
          <kbd>ESC</kbd> Close
        </span>
      </footer>
    </div>
  );
}

function AlertsMenu({
  onClose,
  alarms,
}: {
  onClose: () => void;
  alarms: OperationalAlarm[];
}) {
  const active = alarms
    .filter((alarm) => alarm.lifecycle !== "cleared")
    .slice(0, 3);
  return (
    <div
      className="shell-menu alerts-menu"
      role="dialog"
      aria-label="Notifications"
    >
      <header>
        <div>
          <strong>Notifications</strong>
          <small>{active.length} recent open events</small>
        </div>
        <button onClick={onClose} aria-label="Close notifications">
          <X />
        </button>
      </header>
      {active.map((alarm) => (
        <Link
          href="/alarms"
          onClick={onClose}
          className={cn("alert-menu-item", alarm.severity)}
          key={alarm.id}
        >
          <span>
            {alarm.severity === "critical" ? (
              <TriangleAlert />
            ) : (
              <ShieldCheck />
            )}
          </span>
          <div>
            <strong>{alarm.title}</strong>
            <p>
              {alarm.nodeName} · {alarm.meterCode}
            </p>
            <time>{alarm.lifecycle}</time>
          </div>
        </Link>
      ))}
      {!active.length ? (
        <div className="alert-menu-empty">
          <Check />
          <span>
            <strong>No open alarms</strong>
            <small>The monitored network is clear.</small>
          </span>
        </div>
      ) : null}
      <Link href="/alarms" onClick={onClose} className="menu-footer-action">
        View all alarms
      </Link>
    </div>
  );
}

function ProfileMenu({
  role,
  onRoleChange,
  onClose,
}: {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="shell-menu profile-menu"
      role="dialog"
      aria-label="Account and role menu"
    >
      <div className="profile-summary">
        <span>AN</span>
        <div>
          <strong>Ahsan Qayyum Niazi</strong>
          <small>aq.niazi@paf.gov.pk</small>
        </div>
      </div>
      <div className="role-switcher">
        <p>Preview permission state</p>
        {roles.map((item) => (
          <button
            key={item.value}
            onClick={() => {
              onRoleChange(item.value);
              onClose();
            }}
          >
            <span>
              <strong>{item.value}</strong>
              <small>{item.description}</small>
            </span>
            {role === item.value ? <Check /> : null}
          </button>
        ))}
      </div>
      <div className="profile-links">
        <button
          disabled
          title="Profile management requires authentication integration"
        >
          <UserRound />
          Profile
        </button>
        <button disabled title="Preferences are unavailable in preview mode">
          <Settings />
          Preferences
        </button>
        <button
          disabled
          title="Support integration is unavailable in preview mode"
        >
          <HelpCircle />
          Help & support
        </button>
        <button disabled title="Sign out requires authentication integration">
          <LogOut />
          Sign out
        </button>
      </div>
    </div>
  );
}
