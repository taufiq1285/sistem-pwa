/**
 * Supabase Auth Helper - OPTIMIZED: Reduced console logging
 * Wrapper functions for Supabase authentication with role-specific data
 */

import { supabase } from "./client";
import { clearUserRoleCache } from "@/lib/middleware";
import { logger } from "@/lib/utils/logger";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "@/types/auth.types";

/**
 * Login with email and password
 */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  try {
    logger.auth("login: START", { email: credentials.email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    logger.debug("login: Supabase response", { hasUser: !!data.user, error });

    if (error) throw error;

    if (!data.user) {
      throw new Error("No user returned from login");
    }

    logger.debug("login: Calling getUserProfile for", data.user.id);
    const user = await getUserProfile(data.user.id);
    logger.auth("login: Success ✅", { userId: user.id, role: user.role });

    return {
      success: true,
      user,
      session: {
        user,
        access_token: data.session?.access_token || "",
        refresh_token: data.session?.refresh_token || "",
        expires_at: data.session?.expires_at,
      },
    };
  } catch (error: unknown) {
    logger.error("login error:", error);
    return {
      success: false,
      error: (error as Error).message || "Login failed",
    };
  }
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    logger.auth("register: START", { email: data.email, role: data.role });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
          ...(data.role === "mahasiswa" && {
            nim: data.nim,
            program_studi: data.program_studi,
            angkatan: data.angkatan,
            semester: data.semester,
          }),
          ...(data.role === "dosen" && {
            nip: data.nip,
            nidn: data.nidn,
            gelar_depan: data.gelar_depan,
            gelar_belakang: data.gelar_belakang,
          }),
          ...(data.role === "laboran" && {
            nip: data.nip,
          }),
        },
      },
    });

    logger.auth("register: Supabase response", {
      hasUser: !!authData.user,
      error: authError,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        throw new Error(
          "Email sudah terdaftar. Silakan gunakan email lain atau login.",
        );
      }
      throw authError;
    }

    if (!authData.user) throw new Error("No user created");

    // Create user profile and role-specific records
    try {
      await createUserProfile(authData.user.id, data);
    } catch (profileError) {
      // ❌ Profile creation failed
      logger.error("register: Profile creation failed", profileError);

      // IMPORTANT: Save session token BEFORE signing out
      const sessionToken = authData.session?.access_token;

      // Call Edge Function to delete user from auth.users (BEFORE signOut!)
      if (sessionToken) {
        try {
          logger.debug("register: Calling rollback-registration edge function");
          const rollbackResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rollback-registration`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Content-Type": "application/json",
              },
            },
          );

          const rollbackResult = await rollbackResponse.json();

          if (rollbackResult.success) {
            logger.debug("register: Successfully rolled back registration");
          } else {
            logger.error("register: Rollback failed", rollbackResult.error);
          }
        } catch (rollbackError) {
          logger.error(
            "register: Failed to call rollback edge function",
            rollbackError,
          );
          // Continue anyway - user can contact admin to cleanup
        }
      }

      // Sign out the just-created user to prevent partial registration
      // (This happens AFTER rollback, so no session remains)
      try {
        await supabase.auth.signOut();
        logger.debug("register: Signed out incomplete registration");
      } catch (signOutError) {
        logger.error("register: Failed to sign out", signOutError);
      }

      // Provide helpful error message
      const errorMsg = (profileError as Error).message;
      if (
        errorMsg.includes("duplicate") ||
        errorMsg.includes("already exists")
      ) {
        throw new Error(
          "Data sudah terdaftar (NIM/NIP duplicate). Silakan gunakan email dan NIM/NIP yang berbeda.",
        );
      }
      throw new Error(
        `Gagal membuat profil: ${errorMsg}. Silakan coba lagi dengan data yang berbeda.`,
      );
    }

    logger.auth("register: Success", { userId: authData.user.id });

    return {
      success: true,
      message:
        "Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.",
    };
  } catch (error: unknown) {
    logger.error("Registration error:", error);

    let errorMessage = "Registrasi gagal";

    if (
      (error as Error).message.includes("already registered") ||
      (error as Error).message.includes("sudah terdaftar")
    ) {
      errorMessage = (error as Error).message;
    } else if ((error as Error).message.includes("Invalid email")) {
      errorMessage = "Format email tidak valid";
    } else if ((error as Error).message.includes("Password")) {
      errorMessage = "Password harus minimal 6 karakter";
    } else if ((error as Error).message) {
      errorMessage = (error as Error).message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<AuthResponse> {
  try {
    logger.auth("logout: START");

    const { error } = await supabase.auth.signOut();
    logger.auth("logout: Supabase response", { error });

    if (error) throw error;

    // Clear user role cache
    clearUserRoleCache();

    logger.auth("logout: Success");
    return {
      success: true,
      message: "Logged out successfully",
    };
  } catch (error: unknown) {
    logger.error("Logout error:", error);
    return {
      success: false,
      error: (error as Error).message || "Logout failed",
    };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<AuthSession | null> {
  logger.debug("getSession: START");

  try {
    const { data, error } = await supabase.auth.getSession();
    logger.debug("getSession: Response", {
      hasData: !!data,
      hasSession: !!data?.session,
      error,
    });

    if (error) throw error;
    if (!data.session) {
      logger.debug("getSession: No session found");
      return null;
    }

    // Fetch full user profile from database
    const user = await getUserProfile(data.session.user.id);

    logger.auth("getSession: User loaded ✅", {
      userId: user.id,
      role: user.role,
    });

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error: unknown) {
    logger.error("getSession error:", error);
    return null;
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    logger.auth("refreshSession: START");

    const { data, error } = await supabase.auth.refreshSession();
    logger.auth("refreshSession: Supabase response", {
      hasSession: !!data.session,
      error,
    });

    if (error) throw error;
    if (!data.session) {
      logger.auth("refreshSession: No session after refresh");
      return null;
    }

    logger.auth(
      "refreshSession: Calling getUserProfile for",
      data.session.user.id,
    );
    const user = await getUserProfile(data.session.user.id);
    logger.auth("refreshSession: Success", {
      userId: user.id,
      role: user.role,
    });

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error: unknown) {
    logger.error("Refresh session error:", error);
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    logger.auth("resetPassword: START", { email });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    logger.auth("resetPassword: Supabase response", { error });

    if (error) throw error;

    logger.auth("resetPassword: Success");
    return {
      success: true,
      message: "Password reset email sent",
    };
  } catch (error: unknown) {
    logger.error("Password reset error:", error);
    return {
      success: false,
      error: (error as Error).message || "Password reset failed",
    };
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  try {
    logger.auth("updatePassword: START");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    logger.auth("updatePassword: Supabase response", { error });

    if (error) throw error;

    logger.auth("updatePassword: Success");
    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error: unknown) {
    logger.error("Password update error:", error);
    return {
      success: false,
      error: (error as Error).message || "Password update failed",
    };
  }
}

/**
 * Create user profile and role-specific records
 * Called after successful registration
 */
async function createUserProfile(
  userId: string,
  data: RegisterData,
): Promise<void> {
  try {
    logger.debug("createUserProfile: START", {
      userId,
      role: data.role,
      hasMahasiswaData: !!(data.role === "mahasiswa" && data.nim),
      nim: data.nim,
    });

    // 1. Create user record in users table
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    });

    if (userError) {
      logger.error("createUserProfile: Users insert failed", userError);
      throw userError;
    }
    logger.debug("createUserProfile: User record created", { userId });

    // 2. Create role-specific records
    if (data.role === "mahasiswa" && data.nim) {
      logger.debug("createUserProfile: Creating mahasiswa record", {
        user_id: userId,
        nim: data.nim,
        angkatan: data.angkatan,
        semester: data.semester,
      });

      const mahasiswaPayload: any = {
        user_id: userId,
        nim: data.nim,
        angkatan: data.angkatan || new Date().getFullYear(),
        semester: data.semester || 1,
      };

      if (data.program_studi) {
        mahasiswaPayload.program_studi = data.program_studi;
      }

      const { error: mahasiswaError } = await supabase
        .from("mahasiswa")
        .insert([mahasiswaPayload]);

      if (mahasiswaError) {
        logger.error(
          "createUserProfile: Mahasiswa insert failed",
          mahasiswaError,
        );
        throw mahasiswaError;
      }
      logger.debug("createUserProfile: Mahasiswa record created", { userId });
    } else if (data.role === "mahasiswa") {
      logger.warn("createUserProfile: Mahasiswa role but missing nim", {
        role: data.role,
        nim: data.nim,
      });
    } else if (data.role === "dosen" && data.nidn) {
      const dosenPayload: any = {
        user_id: userId,
        nidn: data.nidn,
      };

      if (data.nip) dosenPayload.nip = data.nip;
      if (data.gelar_depan) dosenPayload.gelar_depan = data.gelar_depan;
      if (data.gelar_belakang)
        dosenPayload.gelar_belakang = data.gelar_belakang;

      const { error: dosenError } = await supabase
        .from("dosen")
        .insert([dosenPayload]);

      if (dosenError) throw dosenError;
      logger.debug("createUserProfile: Dosen record created", { userId });
    } else if (data.role === "laboran" && data.nip) {
      const { error: laboranError } = await supabase.from("laboran").insert([
        {
          user_id: userId,
          nip: data.nip,
        },
      ]);

      if (laboranError) throw laboranError;
      logger.debug("createUserProfile: Laboran record created", { userId });
    }

    logger.debug("createUserProfile: Success", { userId, role: data.role });
  } catch (error: unknown) {
    logger.error("createUserProfile error:", error);
    // ✅ FIXED: Throw error so register() can handle rollback
    throw error;
  }
}

/**
 * Get user profile with role-specific data
 * ✅ FIXED: Increased timeout to 10s and better error handling
 */
async function getUserProfile(userId: string): Promise<AuthUser> {
  logger.debug("getUserProfile: START", { userId });

  try {
    // Timeout for database query (10 seconds for login operations)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for auth operations

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    logger.debug("getUserProfile: Query result", {
      hasUser: !!user,
      role: user?.role,
    });

    if (userError) {
      // Suppress PGRST116 (0 rows) as debug instead of warning during registration
      if (userError.code === "PGRST116") {
        logger.debug(
          "getUserProfile: User profile not found (likely during creation)",
        );
        throw new Error("User account has been deleted");
      }
      logger.warn("getUserProfile: Database error", userError);
      throw userError;
    }

    if (!user) {
      logger.debug("getUserProfile: User not found (likely during creation)");
      throw new Error("User account has been deleted");
    }

    logger.debug("getUserProfile: User found", {
      userId: user.id,
      role: user.role,
    });

    // Get role-specific data
    let roleData = null;
    try {
      logger.debug("getUserProfile: Fetching role data:", user.role);

      switch (user.role) {
        case "mahasiswa": {
          const { data: mahasiswaData } = await supabase
            .from("mahasiswa")
            .select("id, nim, program_studi, angkatan, semester")
            .eq("user_id", userId)
            .maybeSingle();

          logger.debug("Role data: mahasiswa", { hasData: !!mahasiswaData });
          roleData = { mahasiswa: mahasiswaData };
          break;
        }

        case "dosen": {
          const { data: dosenData } = await supabase
            .from("dosen")
            .select(
              "id, nip, nidn, gelar_depan, gelar_belakang, fakultas, program_studi",
            )
            .eq("user_id", userId)
            .maybeSingle();

          logger.debug("Role data: dosen", { hasData: !!dosenData });
          roleData = { dosen: dosenData };
          break;
        }

        case "laboran": {
          const { data: laboranData } = await supabase
            .from("laboran")
            .select("id, nip")
            .eq("user_id", userId)
            .maybeSingle();

          logger.debug("Role data: laboran", { hasData: !!laboranData });
          roleData = { laboran: laboranData };
          break;
        }

        case "admin": {
          const { data: adminData } = await supabase
            .from("admin")
            .select("id, level, permissions")
            .eq("user_id", userId)
            .maybeSingle();

          logger.debug("Role data: admin", { hasData: !!adminData });
          roleData = { admin: adminData };
          break;
        }
      }
    } catch (roleError) {
      logger.warn("getUserProfile: Failed to fetch role data", roleError);
      // Don't throw, just continue without role data
    }

    logger.auth("getUserProfile: SUCCESS ✅", {
      userId: user.id,
      role: user.role,
      hasRoleData: !!roleData,
    });

    return { ...user, ...roleData } as AuthUser;
  } catch (error: unknown) {
    // Don't use fallback if user was deleted
    if ((error as Error).message?.includes("deleted")) {
      logger.debug("getUserProfile: User not ready yet (during registration)");
      throw error;
    }

    logger.error("getUserProfile: ERROR", error);

    // Better error handling for abort errors
    if ((error as Error).name === "AbortError") {
      logger.error(
        "getUserProfile: Query timeout - database took too long to respond",
      );
    }

    // FALLBACK: Get user from auth.getUser() metadata
    // Only for network/timeout errors, NOT for deleted users
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        logger.error("getUserProfile: Fallback failed", authError);
        throw new Error("Cannot get user data");
      }

      logger.warn("getUserProfile: Using fallback (network issue)", {
        userId: authUser.id,
        role: authUser.user_metadata?.role,
      });

      // Return user from auth metadata (temporary fallback)
      return {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.user_metadata?.full_name || "User",
        role: authUser.user_metadata?.role || "mahasiswa",
        phone: authUser.user_metadata?.phone || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        is_active: true,
        last_seen_at: null,
        metadata: {},
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
      } as AuthUser;
    } catch (fallbackError) {
      logger.error("getUserProfile: Fallback also failed", fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Listen to auth state changes
 * ✅ FIXED: Fetch full user profile instead of using metadata only
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void,
) {
  logger.debug("onAuthStateChange: Setting up listener");

  return supabase.auth.onAuthStateChange(async (event, session) => {
    // Only log important events (not INITIAL_SESSION)
    if (event !== "INITIAL_SESSION") {
      logger.auth("onAuthStateChange:", {
        event,
        hasSession: !!session,
      });
    }

    if (session?.user) {
      try {
        // For SIGNED_IN event (new registration), retry with delay to avoid race condition
        if (event === "SIGNED_IN") {
          // Wait a bit for profile creation to complete
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Fetch full profile from database
        const user = await getUserProfile(session.user.id);

        logger.debug("onAuthStateChange: Profile loaded", {
          userId: user.id,
          role: user.role,
        });

        callback({
          user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        });
      } catch (error: unknown) {
        const errorMsg = (error as Error).message || "";

        // If user was deleted or profile not ready yet, just return null silently
        // (This is normal during registration - profile is being created)
        if (errorMsg.includes("deleted") || errorMsg.includes("0 rows")) {
          logger.debug("onAuthStateChange: Profile not ready yet, skipping");
          callback(null);
          return;
        }

        logger.error("onAuthStateChange: Error loading profile", error);
        callback(null);
      }
    } else {
      logger.debug("onAuthStateChange: No session");
      callback(null);
    }
  });
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    logger.auth("getCurrentUser: START");

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    logger.auth("getCurrentUser: Supabase response", {
      hasUser: !!user,
      error,
    });

    if (!user) {
      logger.auth("getCurrentUser: No user found");
      return null;
    }

    logger.auth("getCurrentUser: Calling getUserProfile for", user.id);
    const profile = await getUserProfile(user.id);
    logger.auth("getCurrentUser: Success", {
      userId: profile.id,
      role: profile.role,
    });

    return profile;
  } catch (error: unknown) {
    logger.error("Get current user error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    logger.auth("isAuthenticated: START");

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    const authenticated = !!session;

    logger.auth("isAuthenticated: Result", { authenticated, error });

    return authenticated;
  } catch (error: unknown) {
    logger.error("isAuthenticated error:", error);
    return false;
  }
}
