/**
 * useTheme Hook Unit Tests
 * Tests the conditional logic for context availability
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { useTheme } from "@/lib/hooks/useTheme";
import { ThemeContext, ThemeContextValue } from "@/context/ThemeContext";

describe("useTheme", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe("context availability logic", () => {
    it("should return context value when context is available", () => {
      const mockContextValue: ThemeContextValue = {
        theme: "dark",
        systemTheme: "dark",
        effectiveTheme: "dark",
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeContext.Provider value={mockContextValue}>
          {children}
        </ThemeContext.Provider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Should return the exact context value
      expect(result.current).toBe(mockContextValue);
      // Should NOT log warning when context is available
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it("should return default fallback when context is null", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeContext.Provider value={null as any}>
          {children}
        </ThemeContext.Provider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Should return hardcoded defaults
      expect(result.current).toEqual({
        theme: "system",
        systemTheme: "light",
        effectiveTheme: "light",
        setTheme: expect.any(Function),
        toggleTheme: expect.any(Function),
      });

      // Should log warning when context is null
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "useTheme: ThemeContext not available, using default",
      );
    });

    it("should return default fallback when context is undefined", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeContext.Provider value={undefined as any}>
          {children}
        </ThemeContext.Provider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Should return hardcoded defaults
      expect(result.current).toEqual({
        theme: "system",
        systemTheme: "light",
        effectiveTheme: "light",
        setTheme: expect.any(Function),
        toggleTheme: expect.any(Function),
      });

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "useTheme: ThemeContext not available, using default",
      );
    });
  });

  describe("fallback behavior", () => {
    it("should return no-op functions that do not throw errors", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeContext.Provider value={null as any}>
          {children}
        </ThemeContext.Provider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Should not throw when calling fallback functions
      expect(() => result.current.setTheme("dark")).not.toThrow();
      expect(() => result.current.toggleTheme()).not.toThrow();
    });

    it("should return exactly the same default object structure", () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ThemeContext.Provider value={null as any}>
          {children}
        </ThemeContext.Provider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      // Verify exact structure matches the code
      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
      expect(typeof result.current.setTheme).toBe("function");
      expect(typeof result.current.toggleTheme).toBe("function");
    });
  });
});
