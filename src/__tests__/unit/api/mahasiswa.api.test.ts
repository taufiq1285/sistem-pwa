/**
 * Mahasiswa API Unit Tests
 * Comprehensive tests for mahasiswa-specific API functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as mahasiswaAPI from '@/lib/api/mahasiswa.api';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock cache API
vi.mock('@/lib/offline/api-cache', () => ({
  cacheAPI: vi.fn((key, fn) => fn()),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Mahasiswa API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMahasiswaStats', () => {
    it('should return mahasiswa statistics successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockMahasiswaId = 'mhs-123';

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockKelasMahasiswa = [
        { kelas_id: 'kelas-1' },
        { kelas_id: 'kelas-2' },
      ];

      const mockJadwal = [{ id: 'jadwal-1' }];
      const mockKuis = [{ id: 'kuis-1' }, { id: 'kuis-2' }];
      const mockNilai = [
        { total_score: 80 },
        { total_score: 90 },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: mockMahasiswaId },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: mockKelasMahasiswa,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'jadwal_praktikum') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  data: mockJadwal,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kuis') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      data: mockKuis,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'attempt_kuis') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  data: mockNilai,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalMataKuliah: 2,
        totalKuis: 2,
        rataRataNilai: 85,
        jadwalHariIni: 1,
      });
    });

    it('should return zero stats when mahasiswa not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalMataKuliah: 0,
        totalKuis: 0,
        rataRataNilai: null,
        jadwalHariIni: 0,
      });
    });

    it('should calculate average score correctly', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockNilai = [
        { total_score: 70 },
        { total_score: 80 },
        { total_score: 90 },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'jadwal_praktikum') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kuis') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'attempt_kuis') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  data: mockNilai,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result.rataRataNilai).toBe(80);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await mahasiswaAPI.getMahasiswaStats();

      expect(result).toEqual({
        totalMataKuliah: 0,
        totalKuis: 0,
        rataRataNilai: null,
        jadwalHariIni: 0,
      });
    });
  });

  describe('getAvailableKelas', () => {
    it('should return available kelas for enrollment', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockKelas = [
        {
          id: 'kelas-1',
          kode_kelas: 'K001',
          nama_kelas: 'Kelas A',
          tahun_ajaran: '2024/2025',
          semester_ajaran: 1,
          kuota: 30,
          mata_kuliah_id: 'mk-1',
        },
      ];

      const mockMataKuliah = {
        id: 'mk-1',
        kode_mk: 'MK001',
        nama_mk: 'Mata Kuliah 1',
        sks: 3,
        semester: 1,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  data: mockKelas,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }) as any,
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  count: 5,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'mata_kuliah') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMataKuliah,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'jadwal_praktikum') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  count: 0,
                }),
                gte: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockReturnValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when mahasiswa not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation(() => {
        throw new Error('Database error');
      });

      const result = await mahasiswaAPI.getAvailableKelas();

      expect(result).toEqual([]);
    });
  });

  describe('enrollToKelas', () => {
    it('should enroll mahasiswa to kelas successfully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              error: null,
            }),
          } as any;
        }
        if (table === 'kelas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { kuota: 30 },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.enrollToKelas('kelas-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Berhasil mendaftar ke kelas');
    });

    it('should fail when mahasiswa not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.enrollToKelas('kelas-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Mahasiswa tidak ditemukan');
    });

    it('should fail when already enrolled', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      data: [{ id: 'existing' }],
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

      const result = await mahasiswaAPI.enrollToKelas('kelas-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Anda sudah terdaftar di kelas ini');
    });

    it('should fail when kelas is full', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      data: [],
                      error: null,
                    }),
                    count: 30,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { kuota: 30 },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.enrollToKelas('kelas-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Kelas sudah penuh');
    });
  });

  describe('unenrollFromKelas', () => {
    it('should unenroll mahasiswa from kelas successfully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.unenrollFromKelas('kelas-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Berhasil keluar dari kelas');
    });

    it('should fail when mahasiswa not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.unenrollFromKelas('kelas-1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Mahasiswa tidak ditemukan');
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  error: new Error('Database error'),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.unenrollFromKelas('kelas-1');

      expect(result.success).toBe(false);
    });
  });

  describe('getMyKelas', () => {
    it('should return enrolled kelas list', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const mockEnrolled = [
        { kelas_id: 'kelas-1', enrolled_at: '2024-01-01' },
      ];

      const mockKelas = {
        id: 'kelas-1',
        kode_kelas: 'K001',
        nama_kelas: 'Kelas A',
        tahun_ajaran: '2024/2025',
        semester_ajaran: 1,
        mata_kuliah_id: 'mk-1',
      };

      const mockMataKuliah = {
        kode_mk: 'MK001',
        nama_mk: 'Mata Kuliah 1',
        sks: 3,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    data: mockEnrolled,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockKelas,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'mata_kuliah') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockMataKuliah,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getMyKelas();

      expect(result).toHaveLength(1);
      expect(result[0].kode_kelas).toBe('K001');
    });

    it('should return empty array when mahasiswa not found', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await mahasiswaAPI.getMyKelas();

      expect(result).toEqual([]);
    });
  });

  describe('getMyJadwal', () => {
    it('should return jadwal for next 7 days', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const today = new Date();
      const mockJadwal = [
        {
          id: 'jadwal-1',
          tanggal_praktikum: today.toISOString().split('T')[0],
          hari: 'Senin',
          jam_mulai: '08:00',
          jam_selesai: '10:00',
          topik: 'Topik 1',
          kelas_id: 'kelas-1',
          laboratorium_id: 'lab-1',
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [{ kelas_id: 'kelas-1' }],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'jadwal_praktikum') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          data: mockJadwal,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    nama_kelas: 'Kelas A',
                    mata_kuliah_id: 'mk-1',
                  },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'mata_kuliah') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { nama_mk: 'Mata Kuliah 1' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'laboratorium') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    nama_lab: 'Lab 1',
                    kode_lab: 'L1',
                  },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getMyJadwal();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when not enrolled in any kelas', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await mahasiswaAPI.getMyJadwal();

      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const limitMock = vi.fn().mockResolvedValue({ data: [], error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'mhs-123' },
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'kelas_mahasiswa') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  data: [{ kelas_id: 'kelas-1' }],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'jadwal_praktikum') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      order: vi.fn().mockReturnValue({
                        order: vi.fn().mockReturnValue({
                          limit: limitMock,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      await mahasiswaAPI.getMyJadwal(5);

      expect(limitMock).toHaveBeenCalledWith(5);
    });
  });
});
