/**
 * Unit Tests for Profile API (Vitest)
 *
 * Purpose: Test user profile management functions
 * Coverage:
 * - Mahasiswa Profile: getMahasiswaProfile, updateMahasiswaProfile, updateUserProfile
 * - Dosen Profile: getDosenProfile, updateDosenProfile
 * - Laboran Profile: getLaboranProfile, updateLaboranProfile
 * - Admin Profile: getAdminProfile, updateAdminProfile
 * - Error handling and edge cases
 *
 * @vitest/environments happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getMahasiswaProfile,
  updateMahasiswaProfile,
  updateUserProfile,
  getDosenProfile,
  updateDosenProfile,
  getLaboranProfile,
  updateLaboranProfile,
  getAdminProfile,
  updateAdminProfile,
  type MahasiswaProfile,
  type DosenProfile,
  type LaboranProfile,
} from "@/lib/api/profile.api";

// Create proper chainable query mock
const createQueryMock = (resolveValue: any = { data: null, error: null }) => {
  const buildChain = () => {
    const chainObj = {
      select: () => buildChain(),
      update: () => buildChain(),
      eq: () => buildChain(),
      single: () => Promise.resolve(resolveValue),
      then: (resolve: any) => Promise.resolve(resolveValue).then(resolve),
      catch: (reject: any) => Promise.resolve(resolveValue).catch(reject),
    };

    return chainObj;
  };

  return buildChain();
};

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createQueryMock()),
  },
}));

describe("Profile API", () => {
  const mockUserId = "user-123";
  const mockMahasiswaId = "mhs-123";
  const mockDosenId = "dosen-123";
  const mockLaboranId = "laboran-123";

  const mockMahasiswaProfile: MahasiswaProfile = {
    id: mockMahasiswaId,
    user_id: mockUserId,
    nim: "2021001",
    program_studi: "Teknik Informatika",
    angkatan: 2021,
    semester: 6,
    gender: "L",
    date_of_birth: "2003-05-15",
    address: "Jl. Contoh No. 123",
    users: {
      full_name: "John Doe",
      email: "john@example.com",
    },
  };

  const mockDosenProfile: DosenProfile = {
    id: mockDosenId,
    user_id: mockUserId,
    nidn: "041234567",
    nama_dosen: "Dr. Smith",
    program_studi: "Teknik Informatika",
    nip: "19800101",
    gelar_depan: "Dr.",
    gelar_belakang: "M.Kom",
    fakultas: "Ilmu Komputer",
    phone: "08123456789",
    office_room: "A-123",
    users: {
      full_name: "Dr. Smith",
      email: "smith@example.com",
    },
  };

  const mockLaboranProfile: LaboranProfile = {
    id: mockLaboranId,
    user_id: mockUserId,
    nip: "12345",
    nama_laboran: "Lab Assistant",
    shift: "Pagi",
    users: {
      full_name: "Lab Assistant",
      email: "lab@example.com",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // MAHASISWA PROFILE
  // ========================================================================

  describe("Mahasiswa Profile", () => {
    it("should get mahasiswa profile by user ID", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: mockMahasiswaProfile,
          error: null,
        }),
      );

      const result = await getMahasiswaProfile(mockUserId);

      expect(result).toEqual(mockMahasiswaProfile);
      expect(supabase.from).toHaveBeenCalledWith("mahasiswa");
    });

    it("should return null when mahasiswa profile not found", async () => {
      // No error, but data is null
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: null,
          error: null,
        }),
      );

      const result = await getMahasiswaProfile(mockUserId);

      expect(result).toBeNull();
    });

    it("should update mahasiswa profile", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: { ...mockMahasiswaProfile, program_studi: "Teknik Elektro" },
          error: null,
        }),
      );

      const updateData = { program_studi: "Teknik Elektro", semester: 7 };

      await expect(
        updateMahasiswaProfile(mockMahasiswaId, updateData),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("mahasiswa");
    });

    it("should throw error when update fails", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: { message: "Update failed" },
        }),
      );

      const updateData = { program_studi: "Teknik Elektro" };

      await expect(
        updateMahasiswaProfile(mockMahasiswaId, updateData),
      ).rejects.toThrow("Update failed");
    });

    it("should update user profile", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const updateData = {
        full_name: "John Updated",
        phone: "08987654321",
      };

      await expect(
        updateUserProfile(mockUserId, updateData),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(supabase.from).toHaveBeenCalledWith("users");
    });
  });

  // ========================================================================
  // DOSEN PROFILE
  // ========================================================================

  describe("Dosen Profile", () => {
    it("should get dosen profile by user ID", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: mockDosenProfile,
          error: null,
        }),
      );

      const result = await getDosenProfile(mockUserId);

      expect(result).toEqual(mockDosenProfile);
      expect(supabase.from).toHaveBeenCalledWith("dosen");
    });

    it("should return null when dosen profile not found", async () => {
      // No error, but data is null
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: null,
          error: null,
        }),
      );

      const result = await getDosenProfile(mockUserId);

      expect(result).toBeNull();
    });

    it("should update dosen profile", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const updateData = {
        nama_dosen: "Dr. Smith Jr.",
        phone: "08123456789",
      };

      await expect(
        updateDosenProfile(mockDosenId, updateData),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("dosen");
    });

    it("should throw error when dosen update fails", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: { message: "Database error" },
        }),
      );

      const updateData = { nama_dosen: "Dr. Smith Jr." };

      await expect(updateDosenProfile(mockDosenId, updateData)).rejects.toThrow(
        "Database error",
      );
    });
  });

  // ========================================================================
  // LABORAN PROFILE
  // ========================================================================

  describe("Laboran Profile", () => {
    it("should get laboran profile by user ID", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: mockLaboranProfile,
          error: null,
        }),
      );

      const result = await getLaboranProfile(mockUserId);

      expect(result).toEqual(mockLaboranProfile);
      expect(supabase.from).toHaveBeenCalledWith("laboran");
    });

    it("should return null when laboran profile not found", async () => {
      // No error, but data is null
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: null,
          error: null,
        }),
      );

      const result = await getLaboranProfile(mockUserId);

      expect(result).toBeNull();
    });

    it("should update laboran profile", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const updateData = {
        shift: "Siang",
        nama_laboran: "Senior Lab Assistant",
      };

      await expect(
        updateLaboranProfile(mockLaboranId, updateData),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("laboran");
    });

    it("should throw error when laboran update fails", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: { message: "Connection lost" },
        }),
      );

      const updateData = { shift: "Siang" };

      await expect(
        updateLaboranProfile(mockLaboranId, updateData),
      ).rejects.toThrow("Connection lost");
    });
  });

  // ========================================================================
  // ADMIN PROFILE
  // ========================================================================

  describe("Admin Profile", () => {
    const mockAdminProfile = {
      full_name: "Admin User",
      email: "admin@example.com",
      role: "admin",
    };

    it("should get admin profile by user ID", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: mockAdminProfile,
          error: null,
        }),
      );

      const result = await getAdminProfile(mockUserId);

      expect(result).toEqual(mockAdminProfile);
      expect(supabase.from).toHaveBeenCalledWith("users");
    });

    it("should return null when admin profile not found", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: null,
          error: null, // No error but no data
        }),
      );

      const result = await getAdminProfile(mockUserId);

      expect(result).toBeNull();
    });

    it("should update admin profile", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const updateData = {
        full_name: "Admin Updated",
      };

      await expect(
        updateAdminProfile(mockUserId, updateData),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("users");
    });

    it("should throw error when admin update fails", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: { message: "Permission denied" },
        }),
      );

      const updateData = { full_name: "Admin Updated" };

      await expect(updateAdminProfile(mockUserId, updateData)).rejects.toThrow(
        "Permission denied",
      );
    });

    it("should only update full_name for admin (not phone)", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const updateData = {
        full_name: "Super Admin",
        email: "should@not.be.used", // This should be ignored
      };

      await expect(
        updateAdminProfile(mockUserId, updateData),
      ).resolves.not.toThrow();

      // Admin profile update only uses full_name, not email
      expect(supabase.from).toHaveBeenCalledWith("users");
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================

  describe("Edge Cases", () => {
    it("should handle missing optional fields in mahasiswa profile", async () => {
      const partialProfile: MahasiswaProfile = {
        id: mockMahasiswaId,
        user_id: mockUserId,
        nim: "2021002",
        program_studi: "Teknik Informatika",
        angkatan: 2021,
        semester: 4,
        gender: null, // Optional field
        address: undefined, // Optional field
      };

      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: partialProfile,
          error: null,
        }),
      );

      const result = await getMahasiswaProfile(mockUserId);

      expect(result).toEqual(partialProfile);
    });

    it("should handle missing optional fields in dosen profile", async () => {
      const partialProfile: DosenProfile = {
        id: mockDosenId,
        user_id: mockUserId,
        nidn: "041234568",
        program_studi: "Sistem Informasi",
        nip: undefined,
        gelar_depan: undefined,
        gelar_belakang: undefined,
        fakultas: undefined,
        phone: undefined,
        office_room: undefined,
      };

      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: partialProfile,
          error: null,
        }),
      );

      const result = await getDosenProfile(mockUserId);

      expect(result).toEqual(partialProfile);
    });

    it("should handle missing optional fields in laboran profile", async () => {
      const partialProfile: LaboranProfile = {
        id: mockLaboranId,
        user_id: mockUserId,
        nip: "12346",
        shift: undefined,
        nama_laboran: undefined,
      };

      (supabase.from as any).mockReturnValue(
        createQueryMock({
          data: partialProfile,
          error: null,
        }),
      );

      const result = await getLaboranProfile(mockUserId);

      expect(result).toEqual(partialProfile);
    });

    it("should handle partial updates for mahasiswa", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      // Update only specific fields
      const partialUpdate = {
        semester: 8, // Update semester only
      };

      await expect(
        updateMahasiswaProfile(mockMahasiswaId, partialUpdate),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("mahasiswa");
    });

    it("should handle partial updates for dosen", async () => {
      (supabase.from as any).mockReturnValue(
        createQueryMock({
          error: null,
        }),
      );

      const partialUpdate = {
        office_room: "B-456", // Update only office room
      };

      await expect(
        updateDosenProfile(mockDosenId, partialUpdate),
      ).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith("dosen");
    });
  });
});
