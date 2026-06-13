/**
 * ChartCard wraps dashboard charts with loading, empty, and period controls.
 */

import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ChartPeriod = "7d" | "30d" | "semester";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  period?: ChartPeriod;
  onPeriodChange?: (p: ChartPeriod) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  children: ReactNode;
  className?: string;
}

const periodLabels: Record<ChartPeriod, string> = {
  "7d": "7 hari",
  "30d": "30 hari",
  semester: "Semester",
};

export function ChartCard({
  title,
  subtitle,
  period,
  onPeriodChange,
  isLoading = false,
  isEmpty = false,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-bg-primary p-5 shadow-sm",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-heading text-text-primary">{title}</h2>
          {subtitle ? (
            <p className="text-small mt-1 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {period && onPeriodChange ? (
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger
              className="h-9 w-full min-w-32 sm:w-36"
              aria-label={`Periode ${title}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(periodLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {isLoading ? (
        <Skeleton className="h-[200px] w-full rounded-lg" />
      ) : isEmpty ? (
        <EmptyState
          variant="no-data"
          context="chart"
          title="Belum ada data grafik"
          description="Data akan muncul setelah aktivitas terkait tersedia."
          className="my-0 max-w-none border-border/70 bg-muted/20 py-8"
        />
      ) : (
        children
      )}
    </section>
  );
}

export default ChartCard;
