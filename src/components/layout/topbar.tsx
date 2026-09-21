import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveClock } from "@/components/layout/live-clock";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-[13px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-[13px] text-muted-foreground sm:flex">
          <span className="size-1.5 rounded-full bg-online" />
          <span>Live</span>
          <span className="text-border">·</span>
          <LiveClock />
        </div>
        <Button variant="outline" size="sm">
          <Download />
          Export
        </Button>
      </div>
    </header>
  );
}
