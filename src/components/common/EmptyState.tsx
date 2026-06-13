import {
  IconInbox,
  IconSearchOff,
  IconWifiOff,
  IconAlertTriangle,
  IconSparkles,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

export type EmptyStateVariant =
  | "no-data"
  | "no-results"
  | "offline"
  | "error"
  | "first-time";

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  context?: string; // nama entity: "kuis", "materi", dll
  title?: string; // override judul default
  description?: string; // override deskripsi default
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const getContextDescription = (context?: string): string => {
  if (!context) return "Data tidak tersedia.";
  const key = context.toLowerCase().trim();

  switch (key) {
    case "kuis":
    case "tugas praktikum":
      return "Buat kuis pertama untuk mulai mengevaluasi mahasiswamu";
    case "materi":
    case "materi pembelajaran":
      return "Upload materi agar mahasiswa bisa belajar kapan saja";
    case "mahasiswa":
      return "Belum ada mahasiswa terdaftar di kelas ini";
    case "peralatan":
    case "inventaris":
      return "Tambahkan peralatan untuk mulai mengelola inventaris lab";
    case "jadwal":
      return "Belum ada jadwal yang dibuat untuk periode ini";
    case "nilai":
    case "nilai akademik":
      return "Nilai akan muncul setelah kuis atau tugas dinilai";
    case "logbook":
      return "Logbook akan muncul setelah mahasiswa mengisinya";
    default:
      return `Belum ada data ${context} yang tersedia saat ini.`;
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EmptyState({
  variant,
  context,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  // Determine Icon, Title, and Description based on variant
  let Icon = IconInbox;
  let defaultTitle = "";
  let defaultDescription = "";
  let iconColorClass = "text-text-muted";
  let iconBgClass = "bg-muted/10";

  switch (variant) {
    case "no-data":
      Icon = IconInbox;
      defaultTitle = `Belum ada ${context ?? "data"}`;
      defaultDescription = getContextDescription(context);
      iconColorClass = "text-text-secondary";
      iconBgClass = "bg-slate-100 dark:bg-slate-800";
      break;

    case "no-results":
      Icon = IconSearchOff;
      defaultTitle = "Tidak ada hasil";
      defaultDescription = "Coba kata kunci lain atau hapus filter yang aktif";
      iconColorClass = "text-amber-600 dark:text-amber-400";
      iconBgClass = "bg-amber-50 dark:bg-amber-950/20";
      break;

    case "offline":
      Icon = IconWifiOff;
      defaultTitle = "Tidak ada koneksi";
      defaultDescription =
        "Data ini belum tersimpan offline. Sambungkan internet lalu sync ulang.";
      iconColorClass = "text-blue-600 dark:text-blue-400";
      iconBgClass = "bg-blue-50 dark:bg-blue-950/20";
      break;

    case "error":
      Icon = IconAlertTriangle;
      defaultTitle = "Terjadi kesalahan";
      defaultDescription =
        description ?? "Gagal memuat data. Silakan coba beberapa saat lagi.";
      iconColorClass = "text-destructive";
      iconBgClass = "bg-destructive/10";
      break;

    case "first-time":
      Icon = IconSparkles;
      defaultTitle = "Selamat datang!";
      defaultDescription = getContextDescription(context);
      // Use role-accent color (dynamically maps to var(--role-accent) / text-primary)
      iconColorClass = "text-primary";
      iconBgClass = "bg-primary/10";
      break;
  }

  const displayTitle = title ?? defaultTitle;
  const displayDescription = description ?? defaultDescription;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-border-light bg-card/50 backdrop-blur-xs shadow-xs transition-all max-w-lg mx-auto my-4",
        className,
      )}
    >
      {/* Icon Wrapper */}
      <div
        className={cn(
          "p-4 rounded-2xl mb-4 flex items-center justify-center",
          iconBgClass,
        )}
      >
        <Icon className={cn("h-10 w-10 stroke-[1.5]", iconColorClass)} />
      </div>

      {/* Header */}
      <h3 className="text-xl font-bold text-text-primary tracking-tight mb-2">
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p className="text-sm font-medium text-text-secondary max-w-sm leading-relaxed mb-6">
          {displayDescription}
        </p>
      )}

      {/* Action Buttons */}
      {(onAction || onSecondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              type="button"
              variant="outline"
              onClick={onSecondaryAction}
              className="border-2 font-semibold shadow-xs"
            >
              {secondaryActionLabel}
            </Button>
          )}
          {onAction && actionLabel && (
            <Button
              type="button"
              onClick={onAction}
              className="bg-primary hover:bg-primary-foreground/90 text-primary-foreground font-semibold shadow-sm"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
