/**
 * AppProviders
 *
 * Central wrapper for all application providers
 * Provides proper nesting order and configuration for:
 * - Offline functionality
 * - Sync queue management
 * - Authentication
 * - Theme
 * - Error boundaries
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { OfflineProvider } from './OfflineProvider';
import { SyncProvider } from './SyncProvider';
import { AuthProvider } from './AuthProvider';

// ============================================================================
// TYPES
// ============================================================================

export interface AppProvidersProps {
  children: React.ReactNode;
  /** Enable auto-sync functionality */
  autoSync?: boolean;
  /** Custom error boundary fallback */
  errorFallback?: React.ReactNode;
  /** Disable BrowserRouter (useful for testing) */
  disableRouter?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Central provider wrapper for the application
 *
 * Provider nesting order:
 * 1. ErrorBoundary - Catches and handles errors
 * 2. BrowserRouter - Routing functionality
 * 3. OfflineProvider - Offline/IndexedDB support
 * 4. SyncProvider - Sync queue management
 * 5. AuthProvider - Authentication state
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AppProviders autoSync={true}>
 *       <AppRouter />
 *     </AppProviders>
 *   );
 * }
 * ```
 */
export function AppProviders({
  children,
  autoSync = true,
  errorFallback,
  disableRouter = false,
}: AppProvidersProps) {
  const content = (
    <ErrorBoundary fallback={errorFallback}>
      <OfflineProvider>
        <SyncProvider autoSync={autoSync}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SyncProvider>
      </OfflineProvider>
    </ErrorBoundary>
  );

  if (disableRouter) {
    return content;
  }

  return <BrowserRouter>{content}</BrowserRouter>;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export provider hooks for convenience
export { useOfflineContext } from './OfflineProvider';
export { useSyncContext } from './SyncProvider';
export { useAuth } from '@/lib/hooks/useAuth';

// Re-export types
export type { UseOfflineReturn } from '@/lib/hooks/useOffline';
export type { UseSyncReturn } from '@/lib/hooks/useSync';
