/**
 * Theme Provider
 * Provides theme state and injects the active theme into the document root.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import logger from "@/lib/utils/logger";
import { ThemeContext, type Theme } from "@/context/ThemeContext";

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_STORAGE_KEY = "sipraktik-theme";
const THEME_QUERY = "(prefers-color-scheme: dark)";

// ============================================================================
// HELPERS
// ============================================================================

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  if (typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(THEME_QUERY).matches ? "dark" : "light";
}

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch (error) {
    logger.debug("ThemeProvider: failed to read stored theme", error);
  }

  return null;
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    logger.debug("ThemeProvider: failed to persist theme", error);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps): ReactElement {
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme() ?? defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    getSystemTheme(),
  );

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia(THEME_QUERY);

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    return theme === "system" ? systemTheme : theme;
  }, [theme, systemTheme]);

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.style.colorScheme = resolvedTheme;

    return () => {
      root.removeAttribute("data-theme");
      root.style.removeProperty("color-scheme");
    };
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
    persistTheme(newTheme);
  }, []);

  const value = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
