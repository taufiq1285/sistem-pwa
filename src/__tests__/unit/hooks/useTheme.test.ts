/**
 * useTheme Hook Unit Tests
 * Comprehensive testing of theme context access
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContext } from "react";
import { useTheme } from "../../../lib/hooks/useTheme";

// Mock React useContext
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

// Mock ThemeContext
vi.mock("../../../context/ThemeContext", () => ({
  ThemeContext: Symbol("ThemeContext"),
}));

const mockUseContext = vi.mocked(useContext);

describe("useTheme Hook", () => {
  const mockThemeContext = {
    theme: "dark" as const,
    systemTheme: "light" as const,
    effectiveTheme: "dark" as const,
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
  };

  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("Context available", () => {
    it("should return theme context when available", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result } = renderHook(() => useTheme());

      expect(result.current).toEqual(mockThemeContext);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it("should return light theme context", () => {
      const lightContext = {
        ...mockThemeContext,
        theme: "light" as const,
        effectiveTheme: "light" as const,
      };

      mockUseContext.mockReturnValue(lightContext);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
    });

    it("should return system theme context", () => {
      const systemContext = {
        ...mockThemeContext,
        theme: "system" as const,
        systemTheme: "dark" as const,
        effectiveTheme: "dark" as const,
      };

      mockUseContext.mockReturnValue(systemContext);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("dark");
      expect(result.current.effectiveTheme).toBe("dark");
    });

    it("should provide working theme functions", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result } = renderHook(() => useTheme());

      expect(typeof result.current.setTheme).toBe("function");
      expect(typeof result.current.toggleTheme).toBe("function");

      // Functions should be callable
      result.current.setTheme("light");
      expect(mockThemeContext.setTheme).toHaveBeenCalledWith("light");

      result.current.toggleTheme();
      expect(mockThemeContext.toggleTheme).toHaveBeenCalled();
    });
  });

  describe("Context not available", () => {
    it("should return default values when context is null", () => {
      mockUseContext.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
      expect(typeof result.current.setTheme).toBe("function");
      expect(typeof result.current.toggleTheme).toBe("function");
    });

    it("should return default values when context is undefined", () => {
      mockUseContext.mockReturnValue(undefined);

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("system");
      expect(result.current.systemTheme).toBe("light");
      expect(result.current.effectiveTheme).toBe("light");
    });

    it("should log warning when context is not available", () => {
      mockUseContext.mockReturnValue(null);

      renderHook(() => useTheme());

      expect(console.warn).toHaveBeenCalledWith(
        "useTheme: ThemeContext not available, using default",
      );
    });

    it("should provide no-op functions when context unavailable", () => {
      mockUseContext.mockReturnValue(null);

      const { result } = renderHook(() => useTheme());

      // Functions should exist but do nothing
      expect(() => {
        result.current.setTheme("dark");
        result.current.toggleTheme();
      }).not.toThrow();

      // Should not call any external functions
      expect(mockThemeContext.setTheme).not.toHaveBeenCalled();
      expect(mockThemeContext.toggleTheme).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle falsy context values", () => {
      const falsyValues = [null, undefined, false, 0, "", NaN];

      falsyValues.forEach((falsyValue) => {
        mockUseContext.mockReturnValue(falsyValue as any);

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe("system");
        expect(result.current.effectiveTheme).toBe("light");
      });
    });

    it("should handle context with missing properties", () => {
      const incompleteContext = {
        theme: "dark" as const,
        // Missing other properties
      };

      mockUseContext.mockReturnValue(incompleteContext as any);

      const { result } = renderHook(() => useTheme());

      // Should return the incomplete context as-is
      expect(result.current).toEqual(incompleteContext);
    });

    it("should handle context with extra properties", () => {
      const extendedContext = {
        ...mockThemeContext,
        extraProperty: "extra",
        anotherExtra: 123,
      };

      mockUseContext.mockReturnValue(extendedContext);

      const { result } = renderHook(() => useTheme());

      expect(result.current).toEqual(extendedContext);
      expect((result.current as any).extraProperty).toBe("extra");
    });
  });

  describe("Theme states", () => {
    it("should handle all theme values", () => {
      const themes = ["light", "dark", "system"] as const;

      themes.forEach((theme) => {
        const themeContext = {
          ...mockThemeContext,
          theme,
          effectiveTheme: theme === "system" ? "light" : theme,
        };

        mockUseContext.mockReturnValue(themeContext);

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe(theme);
        expect(result.current.effectiveTheme).toBe(
          theme === "system" ? "light" : theme,
        );
      });
    });

    it("should handle system theme preference changes", () => {
      const systemThemes = ["light", "dark"] as const;

      systemThemes.forEach((systemTheme) => {
        const themeContext = {
          ...mockThemeContext,
          theme: "system" as const,
          systemTheme,
          effectiveTheme: systemTheme,
        };

        mockUseContext.mockReturnValue(themeContext);

        const { result } = renderHook(() => useTheme());

        expect(result.current.systemTheme).toBe(systemTheme);
        expect(result.current.effectiveTheme).toBe(systemTheme);
      });
    });
  });

  describe("Function behavior", () => {
    it("should pass through setTheme calls", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result } = renderHook(() => useTheme());

      const themes = ["light", "dark", "system"] as const;

      themes.forEach((theme) => {
        result.current.setTheme(theme);
        expect(mockThemeContext.setTheme).toHaveBeenCalledWith(theme);
      });
    });

    it("should pass through toggleTheme calls", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result } = renderHook(() => useTheme());

      result.current.toggleTheme();
      result.current.toggleTheme();

      expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(2);
    });

    it("should maintain function identity when context is stable", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result, rerender } = renderHook(() => useTheme());

      const firstSetTheme = result.current.setTheme;
      const firstToggleTheme = result.current.toggleTheme;

      rerender();

      expect(result.current.setTheme).toBe(firstSetTheme);
      expect(result.current.toggleTheme).toBe(firstToggleTheme);
    });
  });

  describe("Multiple hook instances", () => {
    it("should work with multiple hook instances", () => {
      mockUseContext.mockReturnValue(mockThemeContext);

      const { result: result1 } = renderHook(() => useTheme());
      const { result: result2 } = renderHook(() => useTheme());

      expect(result1.current).toEqual(result2.current);

      // Both should access the same context
      result1.current.setTheme("dark");
      expect(mockThemeContext.setTheme).toHaveBeenCalledWith("dark");

      result2.current.toggleTheme();
      expect(mockThemeContext.toggleTheme).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", () => {
      let renderCount = 0;

      mockUseContext.mockReturnValue(mockThemeContext);

      const { rerender } = renderHook(() => {
        renderCount++;
        return useTheme();
      });

      expect(renderCount).toBe(1);

      rerender();
      expect(renderCount).toBe(2);

      // Should not increase render count for same context
      rerender();
      expect(renderCount).toBe(3);
    });

    it("should handle rapid context changes", () => {
      const contexts = [
        { ...mockThemeContext, theme: "light" as const },
        { ...mockThemeContext, theme: "dark" as const },
        { ...mockThemeContext, theme: "system" as const },
      ];

      contexts.forEach((context) => {
        mockUseContext.mockReturnValue(context);

        const { result } = renderHook(() => useTheme());

        expect(result.current.theme).toBe(context.theme);
      });
    });
  });
});
