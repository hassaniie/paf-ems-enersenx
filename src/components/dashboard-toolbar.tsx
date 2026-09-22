"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const ranges = ["Live", "24H", "7D", "30D"] as const;

export function DashboardToolbar() {
  const [range, setRange] = useState<(typeof ranges)[number]>("24H");
  const [synced, setSynced] = useState(false);
  return (
    <div className="command-bar">
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
          Range
        </span>
        <div className="segmented" aria-label="Dashboard time range">
          {ranges.map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={cn("segment", range === item && "segment-active")}
            >
              {item}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="hidden md:inline-flex">
          <CalendarDays />
          21 Sep 2026
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          <SlidersHorizontal />
          Filters
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSynced(true);
            window.setTimeout(() => setSynced(false), 1600);
          }}
        >
          {synced ? <Check /> : <RefreshCw className={synced ? "" : ""} />}
          {synced ? "Synced" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
