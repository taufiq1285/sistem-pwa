/**
 * Supabase Auth Helper - OPTIMIZED: Reduced console logging
 * Wrapper functions for Supabase authentication with role-specific data
 */

import { supabase } from './client';
import logger from '@/lib/utils/logger';
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
    logger.auth('login: START', { email: credentials.email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    logger.debug('login: Supabase response', { hasUser: !!data.user, error });

    if (error) throw error;

    if (!data.user) {
      throw new Error('No user returned from login');
    }

    logger.debug('login: Calling getUserProfile for', data.user.id);
    const user = await getUserProfile(data.user.id);
    logger.auth('login: Success ✅', { userId: user.id, role: user.role });

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
    console.error('❌ login error:', error);
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
    console.log('🔵 register: START', { email: data.email, role: data.role });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
          phone: data.phone || null,
          ...(data.role === 'mahasiswa' && {
            nim: data.nim,
            program_studi: data.program_studi,
            angkatan: data.angkatan,
            semester: data.semester,
          }),
          ...(data.role === 'dosen' && {
            nip: data.nip,
            nidn: data.nidn,
            gelar_depan: data.gelar_depan,
            gelar_belakang: data.gelar_belakang,
          }),
          ...(data.role === 'laboran' && {
            nip: data.nip,
          }),
        },
      },
    });

    console.log('🔵 register: Supabase response', { hasUser: !!authData.user, error: authError });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Email sudah terdaftar. Silakan gunakan email lain atau login.');
      }
      throw authError;
    }

    if (!authData.user) throw new Error('No user created');

    console.log('🔵 register: Success', { userId: authData.user.id });

    return {
      success: true,
      message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.',
    };
  } catch (error: any) {
    console.error('❌ Registration error:', error);
    
    let errorMessage = 'Registrasi gagal';
    
    if (error.message.includes('already registered') || error.message.includes('sudah terdaftar')) {
      errorMessage = error.message;
    } else if (error.message.includes('Invalid email')) {
      errorMessage = 'Format email tidak valid';
    } else if (error.message.includes('Password')) {
      errorMessage = 'Password harus minimal 6 karakter';
    } else if (error.message) {
      errorMessage = error.message;
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
    console.log('🔵 logout: START');
    
    const { error } = await supabase.auth.signOut();
    console.log('🔵 logout: Supabase response', { error });
    
    if (error) throw error;

    console.log('🔵 logout: Success');
    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error: any) {
    console.error('❌ Logout error:', error);
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
  logger.debug('getSession: START');

  try {
    const { data, error } = await supabase.auth.getSession();
    logger.debug('getSession: Response', {
      hasData: !!data,
      hasSession: !!data?.session,
      error
    });

    if (error) throw error;
    if (!data.session) {
      logger.debug('getSession: No session found');
      return null;
    }

    // Fetch full user profile from database
    const user = await getUserProfile(data.session.user.id);

    logger.auth('getSession: User loaded ✅', { userId: user.id, role: user.role });

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error) {
    console.error('❌ getSession error:', error);
    return null;
  }
}

/**
 * Refresh current session
 */
export async function refreshSession(): Promise<AuthSession | null> {
  try {
    console.log('🔵 refreshSession: START');
    
    const { data, error } = await supabase.auth.refreshSession();
    console.log('🔵 refreshSession: Supabase response', { 
      hasSession: !!data.session, 
      error 
    });
    
    if (error) throw error;
    if (!data.session) {
      console.log('🔵 refreshSession: No session after refresh');
      return null;
    }

    console.log('🔵 refreshSession: Calling getUserProfile for', data.session.user.id);
    const user = await getUserProfile(data.session.user.id);
    console.log('🔵 refreshSession: Success', { userId: user.id, role: user.role });

    return {
      user,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    };
  } catch (error) {
    console.error('❌ Refresh session error:', error);
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    console.log('🔵 resetPassword: START', { email });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    console.log('🔵 resetPassword: Supabase response', { error });

    if (error) throw error;

    console.log('🔵 resetPassword: Success');
    return {
      success: true,
      message: 'Password reset email sent',
    };
  } catch (error: any) {
    console.error('❌ Password reset error:', error);
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
    console.log('🔵 updatePassword: START');
    
    const { error } = await supabase.auth.updateUser({
      password,
    });

    console.log('🔵 updatePassword: Supabase response', { error });

    if (error) throw error;

    console.log('🔵 updatePassword: Success');
    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    console.error('❌ Password update error:', error);
    return {
      success: false,
      error: error.message || 'Password update failed',
    };
  }
}

/**
 * Get user profile with role-specific data
 * ✅ FIXED: Increased timeout to 10s and better error handling
 */
async function getUserProfile(userId: string): Promise<AuthUser> {
  logger.debug('getUserProfile: START', { userId });

  try {
    // Increased timeout to 10 seconds with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .abortSignal(controller.signal)
      .single();

    clearTimeout(timeoutId);

    logger.debug('getUserProfile: Query result', {
      hasUser: !!user,
      role: user?.role,
    });

    if (userError) {
      logger.warn('getUserProfile: Database error', userError);
      throw userError;
    }

    if (!user) {
      logger.warn('getUserProfile: User not found');
      throw new Error('User not found');
    }

    logger.debug('getUserProfile: User found', {
      userId: user.id,
      role: user.role,
    });

    // Get role-specific data
    let roleData = null;
    try {
      logger.debug('getUserProfile: Fetching role data:', user.role);
      
      switch (user.role) {
        case 'mahasiswa': {
          const { data: mahasiswaData } = await supabase
            .from('mahasiswa')
            .select('id, nim, program_studi, angkatan, semester')
            .eq('user_id', userId)
            .maybeSingle();

          logger.debug('Role data: mahasiswa', { hasData: !!mahasiswaData });
          roleData = { mahasiswa: mahasiswaData };
          break;
        }

        case 'dosen': {
          const { data: dosenData } = await supabase
            .from('dosen')
            .select('id, nip, nidn, gelar_depan, gelar_belakang, fakultas, program_studi')
            .eq('user_id', userId)
            .maybeSingle();

          logger.debug('Role data: dosen', { hasData: !!dosenData });
          roleData = { dosen: dosenData };
          break;
        }

        case 'laboran': {
          const { data: laboranData } = await supabase
            .from('laboran')
            .select('id, nip')
            .eq('user_id', userId)
            .maybeSingle();

          logger.debug('Role data: laboran', { hasData: !!laboranData });
          roleData = { laboran: laboranData };
          break;
        }

        case 'admin': {
          const { data: adminData } = await supabase
            .from('admin')
            .select('id, level, permissions')
            .eq('user_id', userId)
            .maybeSingle();

          logger.debug('Role data: admin', { hasData: !!adminData });
          roleData = { admin: adminData };
          break;
        }
      }
    } catch (roleError) {
      logger.warn('getUserProfile: Failed to fetch role data', roleError);
      // Don't throw, just continue without role data
    }

    logger.auth('getUserProfile: SUCCESS ✅', {
      userId: user.id,
      role: user.role,
      hasRoleData: !!roleData
    });

    return { ...user, ...roleData } as AuthUser;
  } catch (error: any) {
    logger.error('getUserProfile: ERROR, using fallback', error);

    // Better error handling for abort errors
    if (error.name === 'AbortError') {
      logger.error('getUserProfile: Query timeout (10s)');
    }

    // FALLBACK: Get user from auth.getUser() metadata
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        logger.error('getUserProfile: Fallback failed', authError);
        throw new Error('Cannot get user data');
      }

      logger.warn('getUserProfile: Using fallback', {
        userId: authUser.id,
        role: authUser.user_metadata?.role,
      });
      
      // Return user from auth metadata (temporary fallback)
      return {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
        role: authUser.user_metadata?.role || 'mahasiswa',
        phone: authUser.user_metadata?.phone || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        is_active: true,
        last_seen_at: null,
        metadata: {},
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
      } as AuthUser;
    } catch (fallbackError) {
      console.error('❌ getUserProfile: Fallback also failed', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Listen to auth state changes
 * ✅ FIXED: Fetch full user profile instead of using metadata only
 */
export function onAuthStateChange(
  callback: (session: AuthSession | null) => void
) {
  logger.debug('onAuthStateChange: Setting up listener');

  return supabase.auth.onAuthStateChange(async (event, session) => {
    // Only log important events (not INITIAL_SESSION)
    if (event !== 'INITIAL_SESSION') {
      logger.auth('onAuthStateChange:', {
        event,
        hasSession: !!session,
      });
    }

    if (session?.user) {
      try {
        // Fetch full profile from database
        const user = await getUserProfile(session.user.id);

        logger.debug('onAuthStateChange: Profile loaded', {
          userId: user.id,
          role: user.role,
        });

        callback({
          user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
        });
      } catch (error) {
        logger.error('onAuthStateChange: Error loading profile', error);
        callback(null);
      }
    } else {
      logger.debug('onAuthStateChange: No session');
      callback(null);
    }
  });
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log('🔵 getCurrentUser: START');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('🔵 getCurrentUser: Supabase response', { 
      hasUser: !!user, 
      error 
    });
    
    if (!user) {
      console.log('🔵 getCurrentUser: No user found');
      return null;
    }
    
    console.log('🔵 getCurrentUser: Calling getUserProfile for', user.id);
    const profile = await getUserProfile(user.id);
    console.log('🔵 getCurrentUser: Success', { userId: profile.id, role: profile.role });
    
    return profile;
  } catch (error) {
    console.error('❌ Get current user error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    console.log('🔵 isAuthenticated: START');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    const authenticated = !!session;
    
    console.log('🔵 isAuthenticated: Result', { authenticated, error });
    
    return authenticated;
  } catch (error) {
    console.error('❌ isAuthenticated error:', error);
    return false;
  }
}