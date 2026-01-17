/**
 * Mata Kuliah API
 * API functions for mata kuliah (course) management
 */

import {
  query,
  queryWithFilters,
  getById,
  getPaginated,
  insert,
  update,
  remove,
  count,
  withApiResponse,
} from "./base.api";
import type {
  MataKuliah,
  MataKuliahWithStats,
  MataKuliahWithRelations,
  CreateMataKuliahData,
  UpdateMataKuliahData,
  MataKuliahQueryParams,
  MataKuliahStats,
  MataKuliahFilters,
} from "@/types/mata-kuliah.types";
import type { PaginatedResponse } from "@/types/api.types";
import { handleError, logError } from "@/lib/utils/errors";
import {
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/middleware";

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get all mata kuliah with optional filters
 * @param filters - Filter options
 * @returns Array of mata kuliah
 */
export async function getMataKuliah(
  filters?: MataKuliahFilters,
): Promise<MataKuliah[]> {
  try {
    const filterConditions = [];

    // Apply filters
    if (filters?.program_studi) {
      filterConditions.push({
        column: "program_studi",
        operator: "eq" as const,
        value: filters.program_studi,
      });
    }

    if (filters?.semester) {
      filterConditions.push({
        column: "semester",
        operator: "eq" as const,
        value: filters.semester,
      });
    }

    if (filters?.sks) {
      filterConditions.push({
        column: "sks",
        operator: "eq" as const,
        value: filters.sks,
      });
    }

    // Search filter
    if (filters?.search) {
      filterConditions.push({
        column: "nama_mk",
        operator: "ilike" as const,
        value: `%${filters.search}%`,
      });
    }

    const options = {
      order: {
        column: filters?.sortBy || "kode_mk",
        ascending: filters?.sortOrder === "asc",
      },
    };

    const data =
      filterConditions.length > 0
        ? await queryWithFilters<MataKuliah>(
            "mata_kuliah",
            filterConditions,
            options,
          )
        : await query<MataKuliah>("mata_kuliah", options);

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getMataKuliah");
    throw apiError;
  }
}

/**
 * Get paginated mata kuliah
 * @param params - Query parameters with pagination
 * @returns Paginated response
 */
export async function getMataKuliahPaginated(
  params: MataKuliahQueryParams = {},
): Promise<PaginatedResponse<MataKuliah>> {
  try {
    return await getPaginated<MataKuliah>("mata_kuliah", params, {
      order: {
        column: params.sortBy || "kode_mk",
        ascending: params.sortOrder === "asc",
      },
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getMataKuliahPaginated");
    throw apiError;
  }
}

/**
 * Get mata kuliah by ID
 * @param id - Mata kuliah ID
 * @returns Mata kuliah record
 */
export async function getMataKuliahById(id: string): Promise<MataKuliah> {
  try {
    return await getById<MataKuliah>("mata_kuliah", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMataKuliahById:${id}`);
    throw apiError;
  }
}

/**
 * Get mata kuliah with statistics
 * @param id - Mata kuliah ID
 * @returns Mata kuliah with stats
 */
export async function getMataKuliahWithStats(
  id: string,
): Promise<MataKuliahWithStats> {
  try {
    // Get base mata kuliah data
    const mataKuliah = await getById<MataKuliah>("mata_kuliah", id);

    // Get kelas count
    const kelasCount = await count("kelas", [
      { column: "mata_kuliah_id", operator: "eq", value: id },
    ]);

    // Get total mahasiswa (through kelas_mahasiswa)
    const kelasList = await queryWithFilters("kelas", [
      { column: "mata_kuliah_id", operator: "eq", value: id },
    ]);

    let totalMahasiswa = 0;
    for (const kelas of kelasList) {
      const mahasiswaCount = await count("kelas_mahasiswa", [
        { column: "kelas_id", operator: "eq", value: kelas.id },
      ]);
      totalMahasiswa += mahasiswaCount;
    }

    // Get dosen count (unique dosen teaching this mata kuliah)
    const dosenList = await queryWithFilters("kelas", [
      { column: "mata_kuliah_id", operator: "eq", value: id },
    ]);
    const uniqueDosenIds = new Set(dosenList.map((k: any) => k.dosen_id));

    return {
      ...mataKuliah,
      total_kelas: kelasCount,
      total_mahasiswa: totalMahasiswa,
      total_dosen: uniqueDosenIds.size,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMataKuliahWithStats:${id}`);
    throw apiError;
  }
}

/**
 * Get mata kuliah with relations (kelas, dosen)
 * @param id - Mata kuliah ID
 * @returns Mata kuliah with relations
 */
export async function getMataKuliahWithRelations(
  id: string,
): Promise<MataKuliahWithRelations> {
  try {
    const mataKuliah = await getById<MataKuliah>("mata_kuliah", id);

    // Get kelas with mahasiswa count
    const kelasList = await query("kelas", {
      select: "id, kode_kelas, nama_kelas, dosen_id",
      order: { column: "kode_kelas", ascending: true },
    });

    // Filter kelas for this mata kuliah
    const filteredKelas = kelasList.filter((k: any) => k.mata_kuliah_id === id);

    // Get mahasiswa count for each kelas
    const kelasWithCount = await Promise.all(
      filteredKelas.map(async (kelas: any) => {
        const mahasiswaCount = await count("kelas_mahasiswa", [
          { column: "kelas_id", operator: "eq", value: kelas.id },
        ]);
        return {
          id: kelas.id,
          kode_kelas: kelas.kode_kelas,
          nama_kelas: kelas.nama_kelas,
          jumlah_mahasiswa: mahasiswaCount,
        };
      }),
    );

    // Get unique dosen
    const dosenIds = [...new Set(filteredKelas.map((k: any) => k.dosen_id))];
    const dosenList =
      dosenIds.length > 0
        ? await queryWithFilters("dosen", [
            { column: "id", operator: "in", value: dosenIds },
          ])
        : [];

    const dosenData = dosenList.map((d: any) => ({
      id: d.id,
      nip: d.nip,
      nama: d.nama || d.full_name,
    }));

    return {
      ...mataKuliah,
      kelas: kelasWithCount,
      dosen: dosenData,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getMataKuliahWithRelations:${id}`);
    throw apiError;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create new mata kuliah
 * @param data - Mata kuliah data
 * @returns Created mata kuliah
 */
async function createMataKuliahImpl(
  data: CreateMataKuliahData,
): Promise<MataKuliah> {
  try {
    // Check if kode_mk already exists
    const existing = await queryWithFilters("mata_kuliah", [
      { column: "kode_mk", operator: "eq", value: data.kode_mk },
    ]);

    if (existing.length > 0) {
      throw new Error(`Mata kuliah dengan kode ${data.kode_mk} sudah ada`);
    }

    return await insert<MataKuliah>("mata_kuliah", data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "createMataKuliah");
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:mata_kuliah permission
export const createMataKuliah = requirePermission(
  "manage:mata_kuliah",
  createMataKuliahImpl,
);

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update mata kuliah
 * @param id - Mata kuliah ID
 * @param data - Update data
 * @returns Updated mata kuliah
 */
async function updateMataKuliahImpl(
  id: string,
  data: UpdateMataKuliahData,
): Promise<MataKuliah> {
  try {
    // If kode_mk is being updated, check uniqueness
    if (data.kode_mk) {
      const existing = await queryWithFilters("mata_kuliah", [
        { column: "kode_mk", operator: "eq", value: data.kode_mk },
      ]);

      // Check if kode_mk exists for different record
      if (existing.length > 0 && existing[0].id !== id) {
        throw new Error(`Mata kuliah dengan kode ${data.kode_mk} sudah ada`);
      }
    }

    return await update<MataKuliah>("mata_kuliah", id, data);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateMataKuliah:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:mata_kuliah permission
export const updateMataKuliah = requirePermission(
  "manage:mata_kuliah",
  updateMataKuliahImpl,
);

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete mata kuliah
 * @param id - Mata kuliah ID
 * @param options - Delete options
 *   - detach: Set mata_kuliah_id to NULL in related kelas (default: true)
 *   - cascade: Delete all related kelas (destructive)
 * @returns Success status
 */
async function deleteMataKuliahImpl(
  id: string,
  options: { detach?: boolean; cascade?: boolean } = { detach: true },
): Promise<boolean> {
  try {
    // Check if mata kuliah has kelas
    const kelasCount = await count("kelas", [
      { column: "mata_kuliah_id", operator: "eq", value: id },
    ]);

    if (kelasCount > 0) {
      // Default: DETACH (set mata_kuliah_id to NULL)
      if (options.detach !== false) {
        logError(
          {
            message: `Detaching ${kelasCount} kelas from mata kuliah ${id}`,
          } as any,
          "deleteMataKuliah:detach",
        );

        // Get all related kelas
        const kelasList = await queryWithFilters("kelas", [
          { column: "mata_kuliah_id", operator: "eq", value: id },
        ]);

        // Set mata_kuliah_id to NULL for each kelas
        // This allows kelas to exist independently
        for (const kelas of kelasList) {
          await update("kelas", kelas.id, {
            mata_kuliah_id: null,
          });
        }

        logError(
          {
            message: `Successfully detached ${kelasCount} kelas. Kelas will continue to exist without mata kuliah reference.`,
          } as any,
          "deleteMataKuliah:detach",
        );
      } else if (options.cascade) {
        // CASCADE DELETE: Delete all related kelas (destructive!)
        logError(
          {
            message: `CASCADE DELETE: Deleting ${kelasCount} kelas for mata kuliah ${id}`,
          } as any,
          "deleteMataKuliah:cascade",
        );

        const kelasList = await queryWithFilters("kelas", [
          { column: "mata_kuliah_id", operator: "eq", value: id },
        ]);

        for (const kelas of kelasList) {
          await remove("kelas", kelas.id);
        }

        logError(
          { message: `Cascade deleted ${kelasCount} kelas` } as any,
          "deleteMataKuliah:cascade",
        );
      } else {
        // Neither detach nor cascade - prevent deletion
        throw new Error(
          `Cannot delete mata kuliah. Found ${kelasCount} active kelas. Please choose to either detach kelas or cascade delete.`,
        );
      }
    }

    // Now safe to delete mata kuliah
    return await remove("mata_kuliah", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteMataKuliah:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:mata_kuliah permission
export const deleteMataKuliah = requirePermission(
  "manage:mata_kuliah",
  deleteMataKuliahImpl,
);

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get mata kuliah statistics
 * @returns Mata kuliah stats
 */
export async function getMataKuliahStats(): Promise<MataKuliahStats> {
  try {
    // Get all mata kuliah
    const allMataKuliah = await query<MataKuliah>("mata_kuliah");

    // Calculate stats
    const total = allMataKuliah.length;

    const by_program_studi: Record<string, number> = {};
    const by_semester: Record<string, number> = {};
    const by_sks: Record<string, number> = {};

    allMataKuliah.forEach((mk) => {
      // By program studi
      by_program_studi[mk.program_studi] =
        (by_program_studi[mk.program_studi] || 0) + 1;

      // By semester
      by_semester[String(mk.semester)] =
        (by_semester[String(mk.semester)] || 0) + 1;

      // By SKS
      by_sks[String(mk.sks)] = (by_sks[String(mk.sks)] || 0) + 1;
    });

    // Calculate average mahasiswa per mata kuliah
    let totalMahasiswa = 0;
    for (const mk of allMataKuliah) {
      const kelasList = await queryWithFilters("kelas", [
        { column: "mata_kuliah_id", operator: "eq", value: mk.id },
      ]);

      for (const kelas of kelasList) {
        const mahasiswaCount = await count("kelas_mahasiswa", [
          { column: "kelas_id", operator: "eq", value: kelas.id },
        ]);
        totalMahasiswa += mahasiswaCount;
      }
    }

    const avg_mahasiswa_per_mk = total > 0 ? totalMahasiswa / total : 0;

    return {
      total,
      by_program_studi,
      by_semester,
      by_sks,
      avg_mahasiswa_per_mk: Math.round(avg_mahasiswa_per_mk * 100) / 100,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getMataKuliahStats");
    throw apiError;
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if kode_mk exists
 * @param kode_mk - Kode mata kuliah
 * @param excludeId - ID to exclude from check (for updates)
 * @returns Boolean indicating existence
 */
export async function checkKodeMKExists(
  kode_mk: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const existing = await queryWithFilters("mata_kuliah", [
      { column: "kode_mk", operator: "eq", value: kode_mk },
    ]);

    if (existing.length === 0) {
      return false;
    }

    // If excludeId provided, check if it's a different record
    if (excludeId) {
      return existing[0].id !== excludeId;
    }

    return true;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "checkKodeMKExists");
    return false;
  }
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Wrapped API functions with standard response format
 */
export const mataKuliahApi = {
  getAll: (filters?: MataKuliahFilters) =>
    withApiResponse(() => getMataKuliah(filters)),

  getPaginated: (params?: MataKuliahQueryParams) =>
    withApiResponse(() => getMataKuliahPaginated(params)),

  getById: (id: string) => withApiResponse(() => getMataKuliahById(id)),

  getWithStats: (id: string) =>
    withApiResponse(() => getMataKuliahWithStats(id)),

  getWithRelations: (id: string) =>
    withApiResponse(() => getMataKuliahWithRelations(id)),

  create: (data: CreateMataKuliahData) =>
    withApiResponse(() => createMataKuliah(data)),

  update: (id: string, data: UpdateMataKuliahData) =>
    withApiResponse(() => updateMataKuliah(id, data)),

  // ✅ FIXED: Correct parameter type for delete
  delete: (id: string, options?: { detach?: boolean; cascade?: boolean }) =>
    withApiResponse(() => deleteMataKuliah(id, options)),

  getStats: () => withApiResponse(() => getMataKuliahStats()),

  checkKodeExists: (kode_mk: string, excludeId?: string) =>
    withApiResponse(() => checkKodeMKExists(kode_mk, excludeId)),
};
