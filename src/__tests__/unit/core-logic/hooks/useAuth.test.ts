/**
 * useAuth Hook Unit Tests
 *
 * Menguji bahwa useAuth:
 * 1. Mengembalikan nilai context dengan benar
 * 2. Melempar error jika digunakan di luar AuthProvider
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { AuthContext } from "@/context/AuthContext";
import type { AuthContextValue } from "@/context/AuthContext";
import type { AuthUser, AuthSession } from "@/types/auth.types";

const mockUser: AuthUser = {
  id: "user-001",
  email: "test@example.com",
  full_name: "Test User",
  role: "mahasiswa",
  avatar_url: null,
  is_active: true,
  last_seen_at: new Date().toISOString(),
  metadata: {},
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const mockSession: AuthSession = {
  user: mockUser,
  access_token: "access-token-123",
  refresh_token: "refresh-token-123",
  expires_at: Date.now() + 3600000,
};

function buildMockContext(
  overrides: Partial<AuthContextValue> = {},
): AuthContextValue {
  return {
    user: null,
    session: null,
    loading: false,
    initialized: true,
    isAuthenticated: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    refreshSession: vi.fn(),
    hasRole: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}

function makeWrapper(contextValue: AuthContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      AuthContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

describe("useAuth Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("penggunaan di dalam AuthProvider", () => {
    it("mengembalikan user null saat belum login", () => {
      const ctx = buildMockContext({ user: null, isAuthenticated: false });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("mengembalikan user dan session setelah login", () => {
      const ctx = buildMockContext({
        user: mockUser,
        session: mockSession,
        isAuthenticated: true,
      });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("mengembalikan loading: true saat sedang inisialisasi", () => {
      const ctx = buildMockContext({ loading: true, initialized: false });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.initialized).toBe(false);
    });

    it("mengembalikan loading: false setelah selesai inisialisasi", () => {
      const ctx = buildMockContext({ loading: false, initialized: true });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.initialized).toBe(true);
    });
  });

  describe("fungsi-fungsi yang tersedia", () => {
    it("mengekspos fungsi login", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.login).toBe("function");
    });

    it("mengekspos fungsi logout", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.logout).toBe("function");
    });

    it("mengekspos fungsi register", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.register).toBe("function");
    });

    it("mengekspos fungsi resetPassword", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.resetPassword).toBe("function");
    });

    it("mengekspos fungsi updatePassword", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.updatePassword).toBe("function");
    });

    it("mengekspos fungsi refreshSession", () => {
      const ctx = buildMockContext();
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(typeof result.current.refreshSession).toBe("function");
    });
  });

  describe("hasRole", () => {
    it("mengembalikan true jika role cocok", () => {
      const ctx = buildMockContext({
        user: mockUser,
        hasRole: (role: string) => role === "mahasiswa",
      });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.hasRole("mahasiswa")).toBe(true);
      expect(result.current.hasRole("admin")).toBe(false);
    });

    it("mengembalikan false jika user null", () => {
      const ctx = buildMockContext({
        user: null,
        hasRole: vi.fn().mockReturnValue(false),
      });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.hasRole("admin")).toBe(false);
    });
  });

  describe("isAuthenticated", () => {
    it("false saat user null walaupun session ada", () => {
      const ctx = buildMockContext({
        user: null,
        session: mockSession,
        isAuthenticated: false,
      });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("true saat user dan session keduanya ada", () => {
      const ctx = buildMockContext({
        user: mockUser,
        session: mockSession,
        isAuthenticated: true,
      });
      const { result } = renderHook(() => useAuth(), {
        wrapper: makeWrapper(ctx),
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("error handling", () => {
    it("melempar error jika digunakan di luar AuthProvider", () => {
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used within AuthProvider",
      );
    });
  });
});
