/**
 * Kehadiran (Attendance) API
 * Handle student attendance/absen management
 */

import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";
import { logger } from "@/lib/utils/logger";
import { handleSupabaseError } from "@/lib/utils/errors";
import {
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/middleware";

// ============================================================================
// TYPES
// ============================================================================

export type KehadiranStatus = "hadir" | "izin" | "sakit" | "alpha";

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
  jadwal_id?: string; // Legacy support
  kelas_id?: string;  // New: Support kelas-based attendance
  mata_kuliah_id?: string; // Mata kuliah yang dipilih dosen
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
  _tanggal?: string,
): Promise<KehadiranWithMahasiswa[]> {
  try {
    const { data, error } = await supabase
      .from("kehadiran")
      .select(
        `
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
      `,
      )
      .eq("jadwal_id", jadwalId)
      .order("mahasiswa(nim)", { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as KehadiranWithMahasiswa[];
  } catch (error) {
    logger.error("Failed to fetch kehadiran by jadwal", { jadwalId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get kehadiran by kelas and date range
 */
export async function getKehadiranByKelas(
  kelasId: string,
  startDate?: string,
  endDate?: string,
): Promise<KehadiranWithMahasiswa[]> {
  try {
    let query = supabase
      .from("kehadiran")
      .select(
        `
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
      `,
      )
      .eq("jadwal.kelas_id", kelasId);

    if (startDate) {
      query = query.gte("jadwal.tanggal_praktikum", startDate);
    }
    if (endDate) {
      query = query.lte("jadwal.tanggal_praktikum", endDate);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return (data || []) as unknown as KehadiranWithMahasiswa[];
  } catch (error) {
    logger.error("Failed to fetch kehadiran by kelas", { kelasId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Create single kehadiran record
 */
async function createKehadiranImpl(data: CreateKehadiranData): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from("kehadiran")
      .insert(data)
      .select("id")
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    logger.error("Failed to create kehadiran", { data, error });
    throw handleSupabaseError(error);
  }
}

// 🔒 PROTECTED: Requires manage:kehadiran permission
export const createKehadiran = requirePermission(
  "manage:kehadiran",
  createKehadiranImpl,
);

/**
 * Bulk create/update kehadiran (for absen per pertemuan)
 */
async function saveKehadiranBulkImpl(data: BulkKehadiranData): Promise<void> {
  try {
    // Determine if we're using jadwal_id or kelas_id
    const identifier = data.kelas_id || data.jadwal_id;
    const identifierType = data.kelas_id ? 'kelas_id' : 'jadwal_id';

    const records = data.kehadiran.map((item) => ({
      [identifierType]: identifier, // Use either kelas_id or jadwal_id
      mahasiswa_id: item.mahasiswa_id,
      status: item.status,
      keterangan: item.keterangan || null,
      mata_kuliah_id: data.mata_kuliah_id || null, // Include mata kuliah
    }));

    // Check if records exist for this identifier + tanggal
    const { data: existing } = await supabase
      .from("kehadiran")
      .select("id, mahasiswa_id")
      .eq(identifierType, identifier)
      .eq("tanggal", data.tanggal);

    if (existing && existing.length > 0) {
      // Update existing records
      const updates = records.map(async (record) => {
        const existingRecord = existing.find(
          (e) => e.mahasiswa_id === record.mahasiswa_id,
        );
        if (existingRecord) {
          return supabase
            .from("kehadiran")
            .update(record)
            .eq("id", existingRecord.id);
        } else {
          return supabase.from("kehadiran").insert({
            ...record,
            tanggal: data.tanggal
          });
        }
      });
      await Promise.all(updates);
    } else {
      // Insert new records with tanggal
      const recordsWithTanggal = records.map(record => ({
        ...record,
        tanggal: data.tanggal
      }));
      const { error } = await supabase.from("kehadiran").insert(recordsWithTanggal);
      if (error) throw error;
    }
  } catch (error) {
    logger.error("Failed to save bulk kehadiran", {
      jadwal_id: data.jadwal_id,
      error,
    });
    throw handleSupabaseError(error);
  }
}

// 🔒 PROTECTED: Requires manage:kehadiran permission
export const saveKehadiranBulk = requirePermission(
  "manage:kehadiran",
  saveKehadiranBulkImpl,
);

/**
 * Update kehadiran
 */
async function updateKehadiranImpl(
  id: string,
  data: Partial<CreateKehadiranData>,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("kehadiran")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    logger.error("Failed to update kehadiran", { id, error });
    throw handleSupabaseError(error);
  }
}

// 🔒 PROTECTED: Requires manage:kehadiran permission
export const updateKehadiran = requirePermission(
  "manage:kehadiran",
  updateKehadiranImpl,
);

/**
 * Delete kehadiran
 */
async function deleteKehadiranImpl(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("kehadiran").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    logger.error("Failed to delete kehadiran", { id, error });
    throw handleSupabaseError(error);
  }
}

// 🔒 PROTECTED: Requires manage:kehadiran permission
export const deleteKehadiran = requirePermission(
  "manage:kehadiran",
  deleteKehadiranImpl,
);

/**
 * Get kehadiran stats for a mahasiswa in a kelas
 */
export async function getKehadiranStats(
  mahasiswaId: string,
  kelasId: string,
): Promise<KehadiranStats> {
  try {
    const { data, error } = await supabase
      .from("kehadiran")
      .select("status, jadwal!inner(kelas_id)")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("jadwal.kelas_id", kelasId);

    if (error) throw error;

    const records = data || [];
    const total = records.length;
    const hadir = records.filter((r) => r.status === "hadir").length;
    const izin = records.filter((r) => r.status === "izin").length;
    const sakit = records.filter((r) => r.status === "sakit").length;
    const alpha = records.filter((r) => r.status === "alpha").length;

    return {
      total_pertemuan: total,
      hadir,
      izin,
      sakit,
      alpha,
      persentase_kehadiran: total > 0 ? Math.round((hadir / total) * 100) : 0,
    };
  } catch (error) {
    logger.error("Failed to fetch kehadiran stats", {
      mahasiswaId,
      kelasId,
      error,
    });
    throw handleSupabaseError(error);
  }
}

/**
 * Calculate nilai kehadiran (0-100) based on attendance
 */
export async function calculateNilaiKehadiran(
  mahasiswaId: string,
  kelasId: string,
): Promise<number> {
  try {
    const stats = await getKehadiranStats(mahasiswaId, kelasId);

    // Formula: (Hadir + (Izin * 0.5) + (Sakit * 0.5)) / Total Pertemuan * 100
    const totalHadir = stats.hadir + stats.izin * 0.5 + stats.sakit * 0.5;
    const nilai =
      stats.total_pertemuan > 0
        ? Math.round((totalHadir / stats.total_pertemuan) * 100)
        : 0;

    return Math.min(nilai, 100); // Cap at 100
  } catch (error) {
    logger.error("Failed to calculate nilai kehadiran", {
      mahasiswaId,
      kelasId,
      error,
    });
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
  mahasiswaId: string,
): Promise<MahasiswaKehadiranRecord[]> {
  try {
    const { data, error } = await supabase
      .from("kehadiran")
      .select(
        `
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
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("jadwal(tanggal_praktikum)", { ascending: false })
      .limit(100);

    if (error) throw error;
    return (data || []) as unknown as MahasiswaKehadiranRecord[];
  } catch (error) {
    logger.error("Failed to fetch mahasiswa kehadiran", { mahasiswaId, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Get kehadiran for export
 * Returns formatted data ready for CSV export
 */
export async function getKehadiranForExport(
  kelasId: string,
  tanggal: string
): Promise<any[]> {
  try {
    // Get kelas info
    const { data: kelasData } = await supabase
      .from("kelas")
      .select("nama_kelas")
      .eq("id", kelasId)
      .single();

    // Get kehadiran records with mata kuliah
    const { data: kehadiranData, error } = await supabase
      .from("kehadiran")
      .select(`
        status,
        keterangan,
        mata_kuliah:mata_kuliah_id (
          nama_mk
        ),
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (full_name)
        )
      `)
      .eq("kelas_id", kelasId)
      .eq("tanggal", tanggal)
      .order("mahasiswa(nim)");

    if (error) throw error;

    return (kehadiranData || []).map((item: any) => ({
      tanggal,
      kelas: kelasData?.nama_kelas || '-',
      mata_kuliah: item.mata_kuliah?.nama_mk || '-',
      nim: item.mahasiswa?.nim || '-',
      nama_mahasiswa: item.mahasiswa?.users?.full_name || '-',
      status: item.status,
      keterangan: item.keterangan || ''
    }));
  } catch (error) {
    logger.error("Failed to fetch kehadiran for export", { kelasId, tanggal, error });
    throw handleSupabaseError(error);
  }
}

/**
 * Kehadiran History Record interface
 */
export interface KehadiranHistoryRecord {
  tanggal: string;
  total_mahasiswa: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  kelas_id: string;
  kelas_nama: string;
}

/**
 * Get attendance history grouped by date
 */
export async function getKehadiranHistory(
  kelasId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
): Promise<KehadiranHistoryRecord[]> {
  try {
    let query = supabase
      .from("kehadiran")
      .select(`
        tanggal,
        status,
        kelas:kelas_id (
          id,
          nama_kelas
        )
      `)
      .eq("kelas_id", kelasId)
      .order("tanggal", { ascending: false });

    if (startDate) query = query.gte("tanggal", startDate);
    if (endDate) query = query.lte("tanggal", endDate);

    const { data, error } = await query;
    if (error) throw error;

    // Group by date and calculate stats
    const historyMap = new Map<string, any>();

    (data || []).forEach((record: any) => {
      const tanggal = record.tanggal;
      if (!historyMap.has(tanggal)) {
        historyMap.set(tanggal, {
          tanggal,
          kelas_id: record.kelas?.id || kelasId,
          kelas_nama: record.kelas?.nama_kelas || '-',
          total_mahasiswa: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0
        });
      }

      const stats = historyMap.get(tanggal);
      stats.total_mahasiswa++;
      if (record.status === 'hadir') stats.hadir++;
      if (record.status === 'izin') stats.izin++;
      if (record.status === 'sakit') stats.sakit++;
      if (record.status === 'alpha') stats.alpha++;
    });

    return Array.from(historyMap.values())
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, limit);
  } catch (error) {
    logger.error("Failed to fetch kehadiran history", { kelasId, error });
    throw handleSupabaseError(error);
  }
}
