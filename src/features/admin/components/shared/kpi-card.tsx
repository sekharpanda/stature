import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "gold" | "success" | "warning" | "danger";
};

const toneStyles: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  gold: "bg-accent text-accent-foreground",
  success: "bg-[var(--success)]/10 text-[var(--success)]",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)]",
  danger: "bg-destructive/10 text-destructive",
};

export function KpiCard({
  label,
  value,
  hint,
  href,
  icon: Icon,
  tone = "default",
}: KpiCardProps) {
  const content = (
    <Card className="card-elevated group h-full border-border/80 transition-all hover:-translate-y-0.5 hover:border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </CardTitle>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            toneStyles[tone],
          )}
        >
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-2">
          <p className="font-display text-3xl tracking-tight tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {href ? (
            <ArrowUpRight className="mb-1 size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
          ) : null}
        </div>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
