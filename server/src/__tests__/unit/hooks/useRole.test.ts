/**
 * useRole Hook Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRole } from "../../../lib/hooks/useRole";
import * as useAuthModule from "../../../lib/hooks/useAuth";

// Mock useAuth
vi.mock("../../../lib/hooks/useAuth");

describe("useRole Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("role checking", () => {
    it("should return correct role for admin user", () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "admin@test.com",
          full_name: "Admin User",
          role: "admin",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        loading: false,
        initialized: true,
      } as any);

      const { result } = renderHook(() => useRole());

      expect(result.current.role).toBe("admin");
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isDosen).toBe(false);
      expect(result.current.isMahasiswa).toBe(false);
    });

    it("should check if user is dosen", () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: "2",
          email: "dosen@test.com",
          full_name: "Dr. Dosen",
          role: "dosen",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        loading: false,
        initialized: true,
      } as any);

      const { result } = renderHook(() => useRole());

      expect(result.current.isDosen).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isMahasiswa).toBe(false);
    });

    it("should check if user is mahasiswa", () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: {
          id: "3",
          email: "mahasiswa@test.com",
          full_name: "Mahasiswa User",
          role: "mahasiswa",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        isAuthenticated: true,
        loading: false,
        initialized: true,
      } as any);

      const { result } = renderHook(() => useRole());

      expect(result.current.isMahasiswa).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDosen).toBe(false);
    });
  });

  describe("permissions", () => {
    it("should return null role when no user", () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      } as any);

      const { result } = renderHook(() => useRole());

      expect(result.current.role).toBe(null);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isDosen).toBe(false);
      expect(result.current.isMahasiswa).toBe(false);
    });

    it("should return empty permissions array when no user", () => {
      vi.mocked(useAuthModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: true,
      } as any);

      const { result } = renderHook(() => useRole());

      expect(result.current.permissions).toEqual([]);
      expect(result.current.hasPermission("view:users" as any)).toBe(false);
    });
  });

  // Placeholder test
  it("should have useRole hook tests defined", () => {
    expect(true).toBe(true);
  });
});
