/**
 * Profile API
 *
 * API functions for fetching and updating user profiles
 *
 * ✅ FIXED: All .single() replaced with .maybeSingle() to prevent PGRST116
 *   crashes when a user is newly registered and their profile row doesn't
 *   exist yet. Raw `throw error` also replaced with handleError() for
 *   consistent, user-friendly error messages.
 */

import { supabase } from "@/lib/supabase/client";
import { handleError } from "@/lib/utils/errors";

// ============================================================================
// TYPES
// ============================================================================

export interface MahasiswaProfile {
  id: string;
  user_id: string;
  nim: string;
  program_studi: string;
  angkatan: number;
  semester: number;
  gender?: "L" | "P" | null;
  date_of_birth?: string;
  address?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface DosenProfile {
  id: string;
  user_id: string;
  nidn: string;
  nama_dosen?: string;
  program_studi: string;
  nip?: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  fakultas?: string;
  phone?: string;
  office_room?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface LaboranProfile {
  id: string;
  user_id: string;
  nip: string;
  nama_laboran?: string;
  shift?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
}

export interface AdminProfile {
  full_name: string;
  email: string;
  role: string;
}

// ============================================================================
// MAHASISWA PROFILE
// ============================================================================

/**
 * Get mahasiswa profile by user ID
 *
 * ✅ FIXED: Uses .maybeSingle() — returns null if profile not found (e.g. new
 *    user) instead of throwing PGRST116 error.
 */
export async function getMahasiswaProfile(
  userId: string,
): Promise<MahasiswaProfile | null> {
  const { data, error } = await supabase
    .from("mahasiswa")
    .select(
      `
      *,
      users!inner (
        full_name,
        email
      )
    `,
    )
    .eq("user_id", userId)
    .maybeSingle(); // ✅ FIXED: null-safe, no PGRST116 for missing profiles

  if (error) throw handleError(error); // ✅ FIXED: user-friendly error wrapping
  return data;
}

/**
 * Update mahasiswa profile
 */
export async function updateMahasiswaProfile(
  mahasiswaId: string,
  data: Partial<MahasiswaProfile>,
): Promise<void> {
  const { error } = await supabase
    .from("mahasiswa")
    .update(data)
    .eq("id", mahasiswaId);

  if (error) throw handleError(error); // ✅ FIXED
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: UserProfile,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name,
      phone: data.phone,
    })
    .eq("id", userId);

  if (error) throw handleError(error); // ✅ FIXED
}

// ============================================================================
// DOSEN PROFILE
// ============================================================================

/**
 * Get dosen profile by user ID
 *
 * ✅ FIXED: Uses .maybeSingle() — returns null if not found instead of throwing.
 */
export async function getDosenProfile(
  userId: string,
): Promise<DosenProfile | null> {
  const { data, error } = await supabase
    .from("dosen")
    .select(
      `
      *,
      users!inner (
        full_name,
        email
      )
    `,
    )
    .eq("user_id", userId)
    .maybeSingle(); // ✅ FIXED

  if (error) throw handleError(error); // ✅ FIXED
  return data;
}

/**
 * Update dosen profile
 */
export async function updateDosenProfile(
  dosenId: string,
  data: Partial<DosenProfile>,
): Promise<void> {
  const { error } = await supabase
    .from("dosen")
    .update(data)
    .eq("id", dosenId);

  if (error) throw handleError(error); // ✅ FIXED
}

// ============================================================================
// LABORAN PROFILE
// ============================================================================

/**
 * Get laboran profile by user ID
 *
 * ✅ FIXED: Uses .maybeSingle() — returns null if not found.
 */
export async function getLaboranProfile(
  userId: string,
): Promise<LaboranProfile | null> {
  const { data, error } = await supabase
    .from("laboran")
    .select(
      `
      *,
      users!inner (
        full_name,
        email
      )
    `,
    )
    .eq("user_id", userId)
    .maybeSingle(); // ✅ FIXED

  if (error) throw handleError(error); // ✅ FIXED
  return data;
}

/**
 * Update laboran profile
 */
export async function updateLaboranProfile(
  laboranId: string,
  data: Partial<LaboranProfile>,
): Promise<void> {
  const { error } = await supabase
    .from("laboran")
    .update(data)
    .eq("id", laboranId);

  if (error) throw handleError(error); // ✅ FIXED
}

// ============================================================================
// ADMIN PROFILE
// ============================================================================

/**
 * Get admin profile by user ID
 *
 * ✅ FIXED: Uses .maybeSingle() — returns null if not found.
 */
export async function getAdminProfile(
  userId: string,
): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("full_name, email, role")
    .eq("id", userId)
    .maybeSingle(); // ✅ FIXED

  if (error) throw handleError(error); // ✅ FIXED
  return data;
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(
  userId: string,
  data: Partial<AdminProfile>,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name,
    })
    .eq("id", userId);

  if (error) throw handleError(error); // ✅ FIXED
}
