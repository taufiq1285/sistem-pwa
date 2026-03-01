/**
 * Laboran API Unit Tests
 * Comprehensive tests for laboran-specific API functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as laboranAPI from "@/lib/api/laboran.api";
import { supabase } from "@/lib/supabase/client";

// Mock Supabase
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock cache API
vi.mock("../../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

// Mock middleware
vi.mock("../../../../lib/middleware", () => ({
  requirePermission: vi.fn((permission, fn) => fn),
}));

describe("Laboran API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        "Database error",
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

      const mockUsers = [
        {
          id: "user-1",
          full_name: "John Doe",
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
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
              in: vi.fn().mockResolvedValue({
                data: mockMahasiswa,
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockInventaris,
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockUsers,
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
                  limit: vi.fn().mockResolvedValue({
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
            in: vi.fn().mockResolvedValue({
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
      const limitMock = vi.fn().mockResolvedValue({
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

    it("should map pending approval for dosen requester and catch query errors", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-d1",
                        jumlah_pinjam: 1,
                        keperluan: "Riset",
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2026-01-02",
                        created_at: "2026-01-01T08:00:00Z",
                        peminjam_id: null,
                        dosen_id: "dos-1",
                        inventaris_id: null,
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "dos-1", nip: "NIP-D1", user_id: "u-d1" }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "u-d1", full_name: "Dosen Pending" }],
                error: null,
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      const mapped = await laboranAPI.getPendingApprovals();
      expect(mapped[0].peminjam_nama).toBe("Dosen Pending");
      expect(mapped[0].peminjam_nim).toBe("NIP-D1");
      expect(mapped[0].dosen_user_id).toBe("u-d1");
      expect(mapped[0].dosen_id).toBe("dos-1");

      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("pending-approval-error");
      });

      await expect(laboranAPI.getPendingApprovals()).rejects.toThrow(
        "pending-approval-error",
      );
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

    it("should throw when inventory alerts query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: null,
                error: new Error("inventory-alerts-error"),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getInventoryAlerts()).rejects.toThrow(
        "inventory-alerts-error",
      );
    });
  });
 
  describe("approvePeminjaman", () => {
    it("should approve peminjaman and decrease stock", async () => {
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

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
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

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
        "Stok tidak cukup",
      );
    });

    it("should fail when user not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(laboranAPI.approvePeminjaman("pem-1")).rejects.toThrow(
        "User not authenticated",
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
      const mockUser = { id: "user-123" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

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

    it("should process rejected approval action", async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: null }),
        }),
      });

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      } as any);
      vi.mocked(supabase.from).mockReturnValue({ update: updateMock } as any);

      await expect(
        laboranAPI.processApproval({
          peminjaman_id: "pem-1",
          status: "rejected",
          rejection_reason: "Ditolak sistem",
        }),
      ).resolves.not.toThrow();

      expect(updateMock).toHaveBeenCalled();
    });
 
    it("should fail when user not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(
        laboranAPI.rejectPeminjaman("pem-1", "Reason"),
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
          expect.stringContaining("nama_barang.ilike"),
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

      it("should apply laboratorium and kategori filters together", async () => {
        const eqKategoriMock = vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: [],
            error: null,
            count: 0,
          }),
        });
        const eqLabMock = vi.fn().mockReturnValue({ eq: eqKategoriMock });

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: eqLabMock,
          }),
        } as any);

        await laboranAPI.getInventarisList({
          laboratorium_id: "lab-1",
          kategori: "Elektronik",
        });

        expect(eqLabMock).toHaveBeenCalledWith("laboratorium_id", "lab-1");
        expect(eqKategoriMock).toHaveBeenCalledWith("kategori", "Elektronik");
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
          }),
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
          laboranAPI.updateInventaris("inv-1", { nama_barang: "New Name" }),
        ).resolves.not.toThrow();
      });

      it("should throw when update inventaris fails", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              error: new Error("Update failed"),
            }),
          }),
        } as any);

        await expect(
          laboranAPI.updateInventaris("inv-1", { jumlah_tersedia: 3 }),
        ).rejects.toThrow("Update failed");
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
          laboranAPI.deleteInventaris("inv-1"),
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
          "Cannot delete inventaris with active borrowings",
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

      it("should apply search filter for laboratorium list", async () => {
        const orMock = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        });
        const eqMock = vi.fn().mockReturnValue({ or: orMock });

        vi.mocked(supabase.from).mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: eqMock,
              or: orMock,
            }),
          }),
        } as any);

        await laboranAPI.getLaboratoriumList({ is_active: true, search: "bio" });

        expect(orMock).toHaveBeenCalledWith(
          expect.stringContaining("nama_lab.ilike.%bio%"),
        );
      });
    });

    describe("getLabScheduleToday", () => {
      it("should handle empty related ids and throw on query error", async () => {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === "jadwal_praktikum") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: "jad-1",
                            kelas_id: null,
                            laboratorium_id: null,
                            hari: "Senin",
                            jam_mulai: "08:00",
                            jam_selesai: "10:00",
                            tanggal_praktikum: "2026-01-01",
                            topik: null,
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            } as any;
          }
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        });

        const result = await laboranAPI.getLabScheduleToday(5);
        expect(result).toHaveLength(1);
        expect(result[0].mata_kuliah_nama).toBe("Unknown");
        expect(result[0].dosen_nama).toBe("Unknown");
        expect(result[0].kelas_nama).toBe("-");
        expect(result[0].laboratorium_nama).toBe("-");
        expect(result[0].topik).toBe("-");

        vi.mocked(supabase.from).mockReset();
        vi.mocked(supabase.from).mockImplementation(() => {
          throw new Error("lab-schedule-today-error");
        });

        await expect(laboranAPI.getLabScheduleToday(5)).rejects.toThrow(
          "lab-schedule-today-error",
        );
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
          }),
        ).resolves.not.toThrow();
      });

      it("should throw when create laboratorium fails", async () => {
        vi.mocked(supabase.from).mockReturnValue({
          insert: vi.fn().mockReturnValue({
            error: new Error("Create lab failed"),
          }),
        } as any);

        await expect(
          laboranAPI.createLaboratorium({
            kode_lab: "LAB1",
            nama_lab: "Lab Baru",
          }),
        ).rejects.toThrow("Create lab failed");
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
          laboranAPI.deleteLaboratorium("lab-1"),
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
          "Cannot delete laboratory that has equipment assigned to it",
        );
      });

      it("should fail when schedules exist", async () => {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === "inventaris") {
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
          if (table === "jadwal_praktikum") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    data: [{ id: "jadwal-1" }],
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
          return {} as any;
        });

        await expect(laboranAPI.deleteLaboratorium("lab-1")).rejects.toThrow(
          "Cannot delete laboratory that has schedules assigned to it",
        );
      });
    });
  });

  describe("Additional laboran coverage", () => {
    it("should update stock with add type", async () => {
      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { jumlah: 10, jumlah_tersedia: 8 },
                  error: null,
                }),
              }),
            }),
            update: updateMock,
          } as any;
        }
        return {} as any;
      });

      await laboranAPI.updateStock("inv-1", 2, "add");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ jumlah: 12, jumlah_tersedia: 10 }),
      );
      expect(updateEqMock).toHaveBeenCalledWith("id", "inv-1");
    });

    it("should get inventaris categories sorted and unique", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({
            data: [
              { kategori: "Elektronik" },
              { kategori: "Biologi" },
              { kategori: "Elektronik" },
            ],
            error: null,
          }),
        }),
      } as any);

      const result = await laboranAPI.getInventarisCategories();

      expect(result).toEqual(["Biologi", "Elektronik"]);
    });

    it("should map active borrowings and overdue fields", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-1",
                        inventaris_id: "inv-1",
                        peminjam_id: null,
                        dosen_id: "d-1",
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2024-01-01",
                        tanggal_kembali_rencana: "2024-01-02",
                        keperluan: "Praktikum",
                        kondisi_pinjam: "baik",
                        approved_at: "2024-01-01T10:00:00Z",
                        created_at: "2024-01-01T09:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "d-1", nip: "NIP001", user_id: "u-d1" }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "u-d1", full_name: "Dosen A" }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getActiveBorrowings(5);

      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Dosen A");
      expect(result[0].is_overdue).toBe(true);
      expect(result[0].days_overdue).toBeGreaterThan(0);
    });

    it("should mark borrowing as returned and restore stock", async () => {
      const peminjamanUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      const inventarisUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { inventaris_id: "inv-1", jumlah_pinjam: 2 },
                    error: null,
                  }),
                }),
              }),
            }),
            update: peminjamanUpdate,
          } as any;
        }

        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { jumlah_tersedia: 5, nama_barang: "Mikroskop" },
                  error: null,
                }),
              }),
            }),
            update: inventarisUpdate,
          } as any;
        }

        return {} as any;
      });

      await expect(
        laboranAPI.markBorrowingReturned("pem-1", "baik", "ok", 0),
      ).resolves.not.toThrow();
 
      expect(inventarisUpdate).toHaveBeenCalledWith({ jumlah_tersedia: 7 });
    });

    it("should throw when inventaris list query fails", async () => {
      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error("inventaris-list-error");
      });

      await expect(laboranAPI.getInventarisList()).rejects.toThrow(
        "inventaris-list-error",
      );
    });

    it("should update stock with set type", async () => {
      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { jumlah: 10, jumlah_tersedia: 8 },
              error: null,
            }),
          }),
        }),
        update: updateMock,
      } as any);

      await laboranAPI.updateStock("inv-1", 4, "set");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ jumlah: 4, jumlah_tersedia: 4 }),
      );
    });

    it("should throw when update stock fetch fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("stock-fetch-error"),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.updateStock("inv-1", 1, "add")).rejects.toThrow(
        "stock-fetch-error",
      );
    });

    it("should throw when get inventaris categories fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("categories-error"),
          }),
        }),
      } as any);

      await expect(laboranAPI.getInventarisCategories()).rejects.toThrow(
        "categories-error",
      );
    });

    it("should throw when laboratorium list query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("laboratorium-list-error"),
          }),
        }),
      } as any);

      await expect(laboranAPI.getLaboratoriumList()).rejects.toThrow(
        "laboratorium-list-error",
      );
    });

    it("should update laboratorium successfully", async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

      vi.mocked(supabase.from).mockReturnValue({
        update: updateMock,
      } as any);

      await expect(
        laboranAPI.updateLaboratorium("lab-1", { nama_lab: "Lab Update" }),
      ).resolves.not.toThrow();
      expect(updateMock).toHaveBeenCalledWith({ nama_lab: "Lab Update" });
      expect(eqMock).toHaveBeenCalledWith("id", "lab-1");
    });

    it("should throw when update laboratorium fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: new Error("update-lab-error"),
          }),
        }),
      } as any);

      await expect(
        laboranAPI.updateLaboratorium("lab-1", { nama_lab: "Lab Update" }),
      ).rejects.toThrow("update-lab-error");
    });

    it("should throw when lab schedule query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: new Error("lab-schedule-error"),
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getLabScheduleByLabId("lab-1", 5)).rejects.toThrow(
        "lab-schedule-error",
      );
    });

    it("should throw when lab equipment query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: new Error("lab-equipment-error"),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getLabEquipment("lab-1")).rejects.toThrow(
        "lab-equipment-error",
      );
    });
  });
 
  describe("Extended branch coverage", () => {
    it("should process approval for approved action", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "lab-user" } },
        error: null,
      } as any);

      const peminjamanUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: null }),
        }),
      });
      const inventarisUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ error: null }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { inventaris_id: "inv-1", jumlah_pinjam: 1 },
                    error: null,
                  }),
                }),
              }),
            }),
            update: peminjamanUpdate,
          } as any;
        }

        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { jumlah_tersedia: 4, nama_barang: "Mikroskop" },
                  error: null,
                }),
              }),
            }),
            update: inventarisUpdate,
          } as any;
        }

        return {} as any;
      });

      await expect(
        laboranAPI.processApproval({
          peminjaman_id: "pem-1",
          status: "approved",
        }),
      ).resolves.not.toThrow();

      expect(peminjamanUpdate).toHaveBeenCalled();
      expect(inventarisUpdate).toHaveBeenCalledWith({ jumlah_tersedia: 3 });
    });

    it("should reject processApproval without rejection reason", async () => {
      await expect(
        laboranAPI.processApproval({
          peminjaman_id: "pem-1",
          status: "rejected",
        }),
      ).rejects.toThrow("Rejection reason is required");
    });

    it("should return empty schedule when no data", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getLabScheduleToday();
      expect(result).toEqual([]);
    });

    it("should map lab schedule today with related entities", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "jadwal_praktikum") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "jp-1",
                          hari: "Senin",
                          jam_mulai: "08:00",
                          jam_selesai: "10:00",
                          tanggal_praktikum: "2024-01-01",
                          topik: "Topik A",
                          kelas_id: "k-1",
                          laboratorium_id: "lab-1",
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        if (table === "kelas") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "k-1",
                    nama_kelas: "TI-1A",
                    mata_kuliah_id: "mk-1",
                    dosen_id: "d-1",
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === "laboratorium") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "lab-1", nama_lab: "Lab Komputer" }],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === "mata_kuliah") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "mk-1", nama_mk: "Pemrograman" }],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "d-1",
                    user_id: "u-1",
                    users: { full_name: "Dosen Pengampu" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      const result = await laboranAPI.getLabScheduleToday(5);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          mata_kuliah_nama: "Pemrograman",
          kelas_nama: "TI-1A",
          dosen_nama: "Dosen Pengampu",
          laboratorium_nama: "Lab Komputer",
        }),
      );
    });

    it("should throw when inventaris by id not found", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getInventarisById("inv-x")).rejects.toThrow(
        "Inventaris not found",
      );
    });

    it("should throw when laboratorium by id not found", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getLaboratoriumById("lab-x")).rejects.toThrow(
        "Laboratorium not found",
      );
    });

    it("should update stock with subtract and floor to zero", async () => {
      const updateEqMock = vi.fn().mockResolvedValue({ error: null });
      const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { jumlah: 3, jumlah_tersedia: 2 },
              error: null,
            }),
          }),
        }),
        update: updateMock,
      } as any);

      await laboranAPI.updateStock("inv-1", 10, "subtract");

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ jumlah: 0, jumlah_tersedia: 0 }),
      );
    });

    it("should map approval history including approver info", async () => {
      let usersCall = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "pem-1",
                          jumlah_pinjam: 1,
                          status: "approved",
                          approved_at: "2024-01-03T10:00:00Z",
                          rejection_reason: null,
                          peminjam_id: "m-1",
                          dosen_id: null,
                          inventaris_id: "inv-1",
                          approved_by: "u-admin",
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-1", nim: "123", user_id: "u-mhs" }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          usersCall += 1;
          if (usersCall === 1) {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [{ id: "u-admin", full_name: "Admin", role: "admin" }],
                  error: null,
                }),
              }),
            } as any;
          }
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { id: "u-admin", full_name: "Admin" },
                  { id: "u-mhs", full_name: "Mahasiswa A" },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      const result = await laboranAPI.getApprovalHistory(5);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          peminjam_nama: "Mahasiswa A",
          inventaris_nama: "Mikroskop",
          approved_by_nama: "Admin",
          approved_by_role: "admin",
        }),
      );
    });

    it("should map approval history dosen fallback with unknown approver and no inventory relation", async () => {
      let usersCall = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "pem-2",
                          jumlah_pinjam: 2,
                          status: "rejected",
                          approved_at: null,
                          rejection_reason: "stok habis",
                          peminjam_id: null,
                          dosen_id: "d-9",
                          inventaris_id: null,
                          approved_by: "u-missing",
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "d-9", nip: "NIP-009", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "users") {
          usersCall += 1;
          if (usersCall === 1) {
            return {
              select: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            } as any;
          }
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }

        return {} as any;
      });

      const result = await laboranAPI.getApprovalHistory(5);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          peminjam_nama: "NIP-009",
          peminjam_nim: "NIP-009",
          inventaris_nama: "Unknown",
          approved_by_nama: "Unknown",
          approved_by_role: "unknown",
          rejection_reason: "stok habis",
        }),
      );
    });

    it("should map approval history with no related ids", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "pem-3",
                          jumlah_pinjam: 1,
                          status: "approved",
                          approved_at: null,
                          rejection_reason: null,
                          peminjam_id: null,
                          dosen_id: null,
                          inventaris_id: null,
                          approved_by: null,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      const result = await laboranAPI.getApprovalHistory(5);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          peminjam_nama: "Unknown",
          peminjam_nim: "-",
          inventaris_nama: "Unknown",
          inventaris_kode: "-",
          laboratorium_nama: "-",
          approved_by_nama: "Unknown",
          approved_by_role: "unknown",
        }),
      );
    });
 
    it("should throw when approval history query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: new Error("approval-history-error"),
                }),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getApprovalHistory(5)).rejects.toThrow(
        "approval-history-error",
      );
    });

    it("should map returned borrowings and overdue flag", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-1",
                        inventaris_id: "inv-1",
                        peminjam_id: "m-1",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2024-01-01",
                        tanggal_kembali_rencana: "2024-01-02",
                        tanggal_kembali_aktual: "2024-01-05",
                        kondisi_pinjam: "baik",
                        kondisi_kembali: "baik",
                        keterangan_kembali: null,
                        denda: 5000,
                        created_at: "2024-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-1", nim: "123", user_id: "u-mhs" }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "u-mhs", full_name: "Mahasiswa A" }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(10);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Mahasiswa A");
      expect(result[0].was_overdue).toBe(true);
      expect(result[0].denda).toBe(5000);
    });

    it("should get inventaris by id successfully", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "inv-1",
                kode_barang: "INV001",
                nama_barang: "Mikroskop",
                kategori: "Alat",
                merk: null,
                spesifikasi: null,
                jumlah: 5,
                jumlah_tersedia: 3,
                kondisi: "baik",
                harga_satuan: null,
                tahun_pengadaan: null,
                keterangan: null,
                created_at: null,
                updated_at: null,
                laboratorium: null,
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getInventarisById("inv-1");
      expect(result.id).toBe("inv-1");
    });

    it("should get laboratorium by id successfully", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "lab-1", kode_lab: "L1", nama_lab: "Lab 1" },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getLaboratoriumById("lab-1");
      expect(result.nama_lab).toBe("Lab 1");
    });

    it("should get lab schedule by lab id", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "jp-1",
                        tanggal_praktikum: "2024-01-02",
                        jam_mulai: "08:00",
                        jam_selesai: "10:00",
                        topik: "Topik",
                        kelas: {
                          nama_kelas: "TI-A",
                          mata_kuliah: { nama_mk: "Pemrograman" },
                          dosen: { user: { full_name: "Dosen A" } },
                        },
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getLabScheduleByLabId("lab-1", 5);
      expect(result[0].dosen_nama).toBe("Dosen A");
    });

    it("should get lab equipment list", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "inv-1",
                  kode_barang: "INV001",
                  nama_barang: "Mikroskop",
                  kondisi: "baik",
                  jumlah: 5,
                  jumlah_tersedia: 2,
                },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await laboranAPI.getLabEquipment("lab-1");
      expect(result).toHaveLength(1);
    });

    it("should throw invalid approval action", async () => {
      await expect(
        laboranAPI.processApproval({
          peminjaman_id: "pem-1",
          status: "invalid" as any,
        }),
      ).rejects.toThrow("Invalid approval action");
    });

    it("should throw when approve cannot find inventaris", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: "u-1" } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { inventaris_id: "inv-x", jumlah_pinjam: 1 },
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
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      await expect(laboranAPI.approvePeminjaman("pem-1")).rejects.toThrow(
        "Inventaris not found",
      );
    });

    it("should throw when mark returned inventory missing", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { inventaris_id: "inv-1", jumlah_pinjam: 1 },
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
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      await expect(
        laboranAPI.markBorrowingReturned("pem-1", "baik"),
      ).rejects.toThrow("Inventaris not found");
    });

    it("should map active borrowings for mahasiswa without linked user and not overdue", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-a1",
                        inventaris_id: "inv-1",
                        peminjam_id: "m-1",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2999-01-01",
                        keperluan: "Praktikum",
                        kondisi_pinjam: "baik",
                        approved_at: "2026-01-01T10:00:00Z",
                        created_at: "2026-01-01T09:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-1", nim: "MHS001", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getActiveBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("MHS001");
      expect(result[0].is_overdue).toBe(false);
      expect(result[0].days_overdue).toBe(0);
    });

    it("should map returned borrowings for dosen without linked user", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r1",
                        inventaris_id: "inv-1",
                        peminjam_id: null,
                        dosen_id: "d-1",
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2024-01-01",
                        tanggal_kembali_rencana: "2024-01-10",
                        tanggal_kembali_aktual: "2024-01-09",
                        kondisi_pinjam: "baik",
                        kondisi_kembali: "baik",
                        keterangan_kembali: null,
                        denda: null,
                        created_at: "2024-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "d-1", nip: "DOS001", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("DOS001");
      expect(result[0].was_overdue).toBe(false);
      expect(result[0].denda).toBe(0);
    });

    it("should map returned borrowings mahasiswa fallback without user and inventaris", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r2",
                        inventaris_id: null,
                        peminjam_id: "m-2",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2024-01-01",
                        tanggal_kembali_rencana: "2024-01-10",
                        tanggal_kembali_aktual: "2024-01-10",
                        kondisi_pinjam: "baik",
                        kondisi_kembali: "baik",
                        keterangan_kembali: null,
                        denda: null,
                        created_at: "2024-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-2", nim: "MHS002", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("MHS002");
      expect(result[0].laboratorium_nama).toBe("-");
      expect(result[0].inventaris_nama).toBe("Unknown");
    });

    it("should return empty returned borrowings with zero related ids", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toEqual([]);
    });

    it("should map returned borrowings with null mahasiswa data fallback", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r3",
                        inventaris_id: "inv-1",
                        peminjam_id: "m-null",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2024-01-01",
                        tanggal_kembali_rencana: "2024-01-02",
                        tanggal_kembali_aktual: "2024-01-03",
                        kondisi_pinjam: "baik",
                        kondisi_kembali: "baik",
                        keterangan_kembali: null,
                        denda: null,
                        created_at: "2024-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-1",
                    kode_barang: "INV001",
                    nama_barang: "Mikroskop",
                    laboratorium: { nama_lab: "Lab A" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Unknown");
      expect(result[0].peminjam_nim).toBe("-");
    });

    it("should map returned borrowings dosen fallback without user and without inventaris relation", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r4",
                        inventaris_id: null,
                        peminjam_id: null,
                        dosen_id: "d-r4",
                        jumlah_pinjam: 2,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2026-01-03",
                        tanggal_kembali_aktual: "2026-01-02",
                        kondisi_pinjam: null,
                        kondisi_kembali: null,
                        keterangan_kembali: "aman",
                        denda: null,
                        created_at: "2026-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "d-r4", nip: "DOS004", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          peminjam_nama: "DOS004",
          peminjam_nim: "DOS004",
          inventaris_nama: "Unknown",
          inventaris_kode: "-",
          laboratorium_nama: "-",
          kondisi_pinjam: "baik",
          kondisi_kembali: "baik",
          denda: 0,
          was_overdue: false,
        }),
      );
    });

    it("should map active borrowings mahasiswa with linked user", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-a3",
                        inventaris_id: "inv-a3",
                        peminjam_id: "m-a3",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2999-12-31",
                        keperluan: "Praktikum",
                        kondisi_pinjam: "baik",
                        approved_at: "2026-01-01T10:00:00Z",
                        created_at: "2026-01-01T09:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-a3", nim: "MHS-A3", user_id: "u-a3" }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "inventaris") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "inv-a3",
                    kode_barang: "INV-A3",
                    nama_barang: "Projector",
                    laboratorium: { nama_lab: "Lab Multimedia" },
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "u-a3", full_name: "Mahasiswa Linked" }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getActiveBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Mahasiswa Linked");
      expect(result[0].peminjam_nim).toBe("MHS-A3");
      expect(result[0].inventaris_nama).toBe("Projector");
      expect(result[0].laboratorium_nama).toBe("Lab Multimedia");
      expect(result[0].is_overdue).toBe(false);
    });
 
    it("should map active borrowings dosen fallback without user and without inventaris relation", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-a2",
                        inventaris_id: null,
                        peminjam_id: null,
                        dosen_id: "d-2",
                        jumlah_pinjam: 2,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2999-12-31",
                        keperluan: "Riset",
                        kondisi_pinjam: null,
                        approved_at: "2026-01-01T10:00:00Z",
                        created_at: "2026-01-01T09:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "d-2", nip: "DOS002", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getActiveBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("DOS002");
      expect(result[0].inventaris_nama).toBe("Unknown");
      expect(result[0].inventaris_kode).toBe("-");
      expect(result[0].laboratorium_nama).toBe("-");
      expect(result[0].kondisi_pinjam).toBe("baik");
    });

    it("should return empty active borrowings with zero related ids", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getActiveBorrowings(5);
      expect(result).toEqual([]);
    });

    it("should throw when active borrowings query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("active-borrowings-error"),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getActiveBorrowings(10)).rejects.toThrow(
        "active-borrowings-error",
      );
    });

    it("should throw when returned borrowings query fails", async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: new Error("returned-borrowings-error"),
              }),
            }),
          }),
        }),
      } as any);

      await expect(laboranAPI.getReturnedBorrowings(10)).rejects.toThrow(
        "returned-borrowings-error",
      );
    });

    it("should map approval history mahasiswa fallback when mahasiswa user_id is null", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "pem-4",
                          jumlah_pinjam: 1,
                          status: "approved",
                          approved_at: "2026-01-01T10:00:00Z",
                          rejection_reason: null,
                          peminjam_id: "m-null",
                          dosen_id: null,
                          inventaris_id: null,
                          approved_by: null,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [{ id: "m-null", nim: "MHS-NULL", user_id: null }],
                error: null,
              }),
            }),
          } as any;
        }
        if (table === "users") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      const result = await laboranAPI.getApprovalHistory(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("MHS-NULL");
      expect(result[0].peminjam_nim).toBe("MHS-NULL");
    });

    it("should map approval history when mahasiswa data is null", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({
                      data: [
                        {
                          id: "pem-5",
                          jumlah_pinjam: 1,
                          status: "approved",
                          approved_at: null,
                          rejection_reason: null,
                          peminjam_id: "m-missing",
                          dosen_id: null,
                          inventaris_id: null,
                          approved_by: null,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === "mahasiswa") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        } as any;
      });

      const result = await laboranAPI.getApprovalHistory(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Unknown");
    });

    it("should map returned borrowings when mahasiswa data is null", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r2",
                        inventaris_id: null,
                        peminjam_id: "m-r2",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2026-01-02",
                        tanggal_kembali_aktual: "2026-01-02",
                        kondisi_pinjam: null,
                        kondisi_kembali: null,
                        keterangan_kembali: null,
                        denda: null,
                        created_at: "2026-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Unknown");
      expect(result[0].peminjam_nim).toBe("-");
    });

    it("should map returned borrowings when mahasiswa data is undefined", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        id: "pem-r4",
                        inventaris_id: null,
                        peminjam_id: "m-r4",
                        dosen_id: null,
                        jumlah_pinjam: 1,
                        tanggal_pinjam: "2026-01-01",
                        tanggal_kembali_rencana: "2026-01-02",
                        tanggal_kembali_aktual: "2026-01-02",
                        kondisi_pinjam: "baik",
                        kondisi_kembali: "baik",
                        keterangan_kembali: null,
                        denda: 0,
                        created_at: "2026-01-01T10:00:00Z",
                      },
                    ],
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
              in: vi.fn().mockResolvedValue({ data: undefined, error: null }),
            }),
          } as any;
        }
        if (table === "dosen") {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await laboranAPI.getReturnedBorrowings(5);
      expect(result).toHaveLength(1);
      expect(result[0].peminjam_nama).toBe("Unknown");
    });
 
    it("should throw when mark returned cannot find approved peminjaman", async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === "peminjaman") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      await expect(
        laboranAPI.markBorrowingReturned("pem-missing", "baik"),
      ).rejects.toThrow("Peminjaman not found or not in approved status");
    });
  });
});
