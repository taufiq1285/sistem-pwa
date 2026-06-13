/**
 * Common Components Module
 * Exports all reusable common components
 */

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

export { PageHeader } from "./PageHeader";
export type { default as PageHeaderProps } from "./PageHeader";
export { Breadcrumb } from "./Breadcrumb";
export { ChartCard } from "./ChartCard";
export { CommandPalette } from "./CommandPalette";
export { FileUploadZone } from "./FileUploadZone";
export { FormField } from "./FormField";
export { SubmitButton } from "./SubmitButton";
export { ThemeToggle } from "./ThemeToggle";
export { EmailInput } from "./inputs/EmailInput";
export { PasswordInput } from "./inputs/PasswordInput";
export { SearchInput } from "./inputs/SearchInput";
export { TextareaWithCounter } from "./inputs/TextareaWithCounter";

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
export { OfflineBanner } from "./OfflineBanner";
export { OfflineAwareContent } from "./OfflineAwareContent";

// ============================================================================
// NOTIFICATION COMPONENTS
// ============================================================================

export { NotificationDropdown } from "./NotificationDropdown";
// export { NotificationBell } from './NotificationBell';
export { UpdatePrompt } from "./UpdatePrompt";
export { WelcomeBanner } from "./WelcomeBanner";
export { DashboardChart } from "./DashboardChart";
export { ContentCard } from "./ContentCard";

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================
export { DashboardSkeleton } from "./skeletons/DashboardSkeleton";
export { TableSkeleton } from "./skeletons/TableSkeleton";
export { CardListSkeleton } from "./skeletons/CardListSkeleton";
export { FormSkeleton } from "./skeletons/FormSkeleton";
