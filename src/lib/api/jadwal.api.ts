/**
 * Jadwal API - Updated for Date-based Schedules
 * API functions for schedule management
 */

import { supabase } from "@/lib/supabase/client";
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
import { logger } from "@/lib/utils/logger";

// Debug logging (disabled in tests and production)
const DEBUG_JADWAL_LOGS =
  import.meta.env.DEV && import.meta.env.MODE !== "test";

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
    if (DEBUG_JADWAL_LOGS)
      console.log("📋 getJadwal called with filters:", filters);
    const filterConditions = [];

    // ✅ NEW LOGIC: Tampilkan SEMUA jadwal aktif (riwayat praktikum lengkap)
    // Dosen bisa lihat semua praktikum yang akan terjadi untuk transparency
    // Tapi hanya bisa edit jadwal yang dia buat sendiri (berdasarkan dosen_id)

    // ✅ FIX: Get current dosen and filter by dosen_id
    // Dosen should ONLY see their own jadwal
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let currentDosenId = null;
    if (user?.id) {
      const { data: dosenData } = await supabase
        .from("dosen")
        .select("id")
        .eq("user_id", user.id)
        .single();
      currentDosenId = dosenData?.id;
    }

    if (currentDosenId) {
      filterConditions.push({
        column: "dosen_id",
        operator: "eq" as const,
        value: currentDosenId,
      });
    }

    // ✅ FIX: Only show active jadwal (exclude deleted)
    // Show jadwal where is_active = true OR is_active = NULL (for backward compatibility)
    if (filters?.is_active !== undefined) {
      filterConditions.push({
        column: "is_active",
        operator: "eq" as const,
        value: filters.is_active,
      });
    } else {
      // Default: show only active jadwal (not deleted)
      filterConditions.push({
        column: "is_active",
        operator: "eq" as const,
        value: true,
      });
    }

    // Apply additional filters only
    if (filters?.kelas_id) {
      filterConditions.push({
        column: "kelas_id",
        operator: "eq" as const,
        value: filters.kelas_id,
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

    const options = {
      select: `
        *,
        laboratorium:laboratorium_id (
          nama_lab,
          kode_lab,
          kapasitas
        ),
        kelas:kelas_id (
          nama_kelas,
          mata_kuliah (
            nama_mk
          )
        ),
        dosen:dosen_id (
          id,
          user:user_id (
            full_name
          )
        )
      `,
      order: {
        column: "tanggal_praktikum",
        ascending: true,
      },
      // ✅ Enable caching for better offline support
      enableCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: true,
    };

    // ✅ Query semua jadwal aktif dengan info dosen pembuat
    const data = await queryWithFilters<Jadwal>(
      "jadwal_praktikum",
      filterConditions,
      options,
    );

    if (DEBUG_JADWAL_LOGS) {
      console.log(`📋 getJadwal returning ${data?.length || 0} items`);
    }
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
      // ✅ Enable caching for better offline support
      enableCache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      staleWhileRevalidate: true,
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

  // Split time components
  const [hours, minutes] = timeWithoutSeconds.split(":").map(Number);

  // Create new date with the reference date's year, month, and day
  // but with the specified hours and minutes, preserving local timezone
  const result = new Date(referenceDate);
  result.setHours(hours, minutes, 0, 0);

  return result;
}

/**
 * Get calendar events for a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param additionalFilters - Optional filters for kelas_id, laboratorium_id, hari
 * @returns Array of calendar events
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
  additionalFilters?: {
    kelas_id?: string;
    laboratorium_id?: string;
    hari?: string;
  },
): Promise<CalendarEvent[]> {
  try {
    console.log("🚨 getCalendarEvents CALLED - DATES:", {
      start: format(startDate, "yyyy-MM-dd"),
      end: format(endDate, "yyyy-MM-dd"),
      additionalFilters,
    });

    // 🆕 CRITICAL FIX: Filter by current dosen user_id for data isolation
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get current dosen ID
    let currentDosenId = null;
    if (user?.id) {
      const { data: dosenData } = await supabase
        .from("dosen")
        .select("id")
        .eq("user_id", user.id)
        .single();
      currentDosenId = dosenData?.id;
    }

    // Build filter conditions
    const filterConditions = [
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
        value: true, // ✅ HANYA jadwal aktif
      },
      // ✅ FIX: Show both approved and pending jadwal for the dosen
      // Dosen should see their own jadwal regardless of approval status
    ];

    // ✅ NEW: Filter by current dosen (only show own jadwal)
    if (currentDosenId) {
      filterConditions.push({
        column: "dosen_id",
        operator: "eq" as const,
        value: currentDosenId,
      });
    }

    // ✅ NEW: Apply additional filters from UI
    if (additionalFilters?.kelas_id) {
      filterConditions.push({
        column: "kelas_id",
        operator: "eq" as const,
        value: additionalFilters.kelas_id,
      });
    }

    if (additionalFilters?.laboratorium_id) {
      filterConditions.push({
        column: "laboratorium_id",
        operator: "eq" as const,
        value: additionalFilters.laboratorium_id,
      });
    }

    if (additionalFilters?.hari) {
      filterConditions.push({
        column: "hari",
        operator: "eq" as const,
        value: additionalFilters.hari,
      });
    }

    // ✅ NEW LOGIC: Tampilkan SEMUA jadwal aktif dalam date range
    // Tambahkan info dosen pembuat untuk indikator visual di UI
    const jadwalList = await queryWithFilters<Jadwal>(
      "jadwal_praktikum",
      filterConditions,
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
          ),
          dosen:dosen_id (
            id,
            user:user_id (
              full_name
            )
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
        is_active: j.is_active,
        status: j.status,
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
        // Parse date in local timezone (WIB/UTC+8)
        const [year, month, day] = j.tanggal_praktikum.split("-").map(Number);
        const localDate = new Date(year, month - 1, day); // Local date tanpa timezone issue

        // Parse time strings and combine with the actual date
        const jamMulaiDate = parseTimeString(j.jam_mulai, localDate);
        const jamSelesaiDate = parseTimeString(j.jam_selesai, localDate);

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

        // Create timezone-aware ISO string by manually constructing the UTC time
        // This ensures that 08:00 WIB is properly displayed as 08:00 in the calendar
        const createLocalISO = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");

          // Create ISO string that preserves local time by adding Z (treat as UTC)
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
        };

        const event = {
          id: j.id,
          title,
          start: createLocalISO(jamMulaiDate),
          end: createLocalISO(jamSelesaiDate),
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
    console.log("🔍 DEBUG: createJadwalImpl called with:", data);

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

    // Get current dosen ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let dosenId = null;

    if (user?.id) {
      const { data: dosenData } = await supabase
        .from("dosen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      dosenId = dosenData?.id;
    }

    // ✅ FIX: Validate dosenId must exist
    if (!dosenId) {
      throw new Error("Dosen ID tidak ditemukan. Pastikan Anda login sebagai dosen.");
    }

    const insertData: Partial<Jadwal> = {
      dosen_id: dosenId, // ✅ FIX: Set dosen_id saat create jadwal
      kelas_id: data.kelas_id,
      laboratorium_id: data.laboratorium_id,
      tanggal_praktikum: format(tanggalPraktikum, "yyyy-MM-dd"),
      hari,
      jam_mulai: data.jam_mulai,
      jam_selesai: data.jam_selesai,
      topik: data.topik,
      catatan: data.catatan,
      is_active: true,
      status: "pending" as const, // ✅ WORKFLOW: Start as pending, needs laboran approval
    };

    console.log("🔍 DEBUG: Insert data:", insertData);
    console.log("🔍 DEBUG: Memanggil insert function...");

    // ✅ PERBAIKAN FINAL: Ganti 'jadwalpraktikum' menjadi 'jadwal_praktikum'
    // ✅ HYBRID APPROVAL: Auto-approve if no conflict (conflict already checked above)
    const result = await insert<Jadwal>("jadwal_praktikum", insertData);
    console.log("✅ DEBUG: Insert success:", result);
    return result;
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
// APPROVAL OPERATIONS (For Laboran)
// ============================================================================

/**
 * Approve jadwal praktikum
 * @param id - Jadwal ID
 * @returns Updated jadwal
 */
async function approveJadwalImpl(id: string): Promise<Jadwal> {
  try {
    console.log("✅ Approving jadwal:", id);

    const updated = await update<Jadwal>("jadwal_praktikum", id, {
      status: "approved",
    });

    console.log("✅ Jadwal approved successfully:", id);
    return updated;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `approveJadwal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:jadwal permission (for laboran)
export const approveJadwal = requirePermission(
  "manage:jadwal",
  approveJadwalImpl,
);

/**
 * Reject jadwal praktikum
 * @param id - Jadwal ID
 * @param reason - Rejection reason
 * @returns Updated jadwal
 */
async function rejectJadwalImpl(id: string, reason?: string): Promise<Jadwal> {
  try {
    console.log("❌ Rejecting jadwal:", id, "reason:", reason);

    const updated = await update<Jadwal>("jadwal_praktikum", id, {
      status: "rejected", // ✅ WORKFLOW: Laboran rejects the booking
      cancellation_reason: reason || "Ditolak oleh laboran",
    });

    console.log("❌ Jadwal rejected successfully:", id);
    return updated;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, `rejectJadwal:${id}`);
    throw apiError;
  }
}

// 🔒 PROTECTED: Requires manage:jadwal permission (for laboran)
export const rejectJadwal = requirePermission(
  "manage:jadwal",
  rejectJadwalImpl,
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
