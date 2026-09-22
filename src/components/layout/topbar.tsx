import { Bell, Command, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveClock } from "@/components/layout/live-clock";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="topbar flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border px-5 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-[-0.025em] text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-[13px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          className="search-trigger hidden lg:flex"
          aria-label="Open command search"
        >
          <Search className="size-4" />
          <span>Search anything</span>
          <kbd>
            <Command className="size-3" />K
          </kbd>
        </button>
        <div className="hidden items-center gap-2 text-[13px] text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-online" />
          <span>Live</span>
          <span className="text-border">·</span>
          <LiveClock />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-critical ring-2 ring-background" />
        </Button>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <Download />
          Export
        </Button>
      </div>
    </header>
  );
}
