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
    pathname === "/power-flow" ? "Live topology" : "Operational overview";
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
            <b>2</b>
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
        <SearchPalette onClose={() => setPanel(null)} />
      ) : null}
      {panel === "alerts" ? (
        <AlertsMenu onClose={() => setPanel(null)} />
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

function SearchPalette({ onClose }: { onClose: () => void }) {
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
          placeholder="Search meters, sites, pages or commands…"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="palette-content">
        <p>Quick navigation</p>
        <Link href="/" onClick={onClose}>
          <span>
            <Gauge />
            Command Center
          </span>
          <small>Overview</small>
        </Link>
        <Link href="/power-flow" onClick={onClose}>
          <span>
            <Radio />
            Power Flow
          </span>
          <small>Live topology</small>
        </Link>
        <button>
          <span>
            <TriangleAlert />
            Open active alarms
          </span>
          <small>2 exceptions</small>
        </button>
      </div>
      <footer>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> Navigate
        </span>
        <span>
          <kbd>↵</kbd> Open
        </span>
      </footer>
    </div>
  );
}

function AlertsMenu({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="shell-menu alerts-menu"
      role="dialog"
      aria-label="Notifications"
    >
      <header>
        <div>
          <strong>Notifications</strong>
          <small>2 require attention</small>
        </div>
        <button onClick={onClose}>
          <X />
        </button>
      </header>
      <div className="alert-menu-item critical">
        <span>
          <TriangleAlert />
        </span>
        <div>
          <strong>PF penalty exposure</strong>
          <p>CAC / CASS has remained at 0.34 PF for 30 minutes.</p>
          <time>4 min ago</time>
        </div>
      </div>
      <div className="alert-menu-item warning">
        <span>
          <ShieldCheck />
        </span>
        <div>
          <strong>CT circuit inspection</strong>
          <p>Tech Area is reporting voltage with near-zero current.</p>
          <time>18 min ago</time>
        </div>
      </div>
      <button className="menu-footer-action">View all alarms</button>
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
        <a href="#profile">
          <UserRound />
          Profile
        </a>
        <a href="#settings">
          <Settings />
          Preferences
        </a>
        <a href="#help">
          <HelpCircle />
          Help & support
        </a>
        <button>
          <LogOut />
          Sign out
        </button>
      </div>
    </div>
  );
}
