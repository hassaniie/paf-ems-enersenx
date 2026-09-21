"use client";

import { useEffect, useState } from "react";
import { formatTimePkt } from "@/domain/format";

/** Ticking PKT wall-clock. Hydration-safe: renders nothing until mounted. */
export function LiveClock() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(formatTimePkt(new Date().toISOString()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="num tabular-nums text-muted">{now ?? "—"} PKT</span>
  );
}
