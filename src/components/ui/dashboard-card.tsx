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

type DashboardCardColor =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "accent"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: DashboardCardColor;
  className?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  decimals?: number;
}

const colorStyles: Record<
  DashboardCardColor,
  {
    bg: string;
    text: string;
    icon: string;
    ring: string;
    bar: string;
    iconBg: string;
  }
> = {
  primary: {
    bg: "bg-primary/10 dark:bg-primary/15",
    text: "text-primary",
    icon: "text-primary",
    ring: "from-primary/12",
    bar: "from-primary/40 via-primary/20 to-transparent",
    iconBg: "bg-linear-to-br from-primary to-primary/80",
  },
  success: {
    bg: "bg-success/10 dark:bg-success/15",
    text: "text-success",
    icon: "text-success",
    ring: "from-success/12",
    bar: "from-success/40 via-success/20 to-transparent",
    iconBg: "bg-linear-to-br from-success to-success/80",
  },
  warning: {
    bg: "bg-warning/15 dark:bg-warning/15",
    text: "text-warning",
    icon: "text-warning",
    ring: "from-warning/15",
    bar: "from-warning/40 via-warning/20 to-transparent",
    iconBg: "bg-linear-to-br from-warning to-warning/80",
  },
  info: {
    bg: "bg-info/10 dark:bg-info/15",
    text: "text-info",
    icon: "text-info",
    ring: "from-info/12",
    bar: "from-info/40 via-info/20 to-transparent",
    iconBg: "bg-linear-to-br from-info to-info/80",
  },
  danger: {
    bg: "bg-destructive/10 dark:bg-destructive/15",
    text: "text-destructive",
    icon: "text-destructive",
    ring: "from-destructive/12",
    bar: "from-destructive/40 via-destructive/20 to-transparent",
    iconBg: "bg-linear-to-br from-destructive to-destructive/80",
  },
  accent: {
    bg: "bg-accent/15 dark:bg-accent/20",
    text: "text-accent",
    icon: "text-accent",
    ring: "from-accent/15",
    bar: "from-accent/40 via-accent/20 to-transparent",
    iconBg: "bg-linear-to-br from-accent to-accent/80",
  },
  blue: {
    bg: "bg-info/10 dark:bg-info/15",
    text: "text-info",
    icon: "text-info",
    ring: "from-info/12",
    bar: "from-info/40 via-info/20 to-transparent",
    iconBg: "bg-linear-to-br from-info to-info/80",
  },
  green: {
    bg: "bg-success/10 dark:bg-success/15",
    text: "text-success",
    icon: "text-success",
    ring: "from-success/12",
    bar: "from-success/40 via-success/20 to-transparent",
    iconBg: "bg-linear-to-br from-success to-success/80",
  },
  amber: {
    bg: "bg-warning/15 dark:bg-warning/15",
    text: "text-warning",
    icon: "text-warning",
    ring: "from-warning/15",
    bar: "from-warning/40 via-warning/20 to-transparent",
    iconBg: "bg-linear-to-br from-warning to-warning/80",
  },
  red: {
    bg: "bg-destructive/10 dark:bg-destructive/15",
    text: "text-destructive",
    icon: "text-destructive",
    ring: "from-destructive/12",
    bar: "from-destructive/40 via-destructive/20 to-transparent",
    iconBg: "bg-linear-to-br from-destructive to-destructive/80",
  },
  purple: {
    bg: "bg-accent/15 dark:bg-accent/20",
    text: "text-accent",
    icon: "text-accent",
    ring: "from-accent/15",
    bar: "from-accent/40 via-accent/20 to-transparent",
    iconBg: "bg-linear-to-br from-accent to-accent/80",
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
        "group relative overflow-hidden border-border/60 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          styles.ring,
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <div className="flex items-end gap-2">
              <AnimatedCounter
                value={value}
                className="text-3xl font-extrabold tracking-tight text-foreground"
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
            {description ? (
              <p className="text-xs text-muted-foreground/80">{description}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110",
              styles.iconBg,
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
        {/* Gradient glow bar */}
        <div
          className={cn(
            "mt-4 h-1 w-full rounded-full bg-linear-to-r",
            styles.bar,
          )}
        />
      </CardContent>
    </Card>
  );
}
