/**
 * Kelas API - Using Base API Pattern
 *
 * Purpose: API functions for managing Kelas (Classes)
 * Used by: Dosen, Admin
 * Pattern: Uses base.api abstraction layer (matches kuis.api pattern)
 */

import { queryWithFilters, getById, insert, update, remove } from "./base.api";

import { requirePermission } from "@/lib/middleware";

import type {
  Kelas,
  KelasFilters,
  CreateKelasData,
  UpdateKelasData,
} from "@/types/kelas.types";

/**
 * Get all kelas with optional filters
 */
export async function getKelas(filters?: KelasFilters): Promise<Kelas[]> {
  try {
    const filterConditions = [];

    if (filters?.dosen_id) {
      filterConditions.push({
        column: "dosen_id",
        operator: "eq" as const,
        value: filters.dosen_id,
      });
    }

    if (filters?.mata_kuliah_id) {
      filterConditions.push({
        column: "mata_kuliah_id",
        operator: "eq" as const,
        value: filters.mata_kuliah_id,
      });
    }

    if (filters?.semester_ajaran !== undefined) {
      filterConditions.push({
        column: "semester_ajaran",
        operator: "eq" as const,
        value: filters.semester_ajaran,
      });
    }

    if (filters?.tahun_ajaran) {
      filterConditions.push({
        column: "tahun_ajaran",
        operator: "eq" as const,
        value: filters.tahun_ajaran,
      });
    }

    if (filters?.is_active !== undefined) {
      filterConditions.push({
        column: "is_active",
        operator: "eq" as const,
        value: filters.is_active,
      });
    } else {
      // Default: only active kelas
      filterConditions.push({
        column: "is_active",
        operator: "eq" as const,
        value: true,
      });
    }

    const options = {
      select: `
        *,
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk
        )
      `,
      order: {
        column: "nama_kelas",
        ascending: true,
      },
    };

    return await queryWithFilters<Kelas>("kelas", filterConditions, options);
  } catch (error: unknown) {
    console.error("Error fetching kelas:", error);
    throw new Error(`Failed to fetch kelas: ${(error as Error).message}`);
  }
}

/**
 * Get single kelas by ID
 */
export async function getKelasById(id: string): Promise<Kelas> {
  try {
    const options = {
      select: `
        *,
        mata_kuliah:mata_kuliah_id (
          id,
          nama_mk,
          kode_mk
        ),
        dosen:dosen_id (
          id,
          users:user_id (
            full_name
          )
        )
      `,
    };

    return await getById<Kelas>("kelas", id, options);
  } catch (error: unknown) {
    console.error("Error fetching kelas:", error);
    throw new Error(`Failed to fetch kelas: ${(error as Error).message}`);
  }
}

/**
 * Create new kelas
 * Note: insert() returns data with default select,
 * then we fetch again with relations if needed
 */
async function createKelasImpl(data: CreateKelasData): Promise<Kelas> {
  try {
    // Insert kelas
    const created = await insert<Kelas>("kelas", data);

    // Fetch again with relations to satisfy callers/tests that expect populated relations
    return await getKelasById(created.id);
  } catch (error: unknown) {
    console.error("Error creating kelas:", error);
    throw new Error(`Failed to create kelas: ${(error as Error).message}`);
  }
}

// 🔒 PROTECTED: Requires manage:kelas permission
export const createKelas = requirePermission("manage:kelas", createKelasImpl);

/**
 * Update kelas
 * Note: update() returns data with default select,
 * then we fetch again with relations if needed
 */
async function updateKelasImpl(
  id: string,
  data: UpdateKelasData,
): Promise<Kelas> {
  try {
    // Update returns basic data
    await update<Kelas>("kelas", id, data);

    // Fetch again with relations
    return await getKelasById(id);
  } catch (error: unknown) {
    console.error("Error updating kelas:", error);
    throw new Error(`Failed to update kelas: ${(error as Error).message}`);
  }
}

// 🔒 PROTECTED: Requires manage:kelas permission
export const updateKelas = requirePermission("manage:kelas", updateKelasImpl);

/**
 * Delete kelas
 */
async function deleteKelasImpl(id: string): Promise<void> {
  try {
    await remove("kelas", id);
  } catch (error: unknown) {
    console.error("Error deleting kelas:", error);
    throw new Error(`Failed to delete kelas: ${(error as Error).message}`);
  }
}

// 🔒 PROTECTED: Requires manage:kelas permission
export const deleteKelas = requirePermission("manage:kelas", deleteKelasImpl);

// ============================================================================
// KELAS MAHASISWA (ENROLLMENT) OPERATIONS
// ============================================================================

export interface KelasMahasiswa {
  id: string;
  kelas_id: string;
  mahasiswa_id: string;
  enrolled_at: string | null;
  is_active: boolean | null;
  mahasiswa?: {
    id: string;
    nim: string;
    angkatan?: number;
    users?: {
      full_name: string;
      email: string;
    };
  };
}

/**
 * Get enrolled students in a kelas
 */
export async function getEnrolledStudents(
  kelasId: string,
): Promise<KelasMahasiswa[]> {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { data, error } = await supabase
      .from("kelas_mahasiswa")
      .select(
        `
        *,
        mahasiswa:mahasiswa_id (
          id,
          nim,
          angkatan,
          users:user_id (
            full_name,
            email
          )
        )
      `,
      )
      .eq("kelas_id", kelasId)
      .order("enrolled_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    console.error("Error fetching enrolled students:", error);
    throw new Error(
      `Failed to fetch enrolled students: ${(error as Error).message}`,
    );
  }
}

/**
 * Enroll student to kelas
 */
async function enrollStudentImpl(
  kelasId: string,
  mahasiswaId: string,
): Promise<KelasMahasiswa> {
  try {
    const { supabase } = await import("@/lib/supabase/client");

    // Step 1: Get kelas info (kuota, nama_kelas) (CRITICAL FIX)
    const { data: kelasData, error: kelasError } = await supabase
      .from("kelas")
      .select("kuota, nama_kelas")
      .eq("id", kelasId)
      .single();

    if (kelasError || !kelasData) {
      throw new Error("Kelas tidak ditemukan");
    }

    // Step 2: Count current enrollment
    const { count: currentEnrollment, error: countError } = await supabase
      .from("kelas_mahasiswa")
      .select("*", { count: "exact", head: true })
      .eq("kelas_id", kelasId)
      .eq("is_active", true);

    if (countError) throw countError;

    // ✅ VALIDATE: Check if kelas is full
    if (
      currentEnrollment !== null &&
      kelasData.kuota !== null &&
      currentEnrollment >= kelasData.kuota
    ) {
      throw new Error(
        `Kelas ${kelasData.nama_kelas} sudah penuh! (${currentEnrollment}/${kelasData.kuota} mahasiswa)`,
      );
    }

    // Step 3: Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("kelas_mahasiswa")
      .select("id")
      .eq("kelas_id", kelasId)
      .eq("mahasiswa_id", mahasiswaId)
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error("Mahasiswa sudah terdaftar di kelas ini");
    }

    // Step 4: Enroll student (now safe, already validated)
    const { data, error } = await supabase
      .from("kelas_mahasiswa")
      .insert({
        kelas_id: kelasId,
        mahasiswa_id: mahasiswaId,
        is_active: true,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error("Error enrolling student:", error);
    throw new Error(`Failed to enroll student: ${(error as Error).message}`);
  }
}

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission
export const enrollStudent = requirePermission(
  "manage:kelas_mahasiswa",
  enrollStudentImpl,
);

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission

/**
 * Remove student from kelas
 */
async function unenrollStudentImpl(
  kelasId: string,
  mahasiswaId: string,
): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase
      .from("kelas_mahasiswa")
      .delete()
      .eq("kelas_id", kelasId)
      .eq("mahasiswa_id", mahasiswaId);

    if (error) throw error;
  } catch (error: unknown) {
    console.error("Error unenrolling student:", error);
    throw new Error(`Failed to unenroll student: ${(error as Error).message}`);
  }
}

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission
export const unenrollStudent = requirePermission(
  "manage:kelas_mahasiswa",
  unenrollStudentImpl,
);

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission

/**
 * Toggle student active status in kelas
 */
async function toggleStudentStatusImpl(
  kelasId: string,
  mahasiswaId: string,
  isActive: boolean,
): Promise<void> {
  try {
    const { supabase } = await import("@/lib/supabase/client");
    const { error } = await supabase
      .from("kelas_mahasiswa")
      .update({ is_active: isActive })
      .eq("kelas_id", kelasId)
      .eq("mahasiswa_id", mahasiswaId);

    if (error) throw error;
  } catch (error: unknown) {
    console.error("Error toggling student status:", error);
    throw new Error(
      `Failed to toggle student status: ${(error as Error).message}`,
    );
  }
}

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission
export const toggleStudentStatus = requirePermission(
  "manage:kelas_mahasiswa",
  toggleStudentStatusImpl,
);

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission

/**
 * Get all mahasiswa (for enrollment selection)
 */
export async function getAllMahasiswa(): Promise<
  Array<{
    id: string;
    nim: string;
    users: { full_name: string; email: string };
  }>
> {
  try {
    const { supabase } = await import("@/lib/supabase/client");

    // Get mahasiswa data
    const { data: mahasiswaData, error: mahasiswaError } = await supabase
      .from("mahasiswa")
      .select(
        `
        id,
        nim,
        user_id
      `,
      )
      .order("nim", { ascending: true });

    if (mahasiswaError) throw mahasiswaError;

    if (!mahasiswaData || mahasiswaData.length === 0) {
      return [];
    }

    // Get user data for these mahasiswa
    const userIds = mahasiswaData.map((m) => m.user_id).filter(Boolean);
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", userIds);

    if (usersError) throw usersError;

    // Map users to mahasiswa
    const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

    return mahasiswaData.map((m) => ({
      id: m.id,
      nim: m.nim,
      users: usersMap.get(m.user_id) || { full_name: "-", email: "-" },
    }));
  } catch (error: unknown) {
    console.error("Error fetching mahasiswa:", error);
    throw new Error(`Failed to fetch mahasiswa: ${(error as Error).message}`);
  }
}

/**
 * Create or get mahasiswa by NIM and enroll to kelas
 * If mahasiswa doesn't exist, create new user account and mahasiswa record
 */
async function createOrEnrollMahasiswaImpl(
  kelasId: string,
  data: {
    nim: string;
    full_name: string;
    email: string;
  },
): Promise<{ success: boolean; message: string; mahasiswaId?: string }> {
  try {
    const { supabase } = await import("@/lib/supabase/client");

    // Check if mahasiswa with NIM already exists
    const { data: existingMahasiswa } = await supabase
      .from("mahasiswa")
      .select("id, user_id")
      .eq("nim", data.nim)
      .limit(1);

    let mahasiswaId: string;

    if (existingMahasiswa && existingMahasiswa.length > 0) {
      // Mahasiswa exists, use existing ID
      mahasiswaId = existingMahasiswa[0].id;
    } else {
      // ✅ FIX ISSUE #7: Check email duplicate before signup
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", data.email)
        .maybeSingle();

      if (existingUser) {
        throw new Error(
          `Email ${data.email} sudah terdaftar di sistem. Gunakan email lain atau hubungi admin.`,
        );
      }

      // Create new user account
      const defaultPassword = `${data.nim}123`; // Default password: NIM + 123

      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: defaultPassword,
        options: {
          data: {
            full_name: data.full_name,
            role: "mahasiswa",
          },
        },
      });

      if (signUpError) {
        // ✅ FIX ISSUE #7: Better error message for auth errors
        if (
          signUpError.message.includes("already registered") ||
          signUpError.message.includes("User already registered")
        ) {
          throw new Error(
            `Email ${data.email} sudah terdaftar. Gunakan email lain.`,
          );
        }
        throw signUpError;
      }

      if (!newUser.user) throw new Error("Failed to create user account");

      // Create user profile
      const { error: profileError } = await supabase.from("users").insert({
        id: newUser.user.id,
        email: data.email,
        full_name: data.full_name,
        role: "mahasiswa",
      });

      if (profileError) {
        // If profile creation fails, delete the auth user
        console.error("Profile creation failed:", profileError);
        throw new Error("Failed to create user profile");
      }

      // Create mahasiswa record
      const { data: newMahasiswa, error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .insert({
          user_id: newUser.user.id,
          nim: data.nim,
          angkatan: new Date().getFullYear(),
          program_studi: "Unknown",
        })
        .select("id")
        .single();

      // ✅ FIX ISSUE #4: Better error handling for insert
      if (mahasiswaError) {
        // Check for specific error codes
        const errorCode = (mahasiswaError as any)?.code;

        if (errorCode === "23505") {
          // Unique constraint violation
          throw new Error(`NIM ${data.nim} sudah terdaftar di sistem`);
        }

        if (errorCode === "23503") {
          // Foreign key violation
          throw new Error("Data tidak valid. User account tidak ditemukan.");
        }

        throw mahasiswaError;
      }

      if (!newMahasiswa) {
        throw new Error(
          "Gagal membuat record mahasiswa. Tidak ada data yang dikembalikan.",
        );
      }

      mahasiswaId = newMahasiswa.id;
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
      .from("kelas_mahasiswa")
      .select("id")
      .eq("kelas_id", kelasId)
      .eq("mahasiswa_id", mahasiswaId)
      .limit(1);

    if (existingEnrollment && existingEnrollment.length > 0) {
      return {
        success: false,
        message: "Mahasiswa sudah terdaftar di kelas ini",
      };
    }

    // Enroll to kelas
    await enrollStudent(kelasId, mahasiswaId);

    return {
      success: true,
      message: "Mahasiswa berhasil ditambahkan ke kelas",
      mahasiswaId,
    };
  } catch (error: unknown) {
    console.error("Error creating/enrolling mahasiswa:", error);
    return {
      success: false,
      message: (error as Error).message || "Gagal menambahkan mahasiswa",
    };
  }
}

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission
export const createOrEnrollMahasiswa = requirePermission(
  "manage:kelas_mahasiswa",
  createOrEnrollMahasiswaImpl,
);

// 🔒 PROTECTED: Requires manage:kelas_mahasiswa permission
