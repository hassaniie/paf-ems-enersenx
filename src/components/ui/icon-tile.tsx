import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function IconTile({
  icon: Icon,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  tone?: "neutral" | "brand" | "warning" | "critical";
  className?: string;
}) {
  return (
    <span className={cn("icon-tile", `icon-tile-${tone}`, className)}>
      <Icon className="size-4" />
    </span>
  );
}
