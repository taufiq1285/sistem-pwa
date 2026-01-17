/**
 * ConfirmDialog Component
 * Confirmation dialog for important actions
 */

import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

type ConfirmDialogVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  variant?: ConfirmDialogVariant;
  icon?: LucideIcon;
  isLoading?: boolean;
}

// ============================================================================
// VARIANT CONFIGS
// ============================================================================

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-destructive",
    iconBgClass: "bg-destructive/10",
    confirmClass: "bg-destructive hover:bg-destructive/90",
  },
  warning: {
    icon: AlertCircle,
    iconClass: "text-orange-500",
    iconBgClass: "bg-orange-500/10",
    confirmClass: "bg-orange-500 hover:bg-orange-500/90",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-500",
    iconBgClass: "bg-blue-500/10",
    confirmClass: "bg-primary hover:bg-primary/90",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  onConfirm,
  variant = "danger",
  icon,
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = icon || config.icon;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirm action failed:", error);
      // Keep dialog open on error so user can retry
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                config.iconBgClass,
              )}
            >
              <IconComponent className={cn("h-6 w-6", config.iconClass)} />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className={cn(config.confirmClass)}
          >
            {isLoading ? "Memproses..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfirmDialog;
