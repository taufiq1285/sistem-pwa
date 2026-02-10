/**
 * Status Badge Component
 * Menampilkan status jadwal dengan warna yang sesuai
 */

import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import type { LucideProps } from "lucide-react";

export type JadwalStatus = "pending" | "approved" | "rejected" | "cancelled";

interface StatusBadgeProps {
  status: JadwalStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = "sm",
  showIcon = true,
}: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: "Menunggu Approval",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      textColor: "text-yellow-700 dark:text-yellow-400",
      borderColor: "border-yellow-300 dark:border-yellow-700",
      icon: Clock,
    },
    approved: {
      label: "Approved",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-700 dark:text-green-400",
      borderColor: "border-green-300 dark:border-green-700",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Ditolak",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      textColor: "text-red-700 dark:text-red-400",
      borderColor: "border-red-300 dark:border-red-700",
      icon: XCircle,
    },
    cancelled: {
      label: "Dibatalkan",
      bgColor: "bg-gray-100 dark:bg-gray-900/30",
      textColor: "text-gray-700 dark:text-gray-400",
      borderColor: "border-gray-300 dark:border-gray-700",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon as React.ComponentType<LucideProps>;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} rounded-full font-semibold shadow-sm transition-all duration-200`}
    >
      {showIcon && <Icon className={iconSize[size]} />}
      <span>{config.label}</span>
    </span>
  );
}
