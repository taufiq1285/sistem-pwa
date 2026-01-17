/**
 * Users API Unit Tests
 *
 * Tests for system user management:
 * - Get all users with role info
 * - User statistics
 * - CRUD operations (all protected)
 * - Role-specific data handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllUsers,
  getUserStats,
  toggleUserStatus,
  updateUser,
  createUser,
  deleteUser,
} from "../../../lib/api/users.api";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signUp: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
  },
}));

vi.mock("../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
  invalidateCache: vi.fn(),
}));

vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
}));

import { supabase } from "../../../lib/supabase/client";

// ============================================================================
// TEST DATA
// ============================================================================

const mockUsers = [
  {
    id: "user-1",
    email: "admin@test.com",
    full_name: "Admin User",
    role: "admin",
    is_active: true,
    created_at: "2024-01-01",
  },
  {
    id: "user-2",
    email: "dosen@test.com",
    full_name: "Dr. Siti",
    role: "dosen",
    is_active: true,
    created_at: "2024-01-02",
  },
  {
    id: "user-3",
    email: "mhs@test.com",
    full_name: "Nur Aisyah",
    role: "mahasiswa",
    is_active: true,
    created_at: "2024-01-03",
  },
  {
    id: "user-4",
    email: "laboran@test.com",
    full_name: "Laboran User",
    role: "laboran",
    is_active: false,
    created_at: "2024-01-04",
  },
];

const mockMahasiswaData = [
  { user_id: "user-3", nim: "BD2321001", phone: "081234567890" },
];

const mockDosenData = [
  {
    user_id: "user-2",
    nip: "198501012010121001",
    nidn: "0001018501",
    phone: "081234567891",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mockQueryBuilder = () => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  return builder;
};

// ============================================================================
// GET ALL USERS TESTS
// ============================================================================

describe("Users API - Get All Users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("should fetch all users with role-specific data", async () => {
      // Mock users query
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      // Mock mahasiswa query
      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.in.mockResolvedValue({
        data: mockMahasiswaData,
        error: null,
      });

      // Mock dosen query
      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: mockDosenData,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(mahasiswaBuilder)
        .mockReturnValueOnce(dosenBuilder);

      const result = await getAllUsers();

      expect(result).toHaveLength(4);
      expect(result[0]).toMatchObject({
        id: "user-1",
        email: "admin@test.com",
        role: "admin",
      });
    });

    it("should map mahasiswa NIM correctly", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.in.mockResolvedValue({
        data: mockMahasiswaData,
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: mockDosenData,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(mahasiswaBuilder)
        .mockReturnValueOnce(dosenBuilder);

      const result = await getAllUsers();

      const mahasiswaUser = result.find(
        (u: { id: string; nim?: string; phone?: string }) => u.id === "user-3",
      );
      expect(mahasiswaUser?.nim).toBe("BD2321001");
      expect(mahasiswaUser?.phone).toBe("081234567890");
    });

    it("should map dosen NIP and NIDN correctly", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.in.mockResolvedValue({
        data: mockMahasiswaData,
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: mockDosenData,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(mahasiswaBuilder)
        .mockReturnValueOnce(dosenBuilder);

      const result = await getAllUsers();

      const dosenUser = result.find(
        (u: { id: string; nip?: string; nidn?: string }) => u.id === "user-2",
      );
      expect(dosenUser?.nip).toBe("198501012010121001");
      expect(dosenUser?.nidn).toBe("0001018501");
    });

    it("should handle empty users list", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });

    it("should handle null users data", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: null,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });

    it("should provide default values for missing data", async () => {
      const incompleteUser = {
        id: "user-5",
        // Missing email, full_name, role
        is_active: null,
        created_at: "2024-01-01",
      };

      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: [incompleteUser],
        error: null,
      });

      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.in.mockResolvedValue({ data: [], error: null });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(mahasiswaBuilder)
        .mockReturnValueOnce(dosenBuilder);

      const result = await getAllUsers();

      expect(result[0].email).toBe("-");
      expect(result[0].full_name).toBe("-");
      expect(result[0].role).toBe("mahasiswa"); // Default role
      expect(result[0].is_active).toBe(true); // Default active
    });

    it("should handle database errors gracefully", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: null,
        error: new Error("Database connection failed"),
      });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      await expect(getAllUsers()).rejects.toThrow();
    });
  });
});

// ============================================================================
// USER STATISTICS TESTS
// ============================================================================

describe("Users API - Statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserStats", () => {
    it("should calculate user statistics correctly", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: mockUsers,
        error: null,
      });

      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.in.mockResolvedValue({
        data: mockMahasiswaData,
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({ data: mockDosenData, error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(usersBuilder)
        .mockReturnValueOnce(mahasiswaBuilder)
        .mockReturnValueOnce(dosenBuilder);

      const stats = await getUserStats();

      expect(stats).toEqual({
        total: 4,
        admin: 1,
        dosen: 1,
        mahasiswa: 1,
        laboran: 1,
        active: 3,
        inactive: 1,
      });
    });

    it("should return zero stats when no users", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      const stats = await getUserStats();

      expect(stats).toEqual({
        total: 0,
        admin: 0,
        dosen: 0,
        mahasiswa: 0,
        laboran: 0,
        active: 0,
        inactive: 0,
      });
    });

    it("should handle errors and return zero stats", async () => {
      const usersBuilder = mockQueryBuilder();
      usersBuilder.order.mockResolvedValue({
        data: null,
        error: new Error("DB Error"),
      });

      vi.mocked(supabase.from).mockReturnValue(usersBuilder);

      const stats = await getUserStats();

      expect(stats).toEqual({
        total: 0,
        admin: 0,
        dosen: 0,
        mahasiswa: 0,
        laboran: 0,
        active: 0,
        inactive: 0,
      });
    });
  });
});

// ============================================================================
// USER CRUD TESTS
// ============================================================================

describe("Users API - CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toggleUserStatus", () => {
    it("should activate user", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await toggleUserStatus("user-1", true);

      expect(builder.update).toHaveBeenCalledWith({ is_active: true });
      expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
    });

    it("should deactivate user", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await toggleUserStatus("user-1", false);

      expect(builder.update).toHaveBeenCalledWith({ is_active: false });
    });

    it("should handle errors", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: new Error("Update failed") });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(toggleUserStatus("user-1", true)).rejects.toThrow();
    });
  });

  describe("updateUser", () => {
    it("should update user data", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const updateData = {
        full_name: "Updated Name",
        email: "updated@test.com",
      };

      await updateUser("user-1", updateData);

      expect(builder.update).toHaveBeenCalledWith(updateData);
      expect(builder.eq).toHaveBeenCalledWith("id", "user-1");
    });

    it("should update user role", async () => {
      const builder = mockQueryBuilder();
      builder.eq.mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await updateUser("user-1", { role: "dosen" });

      expect(builder.update).toHaveBeenCalledWith({ role: "dosen" });
    });
  });

  describe("createUser - COMPLEX FLOW", () => {
    it("should create admin user successfully", async () => {
      // Mock signUp
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      } as any);

      // Mock update users table
      const updateBuilder = mockQueryBuilder();
      updateBuilder.eq.mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockReturnValue(updateBuilder);

      await createUser({
        email: "newadmin@test.com",
        password: "password123",
        full_name: "New Admin",
        role: "admin",
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "newadmin@test.com",
        password: "password123",
        options: {
          data: {
            full_name: "New Admin",
            role: "admin",
          },
        },
      });
    });

    it("should create mahasiswa with role-specific data", async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      } as any);

      const updateBuilder = mockQueryBuilder();
      updateBuilder.eq.mockResolvedValue({ error: null });

      const insertBuilder = mockQueryBuilder();
      insertBuilder.insert.mockResolvedValue({ error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(updateBuilder)
        .mockReturnValueOnce(insertBuilder);

      await createUser({
        email: "newmhs@test.com",
        password: "password123",
        full_name: "New Mahasiswa",
        role: "mahasiswa",
        nim: "BD2321099",
        phone: "081234567899",
      });

      expect(insertBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "new-user-id",
          nim: "BD2321099",
          phone: "081234567899",
        }),
      );
    });

    it("should create dosen with NIP and NIDN", async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      } as any);

      const updateBuilder = mockQueryBuilder();
      updateBuilder.eq.mockResolvedValue({ error: null });

      const insertBuilder = mockQueryBuilder();
      insertBuilder.insert.mockResolvedValue({ error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(updateBuilder)
        .mockReturnValueOnce(insertBuilder);

      await createUser({
        email: "newdosen@test.com",
        password: "password123",
        full_name: "New Dosen",
        role: "dosen",
        nip: "198501012010121999",
        nidn: "0001018599",
        phone: "081234567898",
      });

      expect(insertBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "new-user-id",
          nip: "198501012010121999",
          nidn: "0001018599",
        }),
      );
    });

    it("should handle signup errors", async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: new Error("Email already exists"),
      } as any);

      await expect(
        createUser({
          email: "existing@test.com",
          password: "password123",
          full_name: "Test",
          role: "admin",
        }),
      ).rejects.toThrow();
    });

    it("should handle missing user data after signup", async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        createUser({
          email: "test@test.com",
          password: "password123",
          full_name: "Test",
          role: "admin",
        }),
      ).rejects.toThrow("Failed to create user");
    });
  });

  describe("deleteUser - CASCADE DELETE", () => {
    beforeEach(() => {
      // Mock auth.getUser for current user check
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: {
            id: "admin-user-id",
            email: "admin@test.com",
            user_metadata: { role: "admin" },
          } as any,
        },
        error: null,
      });

      // Mock auth session for edge function call
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            refresh_token: "mock-refresh",
            expires_in: 3600,
            token_type: "bearer",
            user: {} as any,
          },
        },
        error: null,
      });

      // Mock fetch for edge function
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it("should delete mahasiswa from role table then users table", async () => {
      // Get user role
      const getUserBuilder = mockQueryBuilder();
      getUserBuilder.single.mockResolvedValue({
        data: { role: "mahasiswa" },
        error: null,
      });

      // Delete from mahasiswa table
      const deleteMhsBuilder = mockQueryBuilder();
      deleteMhsBuilder.eq.mockResolvedValue({ error: null });

      // Delete from users table - need to return builder for chaining .delete().eq().select()
      const deleteUserBuilder = mockQueryBuilder();
      const finalResult = { data: [{ id: "user-3" }], error: null, count: 1 };
      deleteUserBuilder.select.mockResolvedValue(finalResult);

      vi.mocked(supabase.from)
        .mockReturnValueOnce(getUserBuilder)
        .mockReturnValueOnce(deleteMhsBuilder)
        .mockReturnValueOnce(deleteUserBuilder);

      await deleteUser("user-3");

      expect(deleteMhsBuilder.delete).toHaveBeenCalled();
      expect(deleteUserBuilder.delete).toHaveBeenCalled();
      expect(deleteUserBuilder.select).toHaveBeenCalled();
    });

    it("should delete dosen from role table then users table", async () => {
      const getUserBuilder = mockQueryBuilder();
      getUserBuilder.single.mockResolvedValue({
        data: { role: "dosen" },
        error: null,
      });

      const deleteDosenBuilder = mockQueryBuilder();
      deleteDosenBuilder.eq.mockResolvedValue({ error: null });

      const deleteUserBuilder = mockQueryBuilder();
      deleteUserBuilder.select.mockResolvedValue({
        data: [{ id: "user-2" }],
        error: null,
        count: 1,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(getUserBuilder)
        .mockReturnValueOnce(deleteDosenBuilder)
        .mockReturnValueOnce(deleteUserBuilder);

      await deleteUser("user-2");

      expect(deleteDosenBuilder.delete).toHaveBeenCalled();
      expect(deleteUserBuilder.delete).toHaveBeenCalled();
    });

    it("should delete laboran from role table then users table", async () => {
      const getUserBuilder = mockQueryBuilder();
      getUserBuilder.single.mockResolvedValue({
        data: { role: "laboran" },
        error: null,
      });

      const deleteLaboranBuilder = mockQueryBuilder();
      deleteLaboranBuilder.eq.mockResolvedValue({ error: null });

      const deleteUserBuilder = mockQueryBuilder();
      deleteUserBuilder.select.mockResolvedValue({
        data: [{ id: "user-4" }],
        error: null,
        count: 1,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(getUserBuilder)
        .mockReturnValueOnce(deleteLaboranBuilder)
        .mockReturnValueOnce(deleteUserBuilder);

      await deleteUser("user-4");

      expect(deleteLaboranBuilder.delete).toHaveBeenCalled();
      expect(deleteUserBuilder.delete).toHaveBeenCalled();
    });

    it("should fail if role-specific delete fails", async () => {
      const getUserBuilder = mockQueryBuilder();
      getUserBuilder.single.mockResolvedValue({
        data: { role: "mahasiswa" },
        error: null,
      });

      const deleteMhsBuilder = mockQueryBuilder();
      deleteMhsBuilder.eq.mockResolvedValue({
        error: new Error("Foreign key constraint"),
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(getUserBuilder)
        .mockReturnValueOnce(deleteMhsBuilder);

      // Should throw when role-specific delete fails
      await expect(deleteUser("user-3")).rejects.toThrow(
        "Failed to delete mahasiswa record",
      );
    });

    it("should handle user not found", async () => {
      const getUserBuilder = mockQueryBuilder();
      getUserBuilder.single.mockResolvedValue({
        data: null,
        error: new Error("Not found"),
      });

      vi.mocked(supabase.from).mockReturnValue(getUserBuilder);

      await expect(deleteUser("nonexistent")).rejects.toThrow();
    });
  });
});
