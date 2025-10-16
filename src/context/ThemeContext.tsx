/**
 * Theme Context
 * Context for theme (dark/light mode) management
 */

import { createContext } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  systemTheme: 'light' | 'dark';
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);