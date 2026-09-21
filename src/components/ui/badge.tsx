import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Soft badge/pill, ReUI/Atlas style. `tone` sets a tinted background + colored
 * text from a CSS color var (used for plan/status pills). `variant="outline"`
 * is a neutral bordered chip (HT/LT, transport tags).
 */
export function Badge({
  children,
  tone,
  variant = "soft",
  className,
}: {
  children: ReactNode;
  /** A CSS color, e.g. "var(--status-online)". */
  tone?: string;
  variant?: "soft" | "outline" | "solid";
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-tight";

  if (variant === "outline") {
    return (
      <span
        className={cn(
          base,
          "border border-border bg-transparent text-muted-foreground",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  const style: CSSProperties = tone
    ? variant === "solid"
      ? { backgroundColor: tone, color: "var(--on-solid)" }
      : {
          color: tone,
          backgroundColor: `color-mix(in oklab, ${tone} 15%, transparent)`,
        }
    : {};

  return (
    <span
      className={cn(
        base,
        !tone && "bg-secondary text-secondary-foreground",
        className,
      )}
      style={style}
    >
      {children}
    </span>
  );
}
