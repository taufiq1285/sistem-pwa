/**
 * Kelas API Unit Tests
 *
 * Tests for class management including:
 * - CRUD operations for kelas
 * - Student enrollment (kelas_mahasiswa)
 * - Student management and validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getKelas,
  getKelasById,
  createKelas,
  updateKelas,
  deleteKelas,
  getEnrolledStudents,
  enrollStudent,
  unenrollStudent,
  toggleStudentStatus,
  getAllMahasiswa,
  createOrEnrollMahasiswa,
} from "../../../lib/api/kelas.api";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("../../../lib/supabase/client", async () => {
  const actual = await vi.importActual<
    typeof import("../../../lib/supabase/client")
  >("../../../lib/supabase/client");
  return {
    ...actual,
    supabase: {
      from: vi.fn(),
      auth: {
        signUp: vi.fn(),
      },
    },
  };
});

vi.mock("../../../lib/api/base.api", () => ({
  queryWithFilters: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
  requirePermissionAndOwnership: vi.fn((permission, config, fn) => fn),
}));

// Import mocked modules
import { supabase } from "../../../lib/supabase/client";
import {
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
} from "../../../lib/api/base.api";

// ============================================================================
// TEST DATA
// ============================================================================

const mockKelas = {
  id: "kelas-1",
  kode_kelas: "BD-A",
  nama_kelas: "Kelas A",
  mata_kuliah_id: "mk-1",
  dosen_id: "dosen-1",
  semester_ajaran: 1,
  tahun_ajaran: "2024/2025",
  kuota: 30,
  is_active: true,
  mata_kuliah: {
    id: "mk-1",
    nama_mk: "Kebidanan Dasar",
    kode_mk: "KBD101",
  },
  dosen: {
    id: "dosen-1",
    users: {
      full_name: "Dr. Siti Aminah",
    },
  },
};

const mockMahasiswa = {
  id: "mhs-1",
  nim: "BD2321001",
  users: {
    full_name: "Nur Aisyah",
    email: "nur@example.com",
  },
};

const mockEnrollment = {
  id: "enrollment-1",
  kelas_id: "kelas-1",
  mahasiswa_id: "mhs-1",
  enrolled_at: "2024-01-01T00:00:00Z",
  is_active: true,
};

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
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  // Make builder chainable - each method returns the builder by default
  Object.keys(builder).forEach((key) => {
    if (key !== "single" && key !== "maybeSingle" && !builder[key].mock) {
      builder[key] = vi.fn().mockReturnValue(builder);
    }
  });

  return builder;
};

// ============================================================================
// KELAS CRUD TESTS
// ============================================================================

describe("Kelas API - CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getKelas", () => {
    it("should fetch all kelas without filters", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockKelas]);

      const result = await getKelas();

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "is_active", value: true }),
        ]),
        expect.objectContaining({ select: expect.any(String) }),
      );
      expect(result).toEqual([mockKelas]);
    });

    it("should apply dosen_id filter", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockKelas]);

      await getKelas({ dosen_id: "dosen-1" });

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "dosen_id", value: "dosen-1" }),
        ]),
        expect.any(Object),
      );
    });

    it("should apply mata_kuliah_id filter", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockKelas]);

      await getKelas({ mata_kuliah_id: "mk-1" });

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "mata_kuliah_id", value: "mk-1" }),
        ]),
        expect.any(Object),
      );
    });

    it("should apply semester and tahun filters", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockKelas]);

      await getKelas({ semester_ajaran: 1, tahun_ajaran: "2024/2025" });

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "semester_ajaran", value: 1 }),
          expect.objectContaining({
            column: "tahun_ajaran",
            value: "2024/2025",
          }),
        ]),
        expect.any(Object),
      );
    });

    it("should allow filtering inactive kelas", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([]);

      await getKelas({ is_active: false });

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "is_active", value: false }),
        ]),
        expect.any(Object),
      );
    });

    it("should default to active kelas only", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockKelas]);

      await getKelas({});

      expect(queryWithFilters).toHaveBeenCalledWith(
        "kelas",
        expect.arrayContaining([
          expect.objectContaining({ column: "is_active", value: true }),
        ]),
        expect.any(Object),
      );
    });

    it("should handle errors gracefully", async () => {
      vi.mocked(queryWithFilters).mockRejectedValue(new Error("DB Error"));

      await expect(getKelas()).rejects.toThrow("Failed to fetch kelas");
    });
  });

  describe("getKelasById", () => {
    it("should fetch kelas by ID with relations", async () => {
      vi.mocked(getById).mockResolvedValue(mockKelas);

      const result = await getKelasById("kelas-1");

      expect(getById).toHaveBeenCalledWith(
        "kelas",
        "kelas-1",
        expect.objectContaining({ select: expect.any(String) }),
      );
      expect(result).toEqual(mockKelas);
    });

    it("should handle not found errors", async () => {
      vi.mocked(getById).mockRejectedValue(new Error("Not found"));

      await expect(getKelasById("nonexistent")).rejects.toThrow(
        "Failed to fetch kelas",
      );
    });
  });

  describe("createKelas", () => {
    it("should create new kelas and return with relations", async () => {
      const { id: _removed, ...kelasNoId } = mockKelas;
      vi.mocked(insert).mockResolvedValue({ ...kelasNoId, id: "new-kelas" });
      vi.mocked(getById).mockResolvedValue(mockKelas);

      const data = {
        kode_kelas: "BD-B",
        nama_kelas: "Kelas B",
        mata_kuliah_id: "mk-1",
        dosen_id: "dosen-1",
        semester_ajaran: 1,
        tahun_ajaran: "2024/2025",
        kuota: 30,
      };

      const result = await createKelas(data);

      expect(insert).toHaveBeenCalledWith("kelas", data);
      expect(getById).toHaveBeenCalled(); // Fetch again with relations
      expect(result).toEqual(mockKelas);
    });

    it("should handle creation errors", async () => {
      vi.mocked(insert).mockRejectedValue(new Error("Insert failed"));

      await expect(createKelas({} as any)).rejects.toThrow(
        "Failed to create kelas",
      );
    });
  });

  describe("updateKelas", () => {
    it("should update kelas and return updated data", async () => {
      vi.mocked(update).mockResolvedValue(mockKelas);
      vi.mocked(getById).mockResolvedValue(mockKelas);

      const updateData = { nama_kelas: "Updated Name" };
      const result = await updateKelas("kelas-1", updateData);

      expect(update).toHaveBeenCalledWith("kelas", "kelas-1", updateData);
      expect(getById).toHaveBeenCalledWith(
        "kelas",
        "kelas-1",
        expect.any(Object),
      );
      expect(result).toEqual(mockKelas);
    });
  });

  describe("deleteKelas", () => {
    it("should delete kelas by ID", async () => {
      vi.mocked(remove).mockResolvedValue(true);

      // deleteKelasImpl performs an existence check via Supabase before calling remove()
      const kelasCheckBuilder = mockQueryBuilder();
      kelasCheckBuilder.single.mockResolvedValue({
        data: { id: "kelas-1", nama_kelas: "Kelas A" },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValueOnce(kelasCheckBuilder as any);

      await deleteKelas("kelas-1");

      expect(remove).toHaveBeenCalledWith("kelas", "kelas-1");
    });
  });
});

// ============================================================================
// STUDENT ENROLLMENT TESTS
// ============================================================================

describe("Kelas API - Student Enrollment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getEnrolledStudents", () => {
    it("should fetch enrolled students for a kelas", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [{ ...mockEnrollment, mahasiswa: mockMahasiswa }],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getEnrolledStudents("kelas-1");

      expect(supabase.from).toHaveBeenCalledWith("kelas_mahasiswa");
      expect(builder.eq).toHaveBeenCalledWith("kelas_id", "kelas-1");
      expect(builder.order).toHaveBeenCalledWith("enrolled_at", {
        ascending: false,
      });
      expect(result).toHaveLength(1);
    });

    it("should handle empty enrollment", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getEnrolledStudents("kelas-1");

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: null,
        error: new Error("DB Error"),
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(getEnrolledStudents("kelas-1")).rejects.toThrow();
    });
  });

  describe("enrollStudent - CRITICAL VALIDATION", () => {
    it("should enroll student successfully when quota available", async () => {
      // Step 1: Get kelas (kuota = 30)
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: 30, nama_kelas: "Kelas A" },
        error: null,
      });

      // Step 2: Count current enrollment (10 students)
      // Chain: .select().eq().eq() -> final result
      const countEq2 = vi.fn().mockResolvedValue({ count: 10, error: null });
      const countEq1 = vi.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = vi.fn().mockReturnValue({ eq: countEq1 });
      const countBuilder = { select: countSelect };

      // Step 3: Check existing enrollment (none)
      const existingBuilder = mockQueryBuilder();
      existingBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Step 4a: Optional mahasiswa semester lookup
      const semesterBuilder = mockQueryBuilder();
      semesterBuilder.single.mockResolvedValue({
        data: { semester: 1 },
        error: null,
      });

      // Step 4: Insert enrollment
      const insertBuilder = mockQueryBuilder();
      insertBuilder.single.mockResolvedValue({
        data: mockEnrollment,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(semesterBuilder as any)
        .mockReturnValueOnce(insertBuilder as any);

      const result = await enrollStudent("kelas-1", "mhs-1");

      expect(result).toEqual(mockEnrollment);
    });

    it("should reject enrollment when kelas is full", async () => {
      // Kelas with kuota 30, currently 30 students enrolled
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: 30, nama_kelas: "Kelas A" },
        error: null,
      });

      // Count builder with chained .eq()
      const countEq2 = vi.fn().mockResolvedValue({ count: 30, error: null });
      const countEq1 = vi.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = vi.fn().mockReturnValue({ eq: countEq1 });
      const countBuilder = { select: countSelect };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any);

      await expect(enrollStudent("kelas-1", "mhs-1")).rejects.toThrow(
        "sudah penuh",
      );
    });

    it("should reject duplicate enrollment", async () => {
      // Kelas with space
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: 30, nama_kelas: "Kelas A" },
        error: null,
      });

      // Count builder
      const countEq2 = vi.fn().mockResolvedValue({ count: 10, error: null });
      const countEq1 = vi.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = vi.fn().mockReturnValue({ eq: countEq1 });
      const countBuilder = { select: countSelect };

      // Student already enrolled
      const existingBuilder = mockQueryBuilder();
      existingBuilder.maybeSingle.mockResolvedValue({
        data: { id: "existing-enrollment" },
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any)
        .mockReturnValueOnce(existingBuilder as any);

      await expect(enrollStudent("kelas-1", "mhs-1")).rejects.toThrow(
        "sudah terdaftar",
      );
    });

    it("should handle kelas not found", async () => {
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({ data: null, error: null });

      vi.mocked(supabase.from).mockReturnValueOnce(kelasBuilder);

      await expect(enrollStudent("nonexistent", "mhs-1")).rejects.toThrow(
        "tidak ditemukan",
      );
    });

    it("should handle null kuota (unlimited enrollment)", async () => {
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: null, nama_kelas: "Kelas A" },
        error: null,
      });

      // Count builder
      const countEq2 = vi.fn().mockResolvedValue({ count: 100, error: null });
      const countEq1 = vi.fn().mockReturnValue({ eq: countEq2 });
      const countSelect = vi.fn().mockReturnValue({ eq: countEq1 });
      const countBuilder = { select: countSelect };

      const existingBuilder = mockQueryBuilder();
      existingBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const semesterBuilder = mockQueryBuilder();
      semesterBuilder.single.mockResolvedValue({
        data: { semester: 1 },
        error: null,
      });

      const insertBuilder = mockQueryBuilder();
      insertBuilder.single.mockResolvedValue({
        data: mockEnrollment,
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any)
        .mockReturnValueOnce(existingBuilder as any)
        .mockReturnValueOnce(semesterBuilder as any)
        .mockReturnValueOnce(insertBuilder as any);

      const result = await enrollStudent("kelas-1", "mhs-1");

      expect(result).toEqual(mockEnrollment);
    });
  });

  describe("unenrollStudent", () => {
    it("should remove student from kelas", async () => {
      // Chain: .delete().eq().eq() -> final result
      const deleteEq2 = vi.fn().mockResolvedValue({ error: null });
      const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteBuilder = vi.fn().mockReturnValue({ eq: deleteEq1 });
      const builder = { delete: deleteBuilder };

      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await unenrollStudent("kelas-1", "mhs-1");

      expect(deleteBuilder).toHaveBeenCalled();
      expect(deleteEq1).toHaveBeenCalledWith("kelas_id", "kelas-1");
      expect(deleteEq2).toHaveBeenCalledWith("mahasiswa_id", "mhs-1");
    });

    it("should handle errors during unenrollment", async () => {
      // Chain with error
      const deleteEq2 = vi
        .fn()
        .mockResolvedValue({ error: new Error("Delete failed") });
      const deleteEq1 = vi.fn().mockReturnValue({ eq: deleteEq2 });
      const deleteBuilder = vi.fn().mockReturnValue({ eq: deleteEq1 });
      const builder = { delete: deleteBuilder };

      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await expect(unenrollStudent("kelas-1", "mhs-1")).rejects.toThrow();
    });
  });

  describe("toggleStudentStatus", () => {
    it("should activate student in kelas", async () => {
      // Chain: .update().eq().eq() -> final result
      const updateEq2 = vi.fn().mockResolvedValue({ error: null });
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });
      const updateBuilder = vi.fn().mockReturnValue({ eq: updateEq1 });
      const builder = { update: updateBuilder };

      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await toggleStudentStatus("kelas-1", "mhs-1", true);

      expect(updateBuilder).toHaveBeenCalledWith({ is_active: true });
      expect(updateEq1).toHaveBeenCalledWith("kelas_id", "kelas-1");
      expect(updateEq2).toHaveBeenCalledWith("mahasiswa_id", "mhs-1");
    });

    it("should deactivate student in kelas", async () => {
      // Chain: .update().eq().eq() -> final result
      const updateEq2 = vi.fn().mockResolvedValue({ error: null });
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 });
      const updateBuilder = vi.fn().mockReturnValue({ eq: updateEq1 });
      const builder = { update: updateBuilder };

      vi.mocked(supabase.from).mockReturnValue(builder as any);

      await toggleStudentStatus("kelas-1", "mhs-1", false);

      expect(updateBuilder).toHaveBeenCalledWith({ is_active: false });
    });
  });
});

// ============================================================================
// STUDENT MANAGEMENT TESTS
// ============================================================================

describe("Kelas API - Student Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllMahasiswa", () => {
    it("should fetch all mahasiswa with user info", async () => {
      // First query: mahasiswa with .select().order()
      const mahasiswaOrder = vi.fn().mockResolvedValue({
        data: [{ id: "mhs-1", nim: "BD2321001", user_id: "user-1" }],
        error: null,
      });
      const mahasiswaSelect = vi
        .fn()
        .mockReturnValue({ order: mahasiswaOrder });
      const mahasiswaBuilder = { select: mahasiswaSelect };

      // Second query: users with .select().in()
      const usersIn = vi.fn().mockResolvedValue({
        data: [
          { id: "user-1", full_name: "Nur Aisyah", email: "nur@example.com" },
        ],
        error: null,
      });
      const usersSelect = vi.fn().mockReturnValue({ in: usersIn });
      const usersBuilder = { select: usersSelect };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mahasiswaBuilder as any)
        .mockReturnValueOnce(usersBuilder as any);

      const result = await getAllMahasiswa();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "mhs-1",
        nim: "BD2321001",
        users: { full_name: "Nur Aisyah", email: "nur@example.com" },
      });
    });

    it("should return empty array when no mahasiswa", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({ data: [], error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllMahasiswa();

      expect(result).toEqual([]);
    });

    it("should handle mahasiswa without users gracefully", async () => {
      // First query: mahasiswa
      const mahasiswaOrder = vi.fn().mockResolvedValue({
        data: [{ id: "mhs-1", nim: "BD2321001", user_id: "user-nonexistent" }],
        error: null,
      });
      const mahasiswaSelect = vi
        .fn()
        .mockReturnValue({ order: mahasiswaOrder });
      const mahasiswaBuilder = { select: mahasiswaSelect };

      // Second query: users (empty)
      const usersIn = vi.fn().mockResolvedValue({ data: [], error: null });
      const usersSelect = vi.fn().mockReturnValue({ in: usersIn });
      const usersBuilder = { select: usersSelect };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mahasiswaBuilder as any)
        .mockReturnValueOnce(usersBuilder as any);

      const result = await getAllMahasiswa();

      expect(result[0].users).toEqual({ full_name: "-", email: "-" });
    });
  });

  describe("createOrEnrollMahasiswa - COMPLEX BUSINESS LOGIC", () => {
    it("should enroll existing mahasiswa to kelas", async () => {
      // Mahasiswa exists
      const existingMhsBuilder = mockQueryBuilder();
      existingMhsBuilder.limit.mockResolvedValue({
        data: [{ id: "mhs-1", user_id: "user-1" }],
        error: null,
      });

      // Not enrolled yet
      const enrollmentBuilder = mockQueryBuilder();
      enrollmentBuilder.limit.mockResolvedValue({ data: [], error: null });

      // Mock enrollStudent
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: 30, nama_kelas: "Kelas A" },
        error: null,
      });

      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((cb) => cb({ count: 10, error: null })),
      };

      const checkEnrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const semesterBuilder = mockQueryBuilder();
      semesterBuilder.single.mockResolvedValue({
        data: { semester: 1 },
        error: null,
      });

      const insertEnrollBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEnrollment,
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(existingMhsBuilder as any)
        .mockReturnValueOnce(enrollmentBuilder as any)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any)
        .mockReturnValueOnce(checkEnrollBuilder as any)
        .mockReturnValueOnce(semesterBuilder as any)
        .mockReturnValueOnce(insertEnrollBuilder as any);

      const result = await createOrEnrollMahasiswa("kelas-1", {
        nim: "BD2321001",
        full_name: "Nur Aisyah",
        email: "nur@example.com",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("berhasil");
    });

    it("should create new mahasiswa and enroll", async () => {
      // Mahasiswa doesn't exist
      const existingMhsBuilder = mockQueryBuilder();
      existingMhsBuilder.limit.mockResolvedValue({ data: [], error: null });

      // Email doesn't exist
      const existingEmailBuilder = mockQueryBuilder();
      existingEmailBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      // Create user
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      } as any);

      // Insert user profile
      const profileBuilder = mockQueryBuilder();
      profileBuilder.insert.mockResolvedValue({ error: null });

      // Insert mahasiswa
      const mahasiswaBuilder = mockQueryBuilder();
      mahasiswaBuilder.single.mockResolvedValue({
        data: { id: "new-mhs-id" },
        error: null,
      });

      // Check enrollment
      const enrollCheckBuilder = mockQueryBuilder();
      enrollCheckBuilder.limit.mockResolvedValue({ data: [], error: null });

      // Mock enrollStudent
      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.single.mockResolvedValue({
        data: { kuota: 30, nama_kelas: "Kelas A" },
        error: null,
      });

      const countBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((cb) => cb({ count: 10, error: null })),
      };

      const checkEnrollBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const semesterBuilder = mockQueryBuilder();
      semesterBuilder.single.mockResolvedValue({
        data: { semester: 1 },
        error: null,
      });

      const insertEnrollBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockEnrollment,
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(existingMhsBuilder as any)
        .mockReturnValueOnce(existingEmailBuilder as any)
        .mockReturnValueOnce(profileBuilder as any)
        .mockReturnValueOnce(mahasiswaBuilder as any)
        .mockReturnValueOnce(enrollCheckBuilder as any)
        .mockReturnValueOnce(kelasBuilder as any)
        .mockReturnValueOnce(countBuilder as any)
        .mockReturnValueOnce(checkEnrollBuilder as any)
        .mockReturnValueOnce(semesterBuilder as any)
        .mockReturnValueOnce(insertEnrollBuilder as any);

      const result = await createOrEnrollMahasiswa("kelas-1", {
        nim: "BD2321002",
        full_name: "New Student",
        email: "new@example.com",
      });

      expect(result.success).toBe(true);
      expect(vi.mocked(supabase.auth.signUp)).toHaveBeenCalled();
    });

    it("should reject if email already exists", async () => {
      // Mahasiswa doesn't exist
      const existingMhsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Email exists!
      const existingEmailBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: "user-1", email: "existing@example.com" },
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(existingMhsBuilder as any)
        .mockReturnValueOnce(existingEmailBuilder as any);

      const result = await createOrEnrollMahasiswa("kelas-1", {
        nim: "BD2321003",
        full_name: "Test",
        email: "existing@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("Email");
      expect(result.message).toContain("sudah terdaftar");
    });

    it("should reject if already enrolled", async () => {
      // Mahasiswa exists
      const existingMhsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "mhs-1", user_id: "user-1" }],
          error: null,
        }),
      };

      // Already enrolled
      const enrollmentBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [mockEnrollment],
          error: null,
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(existingMhsBuilder as any)
        .mockReturnValueOnce(enrollmentBuilder as any);

      const result = await createOrEnrollMahasiswa("kelas-1", {
        nim: "BD2321001",
        full_name: "Nur Aisyah",
        email: "nur@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("sudah terdaftar");
    });

    it("should handle NIM duplicate error", async () => {
      // Mahasiswa doesn't exist
      const existingMhsBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      // Email doesn't exist
      const existingEmailBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // Create user
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: { id: "new-user-id" } },
        error: null,
      } as any);

      // Insert user profile
      const profileBuilder = {
        insert: vi.fn().mockResolvedValue({ error: null }),
      };

      // Insert mahasiswa - DUPLICATE NIM ERROR
      const mahasiswaBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505" }, // Unique constraint violation
        }),
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(existingMhsBuilder as any)
        .mockReturnValueOnce(existingEmailBuilder as any)
        .mockReturnValueOnce(profileBuilder as any)
        .mockReturnValueOnce(mahasiswaBuilder as any);

      const result = await createOrEnrollMahasiswa("kelas-1", {
        nim: "BD2321001",
        full_name: "Test",
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("NIM");
      expect(result.message).toContain("sudah terdaftar");
    });
  });
});
