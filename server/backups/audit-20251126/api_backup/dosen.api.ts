/**
 * Dosen API - FIXED: Added getMyKelas and KelasWithStats
 * * 🆕 UPDATED: Added Student Enrollment functions
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

// ✅ NEW: KelasWithStats type for dashboard
export interface KelasWithStats {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  totalMahasiswa: number;
  mata_kuliah_kode?: string;
  mata_kuliah_nama?: string;
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

// ============================================================================
// 🆕 NEW TYPES - STUDENT ENROLLMENT
// ============================================================================
export interface EnrolledStudent {
  id: string;
  mahasiswa_id: string;
  nim: string;
  nama: string;
  email: string;
  enrolled_at: string;
  is_active: boolean;
}

export interface KelasWithStudents {
  id: string;
  kode_kelas: string;
  nama_kelas: string;
  mata_kuliah_kode: string;
  mata_kuliah_nama: string;
  tahun_ajaran: string;
  semester_ajaran: number;
  kuota: number;
  jumlah_mahasiswa: number;
  students: EnrolledStudent[];
}

export interface StudentStats {
  totalStudents: number;
  totalKelas: number;
  averagePerKelas: number;
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
// HELPER FUNCTION
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
      return {
        totalKelas: 0,
        totalMahasiswa: 0,
        activeKuis: 0,
        pendingGrading: 0,
      };
    }

    const { count: totalKelas } = await supabase
      .from('kelas')
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('is_active', true);

    const { data: kelasData } = await supabase
      .from('kelas')
      .select('id')
      .eq('dosen_id', dosenId);

    const kelasIds = kelasData?.map(k => k.id) || [];

    let totalMahasiswa = 0;
    if (kelasIds.length > 0) {
       
      const { count } = await supabase
        .from('kelas_mahasiswa' as any)
        .select('mahasiswa_id', { count: 'exact', head: true })
        .in('kelas_id', kelasIds);
      totalMahasiswa = count || 0;
    }

    const { count: activeKuis } = await supabase
      .from('kuis')
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('status', 'published');

    const { data: kuisData } = await supabase
      .from('kuis')
      .select('id')
      .eq('dosen_id', dosenId);

    const kuisIds = kuisData?.map(k => k.id) || [];

    let pendingGrading = 0;
    if (kuisIds.length > 0) {
       
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
// MY KELAS - ✅ NEW FUNCTION
// ============================================================================

export async function getMyKelas(limit?: number): Promise<KelasWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    // ✅ FIX: Get kelas from jadwal_praktikum that dosen created
    const { data: jadwalData, error: jadwalError } = await supabase
      .from('jadwal_praktikum')
      .select(`
        kelas_id,
        kelas:kelas_id (
          id,
          kode_kelas,
          nama_kelas,
          tahun_ajaran,
          semester_ajaran,
          dosen_id,
          mata_kuliah (
            kode_mk,
            nama_mk
          )
        )
      `)
      .not('kelas_id', 'is', null)
      .order('created_at', { ascending: false });

    if (jadwalError) throw jadwalError;

    // Get unique kelas (remove duplicates)
    const uniqueKelasMap = new Map();
    
    for (const jadwal of (jadwalData || [])) {
      const kelas = (jadwal as any).kelas;
      if (kelas && !uniqueKelasMap.has(kelas.id)) {
        // Only show if dosen assigned OR no dosen assigned
        if (!kelas.dosen_id || kelas.dosen_id === dosenId) {
          uniqueKelasMap.set(kelas.id, kelas);
        }
      }
    }

    const uniqueKelas = Array.from(uniqueKelasMap.values());

    // Apply limit
    const limitedKelas = limit ? uniqueKelas.slice(0, limit) : uniqueKelas;

    // Get stats for each kelas
    const kelasWithStats = await Promise.all(
      limitedKelas.map(async (kelas: any) => {
         
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
          totalMahasiswa: count || 0,
          mata_kuliah_kode: kelas.mata_kuliah?.kode_mk,
          mata_kuliah_nama: kelas.mata_kuliah?.nama_mk,
        };
      })
    );

    return kelasWithStats;
  } catch (error) {
    console.error('Error fetching my kelas:', error);
    return [];
  }
}

// ============================================================================
// MY MATA KULIAH - Keep existing function
// ============================================================================

type KelasDataForMK = {
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
      return [];
    }

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

    const mataKuliahMap = new Map();
    
    for (const kelas of (kelasData as KelasDataForMK[] | null) || []) {
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
    }

    for (const [mkId, mk] of mataKuliahMap.entries()) {
      const { data: kelasIds } = await supabase
        .from('kelas')
        .select('id')
        .eq('dosen_id', dosenId)
        .eq('mata_kuliah_id', mkId);

      if (kelasIds && kelasIds.length > 0) {
         
        const { count } = await supabase
          .from('kelas_mahasiswa' as any)
          .select('*', { count: 'exact', head: true })
          .in('kelas_id', kelasIds.map(k => k.id));
        
        mk.totalMahasiswa = count || 0;
      }
    }

    let results = Array.from(mataKuliahMap.values());
    
    if (limit) {
      results = results.slice(0, limit);
    }

    return results;
  } catch (error) {
    console.error('Error fetching mata kuliah:', error);
    return [];
  }
}

// ============================================================================
// ============================================================================
// UPCOMING PRACTICUM
// ============================================================================

export async function getUpcomingPracticum(limit?: number): Promise<UpcomingPracticum[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    // ✅ Logika Tanggal (7 hari: Hari ini + 6 hari)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Mulai hari ini

    const sixDaysFromNow = new Date();
    sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6); // Selesai 6 hari dari sekarang
    const endDateStr = sixDaysFromNow.toISOString().split('T')[0];

    // ✅ PERBAIKAN: Menghapus 'kelas,' dari string select
    let query = supabase
      .from('jadwal_praktikum')
      .select(`
        id,
        tanggal_praktikum,
        hari,
        jam_mulai,
        jam_selesai,
        topik,
        kelas_id, 
        kelas:kelas_id (
          id,
          nama_kelas,
          dosen_id,
          mata_kuliah (
            nama_mk
          )
        ),
        laboratorium (
          kode_lab,
          nama_lab
        )
      `)
      .gte('tanggal_praktikum', todayStr)
      .lte('tanggal_praktikum', endDateStr)
      .order('tanggal_praktikum', { ascending: true })
      .order('jam_mulai', { ascending: true });

    if (limit) {
      query = query.limit(100); // Get more, filter later
    }

    const { data, error } = await query;
    if (error) {
      // Ini akan log error jika masih ada
      console.error('Error fetching upcoming practicum:', error);
      throw error;
    }

    // ✅ Logika Filter (Sudah benar dari sebelumnya)
    const filtered = (data || []).filter((item: any) => {
      // Jika jadwal tidak punya kelas, tampilkan
      if (!item.kelas_id) {
        return true;
      }
      
      // Jika jadwal punya kelas (item.kelas ada):
      if (item.kelas) {
        // Tampilkan jika kelas itu BELUM punya dosen (null)
        // ATAU jika dosen kelas itu adalah dosen yang sedang login
        if (!item.kelas.dosen_id || item.kelas.dosen_id === dosenId) {
          return true;
        }
      }
      
      // Jika tidak, sembunyikan
      return false;
    });

    // Apply limit after filtering
    const limitedData = limit ? filtered.slice(0, limit) : filtered;

    return limitedData.map((item: any) => ({
      id: item.id,
      kelas: item.kelas_id || '', // Menggunakan kelas_id sebagai referensi
      tanggal_praktikum: item.tanggal_praktikum,
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || '-',
      lab_nama: item.laboratorium?.nama_lab || '-',
      lab_kode: item.laboratorium?.kode_lab || '-',
      kelas_nama: item.kelas?.nama_kelas || '-', // Nama kelas dari relasi
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || '-',
    }));
  } catch (error) {
    // Menangkap error jika terjadi di luar query
    console.error('Error in getUpcomingPracticum function:', error);
    return [];
  }
}

// ============================================================================
// PENDING GRADING
// ============================================================================

type GradingData = {
  id: string;
  submitted_at: string;
  attempt_number: number;
  mahasiswa: {
    nim: string;
    user: {
      full_name: string;
    } | null;
  } | null;
  kuis: {
    judul: string;
    kelas: {
      mata_kuliah: {
        nama_mk: string;
      } | null;
    } | null;
  } | null;
};

export async function getPendingGrading(limit?: number): Promise<PendingGrading[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    const { data: kuisIds } = await supabase
      .from('kuis')
      .select('id')
      .eq('dosen_id', dosenId);

    if (!kuisIds || kuisIds.length === 0) {
      return [];
    }

     
    let query = supabase
      .from('attempt_kuis' as any)
      .select(`
        id,
        submitted_at,
        attempt_number,
        mahasiswa (
          nim,
          users (
            full_name
          )
        ),
        kuis (
          judul,
          kelas (
            mata_kuliah (
              nama_mk
            )
          )
        )
      `)
      .in('kuis_id', kuisIds.map(k => k.id))
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ((data as unknown) as GradingData[] || []).map(item => ({
      id: item.id,
      mahasiswa_nama: item.mahasiswa?.user?.full_name || '-',
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
// ACTIVE KUIS
// ============================================================================

type KuisData = {
  id: string;
  judul: string;
  status: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kelas: {
    nama_kelas: string;
  } | null;
};

export async function getActiveKuis(limit?: number): Promise<KuisWithStats[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
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

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const kuisWithStats = await Promise.all(
      (data as KuisData[] || []).map(async (kuis) => {
         
        const { count: totalAttempts } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id);

         
        const { count: submittedCount } = await supabase
          .from('attempt_kuis' as any)
          .select('*', { count: 'exact', head: true })
          .eq('kuis_id', kuis.id)
          .eq('status', 'submitted');

        return {
          id: kuis.id,
          judul: kuis.judul,
          status: kuis.status || 'draft',
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
// MY BORROWING
// ============================================================================

export type BorrowingStatus = 'menunggu' | 'disetujui' | 'dipinjam' | 'dikembalikan' | 'ditolak';

export async function getMyBorrowing(limitOrStatus?: number | BorrowingStatus | string): Promise<MyBorrowingRequest[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) {
      return [];
    }

    const isLimit = typeof limitOrStatus === 'number';
    const isStatus = typeof limitOrStatus === 'string' && !limitOrStatus.match(/^\d+$/);
    
    const limit = isLimit ? limitOrStatus : undefined;
    const status = isStatus ? limitOrStatus : undefined;

     
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

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;

     
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
// 🆕 NEW FUNCTIONS - STUDENT ENROLLMENT
// ============================================================================
/**
 * Get enrolled students for a specific class
 */
export async function getKelasStudents(kelasId: string): Promise<EnrolledStudent[]> {
  try {
    const { data, error } = await supabase
      .from('kelas_mahasiswa')
      .select(`
        id,
        mahasiswa_id,
        enrolled_at,
        is_active,
        mahasiswa (
          id,
          nim,
          users (
            nama,
            email
          )
        )
      `)
      .eq('kelas_id', kelasId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });
    if (error) throw error;
    if (!data) return [];
     
    return data.map((item: any) => ({
      id: item.id,
      mahasiswa_id: item.mahasiswa_id,
      nim: item.mahasiswa?.nim || '-',
      nama: item.mahasiswa?.users?.nama || 'Unknown',
      email: item.mahasiswa?.users?.email || '-',
      enrolled_at: item.enrolled_at,
      is_active: item.is_active,
    }));
  } catch (error) {
    console.error('Error fetching kelas students:', error);
    return [];
  }
}

/**
 * Get all classes with enrolled students
 */
export async function getMyKelasWithStudents(): Promise<KelasWithStudents[]> {
  try {
    const dosenId = await getDosenId();
    if (!dosenId) return [];

    const { data: kelasData, error } = await supabase
      .from('kelas')
      .select(`
        id,
        kode_kelas,
        nama_kelas,
        tahun_ajaran,
        semester_ajaran,
        kuota,
        mata_kuliah_id
      `)
      .eq('dosen_id', dosenId)
      .eq('is_active', true)
      .order('nama_kelas', { ascending: true });

    if (error) throw error;
    if (!kelasData) return [];

    const result = await Promise.all(
       
      kelasData.map(async (kelas: any) => {
        const { data: mkData } = await supabase
          .from('mata_kuliah')
          .select('kode_mk, nama_mk')
          .eq('id', kelas.mata_kuliah_id)
          .single();
        
        const students = await getKelasStudents(kelas.id);
        
        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          mata_kuliah_kode: mkData?.kode_mk || '-',
          mata_kuliah_nama: mkData?.nama_mk || '-',
          tahun_ajaran: kelas.tahun_ajaran,
          semester_ajaran: kelas.semester_ajaran,
          kuota: kelas.kuota,
          jumlah_mahasiswa: students.length,
          students: students,
        };
      })
    );
    return result;
  } catch (error) {
    console.error('Error fetching kelas with students:', error);
    return [];
  }
}

/**
 * Get student statistics
 */
export async function getStudentStats(): Promise<StudentStats> {
  try {
    const kelasWithStudents = await getMyKelasWithStudents();
        
    const totalKelas = kelasWithStudents.length;
    const totalStudents = kelasWithStudents.reduce(
      (sum, kelas) => sum + kelas.jumlah_mahasiswa, 
      0
    );
    const averagePerKelas = totalKelas > 0 
      ? Math.round(totalStudents / totalKelas) 
      : 0;

    return {
      totalStudents,
      totalKelas,
      averagePerKelas,
    };
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return {
      totalStudents: 0,
      totalKelas: 0,
      averagePerKelas: 0,
    };
  }
}

/**
 * Export all students (CSV)
 */
export async function exportAllStudents() {
  try {
    const kelasWithStudents = await getMyKelasWithStudents();
        
    const allStudents = kelasWithStudents.flatMap(kelas => 
      kelas.students.map(student => ({
        kelas: kelas.nama_kelas,
        mata_kuliah: kelas.mata_kuliah_nama,
        nim: student.nim,
        nama: student.nama,
        email: student.email,
        tanggal_daftar: new Date(student.enrolled_at).toLocaleDateString('id-ID'),
      }))
    );
    return allStudents;
  } catch (error) {
    console.error('Error exporting students:', error);
    return [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getMyBorrowing as getMyBorrowingRequests };

export const dosenApi = {
  // Existing
  getStats: getDosenStats,
  getMyMataKuliah,
  getMyKelas,
  getUpcomingPracticum,
  getPendingGrading,
  getActiveKuis,
  getMyBorrowing,
  getMyBorrowingRequests: getMyBorrowing,
    
  // 🆕 NEW
  getKelasStudents,
  getMyKelasWithStudents,
  getStudentStats,
  exportAllStudents,
};