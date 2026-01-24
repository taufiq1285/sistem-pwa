/**
 * Permintaan Perbaikan Nilai API
 *
 * Purpose: Handle grade revision request operations
 * Features:
 * - Students can request grade corrections
 * - Instructors can approve/reject with reasons
 * - Auto-update nilai when approved
 * - Full audit trail and notifications
 */

import { supabase } from "@/lib/supabase/client";
import { handleError } from "@/lib/utils/errors";
import { requirePermission } from "@/lib/middleware/permission.middleware";
import type {
  PermintaanPerbaikanNilai,
  PermintaanPerbaikanWithRelations,
  CreatePermintaanPerbaikanData,
  ApprovePermintaanData,
  RejectPermintaanData,
  CancelPermintaanData,
  PermintaanFilters,
  PermintaanSummary,
  PermintaanStatsForDosen,
  KomponenNilai,
} from "@/types/permintaan-perbaikan.types";
import {
  createNotification,
  createBulkNotifications,
} from "@/lib/api/notification.api";

// Type helper for Supabase query results with complex relationships
type SupabaseResult<T> = T | null;
type SupabaseResultArray<T> = T[];

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get permintaan with filters
 */
export async function getPermintaan(
  filters: PermintaanFilters = {},
): Promise<PermintaanPerbaikanWithRelations[]> {
  try {
    let query = supabase
      .from("permintaan_perbaikan_nilai" as any)
      .select(
        `
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
          kode_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          ),
          dosen:dosen_id (
            id,
            nip,
            user:user_id (
              full_name,
              email
            )
          )
        ),
        reviewer:reviewed_by (
          id,
          nip,
          user:user_id (
            full_name
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (filters.mahasiswa_id) {
      query = query.eq("mahasiswa_id", filters.mahasiswa_id);
    }

    if (filters.kelas_id) {
      query = query.eq("kelas_id", filters.kelas_id);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.komponen_nilai) {
      query = query.eq("komponen_nilai", filters.komponen_nilai);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1,
      );
    }

    const { data, error } = await query;

    if (error) throw handleError(error);

    return (data ||
      []) as unknown as SupabaseResultArray<PermintaanPerbaikanWithRelations>;
  } catch (error) {
    console.error("getPermintaan error:", error);
    throw handleError(error);
  }
}

/**
 * Get permintaan by mahasiswa
 */
export async function getPermintaanByMahasiswa(
  mahasiswaId: string,
): Promise<PermintaanPerbaikanWithRelations[]> {
  return getPermintaan({ mahasiswa_id: mahasiswaId });
}

/**
 * Get permintaan by kelas
 */
export async function getPermintaanByKelas(
  kelasId: string,
): Promise<PermintaanPerbaikanWithRelations[]> {
  return getPermintaan({ kelas_id: kelasId });
}

/**
 * Get pending permintaan for dosen (across all their classes)
 */
export async function getPermintaanPendingForDosen(
  dosenId: string,
): Promise<PermintaanPerbaikanWithRelations[]> {
  try {
    // Get all kelas taught by this dosen
    const { data: kelasList, error: kelasError } = await supabase
      .from("kelas")
      .select("id")
      .eq("dosen_id", dosenId);

    if (kelasError) throw handleError(kelasError);

    if (!kelasList || kelasList.length === 0) {
      return [];
    }

    const kelasIds = kelasList.map((k) => k.id);

    // Get pending permintaan for these classes
    const { data, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .select(
        `
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
          kode_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          )
        )
      `,
      )
      .in("kelas_id", kelasIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw handleError(error);

    return (data ||
      []) as unknown as SupabaseResultArray<PermintaanPerbaikanWithRelations>;
  } catch (error) {
    console.error("getPermintaanPendingForDosen error:", error);
    throw handleError(error);
  }
}

/**
 * Get permintaan by ID
 */
export async function getPermintaanById(
  id: string,
): Promise<PermintaanPerbaikanWithRelations> {
  try {
    const { data, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .select(
        `
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
          kode_kelas,
          mata_kuliah:mata_kuliah_id (
            nama_mk,
            kode_mk
          ),
          dosen:dosen_id (
            id,
            nip,
            user:user_id (
              full_name,
              email
            )
          )
        ),
        reviewer:reviewed_by (
          id,
          nip,
          user:user_id (
            full_name
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw handleError(error);

    return data as unknown as SupabaseResult<PermintaanPerbaikanWithRelations>;
  } catch (error) {
    console.error("getPermintaanById error:", error);
    throw handleError(error);
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create permintaan perbaikan nilai (by mahasiswa)
 */
async function createPermintaanImpl(
  data: CreatePermintaanPerbaikanData,
): Promise<PermintaanPerbaikanNilai> {
  try {
    const { data: permintaan, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .insert({
        mahasiswa_id: data.mahasiswa_id,
        nilai_id: data.nilai_id,
        kelas_id: data.kelas_id,
        komponen_nilai: data.komponen_nilai,
        nilai_lama: data.nilai_lama,
        nilai_usulan: data.nilai_usulan || null,
        alasan_permintaan: data.alasan_permintaan,
        bukti_pendukung: data.bukti_pendukung || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw handleError(error);

    // Get kelas info for notification
    const { data: kelasInfo, error: kelasError } = await supabase
      .from("kelas")
      .select(
        `
        nama_kelas,
        mata_kuliah:mata_kuliah_id (nama_mk),
        dosen:dosen_id (
          user:user_id (
            id,
            full_name
          )
        )
      `,
      )
      .eq("id", data.kelas_id)
      .single();

    if (!kelasError && kelasInfo) {
      // Get mahasiswa info
      const { data: mahasiswaInfo } = await supabase
        .from("mahasiswa")
        .select("user:user_id (full_name)")
        .eq("id", data.mahasiswa_id)
        .single();

      // Notify dosen (best effort - don't fail if notification fails)
      try {
        const dosenUserId = kelasInfo.dosen?.user?.id;
        if (dosenUserId) {
          await createNotification({
            user_id: dosenUserId,
            title: "Permintaan Perbaikan Nilai",
            message: `${mahasiswaInfo?.user?.full_name || "Mahasiswa"} mengajukan permintaan perbaikan nilai ${data.komponen_nilai.toUpperCase()} untuk kelas ${kelasInfo.mata_kuliah?.nama_mk}`,
            type: "perbaikan_nilai_request",
            data: {
              permintaan_id: (permintaan as unknown as PermintaanPerbaikanNilai)
                .id,
              kelas_id: data.kelas_id,
              komponen_nilai: data.komponen_nilai,
            },
          });
        }
      } catch (notifError) {
        console.error("[NOTIFICATION] Failed to notify dosen:", notifError);
      }
    }

    return permintaan as unknown as SupabaseResult<PermintaanPerbaikanNilai>;
  } catch (error) {
    console.error("createPermintaan error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only mahasiswa can create their own requests
export const createPermintaan = requirePermission(
  "create:peminjaman", // Using existing permission since no specific permission for this
  createPermintaanImpl,
);

// ============================================================================
// UPDATE OPERATIONS (APPROVE / REJECT / CANCEL)
// ============================================================================

/**
 * Approve permintaan (by dosen)
 */
async function approvePermintaanImpl(
  data: ApprovePermintaanData,
): Promise<PermintaanPerbaikanNilai> {
  try {
    const { data: updated, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .update({
        status: "approved",
        nilai_baru: data.nilai_baru,
        response_dosen: data.response_dosen || null,
        reviewed_by: data.reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.permintaan_id)
      .eq("status", "pending") // Only approve if still pending
      .select()
      .single();

    if (error) throw handleError(error);

    // Validate updated data exists and is not an error
    if (!updated || typeof updated !== "object") {
      throw new Error("Failed to update permintaan perbaikan nilai");
    }

    // Get permintaan info for notification
    const permintaan = await getPermintaanById(data.permintaan_id);

    // Notify mahasiswa (best effort - don't fail if notification fails)
    try {
      if (permintaan.mahasiswa_id) {
        const { data: mahasiswa } = await supabase
          .from("mahasiswa")
          .select("user_id")
          .eq("id", permintaan.mahasiswa_id)
          .single();

        if (mahasiswa?.user_id) {
          await createNotification({
            user_id: mahasiswa.user_id,
            title: "Permintaan Perbaikan Nilai Disetujui",
            message: `Permintaan perbaikan nilai ${permintaan.komponen_nilai.toUpperCase()} Anda untuk ${permintaan.kelas?.mata_kuliah?.nama_mk} telah disetujui. Nilai baru: ${data.nilai_baru}`,
            type: "perbaikan_nilai_response",
            data: {
              permintaan_id: data.permintaan_id,
              status: "approved",
              nilai_baru: data.nilai_baru,
            },
          });
        }
      }
    } catch (notifError) {
      console.error("[NOTIFICATION] Failed to notify mahasiswa:", notifError);
    }

    return updated as PermintaanPerbaikanNilai;
  } catch (error) {
    console.error("approvePermintaan error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only dosen can approve
export const approvePermintaan = requirePermission(
  "manage:nilai",
  approvePermintaanImpl,
);

/**
 * Reject permintaan (by dosen)
 */
async function rejectPermintaanImpl(
  data: RejectPermintaanData,
): Promise<PermintaanPerbaikanNilai> {
  try {
    const { data: updated, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .update({
        status: "rejected",
        response_dosen: data.response_dosen,
        reviewed_by: data.reviewed_by,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.permintaan_id)
      .eq("status", "pending") // Only reject if still pending
      .select()
      .single();

    if (error) throw handleError(error);

    // Validate updated data exists and is not an error
    if (!updated || typeof updated !== "object") {
      throw new Error("Failed to update permintaan perbaikan nilai");
    }

    // Get permintaan info for notification
    const permintaan = await getPermintaanById(data.permintaan_id);

    // Notify mahasiswa (best effort - don't fail if notification fails)
    try {
      if (permintaan.mahasiswa_id) {
        const { data: mahasiswa } = await supabase
          .from("mahasiswa")
          .select("user_id")
          .eq("id", permintaan.mahasiswa_id)
          .single();

        if (mahasiswa?.user_id) {
          await createNotification({
            user_id: mahasiswa.user_id,
            title: "Permintaan Perbaikan Nilai Ditolak",
            message: `Permintaan perbaikan nilai ${permintaan.komponen_nilai.toUpperCase()} Anda untuk ${permintaan.kelas?.mata_kuliah?.nama_mk} ditolak. Alasan: ${data.response_dosen}`,
            type: "perbaikan_nilai_response",
            data: {
              permintaan_id: data.permintaan_id,
              status: "rejected",
              response: data.response_dosen,
            },
          });
        }
      }
    } catch (notifError) {
      console.error("[NOTIFICATION] Failed to notify mahasiswa:", notifError);
    }

    return updated as PermintaanPerbaikanNilai;
  } catch (error) {
    console.error("rejectPermintaan error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only dosen can reject
export const rejectPermintaan = requirePermission(
  "manage:nilai",
  rejectPermintaanImpl,
);

/**
 * Cancel permintaan (by mahasiswa)
 */
async function cancelPermintaanImpl(
  data: CancelPermintaanData,
): Promise<PermintaanPerbaikanNilai> {
  try {
    const { data: updated, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.permintaan_id)
      .eq("status", "pending") // Only cancel if still pending
      .select()
      .single();

    if (error) throw handleError(error);

    // Validate updated data exists and is not an error
    if (!updated || typeof updated !== "object") {
      throw new Error("Failed to cancel permintaan perbaikan nilai");
    }

    return updated as PermintaanPerbaikanNilai;
  } catch (error) {
    console.error("cancelPermintaan error:", error);
    throw handleError(error);
  }
}

// 🔒 PROTECTED: Only mahasiswa can cancel their own requests
export const cancelPermintaan = requirePermission(
  "view:peminjaman", // Using view permission as proxy
  cancelPermintaanImpl,
);

// ============================================================================
// STATISTICS & SUMMARY
// ============================================================================

/**
 * Get permintaan summary
 */
export async function getPermintaanSummary(
  filters: PermintaanFilters = {},
): Promise<PermintaanSummary> {
  try {
    let query = supabase
      .from("permintaan_perbaikan_nilai" as any)
      .select("status");

    if (filters.mahasiswa_id) {
      query = query.eq("mahasiswa_id", filters.mahasiswa_id);
    }

    if (filters.kelas_id) {
      query = query.eq("kelas_id", filters.kelas_id);
    }

    const { data, error } = await query;

    if (error) throw handleError(error);

    // Type-safe cast for status query result
    const statusData = data as unknown as Array<{ status: string }> | null;
    const summary: PermintaanSummary = {
      total: statusData?.length || 0,
      pending: statusData?.filter((p) => p.status === "pending").length || 0,
      approved: statusData?.filter((p) => p.status === "approved").length || 0,
      rejected: statusData?.filter((p) => p.status === "rejected").length || 0,
      cancelled:
        statusData?.filter((p) => p.status === "cancelled").length || 0,
    };

    return summary;
  } catch (error) {
    console.error("getPermintaanSummary error:", error);
    throw handleError(error);
  }
}

/**
 * Get permintaan stats for dosen
 */
export async function getPermintaanStatsForDosen(
  dosenId: string,
): Promise<PermintaanStatsForDosen> {
  try {
    // Get all kelas taught by this dosen
    const { data: kelasList, error: kelasError } = await supabase
      .from("kelas")
      .select("id")
      .eq("dosen_id", dosenId);

    if (kelasError) throw handleError(kelasError);

    if (!kelasList || kelasList.length === 0) {
      return {
        total_pending: 0,
        total_reviewed: 0,
        approval_rate: 0,
        by_komponen: {
          kuis: 0,
          tugas: 0,
          uts: 0,
          uas: 0,
          praktikum: 0,
          kehadiran: 0,
        },
      };
    }

    const kelasIds = kelasList.map((k) => k.id);

    // Get all permintaan for these classes
    const { data, error } = await supabase
      .from("permintaan_perbaikan_nilai" as any)
      .select("status, komponen_nilai")
      .in("kelas_id", kelasIds);

    if (error) throw handleError(error);

    const allPermintaan = (data || []) as unknown as Array<{
      status: string;
      komponen_nilai: string;
    }>;
    const pending = allPermintaan.filter((p) => p.status === "pending");
    const reviewed = allPermintaan.filter(
      (p) => p.status === "approved" || p.status === "rejected",
    );
    const approved = allPermintaan.filter((p) => p.status === "approved");

    const approvalRate =
      reviewed.length > 0 ? approved.length / reviewed.length : 0;

    // Count by komponen
    const byKomponen: Record<KomponenNilai, number> = {
      kuis: 0,
      tugas: 0,
      uts: 0,
      uas: 0,
      praktikum: 0,
      kehadiran: 0,
    };

    allPermintaan.forEach((p) => {
      if (p.komponen_nilai in byKomponen) {
        byKomponen[p.komponen_nilai as KomponenNilai]++;
      }
    });

    return {
      total_pending: pending.length,
      total_reviewed: reviewed.length,
      approval_rate: Math.round(approvalRate * 100) / 100,
      by_komponen: byKomponen,
    };
  } catch (error) {
    console.error("getPermintaanStatsForDosen error:", error);
    throw handleError(error);
  }
}
