/**
 * Mata Kuliah API Unit Tests
 * Tests for course management operations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMataKuliah,
  getMataKuliahById,
  createMataKuliah,
  updateMataKuliah,
  deleteMataKuliah,
  getMataKuliahStats,
} from "../../../lib/api/mata-kuliah.api";

vi.mock("../../../lib/api/base.api", () => ({
  queryWithFilters: vi.fn(),
  query: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
}));

vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
}));

vi.mock("../../../lib/utils/errors", () => ({
  handleError: vi.fn((error) => error),
  logError: vi.fn(),
}));

import {
  queryWithFilters,
  query,
  getById,
  insert,
  update,
  remove,
  count,
} from "../../../lib/api/base.api";

const mockMataKuliah = {
  id: "mk-1",
  kode_mk: "KBD101",
  nama_mk: "Kebidanan Dasar",
  program_studi: "D3 Kebidanan",
  semester: 1,
  sks: 3,
};

describe("Mata Kuliah API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMataKuliah", () => {
    it("should fetch all mata kuliah", async () => {
      vi.mocked(query).mockResolvedValue([mockMataKuliah]);

      const result = await getMataKuliah();

      expect(result).toHaveLength(1);
    });

    it("should apply filters", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockMataKuliah]);

      await getMataKuliah({ semester: 1 });

      expect(queryWithFilters).toHaveBeenCalled();
    });
  });

  describe("getMataKuliahById", () => {
    it("should fetch single mata kuliah", async () => {
      vi.mocked(getById).mockResolvedValue(mockMataKuliah);

      const result = await getMataKuliahById("mk-1");

      expect(result).toEqual(mockMataKuliah);
    });
  });

  describe("createMataKuliah", () => {
    it("should create new mata kuliah", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([]);
      vi.mocked(insert).mockResolvedValue(mockMataKuliah);

      const result = await createMataKuliah({
        kode_mk: "KBD102",
        nama_mk: "Test",
        program_studi: "D3 Kebidanan",
        semester: 2,
        sks: 2,
      });

      expect(result).toEqual(mockMataKuliah);
    });

    it("should reject duplicate kode_mk", async () => {
      vi.mocked(queryWithFilters).mockResolvedValue([mockMataKuliah]);

      await expect(
        createMataKuliah({
          kode_mk: "KBD101",
          nama_mk: "Test",
          program_studi: "D3 Kebidanan",
          semester: 1,
          sks: 3,
        }),
      ).rejects.toThrow("sudah ada");
    });
  });

  describe("updateMataKuliah", () => {
    it("should update mata kuliah", async () => {
      vi.mocked(update).mockResolvedValue(mockMataKuliah);

      await updateMataKuliah("mk-1", { nama_mk: "Updated" });

      expect(update).toHaveBeenCalled();
    });
  });

  describe("deleteMataKuliah", () => {
    it("should delete when no kelas", async () => {
      vi.mocked(count).mockResolvedValue(0);
      vi.mocked(remove).mockResolvedValue(true);

      await deleteMataKuliah("mk-1");

      expect(remove).toHaveBeenCalled();
    });

    it("should detach kelas and delete when kelas exist by default", async () => {
      vi.mocked(count).mockResolvedValue(5);
      vi.mocked(queryWithFilters).mockResolvedValue([
        { id: "k1", mata_kuliah_id: "mk-1" },
        { id: "k2", mata_kuliah_id: "mk-1" },
      ]);
      vi.mocked(update).mockResolvedValue({} as any);
      vi.mocked(remove).mockResolvedValue(true);

      await deleteMataKuliah("mk-1");

      expect(update).toHaveBeenCalledTimes(2);
      expect(update).toHaveBeenCalledWith("kelas", "k1", {
        mata_kuliah_id: null,
      });
      expect(update).toHaveBeenCalledWith("kelas", "k2", {
        mata_kuliah_id: null,
      });
      expect(remove).toHaveBeenCalledWith("mata_kuliah", "mk-1");
    });
  });

  describe("getMataKuliahStats", () => {
    it("should calculate statistics", async () => {
      vi.mocked(query).mockResolvedValue([mockMataKuliah]);
      vi.mocked(queryWithFilters).mockResolvedValue([]);
      vi.mocked(count).mockResolvedValue(0);

      const stats = await getMataKuliahStats();

      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("by_program_studi");
    });
  });
});
