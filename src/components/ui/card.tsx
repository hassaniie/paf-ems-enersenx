import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Surface panel — ReUI/Atlas card: rounded-xl, hairline border, bg-card. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-card rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 pt-5 pb-4 lg:px-6 lg:pt-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm leading-none font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("px-5 pb-5 lg:px-6 lg:pb-6", className)}>{children}</div>
  );
}
