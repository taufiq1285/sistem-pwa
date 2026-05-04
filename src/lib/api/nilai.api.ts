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
import type { BobotNilai } from "@/types/kelas.types";
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
  mata_kuliah_id?: string;
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
  mata_kuliah_id?: string; // Mata kuliah yang dipilih dosen
  dosen_id?: string | null; // Dosen yang menyimpan nilai
  bobot_nilai?: BobotNilai | null;
  nilai_list: BatchUpdateNilaiItem[];
}

export interface NilaiHistoryByDosenItem {
  kelas_id: string;
  mata_kuliah_id: string;
  nama_kelas: string;
  kode_kelas?: string | null;
  nama_mk: string;
  kode_mk?: string | null;
  total_nilai: number;
  rata_rata: number;
  terakhir_update: string | null;
}

interface NilaiLookupContext {
  mahasiswaId: string;
  kelasId: string;
  mataKuliahId?: string | null;
}

async function findExistingNilaiRecord({
  mahasiswaId,
  kelasId,
  mataKuliahId,
}: NilaiLookupContext): Promise<Nilai | null> {
  const baseQuery = (supabase as any)
    .from("nilai")
    .select("*")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("kelas_id", kelasId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (mataKuliahId) {
    const { data: exactMatches, error: exactError } = await baseQuery.eq(
      "mata_kuliah_id",
      mataKuliahId,
    );

    if (exactError) throw handleError(exactError);
    const exactMatch = ((exactMatches as Nilai[] | null) || [])[0];
    if (exactMatch) {
      return exactMatch as Nilai;
    }

    const { data: legacyMatches, error: legacyError } = await (supabase as any)
      .from("nilai")
      .select("*")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId)
      .is("mata_kuliah_id", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (legacyError) throw handleError(legacyError);
    const legacyMatch = ((legacyMatches as Nilai[] | null) || [])[0];
    return (legacyMatch as Nilai | null) || null;
  }

  const { data, error } = await baseQuery;
  if (error) throw handleError(error);

  return (((data as Nilai[] | null) || [])[0] as Nilai | null) || null;
}

async function findAnyNilaiRecordForMahasiswaKelas(
  mahasiswaId: string,
  kelasId: string,
): Promise<Nilai | null> {
  const { data, error } = await (supabase as any)
    .from("nilai")
    .select("*")
    .eq("mahasiswa_id", mahasiswaId)
    .eq("kelas_id", kelasId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw handleError(error);

  return ((data as Nilai[] | null) || [])[0] || null;
}

function pickNilaiRecord(
  nilaiList: Nilai[],
  mahasiswaId: string,
  mataKuliahId?: string | null,
): Nilai | undefined {
  const kandidat = nilaiList.filter(
    (item) => item.mahasiswa_id === mahasiswaId,
  );

  if (mataKuliahId) {
    return (
      kandidat.find((item) => item.mata_kuliah_id === mataKuliahId) ||
      kandidat.find((item) => !item.mata_kuliah_id)
    );
  }

  return kandidat[0];
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

    if (filters?.mata_kuliah_id) {
      filterConditions.push({
        column: "mata_kuliah_id",
        operator: "eq" as const,
        value: filters.mata_kuliah_id,
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
            id,
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
  mataKuliahId?: string,
): Promise<NilaiWithMahasiswa[]> {
  try {
    let query = (supabase as any)
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
      .eq("kelas_id", kelasId);

    if (mataKuliahId) {
      query = query.eq("mata_kuliah_id", mataKuliahId);
    }

    const { data, error } = await query.order("mahasiswa(user(full_name))", {
      ascending: true,
    });

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
          is_active,
          mata_kuliah:mata_kuliah_id (
            id,
            nama_mk,
            kode_mk,
            sks,
            is_active
          )
        ),
        dosen:dosen_id (
          id,
          nip,
          user:user_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("created_at", { ascending: false });

    if (error) throw handleError(error);

    const nilaiList = ((data || []) as unknown as Nilai[]) || [];
    if (nilaiList.length === 0) {
      return [];
    }

    const kelasIds = Array.from(
      new Set(
        nilaiList
          .map((item) => item.kelas?.id || item.kelas_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const missingMataKuliahKelasIds = Array.from(
      new Set(
        nilaiList
          .filter((item) => !item.mata_kuliah_id)
          .map((item) => item.kelas?.id || item.kelas_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const jadwalMataKuliahMap = new Map<string, string>();
    if (missingMataKuliahKelasIds.length > 0) {
      const { data: jadwalData } = await (supabase as any)
        .from("jadwal_praktikum")
        .select("kelas_id, mata_kuliah_id, tanggal_praktikum")
        .in("kelas_id", kelasIds)
        .not("mata_kuliah_id", "is", null)
        .eq("is_active", true)
        .order("tanggal_praktikum", { ascending: false });

      for (const item of jadwalData || []) {
        if (
          item?.kelas_id &&
          item?.mata_kuliah_id &&
          !jadwalMataKuliahMap.has(item.kelas_id)
        ) {
          jadwalMataKuliahMap.set(item.kelas_id, item.mata_kuliah_id);
        }
      }
    }

    const mataKuliahIds = Array.from(
      new Set([
        ...nilaiList
          .map((item) => item.mata_kuliah_id)
          .filter((value): value is string => Boolean(value)),
        ...missingMataKuliahKelasIds
          .map((kelasId) => jadwalMataKuliahMap.get(kelasId))
          .filter((value): value is string => Boolean(value)),
      ]),
    );

    if (mataKuliahIds.length === 0) {
      return nilaiList;
    }

    const { data: mataKuliahData } = await supabase
      .from("mata_kuliah")
      .select("id, nama_mk, kode_mk, sks, is_active")
      .in("id", mataKuliahIds);

    const mataKuliahMap = new Map(
      (mataKuliahData || []).map((item) => [item.id, item]),
    );

    return nilaiList.map((item) => {
      const kelasId = item.kelas?.id || item.kelas_id;
      const mataKuliahId =
        item.mata_kuliah_id ||
        (kelasId ? jadwalMataKuliahMap.get(kelasId) : null);
      const fallbackMataKuliah = mataKuliahId
        ? mataKuliahMap.get(mataKuliahId)
        : null;

      if (!item.kelas || !fallbackMataKuliah) {
        return item;
      }

      return {
        ...item,
        kelas: {
          ...item.kelas,
          // Nilai dosen disimpan per kombinasi kelas + mata kuliah. Karena
          // kelas bisa dipakai untuk banyak mata kuliah, label di mahasiswa
          // harus mengikuti nilai.mata_kuliah_id, bukan mata kuliah bawaan kelas.
          mata_kuliah: {
            id: fallbackMataKuliah.id,
            nama_mk: fallbackMataKuliah.nama_mk,
            kode_mk: fallbackMataKuliah.kode_mk,
            sks: fallbackMataKuliah.sks,
            is_active: fallbackMataKuliah.is_active,
          },
        },
      };
    });
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
  mataKuliahId?: string | null,
): Promise<Nilai> {
  try {
    const existing = await findExistingNilaiRecord({
      mahasiswaId,
      kelasId,
      mataKuliahId,
    });

    if (existing) {
      return existing as Nilai;
    }

    // Create new nilai if doesn't exist
    const newNilai: CreateNilaiData = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      mata_kuliah_id: mataKuliahId || null,
      dosen_id: null,
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
      data.bobot_nilai,
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    const { bobot_nilai: _createBobotNilai, ...createPayload } = data;

    const nilaiData = {
      ...createPayload,
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
    const resolvedMataKuliahId = data.mata_kuliah_id;
    const current = await findExistingNilaiRecord({
      mahasiswaId,
      kelasId,
      mataKuliahId: resolvedMataKuliahId,
    });

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
      data.bobot_nilai,
    );

    const nilaiHuruf = getNilaiHuruf(nilaiAkhir);

    const { bobot_nilai: _updateBobotNilai, ...persistedData } = data;

    const payload = {
      mahasiswa_id: mahasiswaId,
      kelas_id: kelasId,
      mata_kuliah_id: resolvedMataKuliahId ?? current?.mata_kuliah_id ?? null,
      dosen_id: data.dosen_id ?? current?.dosen_id ?? null,
      ...persistedData,
      nilai_akhir: nilaiAkhir,
      nilai_huruf: nilaiHuruf,
      updated_at: new Date().toISOString(),
    };

    const isUpdate = Boolean(current?.id);
    const query = isUpdate
      ? (supabase as any).from("nilai").update(payload).eq("id", current.id)
      : (supabase as any).from("nilai").insert(payload);

    let saved;
    let saveError;
    if (isUpdate) {
      const result = await query.select().maybeSingle();
      saved = result.data;
      saveError = result.error;
    } else {
      const result = await query.select().maybeSingle();
      saved = result.data ?? null;
      saveError = result.error;
    }

    if (saveError) {
      if ((saveError as any)?.code === "23505" && !isUpdate) {
        const fallbackCurrent =
          (await findExistingNilaiRecord({
            mahasiswaId,
            kelasId,
            mataKuliahId: resolvedMataKuliahId,
          })) ||
          (await findAnyNilaiRecordForMahasiswaKelas(mahasiswaId, kelasId));

        if (fallbackCurrent?.id) {
          const retryPayload = {
            ...payload,
            mata_kuliah_id:
              resolvedMataKuliahId ?? fallbackCurrent.mata_kuliah_id ?? null,
          };

          const retryResult = await (supabase as any)
            .from("nilai")
            .update(retryPayload)
            .eq("id", fallbackCurrent.id)
            .select()
            .maybeSingle();

          if (retryResult.error) {
            throw handleError(retryResult.error);
          }

          if (retryResult.data) {
            return retryResult.data as Nilai;
          }
        }
      }

      throw handleError(saveError);
    }

    // If insert returned nothing, the RLS blocked the insert
    if (!isUpdate && !saved) {
      throw new Error(
        "Gagal menyimpan nilai - akses ditolak atau mahasiswa tidak ditemukan di kelas ini",
      );
    }

    if (!saved) {
      throw new Error("Gagal menyimpan nilai - data tidak dikembalikan server");
    }

    return saved as Nilai;
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
    const failures: Array<{ mahasiswa_id: string; error: unknown }> = [];

    for (const item of batchData.nilai_list) {
      try {
        const itemWithMK = {
          ...item,
          mata_kuliah_id: batchData.mata_kuliah_id, // Include mata kuliah
          dosen_id: batchData.dosen_id ?? null,
          bobot_nilai: batchData.bobot_nilai ?? null,
        };
        const updated = await updateNilaiImpl(
          item.mahasiswa_id,
          batchData.kelas_id,
          itemWithMK,
        );
        results.push(updated);
      } catch (error) {
        console.error("batchUpdateNilai - single update failed:", error);
        failures.push({
          mahasiswa_id: item.mahasiswa_id,
          error,
        });
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `${failures.length} dari ${batchData.nilai_list.length} nilai gagal tersimpan. Periksa koneksi, struktur tabel nilai, atau akses Supabase.`,
      );
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

export async function getNilaiHistoryByDosen(
  dosenId: string,
): Promise<NilaiHistoryByDosenItem[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("nilai")
      .select(
        `
        id,
        kelas_id,
        mata_kuliah_id,
        nilai_akhir,
        updated_at,
        kelas:kelas_id (
          id,
          nama_kelas,
          kode_kelas
        ),
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk
        )
      `,
      )
      .eq("dosen_id", dosenId)
      .not("mata_kuliah_id", "is", null)
      .order("updated_at", { ascending: false });

    if (error) throw handleError(error);

    const grouped = new Map<
      string,
      NilaiHistoryByDosenItem & { total: number }
    >();

    for (const item of data || []) {
      if (!item?.kelas_id || !item?.mata_kuliah_id) continue;

      const key = `${item.kelas_id}-${item.mata_kuliah_id}`;
      const existing = grouped.get(key);
      const nilaiAkhir = Number(item.nilai_akhir ?? 0);
      const updatedAt = item.updated_at || null;

      if (existing) {
        existing.total_nilai += 1;
        existing.total += nilaiAkhir;
        existing.rata_rata =
          Math.round((existing.total / existing.total_nilai) * 100) / 100;
        if (
          updatedAt &&
          (!existing.terakhir_update ||
            new Date(updatedAt) > new Date(existing.terakhir_update))
        ) {
          existing.terakhir_update = updatedAt;
        }
        continue;
      }

      grouped.set(key, {
        kelas_id: item.kelas_id,
        mata_kuliah_id: item.mata_kuliah_id,
        nama_kelas: item.kelas?.nama_kelas || "Kelas tidak diketahui",
        kode_kelas: item.kelas?.kode_kelas || null,
        nama_mk: item.mata_kuliah?.nama_mk || "Mata kuliah tidak diketahui",
        kode_mk: item.mata_kuliah?.kode_mk || null,
        total_nilai: 1,
        total: nilaiAkhir,
        rata_rata: nilaiAkhir,
        terakhir_update: updatedAt,
      });
    }

    return Array.from(grouped.values())
      .map(({ total: _total, ...item }) => item)
      .sort((a, b) => {
        const aTime = a.terakhir_update
          ? new Date(a.terakhir_update).getTime()
          : 0;
        const bTime = b.terakhir_update
          ? new Date(b.terakhir_update).getTime()
          : 0;
        return bTime - aTime;
      });
  } catch (error) {
    console.error("getNilaiHistoryByDosen error:", error);
    throw handleError(error);
  }
}

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
  mataKuliahId?: string | null,
): Promise<Nilai> {
  try {
    // Get all graded attempts for this mahasiswa in this kelas
    const { data: attempts, error: attemptsError } = await supabase
      .from("attempt_kuis")
      .select(
        `
        id,
        total_score,
        total_poin,
        percentage,
        status,
        kuis:kuis_id (
          id,
          kelas_id,
          mata_kuliah_id
        )
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .in("status", ["graded", "completed"] as any); // Support both status values

    if (attemptsError) throw handleError(attemptsError);

    // Filter attempts by kelas_id (since join doesn't support eq on nested field)
    const kelasAttempts = (attempts || []).filter((attempt: any) => {
      if (attempt.kuis?.kelas_id !== kelasId) {
        return false;
      }

      if (!mataKuliahId) {
        return (
          attempt.total_score != null ||
          attempt.total_poin != null ||
          attempt.percentage != null
        );
      }

      return (
        (!attempt.kuis?.mata_kuliah_id ||
          attempt.kuis.mata_kuliah_id === mataKuliahId) &&
        (attempt.total_score != null ||
          attempt.total_poin != null ||
          attempt.percentage != null)
      );
    });

    // Calculate average nilai_praktikum
    let nilaiPraktikum = 0;
    if (kelasAttempts.length > 0) {
      const totalNilai = kelasAttempts.reduce(
        (sum: number, attempt: any) =>
          sum +
          (attempt.total_score ??
            attempt.total_poin ??
            attempt.percentage ??
            0),
        0,
      );
      nilaiPraktikum = totalNilai / kelasAttempts.length;
      // Round to 2 decimal places
      nilaiPraktikum = Math.round(nilaiPraktikum * 100) / 100;
    }

    // Update nilai record with auto-synced nilai_praktikum
    const updated = await updateNilaiImpl(mahasiswaId, kelasId, {
      mata_kuliah_id: mataKuliahId,
      nilai_praktikum: nilaiPraktikum,
    });

    console.log(
      `[AUTO-SYNC] Nilai praktikum synced for mahasiswa ${mahasiswaId} in kelas ${kelasId}${mataKuliahId ? ` mata kuliah ${mataKuliahId}` : ""}: ${nilaiPraktikum} (from ${kelasAttempts.length} attempts)`,
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

export async function getNilaiSummary(
  kelasId: string,
  mataKuliahId?: string,
): Promise<NilaiSummary> {
  try {
    // Get total mahasiswa in kelas
    const { count: totalMahasiswa, error: countError } = await supabase
      .from("kelas_mahasiswa")
      .select("*", { count: "exact", head: true })
      .eq("kelas_id", kelasId);

    if (countError) throw handleError(countError);

    // Get nilai for this kelas
    const { data: rawNilaiData, error: nilaiError } = await (supabase as any)
      .from("nilai")
      .select("nilai_akhir, mata_kuliah_id")
      .eq("kelas_id", kelasId);

    if (nilaiError) throw handleError(nilaiError);

    const nilaiData = mataKuliahId
      ? (
          (rawNilaiData || []) as Array<{
            nilai_akhir: number | null;
            mata_kuliah_id?: string | null;
          }>
        ).filter((item) => item.mata_kuliah_id === mataKuliahId)
      : rawNilaiData || [];

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
  mataKuliahId?: string,
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
    const { data: rawNilaiData, error: nilaiError } = await (supabase as any)
      .from("nilai")
      .select("*")
      .eq("kelas_id", kelasId)
      .in("mahasiswa_id", mahasiswaIds);

    if (nilaiError) throw handleError(nilaiError);

    const nilaiData =
      (mataKuliahId
        ? ((rawNilaiData || []) as Nilai[]).filter(
            (item) => item.mata_kuliah_id === mataKuliahId,
          )
        : (rawNilaiData as Nilai[] | null)) || [];

    // Create a map of mahasiswa_id to nilai
    // Combine enrollment with nilai
    const result: NilaiWithMahasiswa[] = enrollment.map((e) => {
      const existingNilai = pickNilaiRecord(
        nilaiData,
        e.mahasiswa.id,
        mataKuliahId,
      );

      return {
        id: existingNilai?.id || "",
        mahasiswa_id: e.mahasiswa.id,
        kelas_id: kelasId,
        mata_kuliah_id: existingNilai?.mata_kuliah_id ?? mataKuliahId ?? null,
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
