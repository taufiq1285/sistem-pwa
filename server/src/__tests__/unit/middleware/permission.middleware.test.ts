/**
 * Permission Middleware Unit Tests
 *
 * Tests for:
 * - requirePermission wrapper
 * - requireOwnership validator
 * - requirePermissionAndOwnership combined check
 * - getCurrentUserWithRole
 * - Permission error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  requirePermission,
  requireOwnership,
  requirePermissionAndOwnership,
  getCurrentUserWithRole,
  getCurrentDosenId,
  getCurrentMahasiswaId,
  isCurrentUserAdmin,
  hasRole,
  checkPermission,
} from "../../../lib/middleware/permission.middleware";
import {
  PermissionError,
  OwnershipError,
  AuthenticationError,
  RoleNotFoundError,
} from "../../../lib/errors/permission.errors";
import { supabase } from "../../../lib/supabase/client";
import type { UserRole } from "../../../types/auth.types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock Supabase client
vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock permission utils
vi.mock("../../../lib/utils/permissions", () => ({
  hasPermission: vi.fn(),
}));

// Import mocked hasPermission
import { hasPermission as mockedHasPermission } from "../../../lib/utils/permissions";

// ============================================================================
// TEST HELPERS
// ============================================================================

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  role: "dosen" as UserRole,
};

const mockAdmin = {
  id: "admin-123",
  email: "admin@example.com",
  role: "admin" as UserRole,
};

const mockMahasiswa = {
  id: "mhs-123",
  email: "mahasiswa@example.com",
  role: "mahasiswa" as UserRole,
};

function mockSupabaseAuth(user: any) {
  (supabase.auth.getUser as any).mockResolvedValue({
    data: {
      user: {
        ...user,
        user_metadata: {
          role: user.role,
        },
      },
    },
    error: null,
  });
}

function mockSupabaseFrom(table: string, data: any, error: any = null) {
  const mockSelect = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data, error });

  (supabase.from as any).mockReturnValue({
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle,
      }),
    }),
  });

  return { mockSelect, mockEq, mockSingle };
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe("Permission Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // getCurrentUserWithRole Tests
  // ==========================================================================

  describe("getCurrentUserWithRole", () => {
    it("should return user with role from database", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });

      const result = await getCurrentUserWithRole();

      expect(result).toEqual({
        id: mockUser.id,
        role: "dosen",
        email: mockUser.email,
      });
    });

    it("should throw AuthenticationError if user not authenticated", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error("Not authenticated"),
      });

      await expect(getCurrentUserWithRole()).rejects.toThrow(
        AuthenticationError
      );
      await expect(getCurrentUserWithRole()).rejects.toThrow(
        "User not authenticated"
      );
    });

    it("should throw RoleNotFoundError if user role not found in database", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", null, new Error("User not found"));

      await expect(getCurrentUserWithRole()).rejects.toThrow(RoleNotFoundError);
    });

    it("should get role for admin user", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      const result = await getCurrentUserWithRole();

      expect(result.role).toBe("admin");
    });

    it("should get role for mahasiswa user", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id, email: mockMahasiswa.email });
      mockSupabaseFrom("users", { role: "mahasiswa" });

      const result = await getCurrentUserWithRole();

      expect(result.role).toBe("mahasiswa");
    });
  });

  // ==========================================================================
  // getCurrentDosenId Tests
  // ==========================================================================

  describe("getCurrentDosenId", () => {
    it("should return dosen ID for dosen user", async () => {
      mockSupabaseAuth({ id: mockUser.id });
      mockSupabaseFrom("dosen", { id: "dosen-456" });

      const result = await getCurrentDosenId();

      expect(result).toBe("dosen-456");
    });

    it("should return null if user is not a dosen", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id });
      mockSupabaseFrom("dosen", null, new Error("Not found"));

      const result = await getCurrentDosenId();

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      (supabase.auth.getUser as any).mockRejectedValue(new Error("Auth error"));

      const result = await getCurrentDosenId();

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // getCurrentMahasiswaId Tests
  // ==========================================================================

  describe("getCurrentMahasiswaId", () => {
    it("should return mahasiswa ID for mahasiswa user", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id });
      mockSupabaseFrom("mahasiswa", { id: "mhs-456" });

      const result = await getCurrentMahasiswaId();

      expect(result).toBe("mhs-456");
    });

    it("should return null if user is not a mahasiswa", async () => {
      mockSupabaseAuth({ id: mockUser.id });
      mockSupabaseFrom("mahasiswa", null, new Error("Not found"));

      const result = await getCurrentMahasiswaId();

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // checkPermission Tests
  // ==========================================================================

  describe("checkPermission", () => {
    it("should allow admin to bypass permission check", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      await expect(checkPermission("create:kuis")).resolves.not.toThrow();
    });

    it("should allow user with permission", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });
      (mockedHasPermission as any).mockReturnValue(true);

      await expect(checkPermission("create:kuis")).resolves.not.toThrow();

      expect(mockedHasPermission).toHaveBeenCalledWith("dosen", "create:kuis");
    });

    it("should throw PermissionError if user lacks permission", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id, email: mockMahasiswa.email });
      mockSupabaseFrom("users", { role: "mahasiswa" });
      (mockedHasPermission as any).mockReturnValue(false);

      await expect(checkPermission("create:kuis")).rejects.toThrow(
        PermissionError
      );
      await expect(checkPermission("create:kuis")).rejects.toThrow(
        "Missing permission: create:kuis"
      );
    });

    it("should include role in error message", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id, email: mockMahasiswa.email });
      mockSupabaseFrom("users", { role: "mahasiswa" });
      (mockedHasPermission as any).mockReturnValue(false);

      try {
        await checkPermission("manage:user");
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).permission).toBe("manage:user");
        expect((error as PermissionError).userRole).toBe("mahasiswa");
      }
    });
  });

  // ==========================================================================
  // requirePermission Tests
  // ==========================================================================

  describe("requirePermission", () => {
    it("should execute function if permission granted", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });
      (mockedHasPermission as any).mockReturnValue(true);

      const mockFn = vi
        .fn()
        .mockResolvedValue({ id: "kuis-123", judul: "Test Kuis" });
      const wrappedFn = requirePermission("create:kuis", mockFn);

      const result = await wrappedFn({ judul: "Test Kuis" });

      expect(mockFn).toHaveBeenCalledWith({ judul: "Test Kuis" });
      expect(result).toEqual({ id: "kuis-123", judul: "Test Kuis" });
    });

    it("should not execute function if permission denied", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id, email: mockMahasiswa.email });
      mockSupabaseFrom("users", { role: "mahasiswa" });
      (mockedHasPermission as any).mockReturnValue(false);

      const mockFn = vi.fn();
      const wrappedFn = requirePermission("create:kuis", mockFn);

      await expect(wrappedFn({ judul: "Test" })).rejects.toThrow(
        PermissionError
      );
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("should pass arguments to wrapped function", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      const mockFn = vi.fn(async (id: string, data: any) => ({ id, ...data }));
      const wrappedFn = requirePermission("update:kuis", mockFn);

      const result = await wrappedFn("kuis-123", { judul: "Updated" });

      expect(mockFn).toHaveBeenCalledWith("kuis-123", { judul: "Updated" });
      expect(result).toEqual({ id: "kuis-123", judul: "Updated" });
    });

    it("should allow admin bypass", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      const mockFn = vi.fn().mockResolvedValue({ success: true });
      const wrappedFn = requirePermission("create:kuis", mockFn);

      await wrappedFn();

      expect(mockFn).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // requireOwnership Tests
  // ==========================================================================

  describe("requireOwnership", () => {
    it("should allow admin bypass by default", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      await expect(
        requireOwnership({
          table: "kuis",
          resourceId: "kuis-123",
          ownerField: "dosen_id",
        })
      ).resolves.not.toThrow();
    });

    it("should allow owner to access their resource (user_id)", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });

      // Mock resource ownership check
      const resourceMock = vi.fn().mockReturnThis();
      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const singleMock = vi.fn().mockResolvedValue({
        data: { user_id: mockUser.id },
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "dosen" },
              error: null,
            }),
          };
        }
        return {
          select: selectMock.mockReturnValue({
            eq: eqMock.mockReturnValue({
              single: singleMock,
            }),
          }),
        };
      });

      await expect(
        requireOwnership({
          table: "jawaban",
          resourceId: "jawaban-123",
          ownerField: "user_id",
        })
      ).resolves.not.toThrow();
    });

    it("should allow dosen to access their own kuis", async () => {
      const dosenId = "dosen-456";

      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });

      // Setup mocks for multiple table queries
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "dosen" },
              error: null,
            }),
          };
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: dosenId },
              error: null,
            }),
          };
        }
        if (table === "kuis") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { dosen_id: dosenId },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(
        requireOwnership({
          table: "kuis",
          resourceId: "kuis-123",
          ownerField: "dosen_id",
        })
      ).resolves.not.toThrow();
    });

    it("should throw OwnershipError if not owner", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "mahasiswa" },
              error: null,
            }),
          };
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "mhs-123" },
              error: null,
            }),
          };
        }
        if (table === "jawaban") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_id: "different-user-id" },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      await expect(
        requireOwnership({
          table: "jawaban",
          resourceId: "jawaban-456",
          ownerField: "user_id",
        })
      ).rejects.toThrow(OwnershipError);
    });

    it("should throw error if resource not found", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "dosen" },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("Not found"),
          }),
        };
      });

      await expect(
        requireOwnership({
          table: "kuis",
          resourceId: "non-existent",
          ownerField: "dosen_id",
        })
      ).rejects.toThrow("Resource not found");
    });

    it("should respect allowAdmin option", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });

      // Setup mock to provide resource data when allowAdmin is false
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "admin" },
              error: null,
            }),
          };
        }
        if (table === "kuis") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { dosen_id: "some-dosen-id" }, // Resource exists
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      // With allowAdmin: false, admin should NOT bypass and should fail ownership check
      await expect(
        requireOwnership({
          table: "kuis",
          resourceId: "kuis-123",
          ownerField: "dosen_id",
          allowAdmin: false,
        })
      ).rejects.toThrow(OwnershipError); // Admin is not a dosen, so should fail
    });
  });

  // ==========================================================================
  // requirePermissionAndOwnership Tests
  // ==========================================================================

  describe("requirePermissionAndOwnership", () => {
    it("should check both permission and ownership", async () => {
      const dosenId = "dosen-456";

      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      (mockedHasPermission as any).mockReturnValue(true);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "dosen" },
              error: null,
            }),
          };
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: dosenId },
              error: null,
            }),
          };
        }
        if (table === "kuis") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { dosen_id: dosenId },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const mockFn = vi.fn().mockResolvedValue({ success: true });
      const wrappedFn = requirePermissionAndOwnership(
        "update:kuis",
        { table: "kuis", ownerField: "dosen_id" },
        0, // resourceId is first argument
        mockFn
      );

      await wrappedFn("kuis-123", { judul: "Updated" });

      expect(mockFn).toHaveBeenCalledWith("kuis-123", { judul: "Updated" });
    });

    it("should fail if permission denied", async () => {
      mockSupabaseAuth({ id: mockMahasiswa.id, email: mockMahasiswa.email });
      mockSupabaseFrom("users", { role: "mahasiswa" });
      (mockedHasPermission as any).mockReturnValue(false);

      const mockFn = vi.fn();
      const wrappedFn = requirePermissionAndOwnership(
        "delete:kuis",
        { table: "kuis", ownerField: "dosen_id" },
        0,
        mockFn
      );

      await expect(wrappedFn("kuis-123")).rejects.toThrow(PermissionError);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("should fail if ownership denied", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      (mockedHasPermission as any).mockReturnValue(true);

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === "users") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { role: "dosen" },
              error: null,
            }),
          };
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "dosen-123" },
              error: null,
            }),
          };
        }
        if (table === "kuis") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { dosen_id: "different-dosen-id" }, // Different owner
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      });

      const mockFn = vi.fn();
      const wrappedFn = requirePermissionAndOwnership(
        "update:kuis",
        { table: "kuis", ownerField: "dosen_id" },
        0,
        mockFn
      );

      await expect(wrappedFn("kuis-456")).rejects.toThrow(OwnershipError);
      expect(mockFn).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Utility Functions Tests
  // ==========================================================================

  describe("isCurrentUserAdmin", () => {
    it("should return true for admin user", async () => {
      mockSupabaseAuth({ id: mockAdmin.id, email: mockAdmin.email });
      mockSupabaseFrom("users", { role: "admin" });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(true);
    });

    it("should return false for non-admin user", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      (supabase.auth.getUser as any).mockRejectedValue(new Error("Auth error"));

      const result = await isCurrentUserAdmin();

      expect(result).toBe(false);
    });
  });

  describe("hasRole", () => {
    it("should return true if user has specified role", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });

      const result = await hasRole("dosen");

      expect(result).toBe(true);
    });

    it("should return false if user has different role", async () => {
      mockSupabaseAuth({ id: mockUser.id, email: mockUser.email });
      mockSupabaseFrom("users", { role: "dosen" });

      const result = await hasRole("admin");

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      (supabase.auth.getUser as any).mockRejectedValue(new Error("Auth error"));

      const result = await hasRole("dosen");

      expect(result).toBe(false);
    });
  });
});
