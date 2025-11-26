/**
 * Auth Provider - OPTIMIZED with localStorage cache
 * Provides authentication state and methods to the app
 * ✅ FIXED: Removed infinite loop issue
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import logger from '@/lib/utils/logger';
import type { AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/types/auth.types';
import * as authApi from '@/lib/supabase/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const AUTH_CACHE_KEY = 'auth_cache';
const CACHE_VERSION = 'v1';

interface AuthCache {
  version: string;
  user: AuthUser | null;
  session: AuthSession | null;
  timestamp: number;
}

function getCachedAuth(): { user: AuthUser | null; session: AuthSession | null } | null {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const data: AuthCache = JSON.parse(cached);

    // Invalidate cache if version mismatch or older than 24 hours (increased from 1 hour)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (data.version !== CACHE_VERSION || Date.now() - data.timestamp > TWENTY_FOUR_HOURS) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    console.warn('Failed to read auth cache:', error);
    return null;
  }
}

function setCachedAuth(user: AuthUser | null, session: AuthSession | null) {
  try {
    const cache: AuthCache = {
      version: CACHE_VERSION,
      user,
      session,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to cache auth:', error);
  }
}

function clearCachedAuth() {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear auth cache:', error);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  // ✅ FIX 1: Panggil getCachedAuth() hanya sekali, bukan setiap render
  const [initialCache] = useState(() => getCachedAuth());

  const [user, setUser] = useState<AuthUser | null>(initialCache?.user || null);
  const [session, setSession] = useState<AuthSession | null>(initialCache?.session || null);
  const [loading, setLoading] = useState(!initialCache);
  const [initialized, setInitialized] = useState(!!initialCache);

  const updateAuthState = useCallback((newUser: AuthUser | null, newSession: AuthSession | null) => {
    setUser(newUser);
    setSession(newSession);
    setCachedAuth(newUser, newSession);
  }, []);

  // ✅ FIX 2: Hapus cachedAuth dari dependency array
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (initialCache) {
          logger.auth('Using cached auth ⚡ (instant load!)');
          setLoading(false);
          setInitialized(true);
        }

        const currentSession = await authApi.getSession();

        if (mounted) {
          if (currentSession) {
            updateAuthState(currentSession.user, currentSession);
          } else {
            updateAuthState(null, null);
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Auth initialization error:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = authApi.onAuthStateChange((newSession: AuthSession | null) => {
      if (mounted) {
        updateAuthState(newSession?.user || null, newSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [updateAuthState, initialCache]); // ✅ initialCache adalah stable reference

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);

      if (!response.success || !response.user || !response.session) {
        throw new Error(response.error || 'Login failed');
      }

      updateAuthState(response.user, response.session);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateAuthState]);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('🔵 logout: START');
    setLoading(true);
    
    try {
      const authApiWithLogout = authApi as typeof authApi & {
        logout?: () => Promise<{ success: boolean; error?: string }>;
        signOut?: () => Promise<{ success: boolean; error?: string }>;
      };

      const performLogout = authApiWithLogout.logout || authApiWithLogout.signOut;

      if (performLogout) {
        console.log('🔵 Calling auth API logout (background)...');
        performLogout().catch((error) => {
          console.warn('⚠️ Logout API error (non-critical):', error);
        });
      }

      console.log('🔵 Clearing state & storage...');
      updateAuthState(null, null);
      clearCachedAuth();
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ logout: COMPLETE');
      
      // Force redirect
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Force clear anyway
      updateAuthState(null, null);
      clearCachedAuth();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }, [updateAuthState]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await authApi.resetPassword(email);
      
      if (!response.success) {
        throw new Error(response.error || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    setLoading(true);
    try {
      const response = await authApi.updatePassword(password);
      
      if (!response.success) {
        throw new Error(response.error || 'Password update failed');
      }
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const newSession = await authApi.refreshSession();

      if (newSession) {
        updateAuthState(newSession.user, newSession);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
    }
  }, [updateAuthState]);

  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  const isAuthenticated = !!user && !!session;

  // ✅ FIX 3: Memoize context value untuk prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    session,
    loading,
    initialized,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    refreshSession,
    hasRole,
    isAuthenticated,
  }), [
    user,
    session,
    loading,
    initialized,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    refreshSession,
    hasRole,
    isAuthenticated,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}