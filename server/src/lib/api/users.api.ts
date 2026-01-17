/**
 * Users API for Admin
 * Functions to manage all system users
 */

import { supabase } from "@/lib/supabase/client";
import { invalidateCache } from "@/lib/offline/api-cache";

import { requirePermission } from "@/lib/middleware";
export interface SystemUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "dosen" | "mahasiswa" | "laboran";
  is_active: boolean;
  created_at: string;
  nim?: string;
  nip?: string;
  nidn?: string;
  phone?: string;
}

export interface UserStats {
  total: number;
  admin: number;
  dosen: number;
  mahasiswa: number;
  laboran: number;
  active: number;
  inactive: number;
}

/**
 * Get all users with their role information
 */
async function getAllUsersImpl(): Promise<SystemUser[]> {
  try {
    console.log("[getAllUsersImpl] Fetching all users from database...");
    // Step 1: Get all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, role, is_active, created_at")
      .order("created_at", { ascending: false });

    console.log("[getAllUsersImpl] Query result:", {
      count: users?.length,
      error: usersError,
    });
    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      console.log("[getAllUsersImpl] No users found");
      return [];
    }

    // Step 2: Get role-specific data
    const userIds = users.map((u) => u.id);

    const [mahasiswaData, dosenData] = await Promise.all([
      supabase
        .from("mahasiswa")
        .select("user_id, nim, phone")
        .in("user_id", userIds),
      supabase
        .from("dosen")
        .select("user_id, nip, nidn, phone")
        .in("user_id", userIds),
    ]);

    // Step 3: Create lookup maps
    const mahasiswaMap = new Map(
      (mahasiswaData.data || []).map((m: any) => [m.user_id, m]),
    );
    const dosenMap = new Map(
      (dosenData.data || []).map((d: any) => [d.user_id, d]),
    );

    // Step 4: Combine data
    return users.map((user: any) => {
      const mahasiswa = mahasiswaMap.get(user.id);
      const dosen = dosenMap.get(user.id);

      return {
        id: user.id,
        email: user.email || "-",
        full_name: user.full_name || "-",
        role: user.role || "mahasiswa",
        is_active: user.is_active ?? true,
        created_at: user.created_at,
        nim: mahasiswa?.nim,
        nip: dosen?.nip,
        nidn: dosen?.nidn,
        phone: mahasiswa?.phone || dosen?.phone,
      };
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

// 🔒 PROTECTED: Admin only - view all users
export const getAllUsers = requirePermission("view:all_users", getAllUsersImpl);

/**
 * Get user statistics
 */
async function getUserStatsImpl(): Promise<UserStats> {
  try {
    const users = await getAllUsersImpl();

    return {
      total: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      dosen: users.filter((u) => u.role === "dosen").length,
      mahasiswa: users.filter((u) => u.role === "mahasiswa").length,
      laboran: users.filter((u) => u.role === "laboran").length,
      active: users.filter((u) => u.is_active).length,
      inactive: users.filter((u) => !u.is_active).length,
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      total: 0,
      admin: 0,
      dosen: 0,
      mahasiswa: 0,
      laboran: 0,
      active: 0,
      inactive: 0,
    };
  }
}

export const getUserStats = requirePermission(
  "view:all_users",
  getUserStatsImpl,
);

/**
 * Toggle user active status
 */
async function toggleUserStatusImpl(
  userId: string,
  isActive: boolean,
): Promise<void> {
  try {
    const { error } = await supabase
      .from("users")
      .update({ is_active: isActive })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
}

export const toggleUserStatus = requirePermission(
  "manage:users",
  toggleUserStatusImpl,
);

/**
 * Update user data
 */
export interface UpdateUserData {
  email?: string;
  full_name?: string;
  role?: "admin" | "dosen" | "mahasiswa" | "laboran";
  is_active?: boolean;
}

async function updateUserImpl(id: string, data: UpdateUserData): Promise<void> {
  try {
    const { error } = await supabase.from("users").update(data).eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export const updateUser = requirePermission("manage:users", updateUserImpl);

/**
 * Create new user
 */
export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "dosen" | "mahasiswa" | "laboran";
  nim?: string;
  nip?: string;
  nidn?: string;
  phone?: string;
}

async function createUserImpl(data: CreateUserData): Promise<void> {
  try {
    // Step 1: Create user in auth and users table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    const userId = authData.user.id;

    // Step 2: Update users table with complete info
    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: data.full_name,
        role: data.role,
        is_active: true,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Step 3: Insert role-specific data
    if (data.role === "mahasiswa" && data.nim) {
      const { error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .insert({
          user_id: userId,
          nim: data.nim || "",
          angkatan: new Date().getFullYear(),
          program_studi: "D3 Kebidanan",
          phone: data.phone || null,
        } as any);

      if (mahasiswaError) throw mahasiswaError;
    } else if (data.role === "dosen" && (data.nip || data.nidn)) {
      const { error: dosenError } = await supabase.from("dosen").insert({
        user_id: userId,
        nip: data.nip || "",
        nidn: data.nidn || null,
        phone: data.phone || null,
      } as any);

      if (dosenError) throw dosenError;
    } else if (data.role === "laboran") {
      const { error: laboranError } = await supabase.from("laboran").insert({
        user_id: userId,
        nip: data.phone || "", // temporary fix - should be actual NIP
        phone: data.phone || null,
      } as any);

      if (laboranError) throw laboranError;
    }
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export const createUser = requirePermission("manage:users", createUserImpl);

/**
 * Delete user (Admin only)
 * WARNING: This will permanently delete the user and all related data
 */
async function deleteUserImpl(userId: string): Promise<void> {
  try {
    // Check current auth state
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    console.log("[deleteUserImpl] Current authenticated user:", {
      id: currentUser?.id,
      email: currentUser?.email,
      role: currentUser?.user_metadata?.role,
    });

    console.log("[deleteUserImpl] Step 1: Getting user info for", userId);
    // Step 1: Get user info to know which role-specific table to clean
    const { data: user, error: getUserError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    console.log("[deleteUserImpl] Step 1 result:", {
      user,
      error: getUserError,
    });
    if (getUserError) {
      console.error("[deleteUserImpl] Failed to get user:", getUserError);
      throw getUserError;
    }
    if (!user) throw new Error("User not found");

    // Step 2: Delete from role-specific tables
    console.log(
      "[deleteUserImpl] Step 2: Deleting from role table:",
      user.role,
    );
    if (user.role === "mahasiswa") {
      const { error } = await supabase
        .from("mahasiswa")
        .delete()
        .eq("user_id", userId);
      if (error) {
        console.error("Failed to delete from mahasiswa table:", error);
        throw new Error(`Failed to delete mahasiswa record: ${error.message}`);
      }
      console.log("[deleteUserImpl] Deleted from mahasiswa table");
    } else if (user.role === "dosen") {
      const { error } = await supabase
        .from("dosen")
        .delete()
        .eq("user_id", userId);
      if (error) {
        console.error("Failed to delete from dosen table:", error);
        throw new Error(`Failed to delete dosen record: ${error.message}`);
      }
      console.log("[deleteUserImpl] Deleted from dosen table");
    } else if (user.role === "laboran") {
      const { error } = await supabase
        .from("laboran")
        .delete()
        .eq("user_id", userId);
      if (error) {
        console.error("Failed to delete from laboran table:", error);
        throw new Error(`Failed to delete laboran record: ${error.message}`);
      }
      console.log("[deleteUserImpl] Deleted from laboran table");
    }

    // Step 3: Delete from users table
    console.log("[deleteUserImpl] Step 3: Deleting from users table");
    const {
      data: deleteData,
      error: deleteUserError,
      count,
    } = await supabase.from("users").delete().eq("id", userId).select();

    console.log("[deleteUserImpl] Step 3 result:", {
      error: deleteUserError,
      deletedData: deleteData,
      count: count,
    });

    if (deleteUserError) {
      console.error(
        "[deleteUserImpl] Failed to delete from users table:",
        deleteUserError,
      );
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    // Check if any row was actually deleted
    if (!deleteData || deleteData.length === 0) {
      console.error(
        "[deleteUserImpl] No rows deleted! RLS policy may have blocked the delete.",
      );
      throw new Error(
        "Delete blocked by security policy. Admin permission required.",
      );
    }

    console.log(
      "[deleteUserImpl] Successfully deleted from users table, rows affected:",
      deleteData.length,
    );

    // Small delay to ensure database commit completes
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("[deleteUserImpl] Database commit delay completed");

    // Step 4: Invalidate cache for this user and all users list
    try {
      await invalidateCache(`user_${userId}`);
      await invalidateCache("all_users");
      await invalidateCache("user_stats");
      console.log(`[Delete User] Cache invalidated for user ${userId}`);
    } catch (cacheError) {
      console.warn(
        "Failed to invalidate cache after user deletion:",
        cacheError,
      );
    }

    // Step 5: Delete from Supabase Auth using Edge Function
    try {
      console.log(
        "[deleteUserImpl] Step 5: Calling edge function to delete from auth.users",
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn(
          "[deleteUserImpl] No access token, skipping auth deletion",
        );
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/delete-auth-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.warn(
          "[deleteUserImpl] Failed to delete from auth.users:",
          result.error,
        );
        // Not critical - user is already deleted from users table
      } else {
        console.log(
          "[deleteUserImpl] Successfully deleted user from auth.users:",
          userId,
        );
      }
    } catch (authError: any) {
      console.warn("[deleteUserImpl] Auth deletion error:", authError.message);
      // Not critical - user is already deleted from users table and cannot login
    }
  } catch (error: any) {
    console.error("[deleteUserImpl] ERROR:", error);
    console.error("[deleteUserImpl] Error details:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      status: error?.status,
    });
    throw new Error(error?.message || "Failed to delete user");
  }
}

export const deleteUser = requirePermission("manage:users", deleteUserImpl);
