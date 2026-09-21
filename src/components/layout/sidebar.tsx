import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  FileText,
  Gauge,
  LayoutDashboard,
  Network,
  ScrollText,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
}

const MONITORING: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Sites & Meters", icon: Network },
  { label: "Analytics", icon: Activity },
  { label: "Alarms", icon: Bell, badge: 2 },
  { label: "Power Quality", icon: Gauge },
];

const ADMIN: NavItem[] = [
  { label: "Command Report", icon: FileText },
  { label: "Energy Quotas", icon: Target },
  { label: "Users", icon: Users },
  { label: "Audit Log", icon: ScrollText },
];

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="px-3">
      <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-faint uppercase">
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <a
              href="#"
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                item.active
                  ? "bg-brand-soft text-text"
                  : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              {item.active ? (
                <span className="absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-r-full bg-brand" />
              ) : null}
              <item.icon
                className={cn(
                  "size-4 shrink-0",
                  item.active
                    ? "text-brand"
                    : "text-faint group-hover:text-muted",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="num inline-flex min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-on-solid">
                  {item.badge}
                </span>
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
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface/60">
      {/* brand / tenant */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-fg">
          <Zap className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-text">Enersenx</p>
          <p className="truncate text-[11px] text-faint">PAF Base, Lahore</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto py-2">
        <NavGroup title="Monitoring" items={MONITORING} />
        <NavGroup title="Command & Admin" items={ADMIN} />
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-faint">
          <span className="text-online">●</span> 4 / 10 meters online
        </p>
        <p className="mt-1 text-[10px] text-faint">v0.1 — EMS rebuild</p>
      </div>
    </aside>
  );
}
