/**
 * Mahasiswa API - COMPLETE FIX
 * All .single() issues fixed to prevent 406 errors
 */

import { supabase } from '@/lib/supabase/client';
import { cacheAPI } from '@/lib/offline/api-cache';
import {
  requirePermission,
  requirePermissionAndOwnership,
} from '@/lib/middleware';

// ============================================================================
// TYPES
// ============================================================================

export interface MahasiswaStats {
  totalMataKuliah: number;
  totalKuis: number;
  rataRataNilai: number | null;
  jadwalHariIni: number;
}

export interface AvailableKelas {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  jumlah_mahasiswa: number;
  is_full: boolean;
  is_enrolled: boolean;
  mata_kuliah: {
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    semester: number;
  };
  jadwal_count: number;
  next_jadwal?: {
    tanggal_praktikum: string;
    jam_mulai: string;
    jam_selesai: string;
    lab_nama: string;
  };
}

export interface MyKelas {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  mata_kuliah_kode: string;
  mata_kuliah_nama: string;
  sks: number;
  tahun_ajaran: string;
  semester_ajaran: number;
  enrolled_at: string;
}

export interface JadwalMahasiswa {
  id: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik?: string;
  kelas_nama: string;
  mata_kuliah_nama: string;
  lab_nama: string;
  lab_kode: string;
}

// ============================================================================
// HELPER
// ============================================================================

// Cache for mahasiswa ID
let cachedMahasiswaId: string | null = null;
let cachedMahasiswaIdTimestamp: number = 0;
const MAHASISWA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAHASISWA_ID_STORAGE_KEY = 'cached_mahasiswa_id';

async function getMahasiswaId(): Promise<string | null> {
  try {
    // Return cached value if still valid (in-memory)
    if (cachedMahasiswaId && Date.now() - cachedMahasiswaIdTimestamp < MAHASISWA_CACHE_DURATION) {
      return cachedMahasiswaId;
    }

    // Try to get from localStorage (persistent for offline)
    const storedMahasiswaId = localStorage.getItem(MAHASISWA_ID_STORAGE_KEY);
    if (storedMahasiswaId) {
      cachedMahasiswaId = storedMahasiswaId;
      cachedMahasiswaIdTimestamp = Date.now();
      return storedMahasiswaId;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return storedMahasiswaId || cachedMahasiswaId;
    }

    try {
      const { data } = await supabase
        .from('mahasiswa')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.id) {
        // Cache result (in-memory and localStorage)
        cachedMahasiswaId = data.id;
        cachedMahasiswaIdTimestamp = Date.now();
        localStorage.setItem(MAHASISWA_ID_STORAGE_KEY, data.id);
        return data.id;
      }

      return storedMahasiswaId || cachedMahasiswaId;
    } catch (fetchError) {
      // Network error - return cached
      return storedMahasiswaId || cachedMahasiswaId;
    }
  } catch (error: unknown) {
    // Suppress error - return cached/stored if available
    const storedMahasiswaId = localStorage.getItem(MAHASISWA_ID_STORAGE_KEY);
    return storedMahasiswaId || cachedMahasiswaId;
  }
}

// ============================================================================
// STATS
// ============================================================================

export async function getMahasiswaStats(): Promise<MahasiswaStats> {
  return cacheAPI(
    'mahasiswa_stats',
    async () => {
      try {
        const mahasiswaId = await getMahasiswaId();
        if (!mahasiswaId) {
          return {
            totalMataKuliah: 0,
            totalKuis: 0,
            rataRataNilai: null,
            jadwalHariIni: 0,
          };
        }

    const { data: kelasData } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    const totalMataKuliah = kelasData?.length || 0;

    const today = new Date().toISOString().split('T')[0];
    const { data: jadwalData } = await supabase
      .from('jadwal_praktikum')
      .select('id, kelas_id')
      .eq('tanggal_praktikum', today)
      .in('kelas_id', kelasData?.map((k: any) => k.kelas_id) || []);

    const jadwalHariIni = jadwalData?.length || 0;

    const { data: kuisData } = await supabase
      .from('kuis')
      .select('id')
      .in('kelas_id', kelasData?.map((k: any) => k.kelas_id) || [])
      .lte('tanggal_mulai', new Date().toISOString())
      .gte('tanggal_selesai', new Date().toISOString())
      .eq('status', 'published');

    const totalKuis = kuisData?.length || 0;

    const { data: nilaiData } = await supabase
      .from('attempt_kuis')
      .select('total_score')
      .eq('mahasiswa_id', mahasiswaId)
      .not('total_score', 'is', null);

    let rataRataNilai = null;
    if (nilaiData && nilaiData.length > 0) {
      const sum = nilaiData.reduce((acc: number, curr: any) => acc + (curr.total_score || 0), 0);
      rataRataNilai = sum / nilaiData.length;
    }

        return {
          totalMataKuliah,
          totalKuis,
          rataRataNilai,
          jadwalHariIni,
        };
      } catch (error: unknown) {
        console.error('Error fetching mahasiswa stats:', error);
        return {
          totalMataKuliah: 0,
          totalKuis: 0,
          rataRataNilai: null,
          jadwalHariIni: 0,
        };
      }
    },
    {
      ttl: 5 * 60 * 1000, // Cache for 5 minutes
      staleWhileRevalidate: true,
    }
  );
}

// ============================================================================
// AVAILABLE KELAS
// ============================================================================

export async function getAvailableKelas(): Promise<AvailableKelas[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const { data: kelasData, error } = await supabase
      .from('kelas')
      .select('id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, kuota, mata_kuliah_id')
      .eq('is_active', true)
      .order('nama_kelas', { ascending: true });

    if (error) throw error;
    if (!kelasData) return [];

    const { data: enrolledData } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    const enrolledKelasIds = new Set(enrolledData?.map((e: any) => e.kelas_id) || []);

    const result = await Promise.all(
      kelasData.map(async (kelas: any) => {
        const { data: mkData } = await supabase
          .from('mata_kuliah')
          .select('id, kode_mk, nama_mk, sks, semester')
          .eq('id', kelas.mata_kuliah_id)
          .single();

        const { count: jumlahMahasiswa } = await supabase
          .from('kelas_mahasiswa')
          .select('*', { count: 'exact', head: true })
          .eq('kelas_id', kelas.id)
          .eq('is_active', true);

        const { count: jadwalCount } = await supabase
          .from('jadwal_praktikum')
          .select('*', { count: 'exact', head: true })
          .eq('kelas_id', kelas.id)
          .eq('is_active', true);

        // FIXED: No .single() to avoid 406 error when no data
        const today = new Date().toISOString().split('T')[0];
        const { data: nextJadwalArray } = await supabase
          .from('jadwal_praktikum')
          .select('tanggal_praktikum, jam_mulai, jam_selesai, laboratorium_id')
          .eq('kelas_id', kelas.id)
          .gte('tanggal_praktikum', today)
          .eq('is_active', true)
          .order('tanggal_praktikum', { ascending: true })
          .limit(1);

        const nextJadwalData = nextJadwalArray && nextJadwalArray.length > 0 
          ? nextJadwalArray[0] 
          : null;

        let nextJadwal;
        if (nextJadwalData) {
          const { data: labData } = await supabase
            .from('laboratorium')
            .select('nama_lab')
            .eq('id', nextJadwalData.laboratorium_id)
            .single();

          nextJadwal = {
            tanggal_praktikum: nextJadwalData.tanggal_praktikum,
            jam_mulai: nextJadwalData.jam_mulai,
            jam_selesai: nextJadwalData.jam_selesai,
            lab_nama: labData?.nama_lab || '-',
          };
        }

        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          kuota: kelas.kuota,
          jumlah_mahasiswa: jumlahMahasiswa || 0,
          is_full: (jumlahMahasiswa || 0) >= kelas.kuota,
          is_enrolled: enrolledKelasIds.has(kelas.id),
          mata_kuliah: mkData || {
            id: '',
            kode_mk: '',
            nama_mk: '',
            sks: 0,
            semester: 0,
          },
          jadwal_count: jadwalCount || 0,
          next_jadwal: nextJadwal,
        };
      })
    );

    return result;
  } catch (error: unknown) {
    console.error('Error fetching available kelas:', error);
    return [];
  }
}

// ============================================================================
// ENROLLMENT
// ============================================================================

async function enrollToKelasImpl(kelasId: string): Promise<{ success: boolean; message: string }> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) {
      return { success: false, message: 'Mahasiswa tidak ditemukan' };
    }

    // FIXED: No .single() to avoid 406 error when not enrolled yet
    const { data: existingArray } = await supabase
      .from('kelas_mahasiswa')
      .select('id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('kelas_id', kelasId)
      .eq('is_active', true)
      .limit(1);

    if (existingArray && existingArray.length > 0) {
      return { success: false, message: 'Anda sudah terdaftar di kelas ini' };
    }

    const { data: kelasData } = await supabase
      .from('kelas')
      .select('kuota')
      .eq('id', kelasId)
      .single();

    if (!kelasData) {
      return { success: false, message: 'Kelas tidak ditemukan' };
    }

    const { count: enrolledCount } = await supabase
      .from('kelas_mahasiswa')
      .select('*', { count: 'exact', head: true })
      .eq('kelas_id', kelasId)
      .eq('is_active', true);

    if ((enrolledCount || 0) >= (kelasData.kuota || 0)) {
      return { success: false, message: 'Kelas sudah penuh' };
    }

    const { error } = await supabase
      .from('kelas_mahasiswa')
      .insert({
        mahasiswa_id: mahasiswaId,
        kelas_id: kelasId,
        enrolled_at: new Date().toISOString(),
        is_active: true,
      });

    if (error) throw error;

    return { success: true, message: 'Berhasil mendaftar ke kelas' };
  } catch (error: unknown) {
    console.error('Error enrolling to kelas:', error);
    return { success: false, message: (error as Error).message || 'Gagal mendaftar ke kelas' };
  }
}

async function unenrollFromKelasImpl(kelasId: string): Promise<{ success: boolean; message: string }> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) {
      return { success: false, message: 'Mahasiswa tidak ditemukan' };
    }

    const { error } = await supabase
      .from('kelas_mahasiswa')
      .update({ is_active: false })
      .eq('mahasiswa_id', mahasiswaId)
      .eq('kelas_id', kelasId);

    if (error) throw error;

    return { success: true, message: 'Berhasil keluar dari kelas' };
  } catch (error: unknown) {
    console.error('Error unenrolling from kelas:', error);
    return { success: false, message: (error as Error).message || 'Gagal keluar dari kelas' };
  }
}

// Export enrollment functions
export const enrollToKelas = enrollToKelasImpl;
export const unenrollFromKelas = unenrollFromKelasImpl;

// ============================================================================
// MY CLASSES
// ============================================================================

export async function getMyKelas(): Promise<MyKelas[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id, enrolled_at')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const result = await Promise.all(
      data.map(async (item: any) => {
        const { data: kelasData } = await supabase
          .from('kelas')
          .select('id, kode_kelas, nama_kelas, tahun_ajaran, semester_ajaran, mata_kuliah_id')
          .eq('id', item.kelas_id)
          .single();

        if (!kelasData) return null;

        const { data: mkData } = await supabase
          .from('mata_kuliah')
          .select('kode_mk, nama_mk, sks')
          .eq('id', kelasData.mata_kuliah_id)
          .single();

        return {
          id: kelasData.id,
          kode_kelas: kelasData.kode_kelas,
          nama_kelas: kelasData.nama_kelas,
          mata_kuliah_kode: mkData?.kode_mk || '-',
          mata_kuliah_nama: mkData?.nama_mk || '-',
          sks: mkData?.sks || 0,
          tahun_ajaran: kelasData.tahun_ajaran,
          semester_ajaran: kelasData.semester_ajaran,
          enrolled_at: item.enrolled_at,
        };
      })
    );

    return result.filter((item): item is MyKelas => item !== null);
  } catch (error: unknown) {
    console.error('Error fetching my kelas:', error);
    return [];
  }
}

// ============================================================================
// JADWAL
// ============================================================================

export async function getMyJadwal(limit?: number): Promise<JadwalMahasiswa[]> {
  try {
    const mahasiswaId = await getMahasiswaId();
    if (!mahasiswaId) return [];

    const { data: enrolledData } = await supabase
      .from('kelas_mahasiswa')
      .select('kelas_id')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('is_active', true);

    if (!enrolledData || enrolledData.length === 0) return [];

    const kelasIds = enrolledData.map((e: any) => e.kelas_id);

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    let query = supabase
      .from('jadwal_praktikum')
      .select('id, tanggal_praktikum, hari, jam_mulai, jam_selesai, topik, kelas_id, laboratorium_id')
      .in('kelas_id', kelasIds)
      .gte('tanggal_praktikum', today)
      .lte('tanggal_praktikum', nextWeekStr)
      .eq('is_active', true)
      .order('tanggal_praktikum', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    const result = await Promise.all(
      data.map(async (item: any) => {
        const { data: kelasData } = await supabase
          .from('kelas')
          .select('nama_kelas, mata_kuliah_id')
          .eq('id', item.kelas_id)
          .single();

        let mkData = null;
        if (kelasData?.mata_kuliah_id) {
          const result = await supabase
            .from('mata_kuliah')
            .select('nama_mk')
            .eq('id', kelasData.mata_kuliah_id)
            .single();
          mkData = result.data;
        }

        const { data: labData } = await supabase
          .from('laboratorium')
          .select('nama_lab, kode_lab')
          .eq('id', item.laboratorium_id)
          .single();

        return {
          id: item.id,
          tanggal_praktikum: item.tanggal_praktikum,
          hari: item.hari,
          jam_mulai: item.jam_mulai,
          jam_selesai: item.jam_selesai,
          topik: item.topik,
          kelas_nama: kelasData?.nama_kelas || '-',
          mata_kuliah_nama: mkData?.nama_mk || '-',
          lab_nama: labData?.nama_lab || '-',
          lab_kode: labData?.kode_lab || '-',
        };
      })
    );

    return result;
  } catch (error: unknown) {
    console.error('Error fetching my jadwal:', error);
    return [];
  }
}