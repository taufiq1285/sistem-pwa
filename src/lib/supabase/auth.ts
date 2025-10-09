/**
 * Supabase Auth Helper
 * Wrapper functions for Supabase authentication
 */

import { supabase } from './client';
import type { 
  AuthUser, 
  AuthSession, 
  LoginCredentials, 
  RegisterData,
  AuthResponse 
} from '@/types/auth.types';

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('No user returned from login');
    }

    // Get user profile data
    const user = await getUserProfile(data.user.id);

    return {
      success: true,
      user,
      session: {
        user,
        access_token: data.session?.access_token || '',
        refresh_token: data.session?.refresh_token || '',
        expires_at: data.session?.expires_at,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // 1. Create auth user
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
    if (!authData.user) throw new Error('No user created');

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        phone: data.phone,
      });

    if (profileError) throw profileError;

    // 3. Create role-specific profile
    await createRoleProfile(authData.user.id, data);

    // 4. Get complete user profile
    const user = await getUserProfile(authData.user.id);

    return {
      success: true,
      user,
      message: 'Registration successful. Please check your email for verification.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Registration failed',
    };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Logout failed',
    };
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;

    const user = await getUserProfile(data.session.user.id);

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (!data.session) return null;

    const user = await getUserProfile(data.session.user.id);

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error) {
    console.error('Refresh session error:', error);
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password reset email sent',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Password reset failed',
    };
  }
}

/**
 * Update password
 */
export async function updatePassword(password: string): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Password update failed',
    };
  }
}

/**
 * Get user profile with role-specific data
 */
async function getUserProfile(userId: string): Promise<AuthUser> {
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      mahasiswa (*),
      dosen (*),
      laboran (*),
      admin (*)
    `)
    .eq('id', userId)
    .single();

  if (error) throw error;
  if (!user) throw new Error('User not found');

  return user as unknown as AuthUser;
}

/**
 * Create role-specific profile
 */
async function createRoleProfile(userId: string, data: RegisterData): Promise<void> {
  const roleData = {
    user_id: userId,
  };

  switch (data.role) {
    case 'mahasiswa':
      if (!data.nim || !data.program_studi || !data.angkatan || !data.semester) {
        throw new Error('Missing required mahasiswa data');
      }
      await supabase.from('mahasiswa').insert({
        ...roleData,
        nim: data.nim,
        program_studi: data.program_studi,
        angkatan: data.angkatan,
        semester: data.semester,
      });
      break;

    case 'dosen':
      if (!data.nip) throw new Error('Missing NIP for dosen');
      await supabase.from('dosen').insert({
        ...roleData,
        nip: data.nip,
        gelar_depan: data.gelar_depan,
        gelar_belakang: data.gelar_belakang,
      });
      break;

    case 'laboran':
      if (!data.nip) throw new Error('Missing NIP for laboran');
      await supabase.from('laboran').insert({
        ...roleData,
        nip: data.nip,
      });
      break;

    case 'admin':
      if (!data.nip) throw new Error('Missing NIP for admin');
      await supabase.from('admin').insert({
        ...roleData,
        nip: data.nip,
      });
      break;

    default:
      throw new Error('Invalid role');
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      try {
        const user = await getUserProfile(session.user.id);
        callback({
          user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        });
      } catch (error) {
        console.error('Error getting user profile:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}