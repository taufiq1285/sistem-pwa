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

// Provide a default value to prevent null/undefined errors
const defaultThemeContext: ThemeContextValue = {
  theme: 'system',
  systemTheme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextValue>(
  defaultThemeContext
);