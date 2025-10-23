/**
 * Dosen API
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
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  kelas_nama: string;
  mata_kuliah_nama: string;
  lab_nama: string;
  lab_kode: string;
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

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getDosenStats(): Promise<DosenStats> {
  try {
    // Get current dosen ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData, error: dosenError } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (dosenError) throw dosenError;
    const dosenId = dosenData.id;

    // Get total kelas
    const { count: totalKelas } = await supabase
      .from('kelas')
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('is_active', true);

    // Get total mahasiswa across all kelas
    const { data: kelasIds } = await supabase
      .from('kelas')
      .select('id')
      .eq('dosen_id', dosenId)
      .eq('is_active', true);

    let totalMahasiswa = 0;
    if (kelasIds && kelasIds.length > 0) {
      const { count: mhsCount } = await supabase
        .from('kelas_mahasiswa')
        .select('*', { count: 'exact', head: true })
        .in('kelas_id', kelasIds.map(k => k.id))
        .eq('is_active', true);
      totalMahasiswa = mhsCount || 0;
    }

    // Get active kuis
    const { count: activeKuis } = await supabase
      .from('kuis' as any)
      .select('*', { count: 'exact', head: true })
      .eq('dosen_id', dosenId)
      .eq('status', 'published')
      .gte('tanggal_selesai', new Date().toISOString());

    // Get pending grading (submitted but not graded)
    const { count: pendingGrading } = await supabase
      .from('attempt_kuis' as any)
      .select('*, kuis!inner(dosen_id)', { count: 'exact', head: true })
      .eq('kuis.dosen_id', dosenId)
      .eq('status', 'submitted')
      .is('total_score', null);

    return {
      totalKelas: totalKelas || 0,
      totalMahasiswa,
      activeKuis: activeKuis || 0,
      pendingGrading: pendingGrading || 0,
    };
  } catch (error) {
    console.error('Error fetching dosen stats:', error);
    throw error;
  }
}

// ============================================================================
// MY COURSES (MATA KULIAH)
// ============================================================================

export async function getMyMataKuliah(limit: number = 10): Promise<MataKuliahWithStats[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

    // Get mata kuliah through kelas
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
      .eq('dosen_id', dosenData.id)
      .eq('is_active', true)
      .limit(limit);

    if (kelasError) throw kelasError;

    // Group by mata_kuliah and count
    const mkMap = new Map<string, MataKuliahWithStats>();

    for (const kelas of kelasData || []) {
      const mk = kelas.mata_kuliah as any;
      if (!mk) continue;

      if (!mkMap.has(mk.id)) {
        // Get mahasiswa count for this mata kuliah
        const { count: mhsCount } = await supabase
          .from('kelas_mahasiswa')
          .select('*, kelas!inner(mata_kuliah_id)', { count: 'exact', head: true })
          .eq('kelas.mata_kuliah_id', mk.id)
          .eq('kelas.dosen_id', dosenData.id)
          .eq('is_active', true);

        mkMap.set(mk.id, {
          id: mk.id,
          kode_mk: mk.kode_mk,
          nama_mk: mk.nama_mk,
          sks: mk.sks,
          semester: mk.semester,
          program_studi: mk.program_studi,
          totalKelas: 1,
          totalMahasiswa: mhsCount || 0,
        });
      } else {
        const existing = mkMap.get(mk.id)!;
        existing.totalKelas += 1;
      }
    }

    return Array.from(mkMap.values());
  } catch (error) {
    console.error('Error fetching my mata kuliah:', error);
    throw error;
  }
}

// ============================================================================
// MY CLASSES (KELAS)
// ============================================================================

export async function getMyKelas(limit: number = 10): Promise<KelasWithDetails[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

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
      .eq('dosen_id', dosenData.id)
      .eq('is_active', true)
      .order('tahun_ajaran', { ascending: false })
      .order('semester_ajaran', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get mahasiswa count for each kelas
    const result: KelasWithDetails[] = [];
    for (const kelas of data || []) {
      const { count: mhsCount } = await supabase
        .from('kelas_mahasiswa')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', kelas.id)
        .eq('is_active', true);

      result.push({
        id: kelas.id,
        kode_kelas: kelas.kode_kelas,
        nama_kelas: kelas.nama_kelas,
        tahun_ajaran: kelas.tahun_ajaran,
        semester_ajaran: kelas.semester_ajaran,
        jumlah_mahasiswa: mhsCount || 0,
        mata_kuliah: kelas.mata_kuliah as any,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching my kelas:', error);
    throw error;
  }
}

// ============================================================================
// UPCOMING PRACTICUM (Next 7 days)
// ============================================================================

export async function getUpcomingPracticum(limit: number = 5): Promise<UpcomingPracticum[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

    // Get jadwal for next 7 days
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('jadwal_praktikum')
      .select(`
        id,
        tanggal_praktikum,
        hari,
        jam_mulai,
        jam_selesai,
        topik,
        kelas (
          nama_kelas,
          dosen_id,
          mata_kuliah (
            nama_mk
          )
        ),
        laboratorium (
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

    if (error) throw error;

    // Filter by dosen
    const filtered = (data || []).filter((item: any) => 
      item.kelas?.dosen_id === dosenData.id
    );

    return filtered.map((item: any) => ({
      id: item.id,
      tanggal_praktikum: item.tanggal_praktikum,
      hari: item.hari,
      jam_mulai: item.jam_mulai,
      jam_selesai: item.jam_selesai,
      topik: item.topik || 'Praktikum',
      kelas_nama: item.kelas?.nama_kelas || '-',
      mata_kuliah_nama: item.kelas?.mata_kuliah?.nama_mk || '-',
      lab_nama: item.laboratorium?.nama_lab || '-',
      lab_kode: item.laboratorium?.kode_lab || '-',
    }));
  } catch (error) {
    console.error('Error fetching upcoming practicum:', error);
    throw error;
  }
}

// ============================================================================
// PENDING GRADING (Submitted attempts not yet graded)
// ============================================================================

export async function getPendingGrading(limit: number = 10): Promise<PendingGrading[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

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
            mata_kuliah (
              nama_mk
            )
          )
        )
      `)
      .eq('status', 'submitted')
      .is('total_score', null)
      .order('submitted_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Filter by dosen
    const filtered = (data || []).filter((item: any) => 
      item.kuis?.dosen_id === dosenData.id
    );

    return filtered.map((item: any) => ({
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
    throw error;
  }
}

// ============================================================================
// ACTIVE KUIS
// ============================================================================

export async function getActiveKuis(limit: number = 10): Promise<KuisWithStats[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

    const { data, error } = await supabase
      .from('kuis' as any)
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
      .eq('dosen_id', dosenData.id)
      .eq('status', 'published')
      .gte('tanggal_selesai', new Date().toISOString())
      .order('tanggal_mulai', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Get attempt stats for each kuis
    const result: KuisWithStats[] = [];
    for (const kuisItem of data || []) {
      const kuis = kuisItem as any;
      const { count: totalAttempts } = await supabase
        .from('attempt_kuis' as any)
        .select('*', { count: 'exact', head: true })
        .eq('kuis_id', kuis.id);

      const { count: submittedCount } = await supabase
        .from('attempt_kuis' as any)
        .select('*', { count: 'exact', head: true })
        .eq('kuis_id', kuis.id)
        .eq('status', 'submitted');

      result.push({
        id: kuis.id,
        judul: kuis.judul,
        status: kuis.status,
        tanggal_mulai: kuis.tanggal_mulai,
        tanggal_selesai: kuis.tanggal_selesai,
        total_attempts: totalAttempts || 0,
        submitted_count: submittedCount || 0,
        kelas_nama: kuis.kelas?.nama_kelas || '-',
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching active kuis:', error);
    throw error;
  }
}
// ============================================================================
// MY BORROWING REQUESTS (Peminjaman yang diajukan dosen)
// ============================================================================

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

export async function getMyBorrowingRequests(limit: number = 10): Promise<MyBorrowingRequest[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: dosenData } = await supabase
      .from('dosen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!dosenData) throw new Error('Dosen profile not found');

    // Get peminjaman yang diajukan oleh dosen ini
    const { data, error } = await supabase
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
        inventaris:inventaris_id (
          nama_barang,
          kode_barang,
          laboratorium:laboratorium_id (
            nama_lab
          )
        )
      `)
      .eq('dosen_id', dosenData.id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      inventaris_nama: item.inventaris?.nama_barang || 'Unknown Item',
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
    console.error('Error fetching borrowing requests:', error);
    throw error;
  }
}