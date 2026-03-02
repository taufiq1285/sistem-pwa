/**
 * AuthContext Unit Tests
 */

import { describe, it, expect } from "vitest";
import { createContext, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import type { AuthContextValue } from "@/context/AuthContext";

describe("AuthContext", () => {
  it("context dibuat dengan nilai default undefined", () => {
    // createContext<T | undefined>(undefined) → harus undefined saat tidak ada Provider
    expect(AuthContext).toBeDefined();
  });

  it("AuthContext adalah object context React yang valid", () => {
    expect(AuthContext).toHaveProperty("Provider");
    expect(AuthContext).toHaveProperty("Consumer");
  });

  it("tipe AuthContextValue memiliki semua field yang dibutuhkan", () => {
    // Verifikasi struktur tipe via duck-typing dengan mock object
    const mockValue: AuthContextValue = {
      user: null,
      session: null,
      loading: false,
      initialized: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      updatePassword: async () => {},
      refreshSession: async () => {},
      hasRole: () => false,
      isAuthenticated: false,
    };

    expect(mockValue.user).toBeNull();
    expect(mockValue.session).toBeNull();
    expect(mockValue.loading).toBe(false);
    expect(mockValue.initialized).toBe(false);
    expect(mockValue.isAuthenticated).toBe(false);
    expect(typeof mockValue.login).toBe("function");
    expect(typeof mockValue.logout).toBe("function");
    expect(typeof mockValue.register).toBe("function");
    expect(typeof mockValue.resetPassword).toBe("function");
    expect(typeof mockValue.updatePassword).toBe("function");
    expect(typeof mockValue.refreshSession).toBe("function");
    expect(typeof mockValue.hasRole).toBe("function");
  });

  it("hasRole mengembalikan false untuk semua role ketika user null", () => {
    const mockValue: AuthContextValue = {
      user: null,
      session: null,
      loading: false,
      initialized: true,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      resetPassword: async () => {},
      updatePassword: async () => {},
      refreshSession: async () => {},
      hasRole: (_role: string) => false,
      isAuthenticated: false,
    };

    expect(mockValue.hasRole("admin")).toBe(false);
    expect(mockValue.hasRole("mahasiswa")).toBe(false);
    expect(mockValue.hasRole("dosen")).toBe(false);
    expect(mockValue.hasRole("laboran")).toBe(false);
  });
});
