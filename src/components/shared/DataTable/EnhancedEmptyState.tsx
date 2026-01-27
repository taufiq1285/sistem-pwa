/**
 * Enhanced Empty State Component
 * Provides visual empty states with icons and CTAs
 */

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EnhancedEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EnhancedEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} className="font-semibold">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptyNoData({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia untuk saat ini.",
  action,
}: Partial<EnhancedEmptyStateProps>) {
  return (
    <EnhancedEmptyState
      icon={undefined}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function EmptySearchResults({ onClear }: { onClear?: () => void }) {
  return (
    <EnhancedEmptyState
      title="Tidak ada hasil ditemukan"
      description="Coba ubah kata kunci pencarian atau filter yang digunakan."
      action={
        onClear ? { label: "Hapus Pencarian", onClick: onClear } : undefined
      }
    />
  );
}

export function EmptyError({
  message = "Terjadi kesalahan",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Kesalahan Memuat Data
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="font-semibold">
          Coba Lagi
        </Button>
      )}
    </div>
  );
}
