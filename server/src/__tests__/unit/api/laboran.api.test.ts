/**
 * Laboran API Unit Tests
 * Comprehensive tests for laboran-specific API functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as laboranAPI from "../../../lib/api/laboran.api";
import { supabase } from "../../../lib/supabase/client";

// Mock Supabase
vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock cache API
vi.mock("../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

// Mock middleware
vi.mock("../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
}));

// Helper to setup auth mock
function setupAuthMock(user: any = { id: "user-123" }) {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user },
    error: null,
  } as any);
}

describe("Laboran API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default auth mock
    setupAuthMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getLaboranStats", () => {
    it("should return laboran statistics successfully", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        const mockCounts = {
          laboratorium: 5,
          inventaris: 100,
          peminjaman: 10,
          lowStock: 3,
        };

        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count:
                table === "laboratorium"
                  ? mockCounts.laboratorium
                  : table === "peminjaman"
                    ? mockCounts.peminjaman
                    : 0,
              data: null,
              error: null,
            }),
            lt: vi.fn().mockResolvedValue({
              count: mockCounts.lowStock,
              data: null,
              error: null,
            }),
          }),
        } as any;
      });

      // Need separate mock for inventaris since it doesn't have .eq() call
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "inventaris") {
          callCount++;
          if (callCount === 1) {
            // First call is for total inventaris (no .lt())
            return {
              select: vi.fn().mockResolvedValue({
                count: 100,
                data: null,
                error: null,
              }),
            } as any;
          } else {
            // Second call is for low stock (.lt())
            return {
              select: vi.fn().mockReturnValue({
                lt: vi.fn().mockResolvedValue({
                  count: 3,
                  data: null,
                  error: null,
                }),
              }),
            } as any;
          }
        }

        // For laboratorium and peminjaman
        const count =
          table === "laboratorium" ? 5 : table === "peminjaman" ? 10 : 0;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count,
              data: null,
              error: null,
            }),
          }),
        } as any;
      });

      const result = await laboranAPI.getLaboranStats();

      expect(result).toEqual({
        totalLab: 5,
        totalInventaris: 100,
        pendingApprovals: 10,
        lowStockAlerts: 3,
      });
    });

    it("should handle empty data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            count: 0,
          }),
          lt: vi.fn().mockReturnValue({
            count: 0,
          }),
        }),
      } as any);

      const result = await laboranAPI.getLaboranStats();

      expect(result).toEqual({
        totalLab: 0,
        totalInventaris: 0,
        pendingApprovals: 0,
        lowStockAlerts: 0,
      });
    });

    it("should handle database errors", async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(laboranAPI.getLaboranStats()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getPendingApprovals", () => {
    it("should return pending approval list", async () => {
      const mockPeminjaman = [
        {
          id: "pem-1",
          jumlah_pinjam: 2,
          keperluan: "Praktikum",
          tanggal_pinjam: "2024-01-01",
          tanggal_kembali_rencana: "2024-01-05",
          created_at: "2024-01-01T08:00:00Z",
          peminjam_id: "mhs-1",
          inventaris_id: "inv-1",
        },
      ];

      const mockMahasiswa = [
        {
          id: "mhs-1",
          nim: "12345",
          user_id: "user-1",
          users: { full_name: "John Doe" },
        },
      ];

      const mockInventaris = [
        {
          id: "inv-1",
          kode_barang: "INV001",
          nama_barang: "Mikroskop",
          laboratorium_id: "lab-1",
          laboratorium: { nama_lab: "Lab Biologi" },
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    data: mockPeminjaman,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                data: mockMahasiswa,
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                data: mockInventaris,
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getPendingApprovals();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "pem-1",
        peminjam_nama: "John Doe",
        peminjam_nim: "12345",
        inventaris_nama: "Mikroskop",
        inventaris_kode: "INV001",
        laboratorium_nama: "Lab Biologi",
        jumlah_pinjam: 2,
        keperluan: "Praktikum",
        tanggal_pinjam: "2024-01-01",
        tanggal_kembali_rencana: "2024-01-05",
        created_at: "2024-01-01T08:00:00Z",
      });
    });

    it("should handle missing related data gracefully", async () => {
      const mockPeminjaman = [
        {
          id: "pem-1",
          jumlah_pinjam: 2,
          keperluan: "Praktikum",
          tanggal_pinjam: "2024-01-01",
          tanggal_kembali_rencana: "2024-01-05",
          created_at: "2024-01-01T08:00:00Z",
          peminjam_id: "mhs-999",
          inventaris_id: "inv-999",
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    data: mockPeminjaman,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              data: [],
              error: null,
            }),
          }),
        } as any;
      });

      const result = await laboranAPI.getPendingApprovals();

      expect(result[0].peminjam_nama).toBe("Unknown");
      expect(result[0].inventaris_nama).toBe("Unknown");
    });

    it("should respect limit parameter", async () => {
      const limitMock = vi.fn().mockReturnValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        }),
      } as any);

      await laboranAPI.getPendingApprovals(20);

      expect(limitMock).toHaveBeenCalledWith(20);
    });
  });

  describe("getInventoryAlerts", () => {
    it("should return low stock items", async () => {
      const mockInventaris = [
        {
          id: "inv-1",
          kode_barang: "INV001",
          nama_barang: "Mikroskop",
          kategori: "Alat Lab",
          jumlah: 10,
          jumlah_tersedia: 2,
          kondisi: "baik",
          laboratorium: {
            kode_lab: "LAB1",
            nama_lab: "Lab Biologi",
          },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: mockInventaris,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getInventoryAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].jumlah_tersedia).toBeLessThan(5);
    });

    it('should handle null category as "Umum"', async () => {
      const mockInventaris = [
        {
          id: "inv-1",
          kode_barang: "INV001",
          nama_barang: "Item",
          kategori: null,
          jumlah: 10,
          jumlah_tersedia: 2,
          kondisi: "baik",
          laboratorium: {
            kode_lab: "LAB1",
            nama_lab: "Lab 1",
          },
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: mockInventaris,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getInventoryAlerts();

      expect(result[0].kategori).toBe("Umum");
    });
  });

  describe("approvePeminjaman", () => {
    it("should approve peminjaman and decrease stock", async () => {
      const mockPeminjaman = {
        inventaris_id: "inv-1",
        jumlah_pinjam: 2,
      };

      const mockInventaris = {
        jumlah_tersedia: 10,
        nama_barang: "Mikroskop",
      };

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPeminjaman,
                    error: null,
                  }),
                }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockInventaris,
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      await laboranAPI.approvePeminjaman("pem-1");

      expect(updateMock).toHaveBeenCalled();
    });

    it("should fail when stock is insufficient", async () => {
      const mockPeminjaman = {
        inventaris_id: "inv-1",
        jumlah_pinjam: 10,
      };

      const mockInventaris = {
        jumlah_tersedia: 5,
        nama_barang: "Mikroskop",
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPeminjaman,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockInventaris,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      await expect(laboranAPI.approvePeminjaman("pem-1")).rejects.toThrow(
        "Stok tidak cukup"
      );
    });

    it("should fail when user not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(laboranAPI.approvePeminjaman("pem-1")).rejects.toThrow(
        "User not authenticated"
      );
    });

    it("should fail when peminjaman not found", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("Not found"),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.approvePeminjaman("pem-999")).rejects.toThrow();
    });
  });

  describe("rejectPeminjaman", () => {
    it("should reject peminjaman with reason", async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as any);

      await laboranAPI.rejectPeminjaman("pem-1", "Barang tidak tersedia");

      expect(updateMock).toHaveBeenCalled();
    });

    it("should fail when user not authenticated", async () => {
      setupAuthMock(null); // No user

      await expect(
        laboranAPI.rejectPeminjaman("pem-1", "Reason")
      ).rejects.toThrow("User not authenticated");
    });
  });

  describe("Inventaris CRUD", () => {
    describe("getInventarisList", () => {
      it("should return inventaris list with filters", async () => {
        const mockData = [
          {
            id: "inv-1",
            kode_barang: "INV001",
            nama_barang: "Mikroskop",
            kategori: "Alat Lab",
            merk: "Olympus",
            spesifikasi: "High resolution",
            jumlah: 10,
            jumlah_tersedia: 8,
            kondisi: "baik",
            harga_satuan: 5000000,
            tahun_pengadaan: 2023,
            keterangan: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
            laboratorium: {
              id: "lab-1",
              kode_lab: "LAB1",
              nama_lab: "Lab Biologi",
            },
          },
        ];

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: mockData,
              error: null,
              count: 1,
            }),
          }),
        } as any);

        const result = await laboranAPI.getInventarisList();

        expect(result.data).toHaveLength(1);
        expect(result.count).toBe(1);
      });

      it("should apply search filter", async () => {
        const orMock = vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: [],
            error: null,
            count: 0,
          }),
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            or: orMock,
          }),
        } as any);

        await laboranAPI.getInventarisList({ search: "mikroskop" });

        expect(orMock).toHaveBeenCalledWith(
          expect.stringContaining("nama_barang.ilike")
        );
      });

      it("should apply pagination", async () => {
        const rangeMock = vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        });

        const limitMock = vi.fn().mockReturnValue({
          range: rangeMock,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            limit: limitMock,
            range: rangeMock,
          }),
        } as any);

        await laboranAPI.getInventarisList({ offset: 10, limit: 10 });

        expect(limitMock).toHaveBeenCalledWith(10);
        expect(rangeMock).toHaveBeenCalledWith(10, 19);
      });
    });

    describe("createInventaris", () => {
      it("should create new inventaris", async () => {
        const mockData = {
          kode_barang: "INV001",
          nama_barang: "Mikroskop",
          jumlah: 10,
          jumlah_tersedia: 10,
          kategori: "Alat Lab",
          laboratorium_id: "lab-1",
        };

        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "inv-new" },
                error: null,
              }),
            }),
          }),
        } as any);

        const result = await laboranAPI.createInventaris(mockData);

        expect(result).toBe("inv-new");
      });

      it("should handle creation errors", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("Creation failed"),
              }),
            }),
          }),
        } as any);

        await expect(
          laboranAPI.createInventaris({
            kode_barang: "INV001",
            nama_barang: "Item",
            jumlah: 1,
            jumlah_tersedia: 1,
          })
        ).rejects.toThrow();
      });
    });

    describe("updateInventaris", () => {
      it("should update inventaris", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              error: null,
            }),
          }),
        } as any);

        await expect(
          laboranAPI.updateInventaris("inv-1", { nama_barang: "New Name" })
        ).resolves.not.toThrow();
      });
    });

    describe("deleteInventaris", () => {
      it("should delete inventaris when no active borrowings", async () => {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === "peminjaman") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  in: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            } as any;
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          } as any;
        });

        await expect(
          laboranAPI.deleteInventaris("inv-1")
        ).resolves.not.toThrow();
      });

      it("should fail when active borrowings exist", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  data: [{ id: "borrow-1" }],
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

        await expect(laboranAPI.deleteInventaris("inv-1")).rejects.toThrow(
          "Cannot delete inventaris with active borrowings"
        );
      });
    });
  });

  describe("Laboratorium Management", () => {
    describe("getLaboratoriumList", () => {
      it("should return laboratorium list", async () => {
        const mockData = [
          {
            id: "lab-1",
            kode_lab: "LAB1",
            nama_lab: "Lab Biologi",
            kapasitas: 30,
            lokasi: "Gedung A",
            fasilitas: ["AC", "Proyektor"],
            is_active: true,
            keterangan: null,
            created_at: "2024-01-01",
            updated_at: "2024-01-01",
          },
        ];

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: mockData,
              error: null,
            }),
          }),
        } as any);

        const result = await laboranAPI.getLaboratoriumList();

        expect(result).toHaveLength(1);
      });

      it("should filter by is_active", async () => {
        const eqMock = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: eqMock,
            }),
          }),
        } as any);

        await laboranAPI.getLaboratoriumList({ is_active: true });

        expect(eqMock).toHaveBeenCalledWith("is_active", true);
      });
    });

    describe("createLaboratorium", () => {
      it("should create new laboratorium", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            error: null,
          }),
        } as any);

        await expect(
          laboranAPI.createLaboratorium({
            kode_lab: "LAB1",
            nama_lab: "Lab Baru",
          })
        ).resolves.not.toThrow();
      });
    });

    describe("deleteLaboratorium", () => {
      it("should delete laboratorium when no related data", async () => {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === "inventaris" || table === "jadwal_praktikum") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                error: null,
              }),
            }),
          } as any;
        });

        await expect(
          laboranAPI.deleteLaboratorium("lab-1")
        ).resolves.not.toThrow();
      });

      it("should fail when equipment exists", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: [{ id: "equip-1" }],
                error: null,
              }),
            }),
          }),
        } as any);

        await expect(laboranAPI.deleteLaboratorium("lab-1")).rejects.toThrow(
          "Cannot delete laboratory that has equipment assigned to it"
        );
      });
    });
  });
});
