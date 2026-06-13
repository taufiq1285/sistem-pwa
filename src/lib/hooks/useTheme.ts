/**
 * useTheme Hook
 * Custom hook to access theme context
 */

import { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import logger from "@/lib/utils/logger";

export function useTheme() {
  const context = useContext(ThemeContext);

  // Context now has default value, so it should never be null/undefined
  // But we still check for safety
  if (!context) {
    logger.debug("useTheme: ThemeContext not available, using default");
    return {
      theme: "system" as const,
      setTheme: () => {},
      resolvedTheme: "light" as const,
    };
  }

  return context;
}
