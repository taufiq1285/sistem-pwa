/**
 * Permission Middleware
 * API-level permission validation for RBAC system
 *
 * USAGE:
 * ```typescript
 * export const createKuis = requirePermission(
 *   'create:kuis',
 *   async (data) => {
 *     return insert('kuis', data);
 *   }
 * );
 * ```
 *
 * FEATURES:
 * - Type-safe permission checking
 * - Admin bypass (admin can do everything)
 * - Ownership validation
 * - Backward compatible with existing error handling
 * - OFFLINE MODE: Falls back to stored session when Supabase is unavailable
 */

import { supabase } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/utils/permissions";
import type { UserRole, AuthUser } from "@/types/auth.types";
import type { Permission } from "@/types/permission.types";
import {
  PermissionError,
  OwnershipError,
  AuthenticationError,
  RoleNotFoundError,
} from "@/lib/errors/permission.errors";
import { restoreOfflineSession } from "@/lib/offline/offline-auth";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Current user with role information
 */
export interface CurrentUser {
  id: string;
  role: UserRole;
  email?: string;
}

/**
 * Ownership validation options
 */
export interface OwnershipOptions {
  table: string;
  resourceId: string;
  ownerField?: string;
  allowAdmin?: boolean;
}

// ============================================================================
// USER CONTEXT FUNCTIONS
// ============================================================================

/**
 * In-memory cache untuk user role (berlaku selama session)
 * Cache ini akan di-clear saat user logout atau refresh page
 */
const userRoleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

// Debug logging (disabled in tests and production)
const DEBUG_PERMISSION_LOGS =
  import.meta.env.DEV && import.meta.env.MODE !== "test";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_PERMISSION_LOGS) console.log(...args);
};
const debugWarn = (...args: unknown[]) => {
  if (DEBUG_PERMISSION_LOGS) console.warn(...args);
};
const debugError = (...args: unknown[]) => {
  if (DEBUG_PERMISSION_LOGS) console.error(...args);
};

/**
 * Clear user role cache (dipanggil saat logout)
 */
export function clearUserRoleCache(): void {
  userRoleCache.clear();
}

/**
 * Get current authenticated user
 * @throws {AuthenticationError} If user not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  // Try online mode first
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      return {
        id: user.id,
        role: "mahasiswa", // Default, will be overridden below
        email: user.email,
      };
    }
  } catch (error) {
    // Supabase unavailable, fall through to offline mode
    debugWarn("⚠️ Supabase unavailable, trying offline session");
  }

  // Fallback to offline session
  const offlineSession = await restoreOfflineSession();
  if (offlineSession) {
    debugLog("✅ Using offline session for getCurrentUser");
    return {
      id: offlineSession.user.id,
      role: offlineSession.user.role,
      email: offlineSession.user.email,
    };
  }

  // No user found online or offline
  throw new AuthenticationError("User not authenticated");
}

/**
 * Get current user with role from database (with caching)
 * @throws {AuthenticationError} If user not authenticated
 * @throws {RoleNotFoundError} If user role not found
 */
export async function getCurrentUserWithRole(): Promise<CurrentUser> {
  // Try online mode first
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      // Check if running in test environment
      const isTestEnv = import.meta.env.MODE === "test";

      // Check cache first (skip in tests to avoid stale cross-test state)
      const cached = userRoleCache.get(user.id);
      if (!isTestEnv && cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return {
          id: user.id,
          role: cached.role,
          email: user.email,
        };
      }

      // Get user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userError && userData) {
        // Update cache
        userRoleCache.set(user.id, {
          role: userData.role as UserRole,
          timestamp: Date.now(),
        });

        return {
          id: user.id,
          role: userData.role as UserRole,
          email: user.email,
        };
      }
    }
  } catch (error) {
    // Supabase unavailable, fall through to offline mode
    debugWarn("⚠️ Supabase unavailable, trying offline session for role");
  }

  // Fallback to offline session
  const offlineSession = await restoreOfflineSession();
  if (offlineSession) {
    const user = offlineSession.user;
    debugLog("✅ Using offline session for getCurrentUserWithRole:", user.role);

    // Check cache for offline user
    const cached = userRoleCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        id: user.id,
        role: cached.role,
        email: user.email,
      };
    }

    // Update cache with offline user's role
    userRoleCache.set(user.id, {
      role: user.role,
      timestamp: Date.now(),
    });

    return {
      id: user.id,
      role: user.role,
      email: user.email,
    };
  }

  // No user found online or offline
  throw new AuthenticationError("User not authenticated");
}

/**
 * Get current dosen ID
 * @returns Dosen ID or null if user is not a dosen
 */
export async function getCurrentDosenId(): Promise<string | null> {
  try {
    // Try online mode first
    try {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("dosen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        return data.id;
      }
    } catch {
      // Supabase unavailable, fall through to offline mode
      debugWarn("⚠️ Supabase unavailable for dosen ID, trying offline session");
    }

    // Fallback to offline session
    const offlineSession = await restoreOfflineSession();
    if (offlineSession?.user.dosen?.id) {
      debugLog("✅ Using offline session for dosen ID");
      return offlineSession.user.dosen.id;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get current mahasiswa ID
 * @returns Mahasiswa ID or null if user is not a mahasiswa
 */
export async function getCurrentMahasiswaId(): Promise<string | null> {
  try {
    // Try online mode first
    try {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("mahasiswa")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        return data.id;
      }
    } catch {
      // Supabase unavailable, fall through to offline mode
      debugWarn(
        "⚠️ Supabase unavailable for mahasiswa ID, trying offline session",
      );
    }

    // Fallback to offline session
    const offlineSession = await restoreOfflineSession();
    if (offlineSession?.user.mahasiswa?.id) {
      debugLog("✅ Using offline session for mahasiswa ID");
      return offlineSession.user.mahasiswa.id;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get current laboran ID
 * @returns Laboran ID or null if user is not a laboran
 */
export async function getCurrentLaboranId(): Promise<string | null> {
  try {
    // Try online mode first
    try {
      const user = await getCurrentUser();

      const { data, error } = await supabase
        .from("laboran")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        return data.id;
      }
    } catch {
      // Supabase unavailable, fall through to offline mode
      debugWarn(
        "⚠️ Supabase unavailable for laboran ID, trying offline session",
      );
    }

    // Fallback to offline session
    const offlineSession = await restoreOfflineSession();
    if (offlineSession?.user.laboran?.id) {
      debugLog("✅ Using offline session for laboran ID");
      return offlineSession.user.laboran.id;
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// PERMISSION VALIDATION
// ============================================================================

/**
 * Check if user has required permission
 * @throws {PermissionError} If user lacks permission
 */
export async function checkPermission(permission: Permission): Promise<void> {
  debugLog("🔍 DEBUG: checkPermission called:", permission);
  const user = await getCurrentUserWithRole();
  debugLog("🔍 DEBUG: user:", user);

  // Admin bypass - admin can do everything
  if (user.role === "admin") {
    debugLog("✅ DEBUG: Admin bypass for permission:", permission);
    return;
  }

  // Check if user has permission
  const hasPermissionResult = hasPermission(user.role, permission);
  debugLog(
    "🔍 DEBUG: hasPermission result:",
    hasPermissionResult,
    "for role:",
    user.role,
    "permission:",
    permission,
  );

  if (!hasPermissionResult) {
    debugError(
      "❌ DEBUG: Permission denied for role:",
      user.role,
      "permission:",
      permission,
    );
    throw new PermissionError(
      `Missing permission: ${permission}`,
      permission,
      user.role,
    );
  }

  debugLog(
    "✅ DEBUG: Permission granted for role:",
    user.role,
    "permission:",
    permission,
  );
}

/**
 * Wrapper function to enforce permission checks on async functions
 *
 * @param permission - Required permission
 * @param fn - Function to wrap
 * @returns Wrapped function with permission check
 *
 * @example
 * ```typescript
 * export const createKuis = requirePermission(
 *   'create:kuis',
 *   async (data: CreateKuisData): Promise<Kuis> => {
 *     return insert('kuis', data);
 *   }
 * );
 * ```
 */
export function requirePermission<T extends any[], R>(
  permission: Permission,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // Check permission first
    await checkPermission(permission);

    // Execute original function
    return fn(...args);
  };
}

/**
 * Check multiple permissions (user must have at least one)
 * @throws {PermissionError} If user has none of the permissions
 */
export async function checkAnyPermission(
  permissions: Permission[],
): Promise<void> {
  const user = await getCurrentUserWithRole();

  // Admin bypass
  if (user.role === "admin") {
    return;
  }

  // Check if user has any of the permissions
  const hasAny = permissions.some((permission) =>
    hasPermission(user.role, permission),
  );

  if (!hasAny) {
    throw new PermissionError(
      `Missing one of permissions: ${permissions.join(", ")}`,
      permissions[0],
      user.role,
    );
  }
}

/**
 * Check multiple permissions (user must have all)
 * @throws {PermissionError} If user lacks any permission
 */
export async function checkAllPermissions(
  permissions: Permission[],
): Promise<void> {
  const user = await getCurrentUserWithRole();

  // Admin bypass
  if (user.role === "admin") {
    return;
  }

  // Check each permission
  for (const permission of permissions) {
    if (!hasPermission(user.role, permission)) {
      throw new PermissionError(
        `Missing permission: ${permission}`,
        permission,
        user.role,
      );
    }
  }
}

// ============================================================================
// OWNERSHIP VALIDATION
// ============================================================================

/**
 * Validate resource ownership
 *
 * @param options - Ownership validation options
 * @throws {OwnershipError} If user is not the owner
 * @throws {Error} If resource not found
 *
 * @example
 * ```typescript
 * // Check if user owns the kuis
 * await requireOwnership({
 *   table: 'kuis',
 *   resourceId: kuisId,
 *   ownerField: 'dosen_id'
 * });
 * ```
 */
export async function requireOwnership(
  options: OwnershipOptions,
): Promise<void> {
  const {
    table,
    resourceId,
    ownerField = "user_id",
    allowAdmin = true,
  } = options;

  const user = await getCurrentUserWithRole();

  // Admin bypass (if allowed)
  if (allowAdmin && user.role === "admin") {
    debugLog(`✅ Admin bypass: ownership check for ${table}/${resourceId}`);
    return;
  }

  // Get resource from database
  const { data, error } = await supabase
    .from(table as any)
    .select(ownerField)
    .eq("id", resourceId)
    .single();

  if (error || !data) {
    throw new Error(`Resource not found: ${table}/${resourceId}`);
  }

  const ownerId = (data as any)[ownerField];

  // Handle different ownership patterns
  if (ownerField === "user_id") {
    // Direct user ownership
    if (ownerId !== user.id) {
      debugWarn(
        `❌ Ownership denied: ${user.id} tried to access ${table}/${resourceId} owned by ${ownerId}`,
      );
      throw new OwnershipError(
        "You can only access your own resources",
        table,
        resourceId,
      );
    }
  } else if (ownerField === "dosen_id") {
    // Dosen ownership
    const currentDosenId = await getCurrentDosenId();
    if (!currentDosenId || ownerId !== currentDosenId) {
      throw new OwnershipError(
        "You can only access your own resources",
        table,
        resourceId,
      );
    }
  } else if (ownerField === "mahasiswa_id") {
    // Mahasiswa ownership
    const currentMahasiswaId = await getCurrentMahasiswaId();
    if (!currentMahasiswaId || ownerId !== currentMahasiswaId) {
      throw new OwnershipError(
        "You can only access your own resources",
        table,
        resourceId,
      );
    }
  } else if (ownerField === "laboran_id") {
    // Laboran ownership
    const currentLaboranId = await getCurrentLaboranId();
    if (!currentLaboranId || ownerId !== currentLaboranId) {
      throw new OwnershipError(
        "You can only access your own resources",
        table,
        resourceId,
      );
    }
  } else {
    // Generic ownership check (fallback)
    if (ownerId !== user.id) {
      throw new OwnershipError(
        "You can only access your own resources",
        table,
        resourceId,
      );
    }
  }

  debugLog(`✅ Ownership verified: ${user.role} owns ${table}/${resourceId}`);
}

/**
 * Combined permission + ownership check
 * Useful for update/delete operations
 *
 * @example
 * ```typescript
 * export const updateKuis = requirePermissionAndOwnership(
 *   'update:kuis',
 *   { table: 'kuis', ownerField: 'dosen_id' },
 *   0, // resourceId is first argument
 *   async (id, data) => {
 *     return update('kuis', id, data);
 *   }
 * );
 * ```
 */
export function requirePermissionAndOwnership<T extends any[], R>(
  permission: Permission,
  ownershipConfig: Omit<OwnershipOptions, "resourceId">,
  resourceIdIndex: number,
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    // Check permission first
    await checkPermission(permission);

    // Get resourceId from arguments
    const resourceId = args[resourceIdIndex] as string;

    // Check ownership
    await requireOwnership({
      ...ownershipConfig,
      resourceId,
    });

    // Execute original function
    return fn(...args);
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    return user.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUserWithRole();
    return user.role === role;
  } catch {
    return false;
  }
}
