/**
 * Common Components Module
 * Exports all reusable common components
 */

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export { PageHeader } from "./PageHeader";
export type { default as PageHeaderProps } from "./PageHeader";

// ============================================================================
// FEEDBACK COMPONENTS
// ============================================================================

export { LoadingSpinner } from "./LoadingSpinner";
export type { default as LoadingSpinnerProps } from "./LoadingSpinner";

export { EmptyState } from "./EmptyState";
export type { default as EmptyStateProps } from "./EmptyState";

// ============================================================================
// ERROR HANDLING COMPONENTS
// ============================================================================

export { ErrorBoundary } from "./ErrorBoundary";
export type { default as ErrorBoundaryProps } from "./ErrorBoundary";

export { ErrorFallback } from "./ErrorFallback";
export type { default as ErrorFallbackProps } from "./ErrorFallback";

// ============================================================================
// DIALOG COMPONENTS
// ============================================================================

export { ConfirmDialog } from "./ConfirmDialog";
export type { default as ConfirmDialogProps } from "./ConfirmDialog";

// ============================================================================
// AUTH & ROUTE GUARDS
// ============================================================================

export { ProtectedRoute } from "./ProtectedRoute";
export { RoleGuard } from "./RoleGuard";

// ============================================================================
// OFFLINE & SYNC COMPONENTS
// ============================================================================

// ============================================================================
// NOTIFICATION COMPONENTS
// ============================================================================

export { NotificationDropdown } from "./NotificationDropdown";
// export { NotificationBell } from './NotificationBell';
//export { UpdatePrompt } from './UpdatePrompt';
