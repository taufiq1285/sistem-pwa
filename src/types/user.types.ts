/**
 * User Types
 *
 * Re-exports from auth.types.ts with additional user-specific types
 * for user management and profile operations
 */

// Import types for use in this file
import type { UserRole, AuthUser, RegisterData } from './auth.types';

// Re-export types from auth.types for backward compatibility
export type { UserRole, AuthUser, RegisterData, RegisterableRole } from './auth.types';

// ============================================================================
// ADDITIONAL USER TYPES
// ============================================================================

/**
 * User profile update data (common fields)
 */
export interface UpdateUserProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

/**
 * Mahasiswa profile update
 */
export interface UpdateMahasiswaProfileData extends UpdateUserProfileData {
  program_studi?: string;
  semester?: number;
  angkatan?: number;
}

/**
 * Dosen profile update
 */
export interface UpdateDosenProfileData extends UpdateUserProfileData {
  nidn?: string;
  gelar_depan?: string;
  gelar_belakang?: string;
  fakultas?: string;
  program_studi?: string;
}

/**
 * Laboran profile update
 * Currently uses the same fields as base profile
 */
export type UpdateLaboranProfileData = UpdateUserProfileData;

/**
 * Admin profile update
 */
export interface UpdateAdminProfileData extends UpdateUserProfileData {
  level?: string;
}

/**
 * User list item (simplified for lists)
 */
export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;

  // Role-specific identifier
  nim?: string;
  nip?: string;
}

/**
 * User filter options
 */
export interface UserFilterOptions {
  role?: UserRole;
  is_active?: boolean;
  search?: string; // Search by name, email, NIM, NIP
}

/**
 * User statistics
 */
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  by_role: {
    admin: number;
    dosen: number;
    mahasiswa: number;
    laboran: number;
  };
}

/**
 * User creation result
 */
export interface UserCreationResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  message?: string;
}

/**
 * Bulk user creation data
 */
export interface BulkUserData {
  users: RegisterData[];
  send_email?: boolean; // Send welcome email
}

/**
 * Bulk user creation result
 */
export interface BulkUserCreationResult {
  total: number;
  successful: number;
  failed: number;
  results: UserCreationResult[];
  errors: Array<{
    email: string;
    error: string;
  }>;
}