/**
 * useTheme Hook
 * Custom hook to access theme context
 */

import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";

export function useTheme() {
  const context = useContext(ThemeContext);

  // Context now has default value, so it should never be null/undefined
  // But we still check for safety
  if (!context) {
    console.warn("useTheme: ThemeContext not available, using default");
    return {
      theme: "system" as const,
      systemTheme: "light" as const,
      effectiveTheme: "light" as const,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }

  return context;
}
