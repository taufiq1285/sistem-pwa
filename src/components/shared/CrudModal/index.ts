/**
 * CrudModal Module
 * Exports all CRUD modal components and types
 */

// ============================================================================
// COMPONENTS
// ============================================================================

export { CrudModal } from "./CrudModal";
export { CreateModal } from "./CreateModal";
export { EditModal } from "./EditModal";
export { DeleteDialog } from "./DeleteDialog";

// ============================================================================
// TYPES
// ============================================================================

export type {
  CrudModalProps,
  CreateModalProps,
  EditModalProps,
  DeleteDialogProps,
  BulkDeleteDialogProps,
  ViewModalProps,
  ModalSize,
  ModalMode,
  SubmitStatus,
  FormFieldConfig,
  ModalAction,
  ModalState,
  ModalActions,
  ModalAnimation,
  CrudResult,
  CrudHandlers,
} from "./CrudModal.types";

// ============================================================================
// CONSTANTS
// ============================================================================

export { MODAL_SIZE_CLASSES } from "./CrudModal.types";

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export { CrudModal as default } from "./CrudModal";
