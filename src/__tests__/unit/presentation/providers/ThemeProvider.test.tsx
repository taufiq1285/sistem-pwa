/**
 * ThemeProvider Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  renderHook,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ThemeContext } from "@/context/ThemeContext";
import { useContext } from "react";

// Custom render function that includes ThemeProvider
function renderWithThemeProvider(
  ui: React.ReactNode,
  {
    defaultTheme = "system",
  }: { defaultTheme?: "light" | "dark" | "system" } = {},
) {
  return {
    ...render(<ThemeProvider defaultTheme={defaultTheme}>{ui}</ThemeProvider>),
  };
}

// Helper hook to test context values
function useThemeContext() {
  return useContext(ThemeContext);
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should initialize with system theme", () => {
      // Mock window.matchMedia to return dark theme
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });

    it("should restore saved theme preference", () => {
      // Save a theme preference in localStorage
      localStorage.setItem("theme-preference", "dark");

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });

    it("should use default theme when no saved preference", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
    });

    it("should use default theme when saved preference is invalid", () => {
      localStorage.setItem("theme-preference", "invalid" as any);

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
        ),
      });

      // Should fall back to default theme
      expect(result.current.theme).toBe("dark");
    });
  });

  describe("theme switching", () => {
    it("should switch to dark theme", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("light");

      // Switch to dark theme
      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
      expect(localStorage.getItem("theme-preference")).toBe("dark");
    });

    it("should switch to light theme", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("dark");

      // Switch to light theme
      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
      expect(localStorage.getItem("theme-preference")).toBe("light");
    });

    it("should switch to system theme", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      // Switch to system theme
      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.theme).toBe("system");
      expect(result.current.effectiveTheme).toBe(result.current.systemTheme);
    });

    it("should persist theme preference", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      // Change theme multiple times
      act(() => {
        result.current.setTheme("dark");
      });
      expect(localStorage.getItem("theme-preference")).toBe("dark");

      act(() => {
        result.current.setTheme("light");
      });
      expect(localStorage.getItem("theme-preference")).toBe("light");

      act(() => {
        result.current.setTheme("system");
      });
      expect(localStorage.getItem("theme-preference")).toBe("system");
    });

    it("should apply theme class to document element", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false, // Light theme
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      renderWithThemeProvider(<div>Test</div>, { defaultTheme: "light" });

      // Check if light class is applied
      const rootElement = document.documentElement;
      expect(rootElement.classList.contains("light")).toBe(true);
      expect(rootElement.classList.contains("dark")).toBe(false);
    });

    it("should toggle between light and dark", () => {
      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      expect(result.current.theme).toBe("light");

      // Toggle to dark
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("dark");

      // Toggle back to light
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("light");
    });
  });

  describe("system theme detection", () => {
    it("should detect system theme changes", async () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        const mediaQueryList = {
          matches: false, // Initially light
          media: query,
          onchange: null,
          addListener: vi.fn(), // Deprecated
          removeListener: vi.fn(), // Deprecated
          addEventListener: vi.fn((event: string, callback: any) => {
            if (event === "change") {
              mediaQueryCallback = callback;
            }
          }),
          removeEventListener: vi.fn((event: string, callback: any) => {
            if (event === "change" && callback === mediaQueryCallback) {
              mediaQueryCallback = null;
            }
          }),
          dispatchEvent: vi.fn(),
        };
        return mediaQueryList;
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      // Initial state should be light
      expect(result.current.systemTheme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");

      // Simulate system theme change to dark
      act(() => {
        const mockEvent = {
          matches: true,
          media: "(prefers-color-scheme: dark)",
        } as MediaQueryListEvent;

        mediaQueryCallback?.(mockEvent);
      });

      // System theme should update
      expect(result.current.systemTheme).toBe("dark");
      // Effective theme should also update since theme is "system"
      expect(result.current.effectiveTheme).toBe("dark");
    });

    it("should auto-switch when system theme is preferred", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: true, // Dark theme
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      // When theme is set to "system", effective theme should match system
      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });

    it("should not auto-switch when theme is explicitly set", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: true, // System is dark
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      // Explicitly set to light theme
      act(() => {
        result.current.setTheme("light");
      });

      // Effective theme should be light, not system dark
      expect(result.current.theme).toBe("light");
      expect(result.current.systemTheme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("light");
    });

    it("should update effective theme when switching from system to explicit", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false, // System is light
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      // Start with system theme
      expect(result.current.theme).toBe("system");
      expect(result.current.effectiveTheme).toBe("light");

      // Switch to dark
      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });
  });

  describe("context provider", () => {
    it("should provide theme context to children", () => {
      const TestComponent = () => {
        const theme = useContext(ThemeContext);
        return (
          <div>
            <span data-testid="theme">{theme.theme}</span>
            <span data-testid="effective">{theme.effectiveTheme}</span>
          </div>
        );
      };

      renderWithThemeProvider(<TestComponent />, { defaultTheme: "dark" });

      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(screen.getByTestId("effective").textContent).toBe("dark");
    });

    it("should update all consumers when theme changes", () => {
      const TestComponent = () => {
        const theme = useContext(ThemeContext);
        return <div data-testid="theme">{theme.effectiveTheme}</div>;
      };

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">
            <TestComponent />
            {children}
          </ThemeProvider>
        ),
      });

      // Both the hook and component should show light
      expect(screen.getByTestId("theme").textContent).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");

      // Change theme
      act(() => {
        result.current.setTheme("dark");
      });

      // Both should update to dark
      expect(screen.getByTestId("theme").textContent).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });
  });

  describe("document class management", () => {
    it("should remove old theme class and add new one", () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
        ),
      });

      const rootElement = document.documentElement;

      // Initially light
      expect(rootElement.classList.contains("light")).toBe(true);
      expect(rootElement.classList.contains("dark")).toBe(false);

      // Switch to dark
      act(() => {
        result.current.setTheme("dark");
      });

      // Should be dark now
      expect(rootElement.classList.contains("light")).toBe(false);
      expect(rootElement.classList.contains("dark")).toBe(true);
    });

    it("should handle system theme changes on document element", async () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMatchMedia = vi.fn().mockImplementation((query) => {
        return {
          matches: false, // Initially light
          media: query,
          addEventListener: vi.fn((event: string, callback: any) => {
            if (event === "change") {
              mediaQueryCallback = callback;
            }
          }),
          removeEventListener: vi.fn(),
        };
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      renderHook(() => useThemeContext(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      });

      const rootElement = document.documentElement;

      // Initially light
      expect(rootElement.classList.contains("light")).toBe(true);

      // Simulate system theme change to dark
      act(() => {
        const mockEvent = {
          matches: true,
          media: "(prefers-color-scheme: dark)",
        } as MediaQueryListEvent;

        mediaQueryCallback?.(mockEvent);
      });

      // Should update to dark
      expect(rootElement.classList.contains("dark")).toBe(true);
      expect(rootElement.classList.contains("light")).toBe(false);
    });
  });
});
