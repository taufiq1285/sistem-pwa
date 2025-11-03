/**
 * Dosen API - FIXED WITH CORRECT TABLE AND COLUMN NAMES
 * API functions for dosen dashboard and management
 */

import { supabase } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface DosenStats {
  totalKelas: number;
  totalMahasiswa: number;
  activeKuis: number;
  pendingGrading: number;
}

export interface MataKuliahWithStats {
  id: string;
  kode_mk: string;
  nama_mk: string;
  sks: number;
  semester: number;
  program_studi: string;
  totalKelas: number;
  totalMahasiswa: number;
}

export interface KelasWithDetails {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  jumlah_mahasiswa: number;
  mata_kuliah: {
    kode_mk: string;
    nama_mk: string;
    sks: number;
  };
}

export interface UpcomingPracticum {
  id: string;
  kelas: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  lab_nama: string;
  lab_kode: string;
  // ✅ Added fields for dashboard display
  kelas_nama?: string;
  mata_kuliah_nama?: string;
}

export interface PendingGrading {
  id: string;
  mahasiswa_nama: string;
  mahasiswa_nim: string;
  mata_kuliah_nama: string;
  kuis_judul: string;
  submitted_at: string;
  attempt_number: number;
}

export interface KuisWithStats {
  id: string;
  judul: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  total_attempts: number;
  submitted_count: number;
  kelas_nama: string;
}

export interface MyBorrowingRequest {
  id: string;
  inventaris_nama: string;
  inventaris_kode: string;
  jumlah_pinjam: number;
  keperluan: string;
  tanggal_pinjam: string;
  tanggal_kembali_rencana: string;
  tanggal_kembali_aktual: string | null;
  status: string;
  laboratorium_nama: string;
  created_at: string;
}

// ============================================================================
// HELPER FUNCTION - Get Dosen ID with proper error handling
// ============================================================================

async function getDosenId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ No authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching dosen profile:', error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ No dosen profile found for user:', user.id);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in getDosenId:', error);
    return null;
  }
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDosenStats(): Promise<DosenStats> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning zero stats');
      return {
        totalKelas: 0,
        totalMahasiswa: 0,
        activeKuis: 0,
        pendingGrading: 0,
      };
    }

    // Get total kelas
    const { count: totalKelas } = await supabase
      .from('kelas')
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('is_active', true);

    // Get kelas IDs first, then use them in .in()
    const { data: kelasData } = await supabase
      .from('kelas')
      .select('id')
      .eq('dosen_id', dosenId);

    const kelasIds = kelasData?.map(k => k.id) || [];

    // Get total mahasiswa across all classes
    let totalMahasiswa = 0;
    if (kelasIds.length > 0) {
      // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await supabase
        .from('kelas_mahasiswa' as any)
        .select('mahasiswa_id', { count: 'exact', head: true })
        .in('kelas_id', kelasIds);
      totalMahasiswa = count || 0;
    }

    // Get active kuis
    const { count: activeKuis } = await supabase
      .from('kuis')
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('status', 'published');

    // Get kuis IDs first, then use them in .in()
    const { data: kuisData } = await supabase
      .from('kuis')
      .select('id')
      .eq('dosen_id', dosenId);

    const kuisIds = kuisData?.map(k => k.id) || [];

    // Get pending grading (submitted but not graded)
    // ✅ FIX: Removed .is('score', null) - column doesn't exist
    let pendingGrading = 0;
    if (kuisIds.length > 0) {
      // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await supabase
        .from('attempt_kuis' as any)
        .select('*', { count: 'exact', head: true })
        .in('kuis_id', kuisIds)
        .eq('status', 'submitted');
      pendingGrading = count || 0;
    }

    return {
      totalKelas: totalKelas || 0,
      totalMahasiswa,
      activeKuis: activeKuis || 0,
      pendingGrading,
    };
  } catch (error) {
    console.error('Error fetching dosen stats:', error);
    return {
      totalKelas: 0,
      totalMahasiswa: 0,
      activeKuis: 0,
      pendingGrading: 0,
    };
  }
}

// ============================================================================
// MY MATA KULIAH
// ============================================================================

// PERBAIKAN: Tipe untuk data yang di-fetch
type KelasWithMataKuliah = {
  id: string;
  mata_kuliah: {
    id: string;
    kode_mk: string;
    nama_mk: string;
    sks: number;
    semester: number;
    program_studi: string;
  } | null;
};

export async function getMyMataKuliah(limit?: number): Promise<MataKuliahWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    // Get unique mata kuliah from kelas
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select(`
        id,
        mata_kuliah_id,
        mata_kuliah (
          id,
          kode_mk,
          nama_mk,
          sks,
          semester,
          program_studi
        )
      `)
      .eq('dosen_id', dosenId)
      .eq('is_active', true);

    if (kelasError) throw kelasError;

    // Group by mata kuliah
    const mataKuliahMap = new Map();
    
    // PERBAIKAN: Memberi tipe pada 'kelas' dan menghapus '(kelas as any)'
    for (const kelas of (kelasData as KelasWithMataKuliah[] | null) || []) {
      const mk = kelas.mata_kuliah;
      if (!mk) continue;

      if (!mataKuliahMap.has(mk.id)) {
        mataKuliahMap.set(mk.id, {
          ...mk,
          totalKelas: 0,
          totalMahasiswa: 0,
        });
      }

      const current = mataKuliahMap.get(mk.id);
      current.totalKelas += 1;

      // Count mahasiswa in this kelas
      // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await supabase
        .from('kelas_mahasiswa' as any)
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', kelas.id);

      current.totalMahasiswa += count || 0;
    }

    const result = Array.from(mataKuliahMap.values());
    
    // Apply limit if provided
    return limit ? result.slice(0, limit) : result;
  } catch (error) {
    console.error('Error fetching my mata kuliah:', error);
    return [];
  }
}

// ============================================================================
// MY KELAS
// ============================================================================

// PERBAIKAN: Tipe untuk data kelas yang di-fetch
type KelasData = {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  mata_kuliah: {
    kode_mk: string;
    nama_mk: string;
    sks: number;
  } | null;
};

export async function getMyKelas(): Promise<KelasWithDetails[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    const { data, error } = await supabase
      .from('kelas')
      .select(`
        id,
        kode_kelas,
        nama_kelas,
        tahun_ajaran,
        semester_ajaran,
        mata_kuliah (
          kode_mk,
          nama_mk,
          sks
        )
      `)
      .eq('dosen_id', dosenId)
      .eq('is_active', true)
      .order('nama_kelas', { ascending: true });

    if (error) throw error;

    // Get mahasiswa count for each kelas
    const kelasWithCount = await Promise.all(
      // PERBAIKAN: Mengganti 'kelas: any' dengan tipe 'KelasData'
      (data || []).map(async (kelas: KelasData) => {
        // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await supabase
          .from('kelas_mahasiswa' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kelas_id', kelas.id);

        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          jumlah_mahasiswa: count || 0,
          mata_kuliah: kelas.mata_kuliah || {
            kode_mk: '-',
            nama_mk: '-',
            sks: 0,
          },
        };
      })
    );

    return kelasWithCount;
  } catch (error) {
    console.error('Error fetching my kelas:', error);
    return [];
  }
}

// ============================================================================
// UPCOMING PRACTICUM - ✅ FIXED
// ============================================================================

// PERBAIKAN: Tipe 'JadwalData' disesuaikan (tanggal_praktikum bisa null)
type JadwalData = {
  id: string;
  kelas: string | null;
  tanggal_praktikum: string | null; // <-- INI PERBAIKANNYA
  hari: string | null;
  jam_mulai: string;
  jam_selesai: string;
  topik: string | null;
  laboratorium: {
    nama_lab: string;
    kode_lab: string;
  } | null;
};

export async function getUpcomingPracticum(limit: number = 5): Promise<UpcomingPracticum[]> {
  try {
    // Get jadwal for next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // ✅ FIX: Changed back to 'jadwal_praktikum' to match type definition
    const { data, error } = await supabase
      .from('jadwal')
      .select(`
        id,
        kelas,
        tanggal_praktikum,
        hari,
        jam_mulai,
        jam_selesai,
        topik,
        laboratorium:laboratorium_id (
          nama_lab,
          kode_lab
        )
      `)
      .gte('tanggal_praktikum', today.toISOString().split('T')[0])
      .lte('tanggal_praktikum', nextWeek.toISOString().split('T')[0])
      .eq('is_active', true)
      .order('tanggal_praktikum', { ascending: true })
      .order('jam_mulai', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming practicum:', error);
      throw error;
    }

    // PERBAIKAN: Mengganti 'item: any' dengan tipe 'JadwalData' yang sudah benar
    return (data || []).map((item: JadwalData) => ({
      id: item.id,
      kelas: item.kelas || '-',
      tanggal_praktikum: item.tanggal_praktikum || 'N/A', // <-- Handle null
      hari: item.hari || '-',
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || 'Praktikum',
      lab_nama: item.laboratorium?.nama_lab || '-',
      lab_kode: item.laboratorium?.kode_lab || '-',
      // ✅ Add fallback values for dashboard display
      kelas_nama: item.kelas || '-',
      mata_kuliah_nama: 'Praktikum Kebidanan', // Default value since no relation
    }));
  } catch (error) {
    console.error('Error fetching upcoming practicum:', error);
    return [];
  }
}

// ============================================================================
// PENDING GRADING - ✅ FIXED: Removed 'score' column check
// ============================================================================

export async function getPendingGrading(limit: number = 10): Promise<PendingGrading[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    // ✅ FIX: Removed .is('score', null) because column doesn't exist
    // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('attempt_kuis' as any)
      .select(`
        id,
        submitted_at,
        attempt_number,
        mahasiswa (
          user_id,
          nim,
          users (
            full_name
          )
        ),
        kuis (
          judul,
          dosen_id,
          kelas (
            nama_kelas,
            mata_kuliah (
              nama_mk
            )
          )
        )
      `)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true })
      .limit(limit * 2);

    if (error) throw error;

    // Filter by dosen
    // PERBAIKAN: Kembali ke 'any' dan tambahkan eslint-disable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = (data || []).filter((item: any) => 
      item.kuis?.dosen_id === dosenId
    );

    // PERBAIKAN: Kembali ke 'any' dan tambahkan eslint-disable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return filtered.slice(0, limit).map((item: any) => ({
      id: item.id,
      mahasiswa_nama: item.mahasiswa?.users?.full_name || 'Unknown',
      mahasiswa_nim: item.mahasiswa?.nim || '-',
      mata_kuliah_nama: item.kuis?.kelas?.mata_kuliah?.nama_mk || '-',
      kuis_judul: item.kuis?.judul || '-',
      submitted_at: item.submitted_at,
      attempt_number: item.attempt_number,
    }));
  } catch (error) {
    console.error('Error fetching pending grading:', error);
    return [];
  }
}

// ============================================================================
// MY KUIS (All status)
// ============================================================================

// PERBAIKAN: Tipe 'KuisData' disesuaikan (status bisa null)
type KuisData = {
  id: string;
  judul: string;
  status: string | null; // <-- INI PERBAIKANNYA
  tanggal_mulai: string;
  tanggal_selesai: string;
  kelas: {
    nama_kelas: string;
  } | null;
};

export async function getMyKuis(status?: 'draft' | 'published' | 'archived' | null): Promise<KuisWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    let query = supabase
      .from('kuis')
      .select(`
        id,
        judul,
        status,
        tanggal_mulai,
        tanggal_selesai,
        kelas (
          nama_kelas
        )
      `)
      .eq('dosen_id', dosenId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get stats for each kuis
    const kuisWithStats = await Promise.all(
      // PERBAIKAN: Mengganti 'kuis: any' dengan tipe 'KuisData' yang sudah benar
      (data || []).map(async (kuis: KuisData) => {
        // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: totalAttempts } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id);

        // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: submittedCount } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id)
          .eq('status', 'submitted');

        return {
          id: kuis.id,
          judul: kuis.judul,
          status: kuis.status || 'draft', // <-- Handle null
          tanggal_mulai: kuis.tanggal_mulai,
          tanggal_selesai: kuis.tanggal_selesai,
          total_attempts: totalAttempts || 0,
          submitted_count: submittedCount || 0,
          kelas_nama: kuis.kelas?.nama_kelas || '-',
        };
      })
    );

    return kuisWithStats;
  } catch (error) {
    console.error('Error fetching my kuis:', error);
    return [];
  }
}

// ============================================================================
// ACTIVE KUIS (Published only)
// ============================================================================

export async function getActiveKuis(limit?: number): Promise<KuisWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    let query = supabase
      .from('kuis')
      .select(`
        id,
        judul,
        status,
        tanggal_mulai,
        tanggal_selesai,
        kelas (
          nama_kelas
        )
      `)
      .eq('dosen_id', dosenId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get stats for each kuis
    const kuisWithStats = await Promise.all(
      // PERBAIKAN: Mengganti 'kuis: any' dengan tipe 'KuisData' yang sudah benar
      (data || []).map(async (kuis: KuisData) => {
        // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: totalAttempts } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id);

        // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count: submittedCount } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id)
          .eq('status', 'submitted');

        return {
          id: kuis.id,
          judul: kuis.judul,
          status: kuis.status || 'draft', // <-- Handle null
          tanggal_mulai: kuis.tanggal_mulai,
          tanggal_selesai: kuis.tanggal_selesai,
          total_attempts: totalAttempts || 0,
          submitted_count: submittedCount || 0,
          kelas_nama: kuis.kelas?.nama_kelas || '-',
        };
      })
    );

    return kuisWithStats;
  } catch (error) {
    console.error('Error fetching active kuis:', error);
    return [];
  }
}

// ============================================================================
// MY BORROWING - ✅ FIXED: Added limit parameter & Fixed status enum
// ============================================================================

// Valid borrowing status values
export type BorrowingStatus = 'menunggu' | 'disetujui' | 'dipinjam' | 'dikembalikan' | 'ditolak';

export async function getMyBorrowing(limitOrStatus?: number | BorrowingStatus | string): Promise<MyBorrowingRequest[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      console.warn('⚠️ No dosen profile, returning empty array');
      return [];
    }

    // Determine if parameter is limit (number) or status (string)
    const isLimit = typeof limitOrStatus === 'number';
    const isStatus = typeof limitOrStatus === 'string' && !limitOrStatus.match(/^\d+$/);
    
    const limit = isLimit ? limitOrStatus : undefined;
    const status = isStatus ? limitOrStatus : undefined;

    // Build query
    // PERBAIKAN: Menyembunyikan 'any' yang diperlukan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = supabase
      .from('peminjaman' as any)
      .select(`
        id,
        jumlah_pinjam,
        keperluan,
        tanggal_pinjam,
        tanggal_kembali_rencana,
        tanggal_kembali_aktual,
        status,
        created_at,
        inventaris (
          nama_barang,
          kode_barang,
          laboratorium (
            nama_lab
          )
        )
      `)
      .eq('peminjam_id', dosenId)
      .order('created_at', { ascending: false });

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Add limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching my borrowing:', error);
      throw error;
    }

    // PERBAIKAN: Kembali ke 'any' dan tambahkan eslint-disable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
      id: item.id,
      inventaris_nama: item.inventaris?.nama_barang || '-',
      inventaris_kode: item.inventaris?.kode_barang || '-',
      jumlah_pinjam: item.jumlah_pinjam,
      keperluan: item.keperluan,
      tanggal_pinjam: item.tanggal_pinjam,
      tanggal_kembali_rencana: item.tanggal_kembali_rencana,
      tanggal_kembali_aktual: item.tanggal_kembali_aktual,
      status: item.status,
      laboratorium_nama: item.inventaris?.laboratorium?.nama_lab || '-',
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching my borrowing:', error);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Named exports with aliases
export { getMyBorrowing as getMyBorrowingRequests };

export const dosenApi = {
  getStats: getDosenStats,
  getMyMataKuliah,
  getMyKelas,
  getUpcomingPracticum,
  getPendingGrading,
  getMyKuis,
  getActiveKuis,
  getMyBorrowing,
  getMyBorrowingRequests: getMyBorrowing,
};