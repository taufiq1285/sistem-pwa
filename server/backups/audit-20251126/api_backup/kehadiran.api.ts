/**
 * Kehadiran (Attendance) API
 * Handle student attendance/absen management
 */

import { supabase } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { handleSupabaseError } from '@/lib/utils/errors';

// ============================================================================
// TYPES
// ============================================================================

export type KehadiranStatus = 'hadir' | 'izin' | 'sakit' | 'alpha';

export interface Kehadiran {
  id: string;
  jadwal_id: string;
  mahasiswa_id: string;
  status: KehadiranStatus;
  keterangan?: string;
  created_at: string;
  updated_at?: string;
  waktu_check_in?: string;
  waktu_check_out?: string;
}

export interface KehadiranWithMahasiswa extends Kehadiran {
  mahasiswa: {
    id: string;
    nim: string;
    user: {
      full_name: string;
    };
  };
}

export interface CreateKehadiranData {
  jadwal_id: string;
  mahasiswa_id: string;
  status: KehadiranStatus;
  keterangan?: string;
}

export interface BulkKehadiranData {
  jadwal_id: string;
  tanggal: string;
  kehadiran: Array<{
    mahasiswa_id: string;
    status: KehadiranStatus;
    keterangan?: string;
  }>;
}

export interface KehadiranStats {
  total_pertemuan: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  persentase_kehadiran: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get kehadiran by jadwal_id
 * @param jadwalId - ID of the jadwal praktikum
 * @param _tanggal - Optional date parameter (kept for API compatibility)
 */
export async function getKehadiranByJadwal(
  jadwalId: string,
  _tanggal?: string
): Promise<KehadiranWithMahasiswa[]> {
  try {
    const { data, error } = await supabase
      .from('kehadiran')
      .select(`
        id,
        jadwal_id,
        mahasiswa_id,
        status,
        keterangan,
        created_at,
        updated_at,
        waktu_check_in,
        waktu_check_out,
        mahasiswa (
          id,
          nim,
          user:users (
            full_name
          )
        )
      `)
      .eq('jadwal_id', jadwalId)
      .order('mahasiswa(nim)', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as KehadiranWithMahasiswa[];
  } catch (error) {
    logger.error('Failed to fetch kehadiran by jadwal', { jadwalId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get kehadiran by kelas and date range
 */
export async function getKehadiranByKelas(
  kelasId: string,
  startDate?: string,
  endDate?: string
): Promise<KehadiranWithMahasiswa[]> {
  try {
    let query = supabase
      .from('kehadiran')
      .select(`
        id,
        jadwal_id,
        mahasiswa_id,
        status,
        keterangan,
        created_at,
        updated_at,
        waktu_check_in,
        waktu_check_out,
        mahasiswa (
          id,
          nim,
          user:users (
            full_name
          )
        ),
        jadwal:jadwal_praktikum (
          kelas_id,
          tanggal_praktikum
        )
      `)
      .eq('jadwal.kelas_id', kelasId);

    if (startDate) {
      query = query.gte('jadwal.tanggal_praktikum', startDate);
    }
    if (endDate) {
      query = query.lte('jadwal.tanggal_praktikum', endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as KehadiranWithMahasiswa[];
  } catch (error) {
    logger.error('Failed to fetch kehadiran by kelas', { kelasId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Create single kehadiran record
 */
export async function createKehadiran(data: CreateKehadiranData): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from('kehadiran')
      .insert(data)
      .select('id')
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    logger.error('Failed to create kehadiran', { data, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Bulk create/update kehadiran (for absen per pertemuan)
 */
export async function saveKehadiranBulk(data: BulkKehadiranData): Promise<void> {
  try {
    const records = data.kehadiran.map((item) => ({
      jadwal_id: data.jadwal_id,
      mahasiswa_id: item.mahasiswa_id,
      status: item.status,
      keterangan: item.keterangan || null,
    }));

    // Check if records exist for this jadwal (one jadwal = one attendance session)
    const { data: existing } = await supabase
      .from('kehadiran')
      .select('id, mahasiswa_id')
      .eq('jadwal_id', data.jadwal_id);

    if (existing && existing.length > 0) {
      // Update existing records
      const updates = records.map(async (record) => {
        const existingRecord = existing.find((e) => e.mahasiswa_id === record.mahasiswa_id);
        if (existingRecord) {
          return supabase
            .from('kehadiran')
            .update(record)
            .eq('id', existingRecord.id);
        } else {
          return supabase.from('kehadiran').insert(record);
        }
      });
      await Promise.all(updates);
    } else {
      // Insert new records
      const { error } = await supabase.from('kehadiran').insert(records);
      if (error) throw error;
    }
  } catch (error) {
    logger.error('Failed to save bulk kehadiran', { jadwal_id: data.jadwal_id, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Update kehadiran
 */
export async function updateKehadiran(
  id: string,
  data: Partial<CreateKehadiranData>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('kehadiran')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    logger.error('Failed to update kehadiran', { id, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Delete kehadiran
 */
export async function deleteKehadiran(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('kehadiran').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    logger.error('Failed to delete kehadiran', { id, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get kehadiran stats for a mahasiswa in a kelas
 */
export async function getKehadiranStats(
  mahasiswaId: string,
  kelasId: string
): Promise<KehadiranStats> {
  try {
    const { data, error } = await supabase
      .from('kehadiran')
      .select('status, jadwal!inner(kelas_id)')
      .eq('mahasiswa_id', mahasiswaId)
      .eq('jadwal.kelas_id', kelasId);

    if (error) throw error;

    const records = data || [];
    const total = records.length;
    const hadir = records.filter((r) => r.status === 'hadir').length;
    const izin = records.filter((r) => r.status === 'izin').length;
    const sakit = records.filter((r) => r.status === 'sakit').length;
    const alpha = records.filter((r) => r.status === 'alpha').length;

    return {
      total_pertemuan: total,
      hadir,
      izin,
      sakit,
      alpha,
      persentase_kehadiran: total > 0 ? Math.round((hadir / total) * 100) : 0,
    };
  } catch (error) {
    logger.error('Failed to fetch kehadiran stats', { mahasiswaId, kelasId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Calculate nilai kehadiran (0-100) based on attendance
 */
export async function calculateNilaiKehadiran(
  mahasiswaId: string,
  kelasId: string
): Promise<number> {
  try {
    const stats = await getKehadiranStats(mahasiswaId, kelasId);

    // Formula: (Hadir + (Izin * 0.5) + (Sakit * 0.5)) / Total Pertemuan * 100
    const totalHadir = stats.hadir + (stats.izin * 0.5) + (stats.sakit * 0.5);
    const nilai = stats.total_pertemuan > 0
      ? Math.round((totalHadir / stats.total_pertemuan) * 100)
      : 0;

    return Math.min(nilai, 100); // Cap at 100
  } catch (error) {
    logger.error('Failed to calculate nilai kehadiran', { mahasiswaId, kelasId, error });
    return 0; // Return 0 on error for grade calculation
  }
}

/**
 * Get kehadiran records for a mahasiswa (for Mahasiswa dashboard)
 */
export interface MahasiswaKehadiranRecord {
  id: string;
  status: KehadiranStatus;
  keterangan: string | null;
  created_at: string;
  jadwal: {
    id: string;
    tanggal_praktikum: string;
    jam_mulai: string;
    jam_selesai: string;
    topik: string | null;
    kelas: {
      nama_kelas: string;
      mata_kuliah: {
        nama_mk: string;
      } | null;
    } | null;
    laboratorium: {
      nama_lab: string;
    } | null;
  } | null;
}

export async function getMahasiswaKehadiran(
  mahasiswaId: string
): Promise<MahasiswaKehadiranRecord[]> {
  try {
    const { data, error } = await supabase
      .from('kehadiran')
      .select(`
        id,
        status,
        keterangan,
        created_at,
        jadwal:jadwal_praktikum!inner (
          id,
          tanggal_praktikum,
          jam_mulai,
          jam_selesai,
          topik,
          kelas:kelas_id (
            nama_kelas,
            mata_kuliah:mata_kuliah_id (
              nama_mk
            )
          ),
          laboratorium:laboratorium_id (
            nama_lab
          )
        )
      `)
      .eq('mahasiswa_id', mahasiswaId)
      .order('jadwal(tanggal_praktikum)', { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as unknown as MahasiswaKehadiranRecord[];
  } catch (error) {
    logger.error('Failed to fetch mahasiswa kehadiran', { mahasiswaId, error });
    throw handleSupabaseError(error);
  }
}
