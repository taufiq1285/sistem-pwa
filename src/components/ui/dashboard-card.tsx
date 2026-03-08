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
  color?: "blue" | "green" | "amber" | "purple" | "red" | "teal";
  className?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  decimals?: number;
}

const colorStyles: Record<
  NonNullable<DashboardCardProps["color"]>,
  { bg: string; text: string; icon: string; ring: string }
> = {
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-500 dark:text-blue-400",
    ring: "from-blue-500/10",
  },
  green: {
    bg: "bg-green-500/10 dark:bg-green-500/15",
    text: "text-green-600 dark:text-green-400",
    icon: "text-green-500 dark:text-green-400",
    ring: "from-green-500/10",
  },
  amber: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500 dark:text-amber-400",
    ring: "from-amber-500/10",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    text: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-500 dark:text-purple-400",
    ring: "from-purple-500/10",
  },
  red: {
    bg: "bg-red-500/10 dark:bg-red-500/15",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500 dark:text-red-400",
    ring: "from-red-500/10",
  },
  teal: {
    bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-500 dark:text-cyan-400",
    ring: "from-cyan-500/10",
  },
};

export function DashboardCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
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
                      ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400",
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
        <div className={cn("mt-4 h-1 w-16 rounded-full", styles.bg, styles.text)} />
      </CardContent>
    </Card>
  );
}
