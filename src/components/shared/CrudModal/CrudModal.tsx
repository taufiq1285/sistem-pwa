/**
 * CrudModal Component
 * Base modal component for CRUD operations
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { CrudModalProps, ModalSize } from './CrudModal.types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  full: 'sm:max-w-[95vw]',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  children,
  showFooter = true,
  footerContent,
  className,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}: CrudModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MODAL_SIZE_CLASSES[size], className)}
        onPointerDownOutside={(e) => {
          if (!closeOnOutsideClick) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!closeOnEscape) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="py-4">{children}</div>

        {/* Footer */}
        {showFooter && footerContent && (
          <DialogFooter>{footerContent}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CrudModal;