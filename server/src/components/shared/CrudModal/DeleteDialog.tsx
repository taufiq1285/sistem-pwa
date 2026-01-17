/**
 * DeleteDialog Component
 * Confirmation dialog for delete operations
 */

import { useState } from "react";
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
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeleteDialogProps } from "./CrudModal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function DeleteDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description,
  itemName = "item",
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "danger",
  children,
  className,
}: DeleteDialogProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error("Delete failed:", error);
      // Keep dialog open on error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const loading = isLoading || isDeleting;

  // Default description if not provided
  const defaultDescription =
    description ||
    `This action cannot be undone. This will permanently delete the ${itemName}.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(className)}>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {/* Icon based on variant */}
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                variant === "danger" && "bg-destructive/10 text-destructive",
                variant === "warning" && "bg-yellow-500/10 text-yellow-500",
              )}
            >
              {variant === "danger" ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>

            {/* Title */}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>

          {/* Description */}
          <AlertDialogDescription className="pt-2">
            {defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Custom Content */}
        {children && <div className="py-4">{children}</div>}

        {/* Footer Actions */}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              variant === "danger" && "bg-destructive hover:bg-destructive/90",
              variant === "warning" && "bg-yellow-500 hover:bg-yellow-500/90",
            )}
          >
            {loading ? "Deleting..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DeleteDialog;
