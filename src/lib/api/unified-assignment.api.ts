/**
 * Unified Assignment API - Master-Detail Management System
 *
 * API untuk mengelola assignment dan jadwal dalam satu sistem terintegrasi
 */

import { supabase } from "@/lib/supabase/client";
import { handleError, logError } from "@/lib/utils/errors";
import { requirePermission } from "@/lib/middleware";

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedAssignment {
  dosen_id: string;
  mata_kuliah_id: string;
  kelas_id: string;
  total_jadwal: number;
  tanggal_mulai: string;
  tanggal_selesai: string;

  // Join data
  dosen: {
    id: string;
    full_name: string;
    email: string;
  };
  mata_kuliah: {
    id: string;
    nama_mk: string;
    kode_mk: string;
  };
  kelas: {
    id: string;
    nama_kelas: string;
    kode_kelas: string;
  };
}

export interface UnifiedAssignmentWithSchedules extends UnifiedAssignment {
  jadwalDetail: JadwalDetail[];
}

export interface JadwalDetail {
  id: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  topik: string;
  status: string;
  laboratorium: {
    id: string;
    nama_lab: string;
    kode_lab: string;
  };
}

export interface AssignmentFilters {
  dosen_id?: string;
  mata_kuliah_id?: string;
  kelas_id?: string;
  status?: string;
  semester?: string;
  tahun_ajaran?: string;
}

export interface DeleteAssignmentOptions {
  alsoDeleteKelas?: boolean;
  notifyDosen?: boolean;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get unified assignments with detailed schedules
 */
export async function getUnifiedAssignments(
  filters?: AssignmentFilters,
  search?: string,
): Promise<UnifiedAssignmentWithSchedules[]> {
  try {
    console.log(
      "🔍 Fetching unified assignments with filters:",
      filters,
      "search:",
      search,
    );

    // Build master assignment query
    const query = supabase
      .from("jadwal_praktikum")
      .select(
        `
        dosen_id,
        mata_kuliah_id,
        kelas_id,
        dosen:users!inner(id, full_name, email),
        mata_kuliah:mata_kuliah!inner(id, nama_mk, kode_mk),
        kelas:kelas!inner(id, nama_kelas, kode_kelas)
      `,
      )
      .eq("is_active", true);

    // Apply filters
    let typedQuery: any = query;
    if (filters?.dosen_id) {
      typedQuery = typedQuery.eq("dosen_id", filters.dosen_id);
    }

    if (filters?.mata_kuliah_id) {
      typedQuery = typedQuery.eq("mata_kuliah_id", filters.mata_kuliah_id);
    }

    if (filters?.kelas_id) {
      typedQuery = typedQuery.eq("kelas_id", filters.kelas_id);
    }

    if (filters?.status) {
      typedQuery = typedQuery.eq("status", filters.status);
    }

    if (filters?.tahun_ajaran) {
      typedQuery = typedQuery.eq("kelas.tahun_ajaran", filters.tahun_ajaran);
    }

    if (filters?.semester) {
      typedQuery = typedQuery.eq(
        "kelas.semester_ajaran",
        parseInt(filters.semester as string, 10),
      );
    }

    // Apply search
    if (search) {
      typedQuery = typedQuery.or(`
        dosen.full_name.ilike.%${search}%,
        mata_kuliah.nama_mk.ilike.%${search}%,
        mata_kuliah.kode_mk.ilike.%${search}%,
        kelas.nama_kelas.ilike.%${search}%,
        kelas.kode_kelas.ilike.%${search}%
      `);
    }

    const { data: rawData, error } = await typedQuery;

    if (error) throw error;
    if (!rawData || rawData.length === 0) return [];

    // Group by unique assignment (dosen + mata_kuliah + kelas)
    const assignmentMap = new Map<string, UnifiedAssignment>();

    rawData.forEach((item: any) => {
      const key = `${item.dosen_id}-${item.mata_kuliah_id}-${item.kelas_id}`;

      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, {
          dosen_id: item.dosen_id,
          mata_kuliah_id: item.mata_kuliah_id,
          kelas_id: item.kelas_id,
          total_jadwal: 0,
          tanggal_mulai: "",
          tanggal_selesai: "",
          dosen: item.dosen,
          mata_kuliah: item.mata_kuliah,
          kelas: item.kelas,
        });
      }
    });

    // Get detailed schedules for each assignment
    const assignmentsWithSchedules: UnifiedAssignmentWithSchedules[] = [];

    for (const [key, assignment] of assignmentMap) {
      // Get all jadwal for this assignment
      const { data: jadwalData, error: jadwalError } = await (supabase as any)
        .from("jadwal_praktikum")
        .select(
          `
          id,
          tanggal_praktikum,
          hari,
          jam_mulai,
          jam_selesai,
          topik,
          status,
          laboratorium:laboratorium_id (
            id,
            nama_lab,
            kode_lab
          )
        `,
        )
        .eq("dosen_id", assignment.dosen_id)
        .eq("mata_kuliah_id", assignment.mata_kuliah_id)
        .eq("kelas_id", assignment.kelas_id)
        .eq("is_active", true)
        .order("tanggal_praktikum", { ascending: true });

      if (jadwalError) {
        console.warn(
          "Error fetching jadwal details for assignment:",
          key,
          jadwalError,
        );
        continue;
      }

      const jadwalDetail = jadwalData || [];

      // Validate jadwal data and filter out errors
      const validJadwal = Array.isArray(jadwalDetail)
        ? jadwalDetail.filter(
            (j): j is JadwalDetail =>
              j && typeof j === "object" && "tanggal_praktikum" in j,
          )
        : [];

      const dates = validJadwal.map((j) => j.tanggal_praktikum).filter(Boolean);

      assignmentsWithSchedules.push({
        ...assignment,
        total_jadwal: validJadwal.length,
        tanggal_mulai: dates.length > 0 ? dates[0] : "",
        tanggal_selesai: dates.length > 0 ? dates[dates.length - 1] : "",
        jadwalDetail: validJadwal,
      });
    }

    console.log(
      `✅ Found ${assignmentsWithSchedules.length} unified assignments`,
    );
    return assignmentsWithSchedules;
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getUnifiedAssignments");
    throw apiError;
  }
}

/**
 * Delete assignment with proper cascade and options
 */
export async function deleteAssignmentCascade(
  dosenId: string,
  mataKuliahId: string,
  kelasId: string,
  options?: DeleteAssignmentOptions,
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log("🗑️ Deleting assignment cascade:", {
      dosenId,
      mataKuliahId,
      kelasId,
      options,
    });

    // Start by counting what will be deleted
    const { data: jadwalToDelete, error: countError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select("id, tanggal_praktikum, topik")
      .eq("dosen_id", dosenId)
      .eq("mata_kuliah_id", mataKuliahId)
      .eq("kelas_id", kelasId);

    if (countError) throw countError;

    const totalJadwal = jadwalToDelete?.length || 0;
    console.log(`Found ${totalJadwal} jadwal to delete`);

    // Step 1: Delete all jadwal praktikum for this assignment
    const { error: jadwalDeleteError } = await (supabase as any)
      .from("jadwal_praktikum")
      .delete()
      .eq("dosen_id", dosenId)
      .eq("mata_kuliah_id", mataKuliahId)
      .eq("kelas_id", kelasId);

    if (jadwalDeleteError) throw jadwalDeleteError;

    console.log(`✅ Deleted ${totalJadwal} jadwal praktikum`);

    // Step 2: Check if we should also clean up the kelas
    let kelasDeleted = false;
    if (options?.alsoDeleteKelas) {
      // Check if kelas has any students
      const { count, error: studentCountError } = await supabase
        .from("kelas_mahasiswa")
        .select("*", { count: "exact", head: true })
        .eq("kelas_id", kelasId);

      if (studentCountError) throw studentCountError;

      if (count === 0) {
        // Check if kelas has other active jadwal
        const { count: otherJadwalCount, error: otherJadwalError } =
          await supabase
            .from("jadwal_praktikum")
            .select("*", { count: "exact", head: true })
            .eq("kelas_id", kelasId)
            .eq("is_active", true);

        if (otherJadwalError) throw otherJadwalError;

        if (otherJadwalCount === 0) {
          // Safe to delete the kelas
          const { error: kelasDeleteError } = await supabase
            .from("kelas")
            .delete()
            .eq("id", kelasId);

          if (kelasDeleteError) throw kelasDeleteError;
          kelasDeleted = true;
          console.log(`✅ Deleted kelas ${kelasId}`);
        }
      }
    }

    // Step 3: Clean up dosen_mata_kuliah if no other assignments for this mata kuliah
    const { data: otherAssignments, error: otherAssignError } = await (
      supabase as any
    )
      .from("jadwal_praktikum")
      .select("id")
      .eq("dosen_id", dosenId)
      .eq("mata_kuliah_id", mataKuliahId)
      .eq("is_active", true);

    if (otherAssignError) throw otherAssignError;

    if (!otherAssignments || otherAssignments.length === 0) {
      const { error: dmDeleteError } = await supabase
        .from("dosen_mata_kuliah" as any)
        .delete()
        .eq("dosen_id", dosenId)
        .eq("mata_kuliah_id", mataKuliahId);

      if (dmDeleteError) throw dmDeleteError;
      console.log(`✅ Cleaned up dosen_mata_kuliah record`);
    }

    // Step 4: Send notification if requested
    if (options?.notifyDosen) {
      // Get dosen details for notification
      const { data: dosenData } = await supabase
        .from("users")
        .select("full_name, email")
        .eq("id", dosenId)
        .single();

      const { data: mkData } = await supabase
        .from("mata_kuliah")
        .select("nama_mk")
        .eq("id", mataKuliahId)
        .single();

      const { data: kelasData } = await supabase
        .from("kelas")
        .select("nama_kelas")
        .eq("id", kelasId)
        .single();

      // Create notification
      await supabase.from("notifications").insert({
        user_id: dosenId,
        title: "Assignment Dihapus",
        message: `Assignment untuk mata kuliah ${mkData?.nama_mk} di kelas ${kelasData?.nama_kelas} telah dihapus oleh admin.`,
        type: "assignment_deleted",
        metadata: {
          dosen_id: dosenId,
          mata_kuliah_id: mataKuliahId,
          kelas_id: kelasId,
          deleted_jadwal_count: totalJadwal,
          kelas_deleted: kelasDeleted,
        },
      });

      console.log(`✅ Sent notification to dosen ${dosenData?.full_name}`);
    }

    return {
      success: true,
      message: `Assignment berhasil dihapus`,
      details: {
        deleted_jadwal_count: totalJadwal,
        kelas_deleted: kelasDeleted,
        jadwal_details: jadwalToDelete,
      },
    };
  } catch (error) {
    console.error("Error in deleteAssignmentCascade:", error);
    const apiError = handleError(error);
    logError(apiError, "deleteAssignmentCascade");

    return {
      success: false,
      message: apiError.message || "Gagal menghapus assignment",
      details: { error: apiError },
    };
  }
}

/**
 * Get assignment statistics
 */
export async function getAssignmentStats(): Promise<{
  total_assignments: number;
  total_jadwal: number;
  active_assignments: number;
  unique_dosen: number;
  unique_mata_kuliah: number;
  unique_kelas: number;
}> {
  try {
    // Get unique assignments
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("jadwal_praktikum")
      .select("dosen_id, mata_kuliah_id, kelas_id")
      .eq("is_active", true);

    if (assignmentsError) throw assignmentsError;

    // Get total jadwal
    const { count: totalJadwal, error: jadwalError } = await supabase
      .from("jadwal_praktikum")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (jadwalError) throw jadwalError;

    // Get active jadwal (scheduled)
    const { count: activeJadwal, error: activeError } = await (supabase as any)
      .from("jadwal_praktikum")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("status", "scheduled");

    if (activeError) throw activeError;

    const assignments = assignmentsData || [];

    // Calculate unique counts
    const uniqueDosen = new Set((assignments as any[]).map((a) => a.dosen_id))
      .size;
    const uniqueMataKuliah = new Set(
      (assignments as any[]).map((a) => a.mata_kuliah_id),
    ).size;
    const uniqueKelas = new Set((assignments as any[]).map((a) => a.kelas_id))
      .size;

    // Group unique assignments
    const uniqueAssignments = new Set(
      (assignments as any[]).map(
        (a) => `${a.dosen_id}-${a.mata_kuliah_id}-${a.kelas_id}`,
      ),
    ).size;

    return {
      total_assignments: uniqueAssignments,
      total_jadwal: totalJadwal || 0,
      active_assignments: activeJadwal || 0,
      unique_dosen: uniqueDosen,
      unique_mata_kuliah: uniqueMataKuliah,
      unique_kelas: uniqueKelas,
    };
  } catch (error) {
    const apiError = handleError(error);
    logError(apiError, "getAssignmentStats");
    throw apiError;
  }
}

// ============================================================================
// WRAPPER FUNCTIONS WITH PERMISSIONS
// ============================================================================

export const getUnifiedAssignmentsWithPermission = requirePermission(
  "read:assignments",
  getUnifiedAssignments,
);

export const deleteAssignmentWithPermission = requirePermission(
  "delete:assignments",
  deleteAssignmentCascade,
);

export const getAssignmentStatsWithPermission = requirePermission(
  "read:assignments",
  getAssignmentStats,
);

// ============================================================================
// EXPORT
// ============================================================================

export const unifiedAssignmentApi = {
  getAssignments: getUnifiedAssignmentsWithPermission,
  deleteAssignment: deleteAssignmentWithPermission,
  getStats: getAssignmentStatsWithPermission,
};
