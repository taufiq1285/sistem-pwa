/**
 * Notification Context
 * Context for toast/notification management using Sonner
 */

import { createContext } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationContextValue {
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  dismiss: (id?: string | number) => void;
  clear: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);
