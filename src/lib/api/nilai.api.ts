/**
 * Nilai API
 *
 * Purpose: Handle grade/assessment operations
 * Features:
 * - CRUD operations for nilai
 * - Filter by kelas, mahasiswa
 * - Automatic calculation of nilai_akhir and nilai_huruf
 * - Batch update for multiple students
 * - Grade statistics and summaries
 */

import { queryWithFilters, getById, insert, remove } from "./base.api";
import type {
  Nilai,
  CreateNilaiData,
  UpdateNilaiData,
  NilaiWithMahasiswa,
  NilaiSummary,
} from "@/types/nilai.types";
import { handleError } from "@/lib/utils/errors";
import {
  calculateNilaiAkhir,
  getNilaiHuruf,
} from "@/lib/validations/nilai.schema";
import { supabase } from "@/lib/supabase/client";
import { cacheAPI } from "@/lib/offline/api-cache";
import { requirePermission } from "@/lib/middleware/permission.middleware";

// ============================================================================
// TYPES
// ============================================================================

export interface NilaiFilters {
  kelas_id?: string;
  mahasiswa_id?: string;
  min_nilai_akhir?: number;
  max_nilai_akhir?: number;
}

export interface BatchUpdateNilaiItem {
  mahasiswa_id: string;
  nilai_kuis?: number;
  nilai_tugas?: number;
  nilai_uts?: number;
  nilai_uas?: number;
  nilai_praktikum?: number;
  nilai_kehadiran?: number;
  keterangan?: string;
}

export interface BatchUpdateNilaiData {
  kelas_id: string;
  nilai_list: BatchUpdateNilaiItem[];
}

// ============================================================================
// NILAI CRUD OPERATIONS
// ============================================================================

/**
 * Get all nilai with filters
 */
export async function getNilai(filters?: NilaiFilters): Promise<Nilai[]> {
  try {
    const filterConditions = [];

    if (filters?.kelas_id) {
      filterConditions.push({
        column: "kelas_id",
        operator: "eq" as const,
        value: filters.kelas_id,
      });
    }

    if (filters?.mahasiswa_id) {
      filterConditions.push({
        column: "mahasiswa_id",
        operator: "eq" as const,
        value: filters.mahasiswa_id,
      });
    }

    if (filters?.min_nilai_akhir !== undefined) {
      filterConditions.push({
        column: "nilai_akhir",
        operator: "gte" as const,
        value: filters.min_nilai_akhir,
      });
    }

    if (filters?.max_nilai_akhir !== undefined) {
      filterConditions.push({
        column: "nilai_akhir",
        operator: "lte" as const,
        value: filters.max_nilai_akhir,
      });
    }

    return await queryWithFilters<Nilai>("nilai", filterConditions, {
      select: `
        *,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          user_id,
          user:user_id (
            full_name,
            email
          )
        ),
        kelas:kelas_id (
          id,
          nama_kelas,
          kode_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        )
      `,
      order: {
        column: "created_at",
        ascending: false,
      },
    });
  } catch (error) {
    console.error("getNilai error:", error);
    throw handleError(error);
  }
}

/**
 * Get nilai by kelas for all mahasiswa
 */
export async function getNilaiByKelas(
  kelasId: string,
): Promise<NilaiWithMahasiswa[]> {
  try {
    const { data, error } = await supabase
      .from("nilai")
      .select(
        `
        *,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          user_id,
          user:user_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("kelas_id", kelasId)
      .order("mahasiswa(user(full_name))", { ascending: true });

    if (error) throw handleError(error);

    return (data || []) as NilaiWithMahasiswa[];
  } catch (error) {
    console.error("getNilaiByKelas error:", error);
    throw handleError(error);
  }
}

/**
 * Get nilai by mahasiswa
 */
export async function getNilaiByMahasiswa(
  mahasiswaId: string,
): Promise<Nilai[]> {
  try {
    const { data, error } = await supabase
      .from("nilai")
      .select(
        `
        *,
        kelas:kelas_id (
          id,
          nama_kelas,
          kode_kelas,
          tahun_ajaran,
          semester_ajaran,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk,
            sks
          )
        )
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("created_at", { ascending: false });

    if (error) throw handleError(error);

    return (data || []) as Nilai[];
  } catch (error) {
    console.error("getNilaiByMahasiswa error:", error);
    throw handleError(error);
  }
}

/**
 * Get nilai by ID
 */
export async function getNilaiById(id: string): Promise<Nilai> {
  try {
    return await getById<Nilai>("nilai", id, {
      select: `
        *,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          user:user_id (
            full_name,
            email
          )
        ),
        kelas:kelas_id (
          id,
          nama_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        )
      `,
    });
  } catch (error) {
    console.error("getNilaiById error:", error);
    throw handleError(error);
  }
}

/**
 * Get or create nilai for a mahasiswa in a kelas
 */
async function getOrCreateNilaiImpl(
  mahasiswaId: string,
  kelasId: string,
): Promise<Nilai> {
  try {
    // Try to get existing nilai
    const { data: existing, error: fetchError } = await supabase
      .from("nilai")
      .select("*")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId)
      .maybeSingle();

    if (fetchError) throw handleError(fetchError);

    if (existing) {
      return existing as Nilai;
    }

    // Create new nilai if doesn't exist
    const newNilai: CreateNilaiData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      nilai_kuis: 0,
      nilai_tugas: 0,
      nilai_uts: 0,
      nilai_uas: 0,
      nilai_praktikum: 0,
      nilai_kehadiran: 0,
    };

    return await createNilaiImpl(newNilai);
  } catch (error) {
    console.error("getOrCreateNilai error:", error);
    throw handleError(error);
  }
}

export const getOrCreateNilai = requirePermission(
  "manage:nilai",
  getOrCreateNilaiImpl,
);

/**
 * Create new nilai
 */
async function createNilaiImpl(data: CreateNilaiData): Promise<Nilai> {
  try {
    // Calculate nilai_akhir and nilai_huruf
    const nilaiAkhir = calculateNilaiAkhir(
      data.nilai_kuis || 0,
      data.nilai_tugas || 0,
      data.nilai_uts || 0,
      data.nilai_uas || 0,
      data.nilai_praktikum || 0,
      data.nilai_kehadiran || 0,
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    const nilaiData = {
      ...data,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
    };

    const created = await insert<Nilai>("nilai", nilaiData);
    return Array.isArray(created) ? created[0] : created;
  } catch (error) {
    console.error("createNilai error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only dosen can manage nilai
export const createNilai = requirePermission("manage:nilai", createNilaiImpl);

/**
 * Update nilai
 */
async function updateNilaiImpl(
  mahasiswaId: string,
  kelasId: string,
  data: Partial<UpdateNilaiData>,
): Promise<Nilai> {
  try {
    // ✅ FIX: Use .maybeSingle() instead of .single()
    // maybeSingle() returns null if not found, doesn't error
    const { data: current, error: fetchError } = await supabase
      .from("nilai")
      .select("*")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId)
      .maybeSingle();

    // If error other than not found, throw it
    if (fetchError) throw handleError(fetchError);

    // ✅ FIX: Use optional chaining for null safety
    // current?.nilai_kuis will be null if current is null
    const merged = {
      nilai_kuis: data.nilai_kuis ?? current?.nilai_kuis ?? 0,
      nilai_tugas: data.nilai_tugas ?? current?.nilai_tugas ?? 0,
      nilai_uts: data.nilai_uts ?? current?.nilai_uts ?? 0,
      nilai_uas: data.nilai_uas ?? current?.nilai_uas ?? 0,
      nilai_praktikum: data.nilai_praktikum ?? current?.nilai_praktikum ?? 0,
      nilai_kehadiran: data.nilai_kehadiran ?? current?.nilai_kehadiran ?? 0,
    };

    // Calculate nilai_akhir and nilai_huruf
    const nilaiAkhir = calculateNilaiAkhir(
      merged.nilai_kuis,
      merged.nilai_tugas,
      merged.nilai_uts,
      merged.nilai_uas,
      merged.nilai_praktikum,
      merged.nilai_kehadiran,
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    // ✅ FIX: Include mahasiswa_id and kelas_id in data for UPSERT
    const upsertData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      ...data,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
      updated_at: new Date().toISOString(),
    };

    // ✅ FIX: Use .upsert() instead of .update()
    // UPSERT = UPDATE if exists, INSERT if not
    const { data: upserted, error: upsertError } = await supabase
      .from("nilai")
      .upsert(upsertData, {
        onConflict: "mahasiswa_id,kelas_id",
      })
      .select()
      .single();

    if (upsertError) throw handleError(upsertError);

    return upserted as Nilai;
  } catch (error) {
    console.error("updateNilai error:", error);
    throw handleError(error);
  }
}

export const updateNilai = requirePermission("manage:nilai", updateNilaiImpl);

/**
 * Batch update nilai for multiple students
 */
async function batchUpdateNilaiImpl(
  batchData: BatchUpdateNilaiData,
): Promise<Nilai[]> {
  try {
    const results: Nilai[] = [];

    for (const item of batchData.nilai_list) {
      try {
        const updated = await updateNilaiImpl(
          item.mahasiswa_id,
          batchData.kelas_id,
          item,
        );
        results.push(updated);
      } catch (error) {
        console.error("batchUpdateNilai - single update failed:", error);
        // Continue with other updates even if one fails
      }
    }

    return results;
  } catch (error) {
    console.error("batchUpdateNilai error:", error);
    throw handleError(error);
  }
}

export const batchUpdateNilai = requirePermission(
  "manage:nilai",
  batchUpdateNilaiImpl,
);

/**
 * Delete nilai
 */
async function deleteNilaiImpl(id: string): Promise<void> {
  try {
    await remove("nilai", id);
  } catch (error) {
    console.error("deleteNilai error:", error);
    throw handleError(error);
  }
}

export const deleteNilai = requirePermission("manage:nilai", deleteNilaiImpl);

// ============================================================================
// AUTO-SYNC NILAI PRAKTIKUM FROM TUGAS PRAKTIKUM
// ============================================================================

/**
 * Sync nilai_praktikum from attempt_kuis (tugas praktikum)
 * Calculate average of all graded attempts in the same kelas
 *
 * @param mahasiswaId - ID mahasiswa
 * @param kelasId - ID kelas
 * @returns Updated nilai record
 */
async function syncNilaiPraktikumFromAttemptsImpl(
  mahasiswaId: string,
  kelasId: string,
): Promise<Nilai> {
  try {
    // Get all graded attempts for this mahasiswa in this kelas
    const { data: attempts, error: attemptsError } = await supabase
      .from("attempt_kuis")
      .select(
        `
        id,
        nilai_akhir,
        status,
        kuis:kuis_id (
          id,
          kelas_id
        )
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .eq("status", "graded") // Only count graded attempts
      .not("nilai_akhir", "is", null); // Ensure nilai_akhir exists

    if (attemptsError) throw handleError(attemptsError);

    // Filter attempts by kelas_id (since join doesn't support eq on nested field)
    const kelasAttempts = (attempts || []).filter(
      (attempt: any) => attempt.kuis?.kelas_id === kelasId,
    );

    // Calculate average nilai_praktikum
    let nilaiPraktikum = 0;
    if (kelasAttempts.length > 0) {
      const totalNilai = kelasAttempts.reduce(
        (sum: number, attempt: any) => sum + (attempt.nilai_akhir || 0),
        0,
      );
      nilaiPraktikum = totalNilai / kelasAttempts.length;
      // Round to 2 decimal places
      nilaiPraktikum = Math.round(nilaiPraktikum * 100) / 100;
    }

    // Update nilai record with auto-synced nilai_praktikum
    const updated = await updateNilaiImpl(mahasiswaId, kelasId, {
      nilai_praktikum: nilaiPraktikum,
    });

    console.log(
      `[AUTO-SYNC] Nilai praktikum synced for mahasiswa ${mahasiswaId} in kelas ${kelasId}: ${nilaiPraktikum} (from ${kelasAttempts.length} attempts)`,
    );

    return updated;
  } catch (error) {
    console.error("syncNilaiPraktikumFromAttempts error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only system/dosen can trigger this
export const syncNilaiPraktikumFromAttempts = requirePermission(
  "manage:nilai",
  syncNilaiPraktikumFromAttemptsImpl,
);

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Get nilai summary for a kelas
 */
export async function getNilaiSummary(kelasId: string): Promise<NilaiSummary> {
  try {
    // Get total mahasiswa in kelas
    const { count: totalMahasiswa, error: countError } = await supabase
      .from("kelas_mahasiswa")
      .select("*", { count: "exact", head: true })
      .eq("kelas_id", kelasId);

    if (countError) throw handleError(countError);

    // Get nilai for this kelas
    const { data: nilaiData, error: nilaiError } = await supabase
      .from("nilai")
      .select("nilai_akhir")
      .eq("kelas_id", kelasId);

    if (nilaiError) throw handleError(nilaiError);

    const sudahDinilai = nilaiData?.length || 0;
    const belumDinilai = (totalMahasiswa || 0) - sudahDinilai;

    // Calculate average
    const nilaiList =
      nilaiData?.map((n) => n.nilai_akhir).filter((n) => n !== null) || [];
    const rataRata =
      nilaiList.length > 0
        ? nilaiList.reduce((sum, n) => sum + (n || 0), 0) / nilaiList.length
        : 0;

    return {
      total_mahasiswa: totalMahasiswa || 0,
      sudah_dinilai: sudahDinilai,
      belum_dinilai: belumDinilai,
      rata_rata: Math.round(rataRata * 100) / 100,
    };
  } catch (error) {
    console.error("getNilaiSummary error:", error);
    throw handleError(error);
  }
}

/**
 * Get mahasiswa list for grading in a kelas
 * Returns all mahasiswa in the kelas with their current nilai (if exists)
 */
export async function getMahasiswaForGrading(
  kelasId: string,
): Promise<NilaiWithMahasiswa[]> {
  try {
    // Get all mahasiswa enrolled in the kelas
    const { data: enrollment, error: enrollError } = await supabase
      .from("kelas_mahasiswa")
      .select(
        `
        mahasiswa:mahasiswa_id (
          id,
          nim,
          user_id,
          user:user_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("kelas_id", kelasId);

    if (enrollError) throw handleError(enrollError);

    if (!enrollment || enrollment.length === 0) {
      return [];
    }

    const mahasiswaIds = enrollment.map((e) => e.mahasiswa.id);

    // Get existing nilai for these mahasiswa
    const { data: nilaiData, error: nilaiError } = await supabase
      .from("nilai")
      .select("*")
      .eq("kelas_id", kelasId)
      .in("mahasiswa_id", mahasiswaIds);

    if (nilaiError) throw handleError(nilaiError);

    // Create a map of mahasiswa_id to nilai
    const nilaiMap = new Map((nilaiData || []).map((n) => [n.mahasiswa_id, n]));

    // Combine enrollment with nilai
    const result: NilaiWithMahasiswa[] = enrollment.map((e) => {
      const existingNilai = nilaiMap.get(e.mahasiswa.id);

      return {
        id: existingNilai?.id || "",
        mahasiswa_id: e.mahasiswa.id,
        kelas_id: kelasId,
        nilai_kuis: existingNilai?.nilai_kuis || 0,
        nilai_tugas: existingNilai?.nilai_tugas || 0,
        nilai_uts: existingNilai?.nilai_uts || 0,
        nilai_uas: existingNilai?.nilai_uas || 0,
        nilai_praktikum: existingNilai?.nilai_praktikum || 0,
        nilai_kehadiran: existingNilai?.nilai_kehadiran || 0,
        nilai_akhir: existingNilai?.nilai_akhir || null,
        nilai_huruf: existingNilai?.nilai_huruf || null,
        keterangan: existingNilai?.keterangan || null,
        created_at: existingNilai?.created_at || null,
        updated_at: existingNilai?.updated_at || null,
        mahasiswa: e.mahasiswa,
      } as NilaiWithMahasiswa;
    });

    return result;
  } catch (error) {
    console.error("getMahasiswaForGrading error:", error);
    throw handleError(error);
  }
}

// Note: withApiResponse wrappers removed due to type conflicts
// Use the direct functions instead
