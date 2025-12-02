/**
 * Role Types
 * Types and constants for role-based access control
 */

import type { UserRole } from './auth.types';
import type { Permission } from './permission.types';

// ============================================================================
// ROLE CONSTANTS
// ============================================================================

/**
 * All available roles in the system
 */
export const ROLES = {
  ADMIN: 'admin',
  DOSEN: 'dosen',
  MAHASISWA: 'mahasiswa',
  LABORAN: 'laboran',
} as const;

/**
 * Role display names (Indonesian)
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  dosen: 'Dosen',
  mahasiswa: 'Mahasiswa',
  laboran: 'Laboran',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Mengelola seluruh sistem, user, dan konfigurasi',
  dosen: 'Mengelola mata kuliah, kelas, kuis, dan penilaian mahasiswa',
  mahasiswa: 'Mengikuti praktikum, mengerjakan kuis, dan melihat nilai',
  laboran: 'Mengelola inventaris, laboratorium, dan persetujuan peminjaman',
};

/**
 * Role hierarchy levels (higher = more privileges)
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  dosen: 3,
  laboran: 2,
  mahasiswa: 1,
};

// ============================================================================
// ROLE METADATA
// ============================================================================

/**
 * Role metadata interface
 */
export interface RoleMetadata {
  role: UserRole;
  label: string;
  description: string;
  hierarchy: number;
  color: string;
  icon: string;
  dashboardPath: string;
  permissions: Permission[];
}

/**
 * Complete role metadata configuration
 */
export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  admin: {
    role: 'admin',
    label: 'Administrator',
    description: 'Mengelola seluruh sistem, user, dan konfigurasi',
    hierarchy: 4,
    color: 'red',
    icon: 'Shield',
    dashboardPath: '/admin',
    permissions: [
      'manage:user',
      'manage:users',
      'view:all_users',
      'manage:mahasiswa',
      'manage:dosen',
      'manage:laboran',
      'manage:admin',
      'manage:mata_kuliah',
      'manage:kelas',
      'manage:kelas_mahasiswa',
      'manage:jadwal',
      'manage:laboratorium',
      'manage:kuis',
      'manage:inventaris',
      'manage:peminjaman',
      'manage:pengumuman',
      'manage:materi',
      'manage:sync',
      'view:dashboard',
      'view:analytics',
      'view:nilai',
      'manage:notification',
    ],
  },
  dosen: {
    role: 'dosen',
    label: 'Dosen',
    description: 'Mengelola mata kuliah, kelas, kuis, dan penilaian mahasiswa',
    hierarchy: 3,
    color: 'blue',
    icon: 'GraduationCap',
    dashboardPath: '/dosen',
    permissions: [
      'manage:mata_kuliah',
      'view:mata_kuliah',
      'manage:kelas',
      'manage:kelas_mahasiswa',
      'view:mahasiswa',
      'manage:jadwal',
      'view:jadwal',
      'manage:kehadiran',
      'manage:kuis',
      'manage:soal',
      'grade:attempt_kuis',
      'view:jawaban',
      'manage:nilai',
      'manage:materi',
      'view:materi',
      'create:peminjaman',
      'update:peminjaman',
      'view:peminjaman',
      'create:pengumuman',
      'view:notification',
    ],
  },
  mahasiswa: {
    role: 'mahasiswa',
    label: 'Mahasiswa',
    description: 'Mengikuti praktikum, mengerjakan kuis, dan melihat nilai',
    hierarchy: 1,
    color: 'green',
    icon: 'User',
    dashboardPath: '/mahasiswa',
    permissions: [
      'view:jadwal',
      'manage:kehadiran',
      'view:kuis',
      'create:attempt_kuis',
      'update:attempt_kuis',
      'view:attempt_kuis',
      'create:jawaban',
      'update:jawaban',
      'view:jawaban',
      'view:nilai',
      'view:materi',
      'create:peminjaman',
      'view:peminjaman',
      'view:pengumuman',
      'view:notification',
    ],
  },
  laboran: {
    role: 'laboran',
    label: 'Laboran',
    description: 'Mengelola inventaris, laboratorium, dan persetujuan peminjaman',
    hierarchy: 2,
    color: 'purple',
    icon: 'Wrench',
    dashboardPath: '/laboran',
    permissions: [
      'manage:inventaris',
      'manage:laboratorium',
      'manage:peminjaman',
      'view:peminjaman',
      'update:peminjaman',
      'view:jadwal',
      'manage:kehadiran',
      'view:notification',
    ],
  },
};

// ============================================================================
// ROLE CHECKER TYPES
// ============================================================================

/**
 * Role checker function type
 */
export type RoleChecker = (userRole: UserRole) => boolean;

/**
 * Role comparison result
 */
export interface RoleComparison {
  isHigher: boolean;
  isLower: boolean;
  isEqual: boolean;
  difference: number;
}

/**
 * Role validation result
 */
export interface RoleValidation {
  isValid: boolean;
  role?: UserRole;
  error?: string;
}