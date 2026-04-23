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
  kelas_id?: string; // New: Support kelas-based attendance
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

async function resolveKehadiranJadwalId(
  data: BulkKehadiranData,
): Promise<string> {
  if (data.jadwal_id) {
    return data.jadwal_id;
  }

  if (!data.kelas_id || !data.tanggal) {
    throw new Error("Kelas dan tanggal wajib diisi untuk menyimpan kehadiran.");
  }

  let query: any = supabase
    .from("jadwal_praktikum")
    .select("id, mata_kuliah_id, created_at")
    .eq("kelas_id", data.kelas_id)
    .eq("tanggal_praktikum", data.tanggal)
    .eq("is_active", true);

  if (data.mata_kuliah_id) {
    query = query.eq("mata_kuliah_id", data.mata_kuliah_id);
  }

  const { data: jadwalList, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;

  if (!Array.isArray(jadwalList) || jadwalList.length === 0) {
    throw new Error(
      "Jadwal praktikum untuk kelas, mata kuliah, dan tanggal tersebut belum ditemukan.",
    );
  }

  if (!data.mata_kuliah_id && jadwalList.length > 1) {
    throw new Error(
      "Jadwal praktikum tidak unik. Pilih mata kuliah terlebih dahulu.",
    );
  }

  return jadwalList[0].id;
}

async function resolveKehadiranMataKuliahId(
  jadwal: { kelas_id?: string | null; mata_kuliah_id?: string | null } | null,
): Promise<string | null> {
  if (jadwal?.mata_kuliah_id) {
    return jadwal.mata_kuliah_id;
  }

  if (!jadwal?.kelas_id) {
    return null;
  }

  const { data: latestJadwalMkData } = await (supabase as any)
    .from("jadwal_praktikum")
    .select("mata_kuliah_id")
    .eq("kelas_id", jadwal.kelas_id)
    .eq("is_active", true)
    .not("mata_kuliah_id", "is", null)
    .order("tanggal_praktikum", { ascending: false })
    .limit(1);

  if (latestJadwalMkData?.[0]?.mata_kuliah_id) {
    return latestJadwalMkData[0].mata_kuliah_id;
  }

  const { data: kelasData } = await supabase
    .from("kelas")
    .select("mata_kuliah_id")
    .eq("id", jadwal.kelas_id)
    .maybeSingle();

  return kelasData?.mata_kuliah_id || null;
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
    const resolvedJadwalId = await resolveKehadiranJadwalId(data);

    const records = data.kehadiran.map((item) => ({
      jadwal_id: resolvedJadwalId,
      mahasiswa_id: item.mahasiswa_id,
      status: item.status,
      keterangan: item.keterangan || null,
    }));

    const { data: existing } = await supabase
      .from("kehadiran")
      .select("id, mahasiswa_id")
      .eq("jadwal_id", resolvedJadwalId);

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
          return supabase.from("kehadiran").insert(record);
        }
      });
      await Promise.all(updates);
    } else {
      // Insert new records
      const { error } = await supabase.from("kehadiran").insert(records as any);
      if (error) throw error;
    }
  } catch (error) {
    logger.error("Failed to save bulk kehadiran", {
      jadwal_id: data.jadwal_id,
      kelas_id: data.kelas_id,
      mata_kuliah_id: data.mata_kuliah_id,
      tanggal: data.tanggal,
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
    mata_kuliah?: {
      nama_mk: string;
    } | null;
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
    const { data, error } = await (supabase as any)
      .from("kehadiran")
      .select(
        "id, status, keterangan, created_at, jadwal:jadwal_praktikum!inner(id, tanggal_praktikum, jam_mulai, jam_selesai, topik, kelas_id, laboratorium_id, mata_kuliah_id)",
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("jadwal(tanggal_praktikum)", { ascending: false })
      .limit(100);

    if (error) throw error;

    const records = Array.isArray(data) ? data : [];

    const result = await Promise.all(
      records.map(async (item: any) => {
        const jadwal = item?.jadwal;

        const { data: kelasData } = jadwal?.kelas_id
          ? await supabase
              .from("kelas")
              .select("nama_kelas")
              .eq("id", jadwal.kelas_id)
              .maybeSingle()
          : { data: null };

        const mataKuliahId = await resolveKehadiranMataKuliahId(jadwal || null);

        const { data: mataKuliahData } = mataKuliahId
          ? await supabase
              .from("mata_kuliah")
              .select("nama_mk")
              .eq("id", mataKuliahId)
              .maybeSingle()
          : { data: null };

        const { data: laboratoriumData } = jadwal?.laboratorium_id
          ? await supabase
              .from("laboratorium")
              .select("nama_lab")
              .eq("id", jadwal.laboratorium_id)
              .maybeSingle()
          : { data: null };

        return {
          id: item.id,
          status: item.status,
          keterangan: item.keterangan,
          created_at: item.created_at,
          jadwal: jadwal
            ? {
                id: jadwal.id,
                tanggal_praktikum: jadwal.tanggal_praktikum,
                jam_mulai: jadwal.jam_mulai,
                jam_selesai: jadwal.jam_selesai,
                topik: jadwal.topik,
                mata_kuliah: mataKuliahData
                  ? {
                      nama_mk: mataKuliahData.nama_mk,
                    }
                  : null,
                kelas: kelasData
                  ? {
                      nama_kelas: kelasData.nama_kelas,
                      mata_kuliah: mataKuliahId
                        ? {
                            nama_mk: mataKuliahData?.nama_mk || "-",
                          }
                        : null,
                    }
                  : null,
                laboratorium: laboratoriumData
                  ? {
                      nama_lab: laboratoriumData.nama_lab,
                    }
                  : null,
              }
            : null,
        } as MahasiswaKehadiranRecord;
      }),
    );

    return result;
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
  tanggal: string,
): Promise<any[]> {
  try {
    const result: any = await (supabase as any)
      .from("kehadiran")
      .select(
        `
        jadwal:jadwal_praktikum!inner (
          tanggal_praktikum,
          kelas_id,
          mata_kuliah_id,
          kelas:kelas_id (
            nama_kelas
          ),
          mata_kuliah:mata_kuliah_id (
            nama_mk
          )
        ),
        status,
        keterangan,
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (full_name)
        )
      `,
      )
      .eq("jadwal.kelas_id", kelasId)
      .eq("jadwal.tanggal_praktikum", tanggal)
      .order("mahasiswa(nim)");

    const { data: kehadiranData, error } = result;

    if (error) throw error;

    return (kehadiranData || []).map((item: any) => ({
      tanggal: item.jadwal?.tanggal_praktikum || tanggal,
      kelas: item.jadwal?.kelas?.nama_kelas || "-",
      mata_kuliah: item.jadwal?.mata_kuliah?.nama_mk || "-",
      nim: item.mahasiswa?.nim || "-",
      nama_mahasiswa: item.mahasiswa?.users?.full_name || "-",
      status: item.status,
      keterangan: item.keterangan || "",
    }));
  } catch (error) {
    logger.error("Failed to fetch kehadiran for export", {
      kelasId,
      tanggal,
      error,
    });
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
  limit: number = 30,
): Promise<KehadiranHistoryRecord[]> {
  try {
    let query: any = (supabase as any)
      .from("kehadiran")
      .select(
        `
        status,
        jadwal:jadwal_praktikum!inner (
          tanggal_praktikum,
          kelas_id,
          kelas:kelas_id (
            id,
            nama_kelas
          )
        )
      `,
      )
      .eq("jadwal.kelas_id", kelasId)
      .order("jadwal(tanggal_praktikum)", { ascending: false });

    if (startDate) query = query.gte("jadwal.tanggal_praktikum", startDate);
    if (endDate) query = query.lte("jadwal.tanggal_praktikum", endDate);

    const { data, error } = await query;
    if (error) throw error;

    // Group by date and calculate stats
    const historyMap = new Map<string, any>();

    (data || []).forEach((record: any) => {
      const tanggal = record.jadwal?.tanggal_praktikum;
      if (!tanggal) {
        return;
      }

      if (!historyMap.has(tanggal)) {
        historyMap.set(tanggal, {
          tanggal,
          kelas_id: record.jadwal?.kelas?.id || record.jadwal?.kelas_id || kelasId,
          kelas_nama: record.jadwal?.kelas?.nama_kelas || "-",
          total_mahasiswa: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
        });
      }

      const stats = historyMap.get(tanggal);
      stats.total_mahasiswa++;
      if (record.status === "hadir") stats.hadir++;
      if (record.status === "izin") stats.izin++;
      if (record.status === "sakit") stats.sakit++;
      if (record.status === "alpha") stats.alpha++;
    });

    return Array.from(historyMap.values())
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, limit);
  } catch (error) {
    logger.error("Failed to fetch kehadiran history", { kelasId, error });
    throw handleSupabaseError(error);
  }
}
