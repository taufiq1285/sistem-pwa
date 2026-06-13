/**
 * Theme Context
 * Context for theme (dark/light mode) management
 */

import { createContext } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

// ============================================================================
// CONTEXT
// ============================================================================

// Provide a default value to prevent null/undefined errors
const defaultThemeContext: ThemeContextValue = {
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
};

export const ThemeContext =
  createContext<ThemeContextValue>(defaultThemeContext);
