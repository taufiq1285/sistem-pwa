/**
 * Auth Provider
 * Provides authentication state and methods to the app
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from '@/context/AuthContext';
import type { AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/types/auth.types';
import * as authApi from '@/lib/supabase/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const currentSession = await authApi.getSession();
        
        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen to auth changes
    const { data: authListener } = authApi.onAuthStateChange((newSession: AuthSession | null) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user || null);
        setLoading(false); 
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const response = await authApi.login(credentials);
      
      if (!response.success || !response.user || !response.session) {
        throw new Error(response.error || 'Login failed');
      }

      setUser(response.user);
      setSession(response.session);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);
      
      if (!response.success) {
        throw new Error(response.error || 'Registration failed');
      }

      // Note: User needs to verify email before logging in
      // Don't set user/session here
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      // Support either a 'logout' or 'signOut' function in the auth API
      const authApiWithLogout = authApi as typeof authApi & {
        logout?: () => Promise<{ success: boolean; error?: string }>;
        signOut?: () => Promise<{ success: boolean; error?: string }>;
      };

      const performLogout = authApiWithLogout.logout || authApiWithLogout.signOut;

      if (!performLogout) {
        throw new Error('Logout function not implemented in auth API');
      }

      const response = await performLogout();

      if (!response?.success) {
        throw new Error(response?.error || 'Logout failed');
      }

      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
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

  // Update password
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

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const newSession = await authApi.refreshSession();
      
      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  // Check if authenticated
  const isAuthenticated = !!user && !!session;

  const value = {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}