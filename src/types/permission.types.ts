/**
 * Permission Types
 * Types for role-based permissions and access control
 */

import type { UserRole } from './auth.types';

// ============================================================================
// PERMISSION ACTIONS
// ============================================================================

/**
 * Permission actions that can be performed
 */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'view'
  | 'approve'
  | 'grade';

/**
 * Resource types that permissions apply to
 */
export type PermissionResource =
  | 'user'
  | 'mahasiswa'
  | 'dosen'
  | 'laboran'
  | 'admin'
  | 'mata_kuliah'
  | 'kelas'
  | 'jadwal'
  | 'laboratorium'
  | 'kuis'
  | 'soal'
  | 'attempt_kuis'
  | 'jawaban'
  | 'nilai'
  | 'materi'
  | 'inventaris'
  | 'peminjaman'
  | 'pengumuman'
  | 'notification';

/**
 * Permission string format: "action:resource"
 * Examples: "create:kuis", "manage:users", "view:nilai"
 */
export type Permission = `${PermissionAction}:${PermissionResource}`;

// ============================================================================
// PERMISSION SETS
// ============================================================================

/**
 * Permission set for a role
 */
export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
  description: string;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Context for permission checking
 */
export interface PermissionContext {
  user: {
    id: string;
    role: UserRole;
  };
  resource?: {
    id?: string;
    ownerId?: string;
    type: PermissionResource;
  };
}

// ============================================================================
// PERMISSION CONFIGURATION
// ============================================================================

/**
 * Complete permission configuration
 */
export interface PermissionConfig {
  roles: Record<UserRole, RolePermissions>;
  hierarchies: {
    role: UserRole;
    inheritsFrom?: UserRole[];
  }[];
}

/**
 * Permission validation result
 */
export interface PermissionValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}