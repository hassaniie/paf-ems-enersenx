import { Bell, Search } from "lucide-react";
import { LiveClock } from "@/components/layout/live-clock";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-app-bg/80 px-6 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-semibold text-text">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-faint">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {/* live pill */}
        <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-online opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-online" />
          </span>
          <span className="font-medium text-text">Live</span>
          <span className="text-border-strong">·</span>
          <LiveClock />
        </div>

        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-text"
          aria-label="Search"
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-text"
          aria-label="Alarms"
        >
          <Bell className="size-4" />
          <span className="num absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-on-solid">
            2
          </span>
        </button>
        <div className="flex items-center gap-2 pl-1">
          <span className="grid size-8 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-text">
            AN
          </span>
          <div className="hidden leading-tight lg:block">
            <p className="text-xs font-medium text-text">A. Q. Niazi</p>
            <p className="text-[10px] text-faint">Base Commander</p>
          </div>
        </div>
      </div>
    </header>
  );
}
