"use client";

import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  ChevronRight,
  FileText,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  LifeBuoy,
  Network,
  ScrollText,
  Settings,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
  chevron?: boolean;
}

const MONITORING: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/" },
  { label: "Live Power Flow", icon: Zap, href: "/power-flow" },
  { label: "Sites & Meters", icon: Network, href: "#", chevron: true },
  { label: "Analytics", icon: Activity, href: "#" },
  { label: "Alarms", icon: Bell, href: "#", badge: 2 },
  { label: "Power Quality", icon: Gauge, href: "#" },
];

const ADMIN: NavItem[] = [
  { label: "Command Report", icon: FileText, href: "#" },
  { label: "Energy Quotas", icon: Target, href: "#" },
  { label: "Users", icon: Users, href: "#", chevron: true },
  { label: "Audit Log", icon: ScrollText, href: "#" },
];

const WATCHLIST = [
  { label: "Tech Area", color: "var(--status-faulty)", note: "CT fault" },
  { label: "CAC / CASS", color: "var(--sev-critical)", note: "PF 0.34" },
  { label: "NASTP Delta", color: "var(--status-online)", note: "544 kW" },
];

function NavList({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <div>
      <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                pathname === item.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="num inline-flex min-w-[18px] items-center justify-center rounded-md bg-critical px-1 text-[10px] font-semibold text-on-solid">
                  {item.badge}
                </span>
              ) : null}
              {item.chevron ? (
                <ChevronRight className="size-3.5 text-muted-foreground/60" />
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar-surface hidden w-[272px] shrink-0 flex-col border-r border-border md:flex">
      {/* brand / workspace */}
      <div className="flex h-[72px] items-center gap-3 border-b border-border px-4">
        <span className="brand-mark grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground">
          <Activity className="size-[18px]" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">
            Enersen<span className="text-brand">X</span>
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            PAF Base, Lahore
          </p>
        </div>
      </div>

      <div className="mx-3 mt-4 rounded-xl border border-border bg-elevated/55 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Grid2X2 className="size-3.5 text-brand" />
            PAF Base Lahore
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>10 metering points</span>
          <span className="inline-flex items-center gap-1">
            <i className="size-1.5 rounded-full bg-online" />4 online
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-2 py-5">
        <NavList title="Monitoring" items={MONITORING} />
        <NavList title="Command & Admin" items={ADMIN} />

        <div>
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
            Watchlist
          </p>
          <ul className="space-y-0.5">
            {WATCHLIST.map((w) => (
              <li key={w.label}>
                <a
                  href="#"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: w.color }}
                  />
                  <span className="flex-1 truncate">{w.label}</span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {w.note}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="mt-auto border-t border-border px-2 py-2">
        <ul className="space-y-0.5">
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings className="size-4" /> Settings
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LifeBuoy className="size-4" /> Help &amp; Support
            </a>
          </li>
        </ul>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-xs font-semibold text-brand">
            AN
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium text-foreground">
              A. Q. Niazi
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              Base Commander
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
