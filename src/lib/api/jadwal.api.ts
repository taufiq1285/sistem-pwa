/**
 * Jadwal API - Updated for Date-based Schedules
 * API functions for schedule management
 */

import {
  query,
  queryWithFilters,
  getById,
  insert,
  update,
  remove,
  withApiResponse,
} from "./base.api";
import type {
  Jadwal,
  CreateJadwalData,
  JadwalFilters,
  CalendarEvent,
} from "@/types/jadwal.types";
import { handleError, logError } from "@/lib/utils/errors";
import { format, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/middleware";
import { supabase } from "@/lib/supabase/client";
import { logger } from "@/lib/utils/logger";

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get all jadwal with optional filters
 * @param filters - Filter options
 * @returns Array of jadwal
 */
export async function getJadwal(filters?: JadwalFilters): Promise<Jadwal[]> {
  try {
    const filterConditions = [];

    // Apply filters
    if (filters?.kelas) {
      filterConditions.push({
        column: "kelas",
        operator: "eq" as const,
        value: filters.kelas,
      });
    }

    if (filters?.laboratorium_id) {
      filterConditions.push({
        column: "laboratorium_id",
        operator: "eq" as const,
        value: filters.laboratorium_id,
      });
    }

    if (filters?.hari) {
      filterConditions.push({
        column: "hari",
        operator: "eq" as const,
        value: filters.hari,
      });
    }

    if (filters?.is_active !== undefined) {
      filterConditions.push({
        column: "is_active",
        operator: "eq" as const,
        value: filters.is_active,
      });
    }

    const options = {
      select: `
        *,
        laboratorium:laboratorium_id (
          nama_lab,
          kode_lab,
          kapasitas
        )
      `,
      order: {
        column: "tanggal_praktikum",
        ascending: true,
      },
    };

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    const data =
      filterConditions.length > 0
        ? await queryWithFilters<Jadwal>(
            "jadwal_praktikum",
            filterConditions,
            options,
          )
        : await query<Jadwal>("jadwal_praktikum", options);

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getJadwal");
    throw apiError;
  }
}

/**
 * Get jadwal by ID
 * @param id - Jadwal ID
 * @returns Jadwal record
 */
export async function getJadwalById(id: string): Promise<Jadwal> {
  try {
    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    return await getById<Jadwal>("jadwal_praktikum", id, {
      select: `
        *,
        laboratorium:laboratorium_id (*)
      `,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getJadwalById:${id}`);
    throw apiError;
  }
}

/**
 * Get jadwal by laboratorium
 * @param labId - Laboratorium ID
 * @returns Array of jadwal for that lab
 */
export async function getJadwalByLab(labId: string): Promise<Jadwal[]> {
  try {
    return await getJadwal({ laboratorium_id: labId, is_active: true });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `getJadwalByLab:${labId}`);
    throw apiError;
  }
}

/**
 * Helper: Parse time string (handles both HH:mm and HH:mm:ss formats)
 * @param timeStr - Time string from database
 * @param referenceDate - Reference date for parsing
 * @returns Parsed Date object
 */
function parseTimeString(timeStr: string, referenceDate: Date): Date {
  // Remove seconds if present (08:00:00 → 08:00)
  const timeWithoutSeconds = timeStr.substring(0, 5);

  // Parse with HH:mm format
  return parse(timeWithoutSeconds, "HH:mm", referenceDate);
}

/**
 * Get calendar events for a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of calendar events
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  try {
    // 🔍 DEBUG: Log parameter yang masuk
    console.log("🔍 getCalendarEvents called:", {
      startDate: format(startDate, "yyyy-MM-dd HH:mm:ss"),
      endDate: format(endDate, "yyyy-MM-dd HH:mm:ss"),
      startDateISO: startDate.toISOString(),
      endDateISO: endDate.toISOString(),
      startDateFormatted: format(startDate, "yyyy-MM-dd"),
      endDateFormatted: format(endDate, "yyyy-MM-dd"),
    });

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    // ✅ HYBRID APPROVAL: Only show approved jadwal in calendar
    const jadwalList = await queryWithFilters<Jadwal>(
      "jadwal_praktikum",
      [
        {
          column: "tanggal_praktikum",
          operator: "gte" as const,
          value: format(startDate, "yyyy-MM-dd"),
        },
        {
          column: "tanggal_praktikum",
          operator: "lte" as const,
          value: format(endDate, "yyyy-MM-dd"),
        },
        {
          column: "is_active",
          operator: "eq" as const,
          value: true,
        },
        {
          column: "status",
          operator: "eq" as const,
          value: "approved",
        },
      ],
      {
        select: `
        *,
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah (
            nama_mk
          )
        ),
        laboratorium:laboratorium_id (
          nama_lab,
          kode_lab,
          kapasitas
        )
      `,
      },
    );

    // 🔍 DEBUG: Log hasil query
    console.log("🔍 Query result:", {
      count: jadwalList.length,
      dates: jadwalList.map((j) => ({
        id: j.id,
        tanggal: j.tanggal_praktikum,
        kelas: j.kelas,
        jam: `${j.jam_mulai} - ${j.jam_selesai}`,
      })),
      fullData: jadwalList,
    });

    const events: CalendarEvent[] = [];

    jadwalList.forEach((j) => {
      try {
        // Skip if tanggal_praktikum is null
        if (!j.tanggal_praktikum) {
          console.warn("⚠️ Skipping jadwal with null tanggal_praktikum:", j.id);
          return;
        }

        // ✅ FIX: Parse tanggal dengan benar (timezone-safe)
        // Gunakan format YYYY-MM-DD langsung tanpa timezone conversion
        const [year, month, day] = j.tanggal_praktikum.split("-").map(Number);
        const date = new Date(year, month - 1, day); // Local date tanpa timezone issue

        // 🔍 DEBUG: Log setiap jadwal yang diproses
        console.log("🔍 Processing jadwal:", {
          id: j.id,
          kelas: j.kelas,
          tanggal_praktikum: j.tanggal_praktikum,
          parsed_date: date.toISOString(),
          parsed_date_local: date.toString(),
          jam_mulai: j.jam_mulai,
          jam_selesai: j.jam_selesai,
        });

        // Parse time strings and combine with the actual date
        const jamMulaiDate = parseTimeString(j.jam_mulai, date);
        const jamSelesaiDate = parseTimeString(j.jam_selesai, date);

        // 🔍 DEBUG: Log hasil parsing time
        console.log("🔍 Parsed times:", {
          id: j.id,
          jamMulaiDate: jamMulaiDate.toISOString(),
          jamSelesaiDate: jamSelesaiDate.toISOString(),
          isValid:
            !isNaN(jamMulaiDate.getTime()) && !isNaN(jamSelesaiDate.getTime()),
        });

        // Validate parsed dates
        if (isNaN(jamMulaiDate.getTime()) || isNaN(jamSelesaiDate.getTime())) {
          console.warn(
            "⚠️ Invalid time after parsing:",
            j.id,
            j.jam_mulai,
            j.jam_selesai,
          );
          return;
        }

        // FIX: Get kelas and mata_kuliah from relations (handle string | object)
        const kelasRelation =
          typeof j.kelas === "object" && j.kelas !== null ? j.kelas : undefined;
        const kelasNama = kelasRelation?.nama_kelas || "Kelas";
        const mataKuliahNama = kelasRelation?.mata_kuliah?.nama_mk || "";
        const labNama = j.laboratorium?.nama_lab || "Lab";

        // Build title with mata kuliah if available
        const title = mataKuliahNama
          ? `${mataKuliahNama} - ${kelasNama} - ${labNama}`
          : `${kelasNama} - ${labNama}`;

        const event = {
          id: j.id,
          title,
          start: jamMulaiDate.toISOString(),
          end: jamSelesaiDate.toISOString(),
          type: "class" as const,
          color: "#3b82f6",
          location: j.laboratorium?.nama_lab,
          description: j.topik ?? undefined,
          metadata: {
            jadwal_id: j.id,
            kelas_id: j.kelas_id ?? undefined,
            kelas_nama: kelasNama,
            mata_kuliah_nama: mataKuliahNama || undefined,
            laboratorium_id: j.laboratorium_id,
            topik: j.topik ?? undefined,
          },
        };

        events.push(event);

        // 🔍 DEBUG: Log event yang dibuat
        console.log("✅ Event created:", {
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
        });
      } catch (parseError) {
        console.warn("❌ Error parsing jadwal event:", j.id, parseError);
      }
    });

    console.log(
      `✅ Generated ${events.length} calendar events from ${jadwalList.length} jadwal`,
    );

    // 🔍 DEBUG: Log final events
    console.log("🔍 Final events:", events);

    return events;
  } catch (error) {
    console.error("❌ getCalendarEvents error:", error);
    const apiError = handleError(error);
    logError(apiError, "getCalendarEvents");
    throw apiError;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create new jadwal with date-based scheduling
 * @param data - Jadwal data
 * @returns Created jadwal
 */
async function createJadwalImpl(data: CreateJadwalData): Promise<Jadwal> {
  try {
    // Auto-compute hari from tanggal_praktikum
    const tanggalPraktikum =
      data.tanggal_praktikum instanceof Date
        ? data.tanggal_praktikum
        : new Date(data.tanggal_praktikum);

    // ✅ FIX ISSUE #6: Validate tanggal tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day

    const praktikumDate = new Date(tanggalPraktikum);
    praktikumDate.setHours(0, 0, 0, 0);

    if (praktikumDate < today) {
      throw new Error(
        `Tanggal praktikum tidak boleh di masa lalu. Tanggal yang dipilih: ${format(tanggalPraktikum, "dd MMM yyyy", { locale: localeId })}`,
      );
    }

    const hari = format(tanggalPraktikum, "EEEE", {
      locale: localeId,
    }).toLowerCase() as
      | "senin"
      | "selasa"
      | "rabu"
      | "kamis"
      | "jumat"
      | "sabtu"
      | "minggu";

    // Check for conflicts on the same date
    const hasConflict = await checkJadwalConflictByDate(
      data.laboratorium_id,
      tanggalPraktikum,
      data.jam_mulai,
      data.jam_selesai,
    );

    if (hasConflict) {
      throw new Error(
        `Jadwal bentrok! Lab sudah terpakai pada ${format(tanggalPraktikum, "dd MMM yyyy", { locale: localeId })} jam ${data.jam_mulai}-${data.jam_selesai}`,
      );
    }

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    // ✅ HYBRID APPROVAL: Auto-approve if no conflict (conflict already checked above)
    return await insert<Jadwal>("jadwal_praktikum", {
      kelas_id: data.kelas_id,
      laboratorium_id: data.laboratorium_id,
      tanggal_praktikum: format(tanggalPraktikum, "yyyy-MM-dd"),
      hari,
      jam_mulai: data.jam_mulai,
      jam_selesai: data.jam_selesai,
      topik: data.topik,
      catatan: data.catatan,
      is_active: true, // HYBRID: Auto-approved (laboran can cancel later if needed)
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "createJadwal");
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:jadwal permission
export const createJadwal = requirePermission(
  "manage:jadwal",
  createJadwalImpl,
);

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update jadwal
 * @param id - Jadwal ID
 * @param data - Update data
 * @returns Updated jadwal
 */
async function updateJadwalImpl(
  id: string,
  data: Partial<CreateJadwalData>,
): Promise<Jadwal> {
  try {
    // Get existing jadwal
    const existing = await getJadwalById(id);

    // Build update object
    const updateData: Partial<Jadwal> = {};

    // Copy basic fields
    if (data.kelas_id !== undefined) updateData.kelas_id = data.kelas_id;
    if (data.laboratorium_id !== undefined)
      updateData.laboratorium_id = data.laboratorium_id;
    if (data.jam_mulai !== undefined) updateData.jam_mulai = data.jam_mulai;
    if (data.jam_selesai !== undefined)
      updateData.jam_selesai = data.jam_selesai;
    if (data.topik !== undefined) updateData.topik = data.topik;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    // Handle tanggal_praktikum with auto-computed hari
    if (data.tanggal_praktikum !== undefined) {
      const tanggalPraktikum =
        data.tanggal_praktikum instanceof Date
          ? data.tanggal_praktikum
          : new Date(data.tanggal_praktikum);

      // ✅ FIX ISSUE #6: Validate tanggal tidak boleh di masa lalu (saat update tanggal)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const praktikumDate = new Date(tanggalPraktikum);
      praktikumDate.setHours(0, 0, 0, 0);

      if (praktikumDate < today) {
        throw new Error(
          `Tanggal praktikum tidak boleh di masa lalu. Tanggal yang dipilih: ${format(tanggalPraktikum, "dd MMM yyyy", { locale: localeId })}`,
        );
      }

      updateData.tanggal_praktikum = format(tanggalPraktikum, "yyyy-MM-dd");
      updateData.hari = format(tanggalPraktikum, "EEEE", {
        locale: localeId,
      }).toLowerCase() as
        | "senin"
        | "selasa"
        | "rabu"
        | "kamis"
        | "jumat"
        | "sabtu"
        | "minggu";
    }

    // Determine final values for conflict check
    const labId = data.laboratorium_id || existing.laboratorium_id;
    const tanggalPraktikum = data.tanggal_praktikum
      ? data.tanggal_praktikum instanceof Date
        ? data.tanggal_praktikum
        : new Date(data.tanggal_praktikum)
      : existing.tanggal_praktikum
        ? new Date(existing.tanggal_praktikum)
        : new Date();
    const jamMulai = data.jam_mulai || existing.jam_mulai;
    const jamSelesai = data.jam_selesai || existing.jam_selesai;

    // If date/time/lab changed, check for conflicts
    if (
      data.laboratorium_id ||
      data.tanggal_praktikum ||
      data.jam_mulai ||
      data.jam_selesai
    ) {
      const hasConflict = await checkJadwalConflictByDate(
        labId,
        tanggalPraktikum,
        jamMulai,
        jamSelesai,
        id,
      );

      if (hasConflict) {
        throw new Error(
          `Jadwal bentrok! Lab sudah terpakai pada waktu tersebut`,
        );
      }
    }

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    return await update<Jadwal>("jadwal_praktikum", id, updateData);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `updateJadwal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:jadwal permission + ownership check
export const updateJadwal = requirePermissionAndOwnership(
  "manage:jadwal",
  { table: "jadwal_praktikum", ownerField: "dosen_id" },
  0,
  updateJadwalImpl,
);

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete jadwal
 * @param id - Jadwal ID
 * @returns Success status
 */
async function deleteJadwalImpl(id: string): Promise<boolean> {
  try {
    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    return await remove("jadwal_praktikum", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `deleteJadwal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:jadwal permission + ownership check
export const deleteJadwal = requirePermissionAndOwnership(
  "manage:jadwal",
  { table: "jadwal_praktikum", ownerField: "dosen_id" },
  0,
  deleteJadwalImpl,
);

// ============================================================================
// HYBRID APPROVAL WORKFLOW - CANCEL/REACTIVATE OPERATIONS
// ============================================================================

/**
 * Cancel jadwal praktikum (Laboran only)
 * @param jadwalId - Jadwal ID to cancel
 * @param reason - Reason for cancellation
 * @returns Success status
 */
async function cancelJadwalImpl(
  jadwalId: string,
  reason: string,
): Promise<void> {
  try {
    // Call database function to cancel jadwal
    const { error } = await (supabase as any).rpc("cancel_jadwal_praktikum", {
      jadwal_id: jadwalId,
      reason: reason,
    });

    if (error) {
      console.error("Error cancelling jadwal:", error);
      throw new Error(
        error.message ||
          "Gagal membatalkan jadwal. Hanya laboran yang dapat membatalkan jadwal.",
      );
    }

    logger.info(`Jadwal ${jadwalId} cancelled successfully`, {
      jadwalId,
      reason,
    });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `cancelJadwal:${jadwalId}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission (laboran only)
export const cancelJadwal = requirePermission(
  "manage:laboratorium",
  cancelJadwalImpl,
);

/**
 * Reactivate cancelled jadwal praktikum (Laboran only)
 * @param jadwalId - Jadwal ID to reactivate
 * @returns Success status
 */
async function reactivateJadwalImpl(jadwalId: string): Promise<void> {
  try {
    // Call database function to reactivate jadwal
    const { error } = await (supabase as any).rpc(
      "reactivate_jadwal_praktikum",
      {
        jadwal_id: jadwalId,
      },
    );

    if (error) {
      console.error("Error reactivating jadwal:", error);
      throw new Error(
        error.message ||
          "Gagal mengaktifkan kembali jadwal. Hanya laboran yang dapat mengaktifkan kembali jadwal.",
      );
    }

    logger.info(`Jadwal ${jadwalId} reactivated successfully`, { jadwalId });
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `reactivateJadwal:${jadwalId}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission (laboran only)
export const reactivateJadwal = requirePermission(
  "manage:laboratorium",
  reactivateJadwalImpl,
);

/**
 * Get all jadwal including cancelled (For laboran management page)
 * @param filters - Optional filters
 * @returns List of all jadwal with cancellation details
 */
async function getAllJadwalForLaboranImpl(filters?: {
  status?: "approved" | "cancelled" | "all";
  laboratorium_id?: string;
  start_date?: Date;
  end_date?: Date;
}): Promise<Jadwal[]> {
  try {
    const queryFilters: Array<{
      column: string;
      operator: "eq" | "gte" | "lte";
      value: unknown;
    }> = [];

    // Filter by status
    if (filters?.status && filters.status !== "all") {
      queryFilters.push({
        column: "status",
        operator: "eq" as const,
        value: filters.status,
      });
    }

    // Filter by laboratorium
    if (filters?.laboratorium_id) {
      queryFilters.push({
        column: "laboratorium_id",
        operator: "eq" as const,
        value: filters.laboratorium_id,
      });
    }

    // Filter by date range
    if (filters?.start_date) {
      queryFilters.push({
        column: "tanggal_praktikum",
        operator: "gte" as const,
        value: format(filters.start_date, "yyyy-MM-dd"),
      });
    }

    if (filters?.end_date) {
      queryFilters.push({
        column: "tanggal_praktikum",
        operator: "lte" as const,
        value: format(filters.end_date, "yyyy-MM-dd"),
      });
    }

    const jadwalList = await queryWithFilters<Jadwal>(
      "jadwal_praktikum",
      queryFilters,
      {
        select: `
          *,
          kelas:kelas_id (
            nama_kelas,
            kode_kelas,
            mata_kuliah (
              nama_mk,
              kode_mk
            )
          ),
          laboratorium:laboratorium_id (
            nama_lab,
            kode_lab
          ),
          cancelled_by_user:cancelled_by (
            full_name,
            email
          )
        `,
        order: { column: "tanggal_praktikum", ascending: false },
      },
    );

    return jadwalList;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getAllJadwalForLaboran");
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:laboratorium permission (laboran only)
export const getAllJadwalForLaboran = requirePermission(
  "manage:laboratorium",
  getAllJadwalForLaboranImpl,
);

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if jadwal conflicts with existing schedules on a specific date
 * @param labId - Laboratorium ID
 * @param tanggalPraktikum - Date of praktikum
 * @param jamMulai - Start time (HH:mm)
 * @param jamSelesai - End time (HH:mm)
 * @param excludeId - ID to exclude from check (for updates)
 * @returns Boolean indicating conflict
 */
export async function checkJadwalConflictByDate(
  labId: string,
  tanggalPraktikum: Date,
  jamMulai: string,
  jamSelesai: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const dateStr = format(tanggalPraktikum, "yyyy-MM-dd");

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    // ✅ HYBRID APPROVAL: Exclude cancelled jadwal from conflict check
    const existingJadwal = await queryWithFilters<Jadwal>("jadwal_praktikum", [
      {
        column: "laboratorium_id",
        operator: "eq" as const,
        value: labId,
      },
      {
        column: "tanggal_praktikum",
        operator: "eq" as const,
        value: dateStr,
      },
      {
        column: "is_active",
        operator: "eq" as const,
        value: true,
      },
      {
        column: "status",
        operator: "eq" as const,
        value: "approved",
      },
    ]);

    // Check time overlap
    const timeOverlaps = (
      start1: string,
      end1: string,
      start2: string,
      end2: string,
    ): boolean => {
      return start1 < end2 && start2 < end1;
    };

    const hasConflict = existingJadwal.some((j) => {
      if (excludeId && j.id === excludeId) {
        return false; // Skip self when updating
      }

      return timeOverlaps(jamMulai, jamSelesai, j.jam_mulai, j.jam_selesai);
    });

    return hasConflict;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "checkJadwalConflictByDate");
    return false;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use checkJadwalConflictByDate instead
 */
export async function checkJadwalConflict(
  labId: string,
  hari: string,
  jamMulai: string,
  jamSelesai: string,
  excludeId?: string,
): Promise<boolean> {
  try {
    const existingJadwal = await getJadwal({
      laboratorium_id: labId,
      hari: hari,
      is_active: true,
    });

    const timeOverlaps = (
      start1: string,
      end1: string,
      start2: string,
      end2: string,
    ): boolean => {
      return start1 < end2 && start2 < end1;
    };

    const hasConflict = existingJadwal.some((j) => {
      if (excludeId && j.id === excludeId) {
        return false;
      }

      return timeOverlaps(jamMulai, jamSelesai, j.jam_mulai, j.jam_selesai);
    });

    return hasConflict;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "checkJadwalConflict");
    return false;
  }
}
// ============================================================================
// MAHASISWA SPECIFIC OPERATIONS
// ============================================================================

/**
 * Get jadwal praktikum untuk mahasiswa (using RPC function)
 * @param userId - User ID mahasiswa (reserved for future filtering)
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 * @returns Array of jadwal praktikum mahasiswa
 */
export async function getJadwalPraktikumMahasiswa(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<Jadwal[]> {
  try {
    // TODO: Implement user-specific filtering when needed
    // Currently returns all active jadwal in date range
    void userId; // Acknowledge unused parameter

    // Build query filters
    const filters: any[] = [
      {
        column: "is_active",
        operator: "eq" as const,
        value: true,
      },
    ];

    if (startDate) {
      filters.push({
        column: "tanggal_praktikum",
        operator: "gte" as const,
        value: format(startDate, "yyyy-MM-dd"),
      });
    }

    if (endDate) {
      filters.push({
        column: "tanggal_praktikum",
        operator: "lte" as const,
        value: format(endDate, "yyyy-MM-dd"),
      });
    }

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    const data = await queryWithFilters<Jadwal>("jadwal_praktikum", filters, {
      select: `
        *,
        laboratorium:laboratorium_id (
          nama_lab,
          kode_lab,
          kapasitas
        )
      `,
      order: {
        column: "tanggal_praktikum",
        ascending: true,
      },
    });

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getJadwalPraktikumMahasiswa");
    throw apiError;
  }
}

/**
 * Get jadwal hari ini untuk mahasiswa
 * @param userId - User ID mahasiswa
 * @returns Array of today's jadwal
 */
export async function getJadwalHariIni(userId: string): Promise<Jadwal[]> {
  const today = new Date();
  return getJadwalPraktikumMahasiswa(userId, today, today);
}

/**
 * Get jadwal minggu ini (7 hari ke depan) untuk mahasiswa
 * @param userId - User ID mahasiswa
 * @returns Array of this week's jadwal
 */
export async function getJadwalMingguIni(userId: string): Promise<Jadwal[]> {
  const today = new Date();
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return getJadwalPraktikumMahasiswa(userId, today, nextWeek);
}

/**
 * Get jadwal bulan ini untuk mahasiswa
 * @param userId - User ID mahasiswa
 * @returns Array of this month's jadwal
 */
export async function getJadwalBulanIni(userId: string): Promise<Jadwal[]> {
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return getJadwalPraktikumMahasiswa(userId, today, endOfMonth);
}
// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

/**
 * Wrapped API functions with standard response format
 */
/**
 * Wrapped API functions with standard response format
 */
export const jadwalApi = {
  getAll: (filters?: JadwalFilters) =>
    withApiResponse(() => getJadwal(filters)),

  getById: (id: string) => withApiResponse(() => getJadwalById(id)),

  getByLab: (labId: string) => withApiResponse(() => getJadwalByLab(labId)),

  getCalendarEvents: (startDate: Date, endDate: Date) =>
    withApiResponse(() => getCalendarEvents(startDate, endDate)),

  create: (data: CreateJadwalData) => withApiResponse(() => createJadwal(data)),

  update: (id: string, data: Partial<CreateJadwalData>) =>
    withApiResponse(() => updateJadwal(id, data)),

  delete: (id: string) => withApiResponse(() => deleteJadwal(id)),

  checkConflictByDate: (
    labId: string,
    tanggalPraktikum: Date,
    jamMulai: string,
    jamSelesai: string,
    excludeId?: string,
  ) =>
    withApiResponse(() =>
      checkJadwalConflictByDate(
        labId,
        tanggalPraktikum,
        jamMulai,
        jamSelesai,
        excludeId,
      ),
    ),

  checkConflict: (
    labId: string,
    hari: string,
    jamMulai: string,
    jamSelesai: string,
    excludeId?: string,
  ) =>
    withApiResponse(() =>
      checkJadwalConflict(labId, hari, jamMulai, jamSelesai, excludeId),
    ),

  // ✅ TAMBAHKAN INI - Mahasiswa functions
  getMahasiswaJadwal: (userId: string, startDate?: Date, endDate?: Date) =>
    withApiResponse(() =>
      getJadwalPraktikumMahasiswa(userId, startDate, endDate),
    ),

  getJadwalHariIni: (userId: string) =>
    withApiResponse(() => getJadwalHariIni(userId)),

  getJadwalMingguIni: (userId: string) =>
    withApiResponse(() => getJadwalMingguIni(userId)),

  getJadwalBulanIni: (userId: string) =>
    withApiResponse(() => getJadwalBulanIni(userId)),
};
