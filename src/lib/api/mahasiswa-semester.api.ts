/**
 * Mahasiswa Semester Management API
 *
 * Fitur:
 * - Update semester mahasiswa dengan audit trail
 * - Smart suggestion kelas untuk semester baru
 * - Auto-enroll ke kelas yang disarankan
 * - Cascade enrollment handling
 */

import { supabase } from "@/lib/supabase/client";
import { requirePermission } from "@/lib/middleware";
import type { Database } from "@/types/database.types";

// ============================================================================
// TYPES
// ============================================================================

export interface MahasiswaSemesterUpdate {
  mahasiswa_id: string;
  semester_baru: number;
  notes?: string;
}

export interface KelasRecommendation {
  kelas_id: string;
  nama_kelas: string;
  semester_ajaran: number;
  tahun_ajaran: string;
  dosen_name: string | null;
  reason: string;
}

export interface SemesterUpdateResult {
  success: boolean;
  mahasiswa_id: string;
  semester_lama: number;
  semester_baru: number;
  recommendations: KelasRecommendation[];
  message: string;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Get current semester mahasiswa
 */
export async function getMahasiswaSemester(
  mahasiswaId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("mahasiswa")
      .select("semester")
      .eq("id", mahasiswaId)
      .single();

    if (error) throw error;
    return data?.semester || 1;
  } catch (error) {
    console.error("Error getting mahasiswa semester:", error);
    throw error;
  }
}

/**
 * Get smart suggestions untuk kelas di semester baru
 */
export async function getSemesterRecommendations(
  mahasiswaId: string,
  semesterBaru: number,
): Promise<KelasRecommendation[]> {
  try {
    // Get mahasiswa details
    const { data: mhs, error: mhsError } = await supabase
      .from("mahasiswa")
      .select("angkatan, program_studi")
      .eq("id", mahasiswaId)
      .single();

    if (mhsError || !mhs) {
      throw new Error("Mahasiswa tidak ditemukan");
    }

    // Get recommendations using RPC
    const { data: recommendations, error: rpcError } = await (
      supabase.rpc as any
    )("suggest_kelas_for_semester", {
      p_angkatan: mhs.angkatan,
      p_new_semester: semesterBaru,
      p_tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    });

    if (rpcError) {
      console.warn(
        "RPC error getting recommendations, returning empty:",
        rpcError,
      );
      return [];
    }

    return (recommendations || []) as KelasRecommendation[];
  } catch (error) {
    console.error("Error getting semester recommendations:", error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Update mahasiswa semester (Admin only)
 */
async function updateMahasiswaSemesterImpl(
  data: MahasiswaSemesterUpdate,
): Promise<SemesterUpdateResult> {
  try {
    const { mahasiswa_id, semester_baru, notes } = data;

    // 1. Get current semester
    const semesterLama = await getMahasiswaSemester(mahasiswa_id);

    if (semesterLama === semester_baru) {
      return {
        success: false,
        mahasiswa_id,
        semester_lama: semesterLama,
        semester_baru,
        recommendations: [],
        message: "Semester tidak berubah",
      };
    }

    // 2. Update mahasiswa semester
    const { error: updateError } = await supabase
      .from("mahasiswa")
      .update({
        semester: semester_baru,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mahasiswa_id);

    if (updateError) throw updateError;

    // 3. Get admin ID (if available)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const adminId = user?.id;

    // 4. Create audit log
    const { error: auditError } = await (supabase.from as any)(
      "mahasiswa_semester_audit",
    ).insert({
      mahasiswa_id,
      semester_lama: semesterLama,
      semester_baru,
      updated_by_admin_id: adminId,
      notes: notes || null,
    });

    if (auditError) {
      console.warn("Warning: Audit log creation failed:", auditError);
    }

    // 5. Get recommendations untuk kelas baru
    const recommendations = await getSemesterRecommendations(
      mahasiswa_id,
      semester_baru,
    );

    return {
      success: true,
      mahasiswa_id,
      semester_lama: semesterLama,
      semester_baru,
      recommendations,
      message: `Semester berhasil diupdate dari ${semesterLama} ke ${semester_baru}. ${recommendations.length} kelas tersedia untuk semester baru.`,
    };
  } catch (error: any) {
    console.error("Error updating mahasiswa semester:", error);
    throw new Error(error.message || "Gagal update semester mahasiswa");
  }
}

/**
 * Enroll mahasiswa ke kelas yang disarankan
 */
export async function enrollToRecommendedClass(
  mahasiswaId: string,
  kelasId: string,
): Promise<void> {
  try {
    // Check if already enrolled
    const { data: existing } = await supabase
      .from("kelas_mahasiswa")
      .select("id")
      .eq("mahasiswa_id", mahasiswaId)
      .eq("kelas_id", kelasId)
      .single();

    if (existing) {
      throw new Error("Mahasiswa sudah terdaftar di kelas ini");
    }

    // Get current semester dari mahasiswa
    const { data: mhs, error: mhsError } = await supabase
      .from("mahasiswa")
      .select("semester")
      .eq("id", mahasiswaId)
      .single();

    if (mhsError || !mhs) throw new Error("Mahasiswa tidak ditemukan");

    // Enroll with tracking
    const { error: enrollError } = await supabase
      .from("kelas_mahasiswa")
      .insert({
        mahasiswa_id: mahasiswaId,
        kelas_id: kelasId,
        semester_saat_enroll: mhs.semester,
        semester_terakhir: mhs.semester,
        is_active: true,
      });

    if (enrollError) throw enrollError;
  } catch (error: any) {
    console.error("Error enrolling to class:", error);
    throw new Error(error.message || "Gagal enroll ke kelas");
  }
}

/**
 * Get audit history untuk semester updates
 */
export async function getMahasiswaSemesterHistory(
  mahasiswaId: string,
): Promise<any[]> {
  try {
    const { data, error } = await (supabase.from as any)(
      "mahasiswa_semester_audit",
    )
      .select(
        `
        id,
        mahasiswa_id,
        semester_lama,
        semester_baru,
        updated_by_admin_id,
        updated_at,
        notes
      `,
      )
      .eq("mahasiswa_id", mahasiswaId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting semester history:", error);
    return [];
  }
}

// ============================================================================
// PROTECTED EXPORTS
// ============================================================================

/**
 * 🔒 PROTECTED: Requires manage:mahasiswa permission
 */
export const updateMahasiswaSemester = requirePermission(
  "manage:mahasiswa",
  updateMahasiswaSemesterImpl,
);

// ============================================================================
// PUBLIC EXPORTS
// ============================================================================

export const mahasiswaSemesterApi = {
  getMahasiswaSemester,
  getSemesterRecommendations,
  enrollToRecommendedClass,
  getMahasiswaSemesterHistory,
  updateMahasiswaSemester,
};
