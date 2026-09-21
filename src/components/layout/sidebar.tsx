import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  ChevronRight,
  FileText,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  Network,
  ScrollText,
  Settings,
  Target,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
  chevron?: boolean;
}

const MONITORING: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Sites & Meters", icon: Network, chevron: true },
  { label: "Analytics", icon: Activity },
  { label: "Alarms", icon: Bell, badge: 2 },
  { label: "Power Quality", icon: Gauge },
];

const ADMIN: NavItem[] = [
  { label: "Command Report", icon: FileText },
  { label: "Energy Quotas", icon: Target },
  { label: "Users", icon: Users, chevron: true },
  { label: "Audit Log", icon: ScrollText },
];

const WATCHLIST = [
  { label: "Tech Area", color: "var(--status-faulty)", note: "CT fault" },
  { label: "CAC / CASS", color: "var(--sev-critical)", note: "PF 0.34" },
  { label: "NASTP Delta", color: "var(--status-online)", note: "544 kW" },
];

function NavList({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href="#"
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                item.active
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
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
      {/* brand / workspace */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <span className="text-sm font-bold">E</span>
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">
            Enersenx
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            PAF Base, Lahore
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-2">
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
        <div className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold text-foreground">
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
