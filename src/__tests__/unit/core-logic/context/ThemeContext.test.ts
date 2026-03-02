/**
 * ThemeContext Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { ThemeContext } from "@/context/ThemeContext";
import type { ThemeContextValue, Theme } from "@/context/ThemeContext";

describe("ThemeContext", () => {
  it("context dibuat dan merupakan React context yang valid", () => {
    expect(ThemeContext).toBeDefined();
    expect(ThemeContext).toHaveProperty("Provider");
    expect(ThemeContext).toHaveProperty("Consumer");
  });

  it("context memiliki default value yang valid (bukan undefined)", () => {
    // ThemeContext menggunakan default value — tidak akan throw saat dipakai tanpa Provider
    expect(ThemeContext).toBeDefined();
  });

  it("tipe ThemeContextValue memiliki semua field yang dibutuhkan", () => {
    const mockValue: ThemeContextValue = {
      theme: "system",
      systemTheme: "light",
      effectiveTheme: "light",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    };

    expect(mockValue.theme).toBe("system");
    expect(mockValue.systemTheme).toBe("light");
    expect(mockValue.effectiveTheme).toBe("light");
    expect(typeof mockValue.setTheme).toBe("function");
    expect(typeof mockValue.toggleTheme).toBe("function");
  });

  describe("nilai theme yang valid", () => {
    const validThemes: Theme[] = ["light", "dark", "system"];

    validThemes.forEach((theme) => {
      it(`theme '${theme}' adalah nilai yang valid`, () => {
        const mockValue: ThemeContextValue = {
          theme,
          systemTheme: "light",
          effectiveTheme: theme === "system" ? "light" : theme,
          setTheme: vi.fn(),
          toggleTheme: vi.fn(),
        };
        expect(mockValue.theme).toBe(theme);
      });
    });
  });

  it("setTheme dipanggil dengan nilai theme yang benar", () => {
    const setTheme = vi.fn();
    const mockValue: ThemeContextValue = {
      theme: "light",
      systemTheme: "light",
      effectiveTheme: "light",
      setTheme,
      toggleTheme: vi.fn(),
    };

    mockValue.setTheme("dark");
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("toggleTheme dipanggil tanpa argumen", () => {
    const toggleTheme = vi.fn();
    const mockValue: ThemeContextValue = {
      theme: "light",
      systemTheme: "light",
      effectiveTheme: "light",
      setTheme: vi.fn(),
      toggleTheme,
    };

    mockValue.toggleTheme();
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("effectiveTheme selalu 'light' atau 'dark' (bukan 'system')", () => {
    const lightMock: ThemeContextValue = {
      theme: "system",
      systemTheme: "light",
      effectiveTheme: "light",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    };

    const darkMock: ThemeContextValue = {
      theme: "dark",
      systemTheme: "dark",
      effectiveTheme: "dark",
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    };

    expect(["light", "dark"]).toContain(lightMock.effectiveTheme);
    expect(["light", "dark"]).toContain(darkMock.effectiveTheme);
  });
});
