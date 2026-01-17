/**
 * CreateModal Component
 * Modal with form for creating new data
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CrudModal } from "./CrudModal";
import type { CreateModalProps } from "./CrudModal.types";

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateModal<TFormData = Record<string, unknown>>({
  open,
  onOpenChange,
  title = "Create New",
  description,
  size = "md",
  onSubmit,
  defaultValues,
  children,
  submitLabel = "Create",
  cancelLabel = "Cancel",
  isLoading = false,
  className,
}: CreateModalProps<TFormData>) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries()) as unknown as TFormData;

    try {
      setIsSubmitting(true);
      await onSubmit(data);

      // Close modal on success
      onOpenChange(false);

      // Reset form
      e.currentTarget.reset();
    } catch (error) {
      console.error("Create failed:", error);
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
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" form="create-form" disabled={loading}>
            {loading ? "Creating..." : submitLabel}
          </Button>
        </>
      }
    >
      <form id="create-form" onSubmit={handleSubmit} className="space-y-4">
        {typeof children === "function" ? children(defaultValues) : children}
      </form>
    </CrudModal>
  );
}

export default CreateModal;
