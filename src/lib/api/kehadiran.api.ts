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
  jadwal_id?: string | null;
  kelas_id?: string | null;
  mata_kuliah_id?: string | null;
  tanggal?: string | null;
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
  jadwal_id?: string | null;
  kelas_id?: string;
  mata_kuliah_id?: string | null;
  tanggal?: string;
  mahasiswa_id: string;
  status: KehadiranStatus;
  keterangan?: string;
}

export interface BulkKehadiranData {
  jadwal_id?: string;
  kelas_id?: string;
  mata_kuliah_id?: string;
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

async function findMatchingJadwalId(
  kelasId: string,
  tanggal: string,
  mataKuliahId?: string | null,
): Promise<string | null> {
  let query: any = supabase
    .from("jadwal_praktikum")
    .select("id")
    .eq("kelas_id", kelasId)
    .eq("tanggal_praktikum", tanggal)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (mataKuliahId) {
    query = query.eq("mata_kuliah_id", mataKuliahId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

async function resolveKehadiranContext(data: BulkKehadiranData): Promise<{
  jadwalId: string | null;
  kelasId: string;
  tanggal: string;
  mataKuliahId: string | null;
}> {
  if (data.jadwal_id) {
    const { data: jadwalData, error } = await (supabase as any)
      .from("jadwal_praktikum")
      .select("id, kelas_id, tanggal_praktikum, mata_kuliah_id")
      .eq("id", data.jadwal_id)
      .maybeSingle();

    if (error) throw error;
    if (!jadwalData?.kelas_id) {
      throw new Error("Jadwal praktikum tidak valid.");
    }

    return {
      jadwalId: jadwalData.id,
      kelasId: jadwalData.kelas_id,
      tanggal: jadwalData.tanggal_praktikum || data.tanggal,
      mataKuliahId: data.mata_kuliah_id || jadwalData.mata_kuliah_id || null,
    };
  }

  if (!data.kelas_id || !data.tanggal) {
    throw new Error("Kelas dan tanggal wajib diisi untuk menyimpan kehadiran.");
  }

  const mataKuliahId = data.mata_kuliah_id || null;
  if (!mataKuliahId) {
    throw new Error(
      "Mata kuliah wajib dipilih saat menyimpan kehadiran tanpa jadwal praktikum.",
    );
  }

  return {
    jadwalId: await findMatchingJadwalId(
      data.kelas_id,
      data.tanggal,
      mataKuliahId,
    ),
    kelasId: data.kelas_id,
    tanggal: data.tanggal,
    mataKuliahId,
  };
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
  return null;
}

function isUniqueViolation(error: any): boolean {
  return (
    error?.code === "23505" ||
    String(error?.message || "")
      .toLowerCase()
      .includes("duplicate key")
  );
}

function applyMataKuliahFilter(query: any, mataKuliahId: string | null): any {
  if (!mataKuliahId && typeof query.is !== "function") {
    return query;
  }

  return mataKuliahId
    ? query.eq("mata_kuliah_id", mataKuliahId)
    : query.is("mata_kuliah_id", null);
}

async function findExistingKehadiranRecord(record: {
  kelas_id: string;
  mata_kuliah_id: string | null;
  tanggal: string;
  mahasiswa_id: string;
}): Promise<{ id: string } | null> {
  let query: any = (supabase as any)
    .from("kehadiran")
    .select("id")
    .eq("kelas_id", record.kelas_id)
    .eq("tanggal", record.tanggal)
    .eq("mahasiswa_id", record.mahasiswa_id)
    .limit(1);

  query = applyMataKuliahFilter(query, record.mata_kuliah_id);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

async function insertOrUpdateKehadiranRecord(record: {
  jadwal_id: string | null;
  kelas_id: string;
  mata_kuliah_id: string | null;
  tanggal: string;
  mahasiswa_id: string;
  status: KehadiranStatus;
  keterangan: string | null;
}): Promise<void> {
  const { error } = await (supabase as any).from("kehadiran").insert(record);
  if (!error) return;

  if (!isUniqueViolation(error)) {
    throw error;
  }

  const conflictedRecord = await findExistingKehadiranRecord(record);
  if (!conflictedRecord) {
    throw error;
  }

  const { error: updateError } = await (supabase as any)
    .from("kehadiran")
    .update({
      ...record,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conflictedRecord.id);

  if (updateError) throw updateError;
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
    let query: any = (supabase as any)
      .from("kehadiran")
      .select(
        `
        id,
        jadwal_id,
        kelas_id,
        mata_kuliah_id,
        tanggal,
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
      .eq("kelas_id", kelasId);

    if (startDate) {
      query = query.gte("tanggal", startDate);
    }
    if (endDate) {
      query = query.lte("tanggal", endDate);
    }

    const { data, error } = await query.order("tanggal", {
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
      .insert(data as any)
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
    const context = await resolveKehadiranContext(data);

    const records = data.kehadiran.map((item) => ({
      jadwal_id: context.jadwalId,
      kelas_id: context.kelasId,
      mata_kuliah_id: context.mataKuliahId,
      tanggal: context.tanggal,
      mahasiswa_id: item.mahasiswa_id,
      status: item.status,
      keterangan: item.keterangan || null,
    }));

    let existingQuery: any = (supabase as any)
      .from("kehadiran")
      .select("id, mahasiswa_id")
      .eq("kelas_id", context.kelasId)
      .eq("tanggal", context.tanggal);

    existingQuery = applyMataKuliahFilter(existingQuery, context.mataKuliahId);

    const { data: existing, error: existingError } = await existingQuery;
    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      const updates = records.map(async (record) => {
        const existingRecord = existing.find(
          (e) => e.mahasiswa_id === record.mahasiswa_id,
        );
        if (existingRecord) {
          return supabase
            .from("kehadiran")
            .update({
              ...record,
              updated_at: new Date().toISOString(),
            } as any)
            .eq("id", existingRecord.id);
        } else {
          return insertOrUpdateKehadiranRecord(record);
        }
      });
      await Promise.all(updates);
    } else {
      const { error } = await (supabase as any)
        .from("kehadiran")
        .insert(records as any);
      if (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }

        await Promise.all(records.map(insertOrUpdateKehadiranRecord));
      }
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
  mataKuliahId?: string,
): Promise<KehadiranStats> {
  try {
    let query: any = (supabase as any)
      .from("kehadiran")
      .select("status")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId);

    if (mataKuliahId) {
      query = query.eq("mata_kuliah_id", mataKuliahId);
    }

    const { data, error } = await query;

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
      mataKuliahId,
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
  mataKuliahId?: string,
): Promise<number> {
  try {
    const stats = await getKehadiranStats(mahasiswaId, kelasId, mataKuliahId);

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
      mataKuliahId,
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
  tanggal?: string | null;
  kelas_id?: string | null;
  mata_kuliah_id?: string | null;
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
      id?: string | null;
      nama_mk: string;
      kode_mk?: string | null;
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
        "id, status, keterangan, created_at, tanggal, kelas_id, mata_kuliah_id, jadwal_id",
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("tanggal", { ascending: false })
      .limit(100);

    if (error) throw error;

    const records = Array.isArray(data) ? data : [];

    const result = await Promise.all(
      records.map(async (item: any) => {
        const jadwalId = item?.jadwal_id || null;
        const { data: jadwal } = jadwalId
          ? await (supabase as any)
              .from("jadwal_praktikum")
              .select(
                "id, tanggal_praktikum, jam_mulai, jam_selesai, topik, kelas_id, laboratorium_id, mata_kuliah_id",
              )
              .eq("id", jadwalId)
              .maybeSingle()
          : { data: null };

        const resolvedKelasId = item?.kelas_id || jadwal?.kelas_id || null;
        const resolvedTanggal =
          item?.tanggal || jadwal?.tanggal_praktikum || item?.created_at;
        const resolvedMataKuliahId =
          item?.mata_kuliah_id ||
          (await resolveKehadiranMataKuliahId({
            kelas_id: resolvedKelasId,
            mata_kuliah_id: jadwal?.mata_kuliah_id || null,
          }));

        const { data: kelasData } = resolvedKelasId
          ? await supabase
              .from("kelas")
              .select("nama_kelas")
              .eq("id", resolvedKelasId)
              .maybeSingle()
          : { data: null };

        const { data: mataKuliahData } = resolvedMataKuliahId
          ? await supabase
              .from("mata_kuliah")
              .select("id, nama_mk, kode_mk")
              .eq("id", resolvedMataKuliahId)
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
          tanggal: resolvedTanggal,
          kelas_id: resolvedKelasId,
          mata_kuliah_id: resolvedMataKuliahId,
          status: item.status,
          keterangan: item.keterangan,
          created_at: item.created_at,
          jadwal:
            jadwal || resolvedKelasId || resolvedMataKuliahId
              ? {
                  id: jadwal?.id || item.id,
                  tanggal_praktikum: resolvedTanggal,
                  jam_mulai: jadwal?.jam_mulai || "-",
                  jam_selesai: jadwal?.jam_selesai || "-",
                  topik: jadwal?.topik || "Kehadiran Mata Kuliah",
                  mata_kuliah: mataKuliahData
                    ? {
                        id: mataKuliahData.id,
                        nama_mk: mataKuliahData.nama_mk,
                        kode_mk: mataKuliahData.kode_mk,
                      }
                    : null,
                  kelas: kelasData
                    ? {
                        nama_kelas: kelasData.nama_kelas,
                        mata_kuliah: resolvedMataKuliahId
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
  mataKuliahId?: string,
): Promise<any[]> {
  try {
    let query: any = (supabase as any)
      .from("kehadiran")
      .select(
        `
        tanggal,
        kelas_id,
        mata_kuliah_id,
        status,
        keterangan,
        mahasiswa:mahasiswa_id (
          nim,
          users:user_id (full_name)
        )
      `,
      )
      .eq("kelas_id", kelasId)
      .eq("tanggal", tanggal)
      .order("mahasiswa(nim)");

    if (mataKuliahId) {
      query = query.eq("mata_kuliah_id", mataKuliahId);
    }

    const { data: kehadiranData, error } = await query;

    if (error) throw error;

    const kelasNameCache = new Map<string, string>();
    const mataKuliahNameCache = new Map<string, string>();

    return await Promise.all(
      (kehadiranData || []).map(async (item: any) => {
        let kelasNama = "-";
        if (item.kelas_id) {
          if (!kelasNameCache.has(item.kelas_id)) {
            const { data: kelasData } = await supabase
              .from("kelas")
              .select("nama_kelas")
              .eq("id", item.kelas_id)
              .maybeSingle();
            kelasNameCache.set(item.kelas_id, kelasData?.nama_kelas || "-");
          }
          kelasNama = kelasNameCache.get(item.kelas_id) || "-";
        }

        let mataKuliahNama = "-";
        if (item.mata_kuliah_id) {
          if (!mataKuliahNameCache.has(item.mata_kuliah_id)) {
            const { data: mkData } = await supabase
              .from("mata_kuliah")
              .select("nama_mk")
              .eq("id", item.mata_kuliah_id)
              .maybeSingle();
            mataKuliahNameCache.set(
              item.mata_kuliah_id,
              mkData?.nama_mk || "-",
            );
          }
          mataKuliahNama = mataKuliahNameCache.get(item.mata_kuliah_id) || "-";
        }

        return {
          tanggal: item.tanggal || tanggal,
          kelas: kelasNama,
          mata_kuliah: mataKuliahNama,
          nim: item.mahasiswa?.nim || "-",
          nama_mahasiswa: item.mahasiswa?.users?.full_name || "-",
          status: item.status,
          keterangan: item.keterangan || "",
        };
      }),
    );
  } catch (error) {
    logger.error("Failed to fetch kehadiran for export", {
      kelasId,
      tanggal,
      mataKuliahId,
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
  mata_kuliah_id?: string | null;
  mata_kuliah_nama?: string | null;
  mata_kuliah_kode?: string | null;
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
  mataKuliahId?: string,
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
        tanggal,
        kelas_id,
        mata_kuliah_id
      `,
      )
      .eq("kelas_id", kelasId)
      .order("tanggal", { ascending: false });

    if (mataKuliahId) {
      query = query.eq("mata_kuliah_id", mataKuliahId);
    }

    if (startDate) query = query.gte("tanggal", startDate);
    if (endDate) query = query.lte("tanggal", endDate);

    const { data, error } = await query;
    if (error) throw error;

    const mataKuliahIds = Array.from(
      new Set(
        ((data || []) as any[])
          .map((record) => record.mata_kuliah_id)
          .filter(Boolean),
      ),
    );
    const mataKuliahMap = new Map<
      string,
      { nama_mk?: string | null; kode_mk?: string | null }
    >();

    if (mataKuliahIds.length > 0) {
      const { data: mataKuliahData } = await supabase
        .from("mata_kuliah")
        .select("id, nama_mk, kode_mk")
        .in("id", mataKuliahIds);

      (mataKuliahData || []).forEach((mk: any) => {
        mataKuliahMap.set(mk.id, {
          nama_mk: mk.nama_mk,
          kode_mk: mk.kode_mk,
        });
      });
    }

    const { data: kelasData } = await supabase
      .from("kelas")
      .select("id, nama_kelas")
      .eq("id", kelasId)
      .maybeSingle();

    const historyMap = new Map<string, any>();

    (data || []).forEach((record: any) => {
      const tanggal = record.tanggal;
      if (!tanggal) {
        return;
      }

      const mapKey = `${tanggal}-${record.mata_kuliah_id || "no-mk"}`;
      const mataKuliah = record.mata_kuliah_id
        ? mataKuliahMap.get(record.mata_kuliah_id)
        : null;

      if (!historyMap.has(mapKey)) {
        historyMap.set(mapKey, {
          tanggal,
          mata_kuliah_id: record.mata_kuliah_id || null,
          mata_kuliah_nama: mataKuliah?.nama_mk || null,
          mata_kuliah_kode: mataKuliah?.kode_mk || null,
          kelas_id: record.kelas_id || kelasId,
          kelas_nama: kelasData?.nama_kelas || "-",
          total_mahasiswa: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpha: 0,
        });
      }

      const stats = historyMap.get(mapKey);
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
