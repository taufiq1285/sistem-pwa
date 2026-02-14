/**
 * Peminjaman Extensions API Comprehensive Unit Tests
 * White-box testing for equipment borrowing, room booking, and data flow logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllPeminjaman,
  markAsReturned,
  getPendingRoomBookings,
  approveRoomBooking,
  rejectRoomBooking,
} from "@/lib/api/peminjaman-extensions";

vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../../lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../../lib/utils/errors", () => ({
  handleSupabaseError: vi.fn((error) => error),
}));

import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";
import { handleSupabaseError } from "@/lib/utils/errors";

const mockQueryBuilder = (defaultResponse: any = { data: [], error: null }) => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };
  
  // Make the builder thenable by returning a Promise
  const promise = Promise.resolve(defaultResponse);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  
  return builder;
};

describe("Peminjaman Extensions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 1. getAllPeminjaman - Valid Cases
  // ===========================================================================
  describe("getAllPeminjaman - Valid Cases", () => {
    it("should fetch all peminjaman with complete details", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            dosen_id: "dosen-1",
            jumlah_pinjam: 5,
            keperluan: "Praktikum",
            tanggal_pinjam: "2024-01-01",
            tanggal_kembali_rencana: "2024-01-07",
            tanggal_kembali_aktual: null,
            kondisi_pinjam: "baik",
            kondisi_kembali: null,
            keterangan_kembali: null,
            status: "approved",
            rejection_reason: null,
            approved_by: "laboran-1",
            approved_at: "2024-01-01T10:00:00Z",
            denda: null,
            created_at: "2024-01-01T09:00:00Z",
            updated_at: null,
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Microscope",
              laboratorium: { id: "lab-1", nama_lab: "Lab Fisika" },
            },
            peminjam: {
              nim: "12345678",
              user: { full_name: "John Doe" }
            },
            dosen: {
              nip: "198001011",
              user: { full_name: "Dr. Smith" }
            },
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.data[0]).toHaveProperty("inventaris_kode", "ALT001");
      expect(result.data[0]).toHaveProperty("inventaris_nama", "Microscope");
      expect(result.data[0]).toHaveProperty("peminjam_nama", "John Doe");
      expect(result.data[0]).toHaveProperty("peminjam_nim", "12345678");
      expect(result.data[0]).toHaveProperty("dosen_nama", "Dr. Smith");
      expect(result.data[0]).toHaveProperty("laboratorium_nama", "Lab Fisika");
    });

    it("should apply status filter correctly", async () => {
      const builder = mockQueryBuilder({ data: [], count: 0, error: null });
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await getAllPeminjaman({ status: "approved" });

      expect(builder.eq).toHaveBeenCalledWith("status", "approved");
    });

    it("should apply laboratorium_id filter correctly", async () => {
      const builder = mockQueryBuilder({ data: [], count: 0, error: null });
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await getAllPeminjaman({ laboratorium_id: "lab-1" });

      expect(builder.eq).toHaveBeenCalledWith("inventaris.laboratorium.id", "lab-1");
    });

    it("should apply limit parameter correctly", async () => {
      const builder = mockQueryBuilder({ data: [], count: 0, error: null });
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await getAllPeminjaman({ limit: 10 });

      expect(builder.limit).toHaveBeenCalledWith(10);
    });

    it("should apply offset and range correctly", async () => {
      const builder = mockQueryBuilder({ data: [], count: 0, error: null });
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await getAllPeminjaman({ offset: 20, limit: 10 });

      expect(builder.range).toHaveBeenCalledWith(20, 29);
    });

    it("should handle empty data array", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should handle null data", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: null,
        count: null,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should handle missing inventaris data gracefully", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            status: "approved",
            inventaris: null,
            peminjam: { nim: "123", user: { full_name: "User" } },
            dosen: null,
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data[0].inventaris_kode).toBe("-");
      expect(result.data[0].inventaris_nama).toBe("Unknown");
      expect(result.data[0].laboratorium_nama).toBe("-");
    });

    it("should handle missing peminjam data gracefully", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            status: "approved",
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Item",
              laboratorium: { nama_lab: "Lab" }
            },
            peminjam: null,
            dosen: null,
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data[0].peminjam_nama).toBe("Unknown");
      expect(result.data[0].peminjam_nim).toBe("-");
    });

    it("should handle missing dosen data gracefully", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            dosen_id: "dosen-1",
            status: "approved",
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Item",
              laboratorium: { nama_lab: "Lab" }
            },
            peminjam: { nim: "123", user: { full_name: "User" } },
            dosen: null,
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data[0].dosen_nama).toBeNull();
      expect(result.data[0].dosen_nip).toBeNull();
    });

    it("should map all status types correctly", async () => {
      const statuses = ["pending", "approved", "rejected", "returned", "overdue"];

      for (const status of statuses) {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: [
            {
              id: "1",
              inventaris_id: "inv-1",
              peminjam_id: "mhs-1",
              status: status,
              inventaris: {
                kode_barang: "A",
                nama_barang: "Item",
                laboratorium: { nama_lab: "Lab" }
              },
              peminjam: { nim: "123", user: { full_name: "User" } },
              dosen: null,
            },
          ],
          count: 1,
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        const result = await getAllPeminjaman();
        expect(result.data[0].status).toBe(status);
      }
    });

    it("should order by created_at descending", async () => {
      const builder = mockQueryBuilder({ data: [], count: 0, error: null });
      builder.order.mockResolvedValue({ data: [], count: 0, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await getAllPeminjaman();

      expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });
  });

  // ===========================================================================
  // 2. getAllPeminjaman - Error Handling
  // ===========================================================================
  describe("getAllPeminjaman - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Database error");
      builder.order.mockResolvedValue({
        data: null,
        count: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(getAllPeminjaman()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch peminjaman",
        { params: undefined, error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });
  });

  // ===========================================================================
  // 3. markAsReturned - Valid Cases
  // ===========================================================================
  describe("markAsReturned - Valid Cases", () => {
    it("should mark peminjaman as returned with baik condition", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "baik", "Returned in good condition");

      expect(builder.update).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "pinjam-1");
      expect(builder.eq).toHaveBeenCalledWith("status", "approved");
    });

    it("should mark peminjaman as returned with rusak_ringan condition", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "rusak_ringan", "Minor scratches");

      expect(builder.update).toHaveBeenCalled();
      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall.status).toBe("returned");
      expect(updateCall.kondisi_kembali).toBe("rusak_ringan");
      expect(updateCall.keterangan_kembali).toBe("Minor scratches");
    });

    it("should mark peminjaman as returned with rusak_berat condition", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "rusak_berat", "Major damage");

      expect(builder.update).toHaveBeenCalled();
      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall.kondisi_kembali).toBe("rusak_berat");
    });

    it("should mark peminjaman as returned with maintenance condition", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "maintenance", "Needs maintenance");

      expect(builder.update).toHaveBeenCalled();
      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall.kondisi_kembali).toBe("maintenance");
    });

    it("should set tanggal_kembali_aktual to current time", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const beforeTime = new Date();
      await markAsReturned("pinjam-1", "baik");
      const afterTime = new Date();

      const updateCall = builder.update.mock.calls[0][0];
      const returnedTime = new Date(updateCall.tanggal_kembali_aktual);

      expect(returnedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(returnedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should set updated_at to current time", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const beforeTime = new Date();
      await markAsReturned("pinjam-1", "baik");
      const afterTime = new Date();

      const updateCall = builder.update.mock.calls[0][0];
      const updatedTime = new Date(updateCall.updated_at);

      expect(updatedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should handle missing keterangan parameter", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "baik");

      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall.keterangan_kembali).toBeNull();
    });

    it("should only update approved peminjaman", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "baik");

      expect(builder.eq).toHaveBeenCalledWith("status", "approved");
    });
  });

  // ===========================================================================
  // 4. markAsReturned - Error Handling
  // ===========================================================================
  describe("markAsReturned - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Update failed");
      builder.update.mockReturnThis();
      // First .eq() returns builder, second .eq() returns promise with error
      builder.eq.mockReturnValueOnce(builder).mockResolvedValue({ error: dbError });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(markAsReturned("pinjam-1", "baik")).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to mark peminjaman as returned",
        { peminjamanId: "pinjam-1", error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });
  });

  // ===========================================================================
  // 5. getPendingRoomBookings - Valid Cases
  // ===========================================================================
  describe("getPendingRoomBookings - Valid Cases", () => {
    it("should fetch and map pending room bookings with complete data", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
            tanggal_praktikum: "2024-01-15",
            minggu_ke: 2,
            topik: "Praktikum 1",
            deskripsi: "Deskripsi",
            catatan: "Catatan",
            created_at: "2024-01-10T08:00:00Z",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [
          { id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab Fisika", kapasitas: 30 },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: "mk-1", nama_mk: "Fisika Dasar" }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: "dosen-1", nip: "198001011", user_id: "user-1" }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [{ id: "user-1", full_name: "Dr. Smith" }],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("jadwal-1");
      expect(result[0].kelas_nama).toBe("Kelas A");
      expect(result[0].mata_kuliah_nama).toBe("Fisika Dasar");
      expect(result[0].dosen_nama).toBe("Dr. Smith");
      expect(result[0].laboratorium_nama).toBe("Lab Fisika");
      expect(result[0].laboratorium_kapasitas).toBe(30);
    });

    it("should handle empty jadwal data", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(0);
    });

    it("should handle null jadwal data", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: null,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(0);
    });

    it("should handle missing kelas data gracefully", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [], // No kelas data
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [{ id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 }],
        error: null,
      });

      // Only 3 supabase.from() calls will be made since kelas data is empty
      // (no mata_kuliah, dosen, or users queries)
      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(1);
      expect(result[0].kelas_nama).toBe("-");
      expect(result[0].mata_kuliah_nama).toBe("Unknown");
      expect(result[0].dosen_nama).toBe("Unknown");
    });

    it("should handle missing lab data gracefully", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [], // No lab data
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: "mk-1", nama_mk: "Fisika" }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: "dosen-1", nip: "123", user_id: "user-1" }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [{ id: "user-1", full_name: "Dosen" }],
        error: null,
      });

      // All 6 supabase.from() calls will be made
      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const result = await getPendingRoomBookings();

      expect(result[0].laboratorium_nama).toBe("-");
      expect(result[0].laboratorium_kode).toBe("-");
      expect(result[0].laboratorium_kapasitas).toBe(0);
    });

    it("should handle null kelas_id", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: null, // Null kelas_id
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [{ id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 }],
        error: null,
      });

      // Only 2 supabase.from() calls: jadwal and lab (kelas_id is null, no kelas query)
      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(labBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(1);
      expect(result[0].kelas_id).toBeNull();
    });

    it("should handle missing user data gracefully", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [{ id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 }],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: "mk-1", nama_mk: "Fisika" }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: "dosen-1", nip: "123", user_id: "user-1" }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [], // No user data
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const result = await getPendingRoomBookings();

      expect(result[0].dosen_nama).toBe("Unknown");
    });

    it("should apply limit parameter correctly", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await getPendingRoomBookings(25);

      expect(jadwalBuilder.limit).toHaveBeenCalledWith(25);
    });

    it("should order by created_at descending", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await getPendingRoomBookings();

      expect(jadwalBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should only fetch pending bookings (is_active = false)", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await getPendingRoomBookings();

      expect(jadwalBuilder.eq).toHaveBeenCalledWith("is_active", false);
    });

    it("should handle multiple bookings with different labs and classes", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
          {
            id: "jadwal-2",
            kelas_id: "kelas-2",
            laboratorium_id: "lab-2",
            hari: "Selasa",
            jam_mulai: "10:00",
            jam_selesai: "12:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
          {
            id: "kelas-2",
            nama_kelas: "Kelas B",
            mata_kuliah_id: "mk-2",
            dosen_id: "dosen-2",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [
          { id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab 1", kapasitas: 30 },
          { id: "lab-2", kode_lab: "LAB2", nama_lab: "Lab 2", kapasitas: 40 },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [
          { id: "mk-1", nama_mk: "Fisika" },
          { id: "mk-2", nama_mk: "Kimia" },
        ],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [
          { id: "dosen-1", nip: "123", user_id: "user-1" },
          { id: "dosen-2", nip: "456", user_id: "user-2" },
        ],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [
          { id: "user-1", full_name: "Dr. A" },
          { id: "user-2", full_name: "Dr. B" },
        ],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const result = await getPendingRoomBookings();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("jadwal-1");
      expect(result[1].id).toBe("jadwal-2");
    });
  });

  // ===========================================================================
  // 6. getPendingRoomBookings - Error Handling
  // ===========================================================================
  describe("getPendingRoomBookings - Error Handling", () => {
    it("should handle database error in jadwal query", async () => {
      const jadwalBuilder = mockQueryBuilder();
      const dbError = new Error("Jadwal query failed");
      jadwalBuilder.limit.mockResolvedValue({
        data: null,
        error: dbError,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await expect(getPendingRoomBookings()).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to fetch pending room bookings",
        { limit: 50, error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });
  });

  // ===========================================================================
  // 7. approveRoomBooking - Valid Cases
  // ===========================================================================
  describe("approveRoomBooking - Valid Cases", () => {
    it("should approve room booking by setting is_active to true", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await approveRoomBooking("jadwal-1");

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true })
      );
      expect(builder.eq).toHaveBeenCalledWith("id", "jadwal-1");
      expect(builder.eq).toHaveBeenCalledWith("is_active", false);
    });

    it("should set updated_at to current time", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const beforeTime = new Date();
      await approveRoomBooking("jadwal-1");
      const afterTime = new Date();

      const updateCall = builder.update.mock.calls[0][0];
      const updatedTime = new Date(updateCall.updated_at);

      expect(updatedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it("should only approve pending bookings (is_active = false)", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await approveRoomBooking("jadwal-1");

      expect(builder.eq).toHaveBeenCalledWith("is_active", false);
    });
  });

  // ===========================================================================
  // 8. approveRoomBooking - Error Handling
  // ===========================================================================
  describe("approveRoomBooking - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Update failed");
      builder.update.mockReturnThis();
      // First .eq() returns builder, second .eq() returns promise with error
      builder.eq.mockReturnValueOnce(builder).mockResolvedValue({ error: dbError });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(approveRoomBooking("jadwal-1")).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to approve room booking",
        { jadwalId: "jadwal-1", error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });
  });

  // ===========================================================================
  // 9. rejectRoomBooking - Valid Cases
  // ===========================================================================
  describe("rejectRoomBooking - Valid Cases", () => {
    it("should reject and delete room booking", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await rejectRoomBooking("jadwal-1", "Not available");

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "jadwal-1");
      expect(builder.eq).toHaveBeenCalledWith("is_active", false);
    });

    it("should only delete pending bookings (is_active = false)", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await rejectRoomBooking("jadwal-1");

      expect(builder.eq).toHaveBeenCalledWith("is_active", false);
    });

    it("should handle rejection without reason", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await rejectRoomBooking("jadwal-1");

      expect(builder.delete).toHaveBeenCalled();
    });

    it("should log rejection reason when provided", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await rejectRoomBooking("jadwal-1", "Lab not available on that date");

      expect(logger.info).toHaveBeenCalledWith(
        "Rejection reason:",
        "Lab not available on that date"
      );
    });
  });

  // ===========================================================================
  // 10. rejectRoomBooking - Error Handling
  // ===========================================================================
  describe("rejectRoomBooking - Error Handling", () => {
    it("should handle database error", async () => {
      const builder = mockQueryBuilder();
      const dbError = new Error("Delete failed");
      builder.delete.mockReturnThis();
      // First .eq() returns builder, second .eq() returns promise with error
      builder.eq.mockReturnValueOnce(builder).mockResolvedValue({ error: dbError });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await expect(rejectRoomBooking("jadwal-1", "Reason")).rejects.toThrow();
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to reject room booking",
        { jadwalId: "jadwal-1", reason: "Reason", error: dbError }
      );
      expect(handleSupabaseError).toHaveBeenCalledWith(dbError);
    });
  });

  // ===========================================================================
  // 11. White-Box Testing - Branch Coverage
  // ===========================================================================
  describe("White-Box Testing - Branch Coverage", () => {
    describe("getAllPeminjaman branches", () => {
      it("should branch: apply all filters (status, laboratorium_id, limit, offset)", async () => {
        const builder = mockQueryBuilder({ data: [], count: 0, error: null });
        builder.order.mockResolvedValue({ data: [], count: 0, error: null });
        vi.mocked(supabase.from).mockReturnValue(builder);

        await getAllPeminjaman({
          status: "approved",
          laboratorium_id: "lab-1",
          limit: 10,
          offset: 20,
        });

        expect(builder.eq).toHaveBeenCalledWith("status", "approved");
        expect(builder.eq).toHaveBeenCalledWith("inventaris.laboratorium.id", "lab-1");
        expect(builder.limit).toHaveBeenCalledWith(10);
        expect(builder.range).toHaveBeenCalledWith(20, 29);
      });

      it("should branch: handle null inventaris.laboratorium", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: [
            {
              id: "1",
              inventaris_id: "inv-1",
              peminjam_id: "mhs-1",
              status: "approved",
              inventaris: {
                kode_barang: "A",
                nama_barang: "Item",
                laboratorium: null, // Null laboratorium
              },
              peminjam: { nim: "123", user: { full_name: "User" } },
              dosen: null,
            },
          ],
          count: 1,
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        const result = await getAllPeminjaman();

        expect(result.data[0].laboratorium_nama).toBe("-");
      });

      it("should branch: handle missing peminjam.user", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: [
            {
              id: "1",
              inventaris_id: "inv-1",
              peminjam_id: "mhs-1",
              status: "approved",
              inventaris: {
                kode_barang: "A",
                nama_barang: "Item",
                laboratorium: { nama_lab: "Lab" },
              },
              peminjam: { nim: "123", user: null }, // Null user
              dosen: null,
            },
          ],
          count: 1,
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        const result = await getAllPeminjaman();

        expect(result.data[0].peminjam_nama).toBe("Unknown");
      });

      it("should branch: handle missing dosen.user", async () => {
        const builder = mockQueryBuilder();
        builder.order.mockResolvedValue({
          data: [
            {
              id: "1",
              inventaris_id: "inv-1",
              peminjam_id: "mhs-1",
              dosen_id: "dosen-1",
              status: "approved",
              inventaris: {
                kode_barang: "A",
                nama_barang: "Item",
                laboratorium: { nama_lab: "Lab" },
              },
              peminjam: { nim: "123", user: { full_name: "User" } },
              dosen: { nip: "123", user: null }, // Null user
            },
          ],
          count: 1,
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        const result = await getAllPeminjaman();

        expect(result.data[0].dosen_nama).toBeNull();
      });
    });

    describe("markAsReturned branches", () => {
      it("should branch: all kondisiKembali types", async () => {
        const conditions = ["baik", "rusak_ringan", "rusak_berat", "maintenance"] as const;

        for (const condition of conditions) {
          const builder = mockQueryBuilder({ error: null });
          vi.mocked(supabase.from).mockReturnValue(builder);

          await markAsReturned("pinjam-1", condition);

          const updateCall = builder.update.mock.calls[0][0];
          expect(updateCall.kondisi_kembali).toBe(condition);
        }
      });

      it("should branch: keterangan provided vs not provided", async () => {
        // Branch 1: With keterangan
        const builder1 = mockQueryBuilder({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder1);
        await markAsReturned("pinjam-1", "baik", "Some note");
        const updateCall1 = builder1.update.mock.calls[0][0];
        expect(updateCall1.keterangan_kembali).toBe("Some note");

        // Branch 2: Without keterangan
        const builder2 = mockQueryBuilder({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder2);
        await markAsReturned("pinjam-1", "baik");
        const updateCall2 = builder2.update.mock.calls[0][0];
        expect(updateCall2.keterangan_kembali).toBeNull();
      });
    });

    describe("getPendingRoomBookings branches", () => {
      it("should branch: empty kelas_ids array", async () => {
        const jadwalBuilder = mockQueryBuilder({
          data: [
            {
              id: "jadwal-1",
              kelas_id: null, // All kelas_id are null
              laboratorium_id: "lab-1",
              hari: "Senin",
              jam_mulai: "08:00",
              jam_selesai: "10:00",
            },
          ],
          error: null,
        });

        const labBuilder = mockQueryBuilder({
          data: [{ id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 }],
          error: null,
        });

        vi.mocked(supabase.from)
          .mockReturnValueOnce(jadwalBuilder)
          .mockReturnValueOnce(labBuilder);

        const result = await getPendingRoomBookings();

        expect(result).toHaveLength(1);
      });

      it("should branch: empty lab_ids array", async () => {
        const jadwalBuilder = mockQueryBuilder({
          data: [
            {
              id: "jadwal-1",
              kelas_id: "kelas-1",
              laboratorium_id: null, // All laboratorium_id are null
              hari: "Senin",
              jam_mulai: "08:00",
              jam_selesai: "10:00",
            },
          ],
          error: null,
        });

        // laboratorium_id is null, so only jadwal query will be made
        // (kelas_id exists but will result in empty kelas data from default builder)
        const kelasBuilder = mockQueryBuilder(); // Returns empty by default
        
        vi.mocked(supabase.from)
          .mockReturnValueOnce(jadwalBuilder)
          .mockReturnValueOnce(kelasBuilder);

        const result = await getPendingRoomBookings();

        expect(result).toHaveLength(1);
      });
    });

    describe("rejectRoomBooking branches", () => {
      it("should branch: reason provided vs not provided", async () => {
        // Branch 1: With reason
        const builder1 = mockQueryBuilder({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder1);
        await rejectRoomBooking("jadwal-1", "Not available");
        expect(logger.info).toHaveBeenCalled();

        vi.clearAllMocks();

        // Branch 2: Without reason
        const builder2 = mockQueryBuilder({ error: null });
        vi.mocked(supabase.from).mockReturnValue(builder2);
        await rejectRoomBooking("jadwal-1");
        expect(logger.info).not.toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // 12. White-Box Testing - Path Coverage
  // ===========================================================================
  describe("White-Box Testing - Path Coverage", () => {
    describe("getAllPeminjaman paths", () => {
      it("should path: success with all filters applied", async () => {
        const builder = mockQueryBuilder({
          data: [
            {
              id: "1",
              inventaris_id: "inv-1",
              peminjam_id: "mhs-1",
              status: "approved",
              inventaris: {
                kode_barang: "A",
                nama_barang: "Item",
                laboratorium: { nama_lab: "Lab" },
              },
              peminjam: { nim: "123", user: { full_name: "User" } },
              dosen: null,
            },
          ],
          count: 1,
          error: null,
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        const result = await getAllPeminjaman({
          status: "approved",
          laboratorium_id: "lab-1",
          limit: 10,
          offset: 0,
        });

        expect(result.data).toHaveLength(1);
        expect(result.count).toBe(1);
      });

      it("should path: error handling path", async () => {
        const builder = mockQueryBuilder({
          data: null,
          count: null,
          error: new Error("DB error"),
        });
        vi.mocked(supabase.from).mockReturnValue(builder);

        await expect(getAllPeminjaman()).rejects.toThrow();
      });
    });

    describe("markAsReturned paths", () => {
      it("should path: successful return with all parameters", async () => {
        const builder = mockQueryBuilder();
        vi.mocked(supabase.from).mockReturnValue(builder);

        await markAsReturned("pinjam-1", "baik", "Test keterangan");

        expect(builder.update).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "returned",
            kondisi_kembali: "baik",
            keterangan_kembali: "Test keterangan",
          })
        );
      });
    });

    describe("getPendingRoomBookings paths", () => {
      it("should path: complete data flow through all 6 queries", async () => {
        const jadwalBuilder = mockQueryBuilder();
        jadwalBuilder.limit.mockResolvedValue({
          data: [
            {
              id: "jadwal-1",
              kelas_id: "kelas-1",
              laboratorium_id: "lab-1",
              hari: "Senin",
              jam_mulai: "08:00",
              jam_selesai: "10:00",
            },
          ],
          error: null,
        });

        const kelasBuilder = mockQueryBuilder();
        kelasBuilder.in.mockResolvedValue({
          data: [
            {
              id: "kelas-1",
              nama_kelas: "Kelas A",
              mata_kuliah_id: "mk-1",
              dosen_id: "dosen-1",
            },
          ],
          error: null,
        });

        const labBuilder = mockQueryBuilder();
        labBuilder.in.mockResolvedValue({
          data: [
            { id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 },
          ],
          error: null,
        });

        const mkBuilder = mockQueryBuilder();
        mkBuilder.in.mockResolvedValue({
          data: [{ id: "mk-1", nama_mk: "Fisika" }],
          error: null,
        });

        const dosenBuilder = mockQueryBuilder();
        dosenBuilder.in.mockResolvedValue({
          data: [{ id: "dosen-1", nip: "123", user_id: "user-1" }],
          error: null,
        });

        const userBuilder = mockQueryBuilder();
        userBuilder.in.mockResolvedValue({
          data: [{ id: "user-1", full_name: "Dosen" }],
          error: null,
        });

        vi.mocked(supabase.from)
          .mockReturnValueOnce(jadwalBuilder)
          .mockReturnValueOnce(kelasBuilder)
          .mockReturnValueOnce(labBuilder)
          .mockReturnValueOnce(mkBuilder)
          .mockReturnValueOnce(dosenBuilder)
          .mockReturnValueOnce(userBuilder);

        const result = await getPendingRoomBookings();

        expect(result).toHaveLength(1);
        expect(result[0].kelas_nama).toBe("Kelas A");
        expect(result[0].mata_kuliah_nama).toBe("Fisika");
        expect(result[0].dosen_nama).toBe("Dosen");
        expect(result[0].laboratorium_nama).toBe("Lab");
      });
    });
  });

  // ===========================================================================
  // 13. White-Box Testing - Statement Coverage
  // ===========================================================================
  describe("White-Box Testing - Statement Coverage", () => {
    it("should execute all mapping statements in getAllPeminjaman", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            dosen_id: "dosen-1",
            jumlah_pinjam: 5,
            keperluan: "Test",
            tanggal_pinjam: "2024-01-01",
            tanggal_kembali_rencana: "2024-01-07",
            tanggal_kembali_aktual: "2024-01-06",
            kondisi_pinjam: "baik",
            kondisi_kembali: "baik",
            keterangan_kembali: "Test",
            status: "returned",
            rejection_reason: null,
            approved_by: "laboran-1",
            approved_at: "2024-01-01T10:00:00Z",
            denda: 0,
            created_at: "2024-01-01T09:00:00Z",
            updated_at: "2024-01-06T10:00:00Z",
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Microscope",
              laboratorium: { nama_lab: "Lab Fisika" },
            },
            peminjam: {
              nim: "12345678",
              user: { full_name: "John Doe" }
            },
            dosen: {
              nip: "198001011",
              user: { full_name: "Dr. Smith" }
            },
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data[0]).toMatchObject({
        id: "1",
        inventaris_id: "inv-1",
        inventaris_kode: "ALT001",
        inventaris_nama: "Microscope",
        peminjam_id: "mhs-1",
        peminjam_nama: "John Doe",
        peminjam_nim: "12345678",
        dosen_id: "dosen-1",
        dosen_nama: "Dr. Smith",
        dosen_nip: "198001011",
        jumlah_pinjam: 5,
        keperluan: "Test",
        status: "returned",
      });
    });

    it("should execute all update statements in markAsReturned", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await markAsReturned("pinjam-1", "rusak_ringan", "Test note");

      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty("status", "returned");
      expect(updateCall).toHaveProperty("tanggal_kembali_aktual");
      expect(updateCall).toHaveProperty("kondisi_kembali", "rusak_ringan");
      expect(updateCall).toHaveProperty("keterangan_kembali", "Test note");
      expect(updateCall).toHaveProperty("updated_at");
    });

    it("should execute all map creation statements in getPendingRoomBookings", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [
          { id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: "mk-1", nama_mk: "Fisika" }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: "dosen-1", nip: "123", user_id: "user-1" }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [{ id: "user-1", full_name: "Dosen" }],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const result = await getPendingRoomBookings();

      expect(result[0]).toHaveProperty("kelas_nama", "Kelas A");
      expect(result[0]).toHaveProperty("mata_kuliah_nama", "Fisika");
      expect(result[0]).toHaveProperty("dosen_nama", "Dosen");
      expect(result[0]).toHaveProperty("laboratorium_nama", "Lab");
    });
  });

  // ===========================================================================
  // 14. Edge Cases
  // ===========================================================================
  describe("Edge Cases", () => {
    it("should handle very long keterangan in markAsReturned", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const longKeterangan = "A".repeat(1000);
      await markAsReturned("pinjam-1", "baik", longKeterangan);

      const updateCall = builder.update.mock.calls[0][0];
      expect(updateCall.keterangan_kembali).toBe(longKeterangan);
    });

    it("should handle special characters in getAllPeminjaman data", async () => {
      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: [
          {
            id: "1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            status: "approved",
            inventaris: {
              kode_barang: "ALT-001/2024",
              nama_barang: "Microscope & Equipment",
              laboratorium: { nama_lab: "Lab #1 @ Building A" },
            },
            peminjam: { nim: "123", user: { full_name: "John <Doe>" } },
            dosen: null,
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const result = await getAllPeminjaman();

      expect(result.data[0].inventaris_nama).toBe("Microscope & Equipment");
      expect(result.data[0].laboratorium_nama).toBe("Lab #1 @ Building A");
    });

    it("should handle concurrent approval attempts", async () => {
      const builder = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      await Promise.all([
        approveRoomBooking("jadwal-1"),
        approveRoomBooking("jadwal-2"),
        approveRoomBooking("jadwal-3"),
      ]);

      expect(builder.update).toHaveBeenCalledTimes(3);
    });

    it("should handle default limit in getPendingRoomBookings", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await getPendingRoomBookings();

      expect(jadwalBuilder.limit).toHaveBeenCalledWith(50);
    });

    it("should handle zero limit in getPendingRoomBookings", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(jadwalBuilder);

      await getPendingRoomBookings(0);

      expect(jadwalBuilder.limit).toHaveBeenCalledWith(0);
    });
  });

  // ===========================================================================
  // 15. Performance Testing
  // ===========================================================================
  describe("Performance Testing", () => {
    it("should handle large peminjaman dataset efficiently", async () => {
      const largeData = Array(500).fill(null).map((_, i) => ({
        id: `pinjam-${i}`,
        inventaris_id: `inv-${i}`,
        peminjam_id: `mhs-${i}`,
        status: "approved",
        inventaris: {
          kode_barang: `ALT${i}`,
          nama_barang: `Item ${i}`,
          laboratorium: { nama_lab: `Lab ${i % 10}` },
        },
        peminjam: { nim: `123${i}`, user: { full_name: `User ${i}` } },
        dosen: null,
      }));

      const builder = mockQueryBuilder();
      builder.order.mockResolvedValue({
        data: largeData,
        count: 500,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const startTime = Date.now();
      const result = await getAllPeminjaman();
      const duration = Date.now() - startTime;

      expect(result.data).toHaveLength(500);
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    it("should handle multiple room bookings efficiently", async () => {
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: Array(100).fill(null).map((_, i) => ({
          id: `jadwal-${i}`,
          kelas_id: `kelas-${i % 20}`,
          laboratorium_id: `lab-${i % 5}`,
          hari: "Senin",
          jam_mulai: "08:00",
          jam_selesai: "10:00",
        })),
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: Array(20).fill(null).map((_, i) => ({
          id: `kelas-${i}`,
          nama_kelas: `Kelas ${i}`,
          mata_kuliah_id: `mk-${i}`,
          dosen_id: `dosen-${i}`,
        })),
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: Array(5).fill(null).map((_, i) => ({
          id: `lab-${i}`,
          kode_lab: `LAB${i}`,
          nama_lab: `Lab ${i}`,
          kapasitas: 30,
        })),
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: Array(20).fill(null).map((_, i) => ({
          id: `mk-${i}`,
          nama_mk: `Mata Kuliah ${i}`,
        })),
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: Array(20).fill(null).map((_, i) => ({
          id: `dosen-${i}`,
          nip: `123${i}`,
          user_id: `user-${i}`,
        })),
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: Array(20).fill(null).map((_, i) => ({
          id: `user-${i}`,
          full_name: `Dosen ${i}`,
        })),
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const startTime = Date.now();
      const result = await getPendingRoomBookings(100);
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(100);
    });
  });

  // ===========================================================================
  // 16. Integration Scenarios
  // ===========================================================================
  describe("Integration Scenarios", () => {
    it("should work with realistic peminjaman workflow", async () => {
      // Step 1: Get all pending peminjaman
      const builder1 = mockQueryBuilder();
      builder1.order.mockResolvedValue({
        data: [
          {
            id: "pinjam-1",
            inventaris_id: "inv-1",
            peminjam_id: "mhs-1",
            dosen_id: "dosen-1",
            status: "approved",
            inventaris: {
              kode_barang: "ALT001",
              nama_barang: "Microscope",
              laboratorium: { nama_lab: "Lab Fisika" },
            },
            peminjam: { nim: "123", user: { full_name: "John" } },
            dosen: { nip: "123", user: { full_name: "Dr. Smith" } },
          },
        ],
        count: 1,
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(builder1);

      const peminjaman = await getAllPeminjaman({ status: "approved" });
      expect(peminjaman.data).toHaveLength(1);

      vi.clearAllMocks();

      // Step 2: Mark as returned
      const builder2 = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder2);

      await markAsReturned("pinjam-1", "baik", "Returned in good condition");
      expect(builder2.update).toHaveBeenCalled();
    });

    it("should work with realistic room booking workflow", async () => {
      // Step 1: Get pending room bookings
      const jadwalBuilder = mockQueryBuilder();
      jadwalBuilder.limit.mockResolvedValue({
        data: [
          {
            id: "jadwal-1",
            kelas_id: "kelas-1",
            laboratorium_id: "lab-1",
            hari: "Senin",
            jam_mulai: "08:00",
            jam_selesai: "10:00",
          },
        ],
        error: null,
      });

      const kelasBuilder = mockQueryBuilder();
      kelasBuilder.in.mockResolvedValue({
        data: [
          {
            id: "kelas-1",
            nama_kelas: "Kelas A",
            mata_kuliah_id: "mk-1",
            dosen_id: "dosen-1",
          },
        ],
        error: null,
      });

      const labBuilder = mockQueryBuilder();
      labBuilder.in.mockResolvedValue({
        data: [
          { id: "lab-1", kode_lab: "LAB1", nama_lab: "Lab", kapasitas: 30 },
        ],
        error: null,
      });

      const mkBuilder = mockQueryBuilder();
      mkBuilder.in.mockResolvedValue({
        data: [{ id: "mk-1", nama_mk: "Fisika" }],
        error: null,
      });

      const dosenBuilder = mockQueryBuilder();
      dosenBuilder.in.mockResolvedValue({
        data: [{ id: "dosen-1", nip: "123", user_id: "user-1" }],
        error: null,
      });

      const userBuilder = mockQueryBuilder();
      userBuilder.in.mockResolvedValue({
        data: [{ id: "user-1", full_name: "Dr. Smith" }],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(jadwalBuilder)
        .mockReturnValueOnce(kelasBuilder)
        .mockReturnValueOnce(labBuilder)
        .mockReturnValueOnce(mkBuilder)
        .mockReturnValueOnce(dosenBuilder)
        .mockReturnValueOnce(userBuilder);

      const bookings = await getPendingRoomBookings();
      expect(bookings).toHaveLength(1);

      vi.clearAllMocks();

      // Step 2: Approve the booking
      const builder2 = mockQueryBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(builder2);

      await approveRoomBooking("jadwal-1");
      expect(builder2.update).toHaveBeenCalled();
    });
  });
});
