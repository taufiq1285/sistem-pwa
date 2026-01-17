/**
 * EditModal Component
 * Modal with form for editing existing data
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CrudModal } from "./CrudModal";
import type { EditModalProps } from "./CrudModal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function EditModal<TFormData = Record<string, unknown>>({
  open,
  onOpenChange,
  title = "Edit",
  description,
  size = "md",
  data,
  onSubmit,
  children,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  isLoading = false,
  isFetching = false,
  className,
}: EditModalProps<TFormData>) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset submitting state when modal closes
  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
    }
  }, [open]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!data) return;

    // Get form data
    const formData = new FormData(e.currentTarget);
    const updatedData = Object.fromEntries(
      formData.entries(),
    ) as unknown as TFormData;

    try {
      setIsSubmitting(true);
      await onSubmit(updatedData);

      // Close modal on success
      onOpenChange(false);
    } catch (error) {
      console.error("Update failed:", error);
      // Keep modal open on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const loading = isLoading || isSubmitting;
  const showContent = !isFetching && data;

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      className={className}
      closeOnOutsideClick={!loading}
      closeOnEscape={!loading}
      footerContent={
        showContent && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" form="edit-form" disabled={loading}>
              {loading ? "Saving..." : submitLabel}
            </Button>
          </>
        )
      }
    >
      {/* Loading State */}
      {isFetching && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" text="Loading data..." />
        </div>
      )}

      {/* No Data State */}
      {!isFetching && !data && (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No data available</p>
        </div>
      )}

      {/* Form Content */}
      {showContent && (
        <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
          {typeof children === "function" ? children(data, data) : children}
        </form>
      )}
    </CrudModal>
  );
}

export default EditModal;
