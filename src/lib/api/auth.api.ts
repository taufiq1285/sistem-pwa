/**
 * Auth API Layer - Wrapper untuk supabase auth functions
 *
 * Purpose: Menyediakan API layer yang konsisten untuk autentikasi
 * Pattern: Re-export dari supabase/auth.ts dengan error handling tambahan
 *
 * ✅ BACKWARD COMPATIBLE: Existing code tetap berjalan
 */

import * as supabaseAuth from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from "@/types/auth.types";

// ═══════════════════════════════════════════════════════════════════
// EXPORTS - Re-export dari supabase/auth.ts (backward compatible)
// ═══════════════════════════════════════════════════════════════════

/**
 * Login dengan email dan password
 * ✅ Supports online & offline login
 */
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  try {
    logger.debug("[auth.api] login:", credentials.email);
    return await supabaseAuth.login(credentials);
  } catch (error) {
    logger.error("[auth.api] login failed:", error);
    throw error;
  }
}

/**
 * Register user baru
 * ✅ Includes rollback mechanism untuk failed registration
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    logger.debug("[auth.api] register:", {
      email: data.email,
      role: data.role,
    });
    return await supabaseAuth.register(data);
  } catch (error) {
    logger.error("[auth.api] register failed:", error);
    throw error;
  }
}

/**
 * Logout current user
 * ✅ Clears cache & offline data
 */
export async function logout(): Promise<AuthResponse> {
  try {
    logger.debug("[auth.api] logout");
    return await supabaseAuth.logout();
  } catch (error) {
    logger.error("[auth.api] logout failed:", error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    return await supabaseAuth.getSession();
  } catch (error) {
    logger.error("[auth.api] getSession failed:", error);
    return null;
  }
}

/**
 * Refresh session
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    return await supabaseAuth.refreshSession();
  } catch (error) {
    logger.error("[auth.api] refreshSession failed:", error);
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    logger.debug("[auth.api] resetPassword:", email);
    return await supabaseAuth.resetPassword(email);
  } catch (error) {
    logger.error("[auth.api] resetPassword failed:", error);
    throw error;
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  try {
    logger.debug("[auth.api] updatePassword");
    return await supabaseAuth.updatePassword(password);
  } catch (error) {
    logger.error("[auth.api] updatePassword failed:", error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return await supabaseAuth.getCurrentUser();
  } catch (error) {
    logger.error("[auth.api] getCurrentUser failed:", error);
    return null;
  }
}

/**
 * Check if authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    return await supabaseAuth.isAuthenticated();
  } catch (error) {
    logger.error("[auth.api] isAuthenticated failed:", error);
    return false;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void,
) {
  return supabaseAuth.onAuthStateChange(callback);
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS (Optional - untuk future use)
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password minimal 6 karakter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf besar");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf kecil");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 angka");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format user display name dengan gelar (untuk dosen)
 */
export function formatUserDisplayName(user: AuthUser): string {
  if (user.role === "dosen" && user.dosen) {
    const { gelar_depan, gelar_belakang } = user.dosen;
    let name = user.full_name;

    if (gelar_depan) {
      name = `${gelar_depan} ${name}`;
    }

    if (gelar_belakang) {
      name = `${name}, ${gelar_belakang}`;
    }

    return name;
  }

  return user.full_name;
}

/**
 * Get user identifier (NIM/NIP/Email)
 */
export function getUserIdentifier(user: AuthUser): string {
  switch (user.role) {
    case "mahasiswa":
      return user.mahasiswa?.nim || user.email;
    case "dosen":
      return user.dosen?.nip || user.dosen?.nidn || user.email;
    case "laboran":
      return user.laboran?.nip || user.email;
    case "admin":
      return user.email;
    default:
      return user.email;
  }
}
