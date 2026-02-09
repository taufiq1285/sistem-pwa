/**
 * Logbook API
 *
 * Purpose: Handle digital logbook operations for praktikum kebidanan
 * Features:
 * - Mahasiswa creates logbook entries per jadwal
 * - Dosen reviews and grades logbook
 * - Status tracking (draft → submitted → reviewed → graded)
 * - Statistics dashboard
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
import { supabase } from "@/lib/supabase/client";
import type {
  LogbookEntry,
  CreateLogbookData,
  UpdateLogbookData,
  SubmitLogbookData,
  DosenReviewData,
  GradeLogbookData,
  LogbookFilters,
  LogbookStats,
} from "@/types/logbook.types";
import { handleError, logError } from "@/lib/utils/errors";
import {
  requirePermission,
  requirePermissionAndOwnership,
} from "@/lib/middleware";

// ============================================================================
// DEBUG FLAG
// ============================================================================

const DEBUG_LOGBOOK = false;

// ============================================================================
// LOGBOOK CRUD OPERATIONS
// ============================================================================

/**
 * Get all logbook entries with filters
 */
export async function getLogbook(filters?: LogbookFilters): Promise<LogbookEntry[]> {
  try {
    if (DEBUG_LOGBOOK) console.log("📖 getLogbook called with filters:", filters);

    const filterConditions = [];

    // Apply filters
    if (filters?.jadwal_id) {
      filterConditions.push({
        column: "jadwal_id",
        operator: "eq" as const,
        value: filters.jadwal_id,
      });
    }

    if (filters?.mahasiswa_id) {
      filterConditions.push({
        column: "mahasiswa_id",
        operator: "eq" as const,
        value: filters.mahasiswa_id,
      });
    }

    if (filters?.status) {
      filterConditions.push({
        column: "status",
        operator: "eq" as const,
        value: filters.status,
      });
    }

    if (filters?.kelas_id) {
      filterConditions.push({
        column: "mahasiswa.kelas_id", // Join through mahasiswa
        operator: "eq" as const,
        value: filters.kelas_id,
      });
    }

    if (filters?.dosen_id) {
      filterConditions.push({
        column: "dosen_id",
        operator: "eq" as const,
        value: filters.dosen_id,
      });
    }

    const options = {
      select: `
        *,
        jadwal:jadwal_id (
          id,
          topik,
          laboratorium_id,
          laboratorium:laboratorium_id (
            nama_lab
          )
        ),
        mahasiswa:mahasiswa_id (
          id,
          user:user_id (
            full_name
          )
        ),
        dosen:dosen_id (
          id,
          user:user_id (
            full_name
          )
        )
      `,
      order: { column: "created_at", ascending: false } as const,
    };

    const data = await queryWithFilters<LogbookEntry>(
      "logbook_entries",
      filterConditions,
      options,
    );

    if (DEBUG_LOGBOOK) console.log(`📖 getLogbook returning ${data?.length || 0} items`);
    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getLogbook");
    throw apiError;
  }
}

/**
 * Get logbook by ID
 */
export async function getLogbookById(id: string): Promise<LogbookEntry> {
  try {
    if (DEBUG_LOGBOOK) console.log("📖 getLogbookById called:", id);

    const data = await getById<LogbookEntry>("logbook_entries", id, {
      select: `
        *,
        jadwal:jadwal_id (
          id,
          topik,
          tanggal_praktikum,
          laboratorium:laboratorium_id (
            nama_lab
          )
        ),
        mahasiswa:mahasiswa_id (
          id,
          user:user_id (
            full_name
          )
        ),
        dosen:dosen_id (
          id,
          user:user_id (
            full_name
          )
        )
      `,
    });

    return data;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getLogbookById");
    throw apiError;
  }
}

/**
 * Get logbook statistics
 */
export async function getLogbookStats(
  filters?: Pick<LogbookFilters, "kelas_id" | "dosen_id">,
): Promise<LogbookStats> {
  try {
    if (DEBUG_LOGBOOK) console.log("📊 getLogbookStats called with filters:", filters);

    // Get all logbooks with filters
    const allLogbooks = await getLogbook(filters);

    // Calculate stats
    const total = allLogbooks.length;
    const draft = allLogbooks.filter((l) => l.status === "draft").length;
    const submitted = allLogbooks.filter((l) => l.status === "submitted").length;
    const reviewed = allLogbooks.filter((l) => l.status === "reviewed").length;
    const graded = allLogbooks.filter((l) => l.status === "graded").length;

    // Calculate average grade (only include graded entries)
    const gradedEntries = allLogbooks.filter((l) => l.nilai !== null && l.nilai !== undefined);
    const averageGrade =
      gradedEntries.length > 0
        ? gradedEntries.reduce((sum, l) => sum + (l.nilai || 0), 0) /
          gradedEntries.length
        : undefined;

    return {
      total_logbooks: total,
      draft,
      submitted,
      reviewed,
      graded,
      average_grade: averageGrade,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getLogbookStats");
    throw apiError;
  }
}

/**
 * Create new logbook entry (MAHASISWA only)
 */
export async function createLogbook(
  data: CreateLogbookData,
): Promise<LogbookEntry> {
  try {
    // Get current mahasiswa ID from auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get mahasiswa record
    const { data: mahasiswa } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!mahasiswa) {
      throw new Error("Mahasiswa record not found");
    }

    // Get jadwal info for additional context
    const { data: jadwal } = await supabase
      .from("jadwal_praktikum")
      .select("tanggal_praktikum, topik, laboratorium_id")
      .eq("id", data.jadwal_id)
      .single();

    if (!jadwal) {
      throw new Error("Jadwal praktikum not found");
    }

    // Create logbook entry
    const newLogbook = await insert<LogbookEntry>("logbook_entries", {
      ...data,
      mahasiswa_id: mahasiswa.id,
      tanggal_praktikum: jadwal.tanggal_praktikum,
      topik_praktikum: jadwal.topik,
      status: "draft",
    });

    if (DEBUG_LOGBOOK) console.log("✅ Logbook created:", newLogbook);
    return newLogbook;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "createLogbook");
    throw apiError;
  }
}

/**
 * Update logbook entry (MAHASISWA only, own logbook)
 */
export async function updateLogbook(
  data: UpdateLogbookData,
): Promise<LogbookEntry> {
  try {
    // Get current mahasiswa ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get mahasiswa record
    const { data: mahasiswa } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!mahasiswa) {
      throw new Error("Mahasiswa record not found");
    }

    // Check permission: only owner can update draft logbook
    const existingLogbook = await getById<LogbookEntry>("logbook_entries", data.id);

    if (!existingLogbook) {
      throw new Error("Logbook not found");
    }

    if (existingLogbook.mahasiswa_id !== mahasiswa.id) {
      throw new Error("You can only update your own logbook");
    }

    if (existingLogbook.status !== "draft") {
      throw new Error("Can only update logbook with draft status");
    }

    // Update logbook
    const updated = await update<LogbookEntry>("logbook_entries", data.id, {
      prosedur_dilakukan: data.prosedur_dilakukan,
      hasil_observasi: data.hasil_observasi,
      skill_dipelajari: data.skill_dipelajari,
      kendala_dihadapi: data.kendala_dihadapi,
      refleksi: data.refleksi,
      foto_dokumentasi: data.foto_dokumentasi,
      catatan_tambahan: data.catatan_tambahan,
      status: data.status,
    });

    if (DEBUG_LOGBOOK) console.log("✅ Logbook updated:", updated);
    return updated;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "updateLogbook");
    throw apiError;
  }
}

/**
 * Submit logbook for review (MAHASISWA only, own logbook)
 */
export async function submitLogbook(data: SubmitLogbookData): Promise<LogbookEntry> {
  try {
    // Get current mahasiswa ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get mahasiswa record
    const { data: mahasiswa } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!mahasiswa) {
      throw new Error("Mahasiswa record not found");
    }

    // Check logbook ownership and status
    const existingLogbook = await getById<LogbookEntry>("logbook_entries", data.id);

    if (!existingLogbook) {
      throw new Error("Logbook not found");
    }

    if (existingLogbook.mahasiswa_id !== mahasiswa.id) {
      throw new Error("You can only submit your own logbook");
    }

    if (existingLogbook.status !== "draft") {
      throw new Error("Can only submit logbook with draft status");
    }

    // Validate required fields
    if (!data.prosedur_dilakukan || !data.hasil_observasi || !data.skill_dipelajari) {
      throw new Error("Please fill in all required fields before submitting");
    }

    // Submit logbook
    const submitted = await update<LogbookEntry>("logbook_entries", data.id, {
      prosedur_dilakukan: data.prosedur_dilakukan,
      hasil_observasi: data.hasil_observasi,
      skill_dipelajari: data.skill_dipelajari,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });

    if (DEBUG_LOGBOOK) console.log("✅ Logbook submitted:", submitted);
    return submitted;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "submitLogbook");
    throw apiError;
  }
}

/**
 * Dosen reviews logbook (gives feedback)
 */
export async function reviewLogbook(data: DosenReviewData): Promise<LogbookEntry> {
  try {
    // Get current dosen ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get dosen record
    const { data: dosen } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!dosen) {
      throw new Error("Dosen record not found");
    }

    // Check logbook exists
    const existingLogbook = await getById<LogbookEntry>("logbook_entries", data.id);

    if (!existingLogbook) {
      throw new Error("Logbook not found");
    }

    if (existingLogbook.status !== "submitted" && existingLogbook.status !== "reviewed") {
      throw new Error("Can only review submitted logbooks");
    }

    // Review logbook (give feedback)
    const reviewed = await update<LogbookEntry>("logbook_entries", data.id, {
      dosen_id: dosen.id,
      dosen_feedback: data.feedback,
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
    });

    if (DEBUG_LOGBOOK) console.log("✅ Logbook reviewed:", reviewed);
    return reviewed;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "reviewLogbook");
    throw apiError;
  }
}

/**
 * Dosen grades logbook
 */
export async function gradeLogbook(data: GradeLogbookData): Promise<LogbookEntry> {
  try {
    // Get current dosen ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get dosen record
    const { data: dosen } = await supabase
      .from("dosen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!dosen) {
      throw new Error("Dosen record not found");
    }

    // Validate grade
    if (data.nilai < 0 || data.nilai > 100) {
      throw new Error("Grade must be between 0 and 100");
    }

    // Check logbook exists
    const existingLogbook = await getById<LogbookEntry>("logbook_entries", data.id);

    if (!existingLogbook) {
      throw new Error("Logbook not found");
    }

    // Grade logbook
    const graded = await update<LogbookEntry>("logbook_entries", data.id, {
      dosen_id: dosen.id,
      nilai: data.nilai,
      status: "graded",
    });

    if (DEBUG_LOGBOOK) console.log("✅ Logbook graded:", graded);
    return graded;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "gradeLogbook");
    throw apiError;
  }
}

/**
 * Delete logbook entry (MAHASISWA only, own logbook, draft only)
 */
export async function deleteLogbook(id: string): Promise<void> {
  try {
    // Get current mahasiswa ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get mahasiswa record
    const { data: mahasiswa } = await supabase
      .from("mahasiswa")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!mahasiswa) {
      throw new Error("Mahasiswa record not found");
    }

    // Check logbook ownership
    const existingLogbook = await getById<LogbookEntry>("logbook_entries", id);

    if (!existingLogbook) {
      throw new Error("Logbook not found");
    }

    if (existingLogbook.mahasiswa_id !== mahasiswa.id) {
      throw new Error("You can only delete your own logbook");
    }

    if (existingLogbook.status !== "draft") {
      throw new Error("Can only delete logbook with draft status");
    }

    // Delete logbook
    await remove("logbook_entries", id);

    if (DEBUG_LOGBOOK) console.log("✅ Logbook deleted:", id);
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "deleteLogbook");
    throw apiError;
  }
}

// ============================================================================
// EXPORT API FUNCTIONS (for client components)
// ============================================================================

export const logbookApi = {
  // Get operations
  getLogbook: (filters?: LogbookFilters) =>
    withApiResponse(() => getLogbook(filters)),

  getLogbookById: (id: string) =>
    withApiResponse(() => getLogbookById(id)),

  getLogbookStats: (filters?: Pick<LogbookFilters, "kelas_id" | "dosen_id">) =>
    withApiResponse(() => getLogbookStats(filters)),

  // Mahasiswa operations
  createLogbook: (data: CreateLogbookData) =>
    withApiResponse(() => createLogbook(data)),

  updateLogbook: (data: UpdateLogbookData) =>
    withApiResponse(() => updateLogbook(data)),

  submitLogbook: (data: SubmitLogbookData) =>
    withApiResponse(() => submitLogbook(data)),

  deleteLogbook: (id: string) =>
    withApiResponse(() => deleteLogbook(id)),

  // Dosen operations
  reviewLogbook: (data: DosenReviewData) =>
    withApiResponse(() => reviewLogbook(data)),

  gradeLogbook: (data: GradeLogbookData) =>
    withApiResponse(() => gradeLogbook(data)),
};
