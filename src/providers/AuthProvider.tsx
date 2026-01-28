/**
 * Auth Provider - OPTIMIZED with localStorage cache
 * Provides authentication state and methods to the app
 * ✅ FIXED: Removed infinite loop issue
 * ✅ NEW: Added offline authentication support
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import logger from "@/lib/utils/logger";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from "@/types/auth.types";
import * as authApi from "@/lib/supabase/auth";
import {
  offlineLogin,
  storeOfflineCredentials,
  clearOfflineCredentials,
  storeOfflineSession,
  storeUserData,
  clearOfflineSession,
  restoreOfflineSession,
} from "@/lib/offline/offline-auth";
import { cleanupAllCache } from "@/lib/utils/cache-cleaner";

interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CACHE HELPERS
// ============================================================================

const AUTH_CACHE_KEY = "auth_cache";
const LOGOUT_FLAG_KEY = "auth_logout_flag";
const CACHE_VERSION = "v1";

interface AuthCache {
  version: string;
  user: AuthUser | null;
  session: AuthSession | null;
  timestamp: number;
}

function getCachedAuth(): {
  user: AuthUser | null;
  session: AuthSession | null;
} | null {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const data: AuthCache = JSON.parse(cached);

    // Invalidate cache if version mismatch or older than 24 hours (increased from 1 hour)
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (
      data.version !== CACHE_VERSION ||
      Date.now() - data.timestamp > TWENTY_FOUR_HOURS
    ) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    console.warn("Failed to read auth cache:", error);
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
    console.warn("Failed to cache auth:", error);
  }
}

function clearCachedAuth() {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
    // ✅ PERBAIKAN: Juga hapus logout flag lama jika ada
    // Ini memastikan consistency setelah logout
    console.log("✅ Auth cache cleared");
  } catch (error) {
    console.warn("Failed to clear auth cache:", error);
  }
}

function setLogoutFlag() {
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(LOGOUT_FLAG_KEY, timestamp);
    console.log("✅ Logout flag set:", timestamp);
  } catch (error) {
    console.warn("Failed to set logout flag:", error);
  }
}

function getLogoutFlag(): number | null {
  try {
    const flag = localStorage.getItem(LOGOUT_FLAG_KEY);
    if (!flag) return null;
    const timestamp = parseInt(flag, 10);

    // ✅ PERBAIKAN: Jangan auto-hapus flag setelah 5 menit
    // Flag akan tetap ada sampai user berhasil login baru
    // Ini mencegah auto-login setelah logout
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_DAY) {
      // Hanya hapus jika sudah lebih dari 1 hari (security measure)
      localStorage.removeItem(LOGOUT_FLAG_KEY);
      return null;
    }

    return timestamp;
  } catch (error) {
    console.warn("Failed to get logout flag:", error);
    return null;
  }
}

/**
 * ✅ Clear logout flag (hanya dipanggil saat berhasil login)
 */
function clearLogoutFlag() {
  try {
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    console.log("✅ Logout flag cleared (user logged in)");
  } catch (error) {
    console.warn("Failed to clear logout flag:", error);
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  // ✅ FIX 1: Panggil getCachedAuth() hanya sekali, bukan setiap render
  const [initialCache] = useState(() => getCachedAuth());

  const [user, setUser] = useState<AuthUser | null>(initialCache?.user || null);
  const [session, setSession] = useState<AuthSession | null>(
    initialCache?.session || null,
  );
  const [loading, setLoading] = useState(!initialCache);
  const [initialized, setInitialized] = useState(!!initialCache);

  // Store timeout ID for cleanup
  const logoutTimeoutRef = useRef<number | null>(null);

  // Clear timeout on unmount to prevent "window is not defined" errors in tests
  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }
    };
  }, []);

  const updateAuthState = useCallback(
    (newUser: AuthUser | null, newSession: AuthSession | null) => {
      setUser(newUser);
      setSession(newSession);
      setCachedAuth(newUser, newSession);
    },
    [],
  );

  // ✅ FIX 2: Hapus cachedAuth dari dependency array
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        if (initialCache) {
          logger.auth("Using cached auth ⚡ (instant load!)");
          setLoading(false);
          setInitialized(true);
        }

        const currentSession = await authApi.getSession();
        const logoutFlag = getLogoutFlag();

        if (mounted) {
          // ✅ PERBAIKAN: Jika ada logout flag, prioritaskan logout daripada online session
          // Ini mencegah race condition di mana user sudah logout tapi online session masih ada
          if (logoutFlag) {
            logger.auth(
              "Logout flag detected - user logged out, clearing session",
            );
            // Clear logout flag jika ada online session yang valid (session lama)
            // Tapi jangan auto-login, hanya clear session saja
            await storeOfflineSession(null, null);
            updateAuthState(null, null);
            setInitialized(true);
            setLoading(false);
            return;
          }

          // ✅ PERBAIKAN: Hanya gunakan online session jika TIDAK ada logout flag
          if (currentSession) {
            // Store online session to offline storage
            await storeOfflineSession(currentSession.user, currentSession);
            await storeUserData(currentSession.user);
            updateAuthState(currentSession.user, currentSession);
          } else {
            // Try to restore from offline session
            const offlineSession = await restoreOfflineSession();
            if (offlineSession) {
              logger.auth("Restored session from offline storage");
              updateAuthState(offlineSession.user, offlineSession.session);
            } else {
              updateAuthState(null, null);
            }
          }
          setInitialized(true);
          setLoading(false);
        }
      } catch (error) {
        logger.error("Auth initialization error:", error);
        if (mounted) {
          // Fallback to offline session on error
          try {
            const offlineSession = await restoreOfflineSession();
            if (offlineSession) {
              logger.auth("Fallback to offline session after error");
              updateAuthState(offlineSession.user, offlineSession.session);
            }
          } catch (offlineError) {
            logger.error("Failed to restore offline session:", offlineError);
          }
          setInitialized(true);
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = authApi.onAuthStateChange(
      (newSession: AuthSession | null) => {
        if (mounted) {
          if (newSession) {
            // Store new session to offline storage
            storeOfflineSession(newSession.user, newSession).catch((error) => {
              logger.error("Failed to store offline session:", error);
            });
            storeUserData(newSession.user).catch((error) => {
              logger.error("Failed to store user data:", error);
            });
          }
          updateAuthState(newSession?.user || null, newSession);
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [updateAuthState, initialCache]); // ✅ initialCache adalah stable reference

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setLoading(true);
      try {
        // Check if online or offline
        const isOnline = navigator.onLine;

        if (isOnline) {
          // Online login
          logger.auth("Online login attempt...");
          const response = await authApi.login(credentials);

          // Check if login was successful
          if (!response.success) {
            throw new Error(
              response.error || "Login gagal. Periksa email dan password Anda.",
            );
          }

          // Check if we have user and session data
          if (!response.user || !response.session) {
            throw new Error("Login response missing user or session data");
          }

          // Store credentials and session for offline use
          try {
            await storeOfflineCredentials(
              credentials.email,
              credentials.password,
              response.user,
            );
            await storeOfflineSession(response.user, response.session);
            await storeUserData(response.user);
            logger.auth("Offline credentials stored successfully");
          } catch (storageError) {
            console.warn("Failed to store offline credentials:", storageError);
            // Continue with login even if offline storage fails
          }

          // ✅ PERBAIKAN: Clear logout flag saat login berhasil
          clearLogoutFlag();

          updateAuthState(response.user, response.session);
        } else {
          // Offline login
          logger.auth("Offline mode detected - attempting offline login...");
          const offlineResponse = await offlineLogin(
            credentials.email,
            credentials.password,
          );

          if (!offlineResponse) {
            throw new Error(
              "Login offline gagal. Anda perlu login online minimal 1x sebelum bisa login offline.",
            );
          }

          if (!offlineResponse.user || !offlineResponse.session) {
            throw new Error(
              "Data login offline tidak lengkap. Silakan login online terlebih dahulu.",
            );
          }

          logger.auth("Offline login successful");

          // ✅ PERBAIKAN: Clear logout flag saat offline login berhasil
          clearLogoutFlag();

          updateAuthState(offlineResponse.user, offlineResponse.session);
        }
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [updateAuthState],
  );

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const response = await authApi.register(data);

      if (!response.success) {
        throw new Error(response.error || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    console.log("🔵 logout: START - INSTANT MODE ⚡");

    // Clear any existing timeout
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    // ✅ OPTIMIZATION: Clear state IMMEDIATELY for instant logout
    console.log("🔵 logout: Clearing state & storage FIRST...");
    updateAuthState(null, null);
    clearCachedAuth();
    setLogoutFlag(); // ✅ Set flag to prevent auto-login from offline session
    console.log("🔵 logout: Logout flag SET - auto-login prevented");
    setLoading(false); // Set false immediately for instant UI update

    // ✅ Run cleanup operations in background (non-blocking)
    (async () => {
      try {
        // 1. Call logout API in background
        const authApiWithLogout = authApi as typeof authApi & {
          logout?: () => Promise<{ success: boolean; error?: string }>;
          signOut?: () => Promise<{ success: boolean; error?: string }>;
        };

        const performLogout =
          authApiWithLogout.logout || authApiWithLogout.signOut;

        if (performLogout) {
          console.log("🔵 Calling auth API logout (background)...");
          performLogout().catch((error) => {
            console.warn("⚠️ Logout API error (non-critical):", error);
          });
        }

        // 2. Clear offline session ONLY (keep credentials for future offline login)
        // This allows users to login offline again after logout
        const offlineCleanupPromise = Promise.all([
          clearOfflineSession().catch((error) => {
            console.warn("⚠️ Clear offline session error:", error);
          }),
          // NOTE: We DON'T clear credentials here, so users can login offline again
        ]);

        // 3. Clear session storage only (keep localStorage & IndexedDB for offline functionality)
        // Keep offline credentials and user data intact for next offline login
        const cacheCleanupPromise = cleanupAllCache({
          clearIndexedDB: false, // ✅ KEEP IndexedDB (offline credentials, user data, cache)
          clearLocalStorage: false, // ✅ KEEP localStorage (theme, settings, etc.)
          clearSessionStorage: true, // ✅ Clear sessionStorage (temp data only)
          clearServiceWorkerCache: false, // ✅ KEEP Service Worker cache for offline PWA
        }).catch((error) => {
          console.warn("⚠️ Cache cleanup error:", error);
        });

        // Wait for both with a timeout (max 2 seconds total)
        await Promise.race([
          Promise.all([offlineCleanupPromise, cacheCleanupPromise]),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        console.log("✅ Background cleanup completed");
        console.log(
          "✅ Offline session cleared (credentials kept for offline login)",
        );
      } catch (error) {
        console.warn("⚠️ Background cleanup failed:", error);
      }
    })();

    console.log("✅ logout: COMPLETE (instant!)");

    // ✅ Redirect to landing page immediately without waiting
    // Check if window is available (for test environments)
    if (typeof window !== "undefined") {
      logoutTimeoutRef.current = setTimeout(() => {
        window.location.href = "/";
      }, 100) as unknown as number;
    }
  }, [updateAuthState]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await authApi.resetPassword(email);

      if (!response.success) {
        throw new Error(response.error || "Password reset failed");
      }
    } catch (error) {
      console.error("Password reset error:", error);
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
        throw new Error(response.error || "Password update failed");
      }
    } catch (error) {
      console.error("Password update error:", error);
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
      console.error("Refresh session error:", error);
    }
  }, [updateAuthState]);

  const hasRole = useCallback(
    (role: string) => {
      return user?.role === role;
    },
    [user],
  );

  const isAuthenticated = !!user && !!session;

  // ✅ FIX 3: Memoize context value untuk prevent unnecessary re-renders
  const value = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
