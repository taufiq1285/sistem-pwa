/**
 * CrudModal Types & Interfaces
 * Type definitions for CRUD modal components
 */

import type { ReactNode } from "react";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Modal Size Options
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Modal Mode
 */
export type ModalMode = "create" | "edit" | "view" | "delete";

/**
 * Form Submit Status
 */
export type SubmitStatus = "idle" | "submitting" | "success" | "error";

// ============================================================================
// BASE MODAL TYPES
// ============================================================================

/**
 * Base CRUD Modal Props
 */
export interface CrudModalProps {
  // Modal State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Modal Config
  title: string;
  description?: string;
  size?: ModalSize;

  // Content
  children: ReactNode;

  // Footer Actions
  showFooter?: boolean;
  footerContent?: ReactNode;

  // Styling
  className?: string;

  // Behavior
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

// ============================================================================
// CREATE MODAL TYPES
// ============================================================================

/**
 * Create Modal Props
 */
export interface CreateModalProps<TFormData = Record<string, unknown>> {
  // Modal State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Form Config
  title?: string;
  description?: string;
  size?: ModalSize;

  // Form Handling
  onSubmit: (data: TFormData) => Promise<void> | void;
  defaultValues?: Partial<TFormData>;

  // Form Content
  children: ReactNode | ((form: unknown) => ReactNode);

  // Submit Button
  submitLabel?: string;
  cancelLabel?: string;

  // Loading State
  isLoading?: boolean;

  // Validation
  validationSchema?: unknown; // Zod schema

  // Styling
  className?: string;
}

// ============================================================================
// EDIT MODAL TYPES
// ============================================================================

/**
 * Edit Modal Props
 */
export interface EditModalProps<TFormData = Record<string, unknown>> {
  // Modal State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Form Config
  title?: string;
  description?: string;
  size?: ModalSize;

  // Data
  data: TFormData | null;

  // Form Handling
  onSubmit: (data: TFormData) => Promise<void> | void;

  // Form Content
  children: ReactNode | ((form: unknown, data: TFormData) => ReactNode);

  // Submit Button
  submitLabel?: string;
  cancelLabel?: string;

  // Loading State
  isLoading?: boolean;
  isFetching?: boolean;

  // Validation
  validationSchema?: unknown; // Zod schema

  // Styling
  className?: string;
}

// ============================================================================
// DELETE DIALOG TYPES
// ============================================================================

/**
 * Delete Dialog Props
 */
export interface DeleteDialogProps {
  // Dialog State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Content
  title?: string;
  description?: string;
  itemName?: string; // e.g., "User", "Mata Kuliah"

  // Action
  onConfirm: () => Promise<void> | void;

  // Button Labels
  confirmLabel?: string;
  cancelLabel?: string;

  // Loading State
  isLoading?: boolean;

  // Variant
  variant?: "danger" | "warning";

  // Custom Content
  children?: ReactNode;

  // Styling
  className?: string;
}

// ============================================================================
// BULK DELETE DIALOG TYPES
// ============================================================================

/**
 * Bulk Delete Dialog Props
 */
export interface BulkDeleteDialogProps {
  // Dialog State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Items to Delete
  selectedCount: number;
  itemName?: string; // e.g., "users", "mata kuliah"

  // Action
  onConfirm: () => Promise<void> | void;

  // Button Labels
  confirmLabel?: string;
  cancelLabel?: string;

  // Loading State
  isLoading?: boolean;

  // Custom Content
  children?: ReactNode;

  // Styling
  className?: string;
}

// ============================================================================
// VIEW MODAL TYPES
// ============================================================================

/**
 * View Modal Props (Read-only)
 */
export interface ViewModalProps<TData = Record<string, unknown>> {
  // Modal State
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Config
  title?: string;
  description?: string;
  size?: ModalSize;

  // Data
  data: TData | null;

  // Content
  children: ReactNode | ((data: TData) => ReactNode);

  // Footer Actions (optional)
  footerActions?: ReactNode;

  // Loading State
  isLoading?: boolean;

  // Styling
  className?: string;
}

// ============================================================================
// FORM FIELD TYPES
// ============================================================================

/**
 * Generic Form Field Configuration
 */
export interface FormFieldConfig {
  name: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "date";
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  options?: Array<{ label: string; value: string | number }>;
  rows?: number; // for textarea
  min?: number;
  max?: number;
  pattern?: string;
  defaultValue?: unknown;
}

// ============================================================================
// MODAL ACTION TYPES
// ============================================================================

/**
 * Modal Action Button Configuration
 */
export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// MODAL STATE TYPES
// ============================================================================

/**
 * Modal State Management
 */
export interface ModalState {
  mode: ModalMode;
  isOpen: boolean;
  data: unknown | null;
  isSubmitting: boolean;
  error: string | null;
}

/**
 * Modal Actions
 */
export interface ModalActions {
  openCreate: () => void;
  openEdit: (data: unknown) => void;
  openView: (data: unknown) => void;
  openDelete: (data: unknown) => void;
  close: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Size Class Mapping
 */
export const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
};

/**
 * Modal Animation Variants
 */
export type ModalAnimation = "fade" | "slide" | "zoom";

// ============================================================================
// EXPORT HELPER TYPES
// ============================================================================

/**
 * Generic CRUD Operation Result
 */
export interface CrudResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Generic CRUD Handlers
 */
export interface CrudHandlers<T = unknown> {
  onCreate?: (data: T) => Promise<CrudResult<T>>;
  onUpdate?: (id: string | number, data: T) => Promise<CrudResult<T>>;
  onDelete?: (id: string | number) => Promise<CrudResult>;
  onView?: (id: string | number) => Promise<CrudResult<T>>;
}
