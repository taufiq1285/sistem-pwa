/**
 * Admin Utilities: User Cleanup
 *
 * Functions to clean up orphaned auth users (users who have auth account but incomplete profile)
 * This happens when registration fails after auth.signUp but before createUserProfile completes.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Orphaned user details
 */
export interface OrphanedUser {
  id: string;
  email: string;
  created_at: string;
  status: "missing_users_entry" | "missing_role_profile" | "complete";
  role?: string;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  success: boolean;
  deleted: {
    auth: boolean;
    users: boolean;
    profile: boolean;
  };
  error?: string;
}

/**
 * Find all orphaned auth users (auth account exists but profile incomplete)
 *
 * @param supabaseAdmin - Supabase client with service role key
 * @returns List of orphaned users
 */
export async function findOrphanedUsers(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
): Promise<OrphanedUser[]> {
  try {
    // Get all auth users
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    const orphanedUsers: OrphanedUser[] = [];

    for (const authUser of authUsers.users) {
      // Check if user has profile data
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("id, role")
        .eq("id", authUser.id)
        .single();

      if (profileError || !userProfile) {
        // Missing users table entry
        orphanedUsers.push({
          id: authUser.id,
          email: authUser.email || "no-email",
          created_at: authUser.created_at,
          status: "missing_users_entry",
        });
        continue;
      }

      // Check role-specific profile
      const role = userProfile.role;
      let hasRoleProfile = false;

      if (role === "mahasiswa") {
        const { data } = await supabaseAdmin
          .from("mahasiswa")
          .select("id")
          .eq("user_id", authUser.id)
          .single();
        hasRoleProfile = !!data;
      } else if (role === "dosen") {
        const { data } = await supabaseAdmin
          .from("dosen")
          .select("id")
          .eq("user_id", authUser.id)
          .single();
        hasRoleProfile = !!data;
      } else if (role === "laboran") {
        const { data } = await supabaseAdmin
          .from("laboran")
          .select("id")
          .eq("user_id", authUser.id)
          .single();
        hasRoleProfile = !!data;
      } else {
        hasRoleProfile = true; // superadmin, admin don't need role profile
      }

      if (!hasRoleProfile) {
        orphanedUsers.push({
          id: authUser.id,
          email: authUser.email || "no-email",
          created_at: authUser.created_at,
          status: "missing_role_profile",
          role,
        });
      }
    }

    return orphanedUsers;
  } catch (error) {
    console.error("Failed to find orphaned users:", error);
    throw error;
  }
}

/**
 * Delete a specific user completely (auth + profile)
 *
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - User ID to delete
 * @returns Cleanup result
 */
export async function deleteUser(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  userId: string,
): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: false,
    deleted: {
      auth: false,
      users: false,
      profile: false,
    },
  };

  try {
    // 1. Get user role first
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    // 2. Delete role-specific profile
    if (userProfile?.role) {
      const role = userProfile.role;

      if (role === "mahasiswa") {
        await supabaseAdmin.from("mahasiswa").delete().eq("user_id", userId);
      } else if (role === "dosen") {
        await supabaseAdmin.from("dosen").delete().eq("user_id", userId);
      } else if (role === "laboran") {
        await supabaseAdmin.from("laboran").delete().eq("user_id", userId);
      }

      result.deleted.profile = true;
    }

    // 3. Delete from users table
    const { error: usersError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    if (!usersError) {
      result.deleted.users = true;
    }

    // 4. Delete from auth (requires admin client)
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    result.deleted.auth = true;
    result.success = true;

    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

/**
 * Delete user by email
 *
 * @param supabaseAdmin - Supabase client with service role key
 * @param email - Email address to delete
 * @returns Cleanup result
 */
export async function deleteUserByEmail(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
  email: string,
): Promise<CleanupResult> {
  try {
    // Find user by email
    const { data: authUsers, error } =
      await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    const authUser = (authUsers.users as any[]).find(
      (u: any) => u.email === email,
    );

    if (!authUser) {
      return {
        success: false,
        deleted: { auth: false, users: false, profile: false },
        error: `User not found with email: ${email}`,
      };
    }

    // Delete by ID
    return await deleteUser(supabaseAdmin, authUser.id);
  } catch (error) {
    return {
      success: false,
      deleted: { auth: false, users: false, profile: false },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Bulk cleanup all orphaned users
 * ⚠️ USE WITH CAUTION - This will delete all incomplete registrations
 *
 * @param supabaseAdmin - Supabase client with service role key
 * @returns Array of cleanup results
 */
export async function bulkCleanupOrphanedUsers(
  supabaseAdmin: ReturnType<typeof createClient<Database>>,
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: Array<{ email: string; result: CleanupResult }>;
}> {
  const orphanedUsers = await findOrphanedUsers(supabaseAdmin);

  const results: Array<{ email: string; result: CleanupResult }> = [];
  let success = 0;
  let failed = 0;

  for (const user of orphanedUsers) {
    const result = await deleteUser(supabaseAdmin, user.id);
    results.push({ email: user.email, result });

    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return {
    total: orphanedUsers.length,
    success,
    failed,
    results,
  };
}

/**
 * Create admin Supabase client with service role
 * ⚠️ ONLY USE ON SERVER SIDE - Never expose service role key to client
 *
 * @returns Supabase admin client
 */
export function createAdminClient() {
  // Access environment variables via globalThis to avoid referencing the `process` symbol directly,
  // which may not be globally typed in some TS setups (frontend builds, strict envs).
  const env = (globalThis as any)?.process?.env as
    | Record<string, string | undefined>
    | undefined;
  const supabaseUrl = env?.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = env?.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRole) {
    throw new Error("Missing Supabase credentials for admin client");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
