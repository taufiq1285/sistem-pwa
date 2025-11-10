/**
 * Authentication Types
 * Types for auth system, user sessions, and role-based access
 */

import type { Database } from './database.types';

// User role type from database (includes all roles)
export type UserRole = Database['public']['Enums']['user_role'];

// Registerable roles only (admin excluded)
export type RegisterableRole = 'mahasiswa' | 'dosen' | 'laboran';

// User from database
type UserTable = Database['public']['Tables']['users']['Row'];

// Extended user with profile data
export interface AuthUser extends UserTable {
  // Contact information
  phone?: string | null;

  // Profile data based on role
  mahasiswa?: {
    id: string; // ✅ ADDED: mahasiswa table id
    nim: string;
    program_studi: string;
    angkatan: number;
    semester: number;
  };
  dosen?: {
    id: string; // ✅ ADDED: dosen table id
    nip: string;
    nidn?: string;
    gelar_depan?: string;
    gelar_belakang?: string;
    fakultas?: string;
    program_studi?: string;
  };
  laboran?: {
    id: string; // ✅ ADDED: laboran table id
    nip: string;
  };
  admin?: {
    id: string; // ✅ ADDED: admin table id
    nip: string;
  };
}

// Auth session
export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

// Auth state
export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Register data - only allows registerable roles
export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role: RegisterableRole;  // Only mahasiswa, dosen, laboran
  phone?: string;
  
  // Role-specific data
  nim?: string;
  nip?: string;
  nidn?: string;
  program_studi?: string;
  angkatan?: number;
  semester?: number;
  gelar_depan?: string;
  gelar_belakang?: string;
  fakultas?: string;
}

// Password reset
export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  password: string;
}

// Auth response
export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  session?: AuthSession;
  error?: string;
  message?: string;
}

// Auth error
export interface AuthError {
  code: string;
  message: string;
  status?: number;
}