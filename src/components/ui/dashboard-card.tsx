/**
 * Dashboard Card Component
 * Stat card with animated counter and trend indicator
 */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "primary" | "success" | "warning" | "info" | "danger" | "accent";
  className?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  decimals?: number;
}

const colorStyles: Record<
  NonNullable<DashboardCardProps["color"]>,
  {
    bg: string;
    text: string;
    icon: string;
    ring: string;
    bar: string;
  }
> = {
  primary: {
    bg: "bg-primary/10 dark:bg-primary/15",
    text: "text-primary",
    icon: "text-primary",
    ring: "from-primary/12",
    bar: "bg-primary/20",
  },
  success: {
    bg: "bg-success/10 dark:bg-success/15",
    text: "text-success",
    icon: "text-success",
    ring: "from-success/12",
    bar: "bg-success/20",
  },
  warning: {
    bg: "bg-warning/15 dark:bg-warning/15",
    text: "text-warning",
    icon: "text-warning",
    ring: "from-warning/15",
    bar: "bg-warning/25",
  },
  info: {
    bg: "bg-info/10 dark:bg-info/15",
    text: "text-info",
    icon: "text-info",
    ring: "from-info/12",
    bar: "bg-info/20",
  },
  danger: {
    bg: "bg-destructive/10 dark:bg-destructive/15",
    text: "text-destructive",
    icon: "text-destructive",
    ring: "from-destructive/12",
    bar: "bg-destructive/20",
  },
  accent: {
    bg: "bg-accent/15 dark:bg-accent/20",
    text: "text-accent",
    icon: "text-accent",
    ring: "from-accent/15",
    bar: "bg-accent/25",
  },
};

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "primary",
  className,
  prefix,
  suffix,
  description,
  decimals,
}: DashboardCardProps) {
  const styles = colorStyles[color];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/60 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          styles.ring,
        )}
      />
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-end gap-2">
              <AnimatedCounter
                value={value}
                className="text-3xl font-bold tracking-tight"
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
              {trend && (
                <div
                  className={cn(
                    "mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    trend.isPositive
                      ? "bg-success/10 text-success dark:bg-success/15"
                      : "bg-destructive/10 text-destructive dark:bg-destructive/15",
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "rounded-xl p-3 transition-transform duration-300 group-hover:scale-110",
              styles.bg,
            )}
          >
            <Icon className={cn("h-6 w-6", styles.icon)} />
          </div>
        </div>
        {description ? (
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        ) : null}
        <div
          className={cn("mt-4 h-1 w-16 rounded-full", styles.bar)}
        />
      </CardContent>
    </Card>
  );
}
