/**
 * Auth Provider - OPTIMIZED with localStorage cache
 * Provides authentication state and methods to the app
 * ✅ FIXED: Removed infinite loop issue
 * ✅ NEW: Added offline authentication support
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AuthContext } from "@/context/AuthContext";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from "@/types/auth.types";
import logger from "@/lib/utils/logger";
import * as authApi from "@/lib/supabase/auth";
import { getRecommendedTimeout } from "@/lib/utils/fetch-with-timeout";
import {
  offlineLogin,
  secureOfflineLogin,
  storeOfflineCredentials,
  storeOfflineSession,
  storeUserData,
  clearOfflineSession,
  restoreOfflineSession,
  recordOnlineLogin,
  isOfflineLoginAvailable,
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
const ONLINE_LOGIN_TIMEOUT_MS = 12000;
const AUTH_INIT_TIMEOUT_MS = 3000;
const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

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

    // Invalidate cache if version mismatch or older than 7 days
    // 7 hari agar konsisten dengan offline session expiry (SESSION_EXPIRY di offline-auth.ts)
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (
      data.version !== CACHE_VERSION ||
      Date.now() - data.timestamp > SEVEN_DAYS
    ) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    logger.warn("Failed to read auth cache:", error);
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
    logger.warn("Failed to cache auth:", error);
  }
}

function clearCachedAuth() {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
    // ✅ PERBAIKAN: Juga hapus logout flag lama jika ada
    // Ini memastikan consistency setelah logout
    logger.info("✅ Auth cache cleared");
  } catch (error) {
    logger.warn("Failed to clear auth cache:", error);
  }
}

function setLogoutFlag() {
  try {
    const timestamp = Date.now().toString();
    localStorage.setItem(LOGOUT_FLAG_KEY, timestamp);
    logger.info("✅ Logout flag set:", timestamp);
  } catch (error) {
    logger.warn("Failed to set logout flag:", error);
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
    logger.warn("Failed to get logout flag:", error);
    return null;
  }
}

/**
 * ✅ Clear logout flag (hanya dipanggil saat berhasil login)
 */
function clearLogoutFlag() {
  try {
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    logger.info("✅ Logout flag cleared (user logged in)");
  } catch (error) {
    logger.warn("Failed to clear logout flag:", error);
  }
}

function createNetworkTimeoutError() {
  const error = new Error(
    "Login online melebihi batas waktu. Kemungkinan koneksi sedang tidak stabil.",
  );
  error.name = "AuthNetworkTimeoutError";
  return error;
}

function getAdaptiveOnlineLoginTimeoutMs() {
  return Math.max(ONLINE_LOGIN_TIMEOUT_MS, getRecommendedTimeout());
}

function isPublicAuthStartupPath(): boolean {
  if (typeof window === "undefined") return false;
  return PUBLIC_AUTH_PATHS.has(window.location.pathname);
}

function createAuthInitTimeoutError() {
  const error = new Error("Auth initialization timed out");
  error.name = "AuthInitTimeoutError";
  return error;
}

async function getSessionWithStartupTimeout() {
  let timeoutId: number | null = null;

  try {
    return await Promise.race([
      authApi.getSession(),
      new Promise<null>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(createAuthInitTimeoutError());
        }, AUTH_INIT_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

function isNetworkLikeLoginError(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error || "")
  ).toLowerCase();

  return [
    "timeout",
    "timed out",
    "failed to fetch",
    "fetch",
    "network",
    "network request failed",
    "connection",
    "internet",
    "unreachable",
    "abort",
    "gateway",
    "dns",
    "econn",
    "enotfound",
    "too long to respond",
  ].some((keyword) => message.includes(keyword));
}

async function loginOnlineWithTimeout(
  credentials: LoginCredentials,
  timeoutMs: number = getAdaptiveOnlineLoginTimeoutMs(),
) {
  let timeoutId: number | null = null;

  try {
    return await Promise.race([
      authApi.login(credentials),
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(createNetworkTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function performOnlineLoginAttempt(credentials: LoginCredentials) {
  const response = await loginOnlineWithTimeout(credentials);

  if (!response.success) {
    throw new Error(
      response.error || "Login gagal. Periksa email dan password Anda.",
    );
  }

  if (!response.user || !response.session) {
    throw new Error("Login response missing user or session data");
  }

  return response;
}

async function loginOnlineWithRetry(credentials: LoginCredentials) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await performOnlineLoginAttempt(credentials);
    } catch (error) {
      lastError = error;

      const shouldRetry =
        attempt === 0 && navigator.onLine && isNetworkLikeLoginError(error);

      if (!shouldRetry) {
        throw error;
      }

      logger.auth(
        "Online login encountered network instability, retrying once before fallback",
      );
    }
  }

  throw lastError;
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
        const logoutFlag = getLogoutFlag();

        if (initialCache) {
          logger.auth("Using cached auth ⚡ (instant load!)");
          setLoading(false);
          setInitialized(true);

          if (logoutFlag) {
            logger.auth(
              "Logout flag detected while using cache - clearing cached auth state",
            );
            await clearOfflineSession();
            updateAuthState(null, null);
            setInitialized(true); // ✅ FIX: jangan stuck loading
            setLoading(false);
            return;
          }

          if (!navigator.onLine) {
            logger.auth(
              "Offline startup with cached auth - skipping remote session bootstrap",
            );
            return;
          }
        }

        if (!navigator.onLine) {
          logger.auth("Offline startup - restoring offline session only");
          const offlineSession = await restoreOfflineSession();

          if (mounted) {
            if (logoutFlag) {
              await clearOfflineSession();
              updateAuthState(null, null);
            } else if (offlineSession) {
              logger.auth("Restored session from offline storage");
              updateAuthState(offlineSession.user, offlineSession.session);
            } else {
              updateAuthState(null, null);
            }
            setInitialized(true);
            setLoading(false);
          }
          return;
        }

        if (!initialCache && isPublicAuthStartupPath()) {
          logger.auth(
            "Public auth route startup - rendering immediately and deferring session restoration",
          );
          updateAuthState(null, null);
          setInitialized(true);
          setLoading(false);
          return;
        }

        const currentSession = await getSessionWithStartupTimeout();

        if (mounted) {
          // ✅ PERBAIKAN: Jika ada logout flag, prioritaskan logout daripada online session
          // Ini mencegah race condition di mana user sudah logout tapi online session masih ada
          if (logoutFlag) {
            logger.auth(
              "Logout flag detected - user logged out, clearing session",
            );
            // Clear offline session tapi jangan auto-login
            await clearOfflineSession();
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
            } else {
              // ✅ FIX: Pastikan state di-reset ke null agar app tidak stuck
              updateAuthState(null, null);
            }
          } catch (offlineError) {
            logger.error("Failed to restore offline session:", offlineError);
            // ✅ FIX: Juga reset state jika restore offline session gagal
            updateAuthState(null, null);
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
          // ✅ FIX: Check logout flag before restoring session from Supabase
          // This prevents auto-login after logout when Supabase still has session in memory
          const logoutFlag = getLogoutFlag();
          if (logoutFlag && newSession) {
            logger.auth(
              "onAuthStateChange: Logout flag detected, ignoring Supabase session restoration",
            );
            // Keep auth state as null (no session)
            updateAuthState(null, null);
            setInitialized(true); // ✅ FIX: jangan biarkan app stuck di loading
            setLoading(false);
            return;
          }

          // ✅ FIX: Jika initialCache ada dan Supabase emit null di awal startup,
          // jangan timpa cache yang valid. Biarkan initAuth() yang menangani verifikasi.
          // Supabase kadang emit SIGNED_OUT dulu sebelum SIGNED_IN saat token refresh.
          if (!newSession && initialCache?.user && !logoutFlag) {
            logger.auth(
              "onAuthStateChange: Ignoring null session - initialCache still valid (Supabase init event)",
            );
            return;
          }

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
          // ✅ FIX: Pastikan initialized=true jika belum (misal saat initialCache null)
          setInitialized(true);
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
          try {
            const response = await loginOnlineWithRetry(credentials);

            try {
              await storeOfflineCredentials(
                credentials.email,
                credentials.password,
                response.user,
              );
              await storeOfflineSession(response.user, response.session);
              await storeUserData(response.user);
              await recordOnlineLogin(response.user, response.session);
              logger.auth("Offline credentials stored successfully");

              if (navigator.storage && navigator.storage.persist) {
                navigator.storage.persist().then((granted) => {
                  logger.auth(
                    granted
                      ? "Persistent storage granted"
                      : "Persistent storage not granted (browser may evict data)",
                  );
                });
              }
            } catch (storageError) {
              logger.warn(
                "Failed to store offline credentials:",
                storageError,
              );
            }

            clearLogoutFlag();
            updateAuthState(response.user, response.session);
            setInitialized(true);
          } catch (onlineError) {
            const canFallback =
              isNetworkLikeLoginError(onlineError) &&
              (await isOfflineLoginAvailable(credentials.email));

            if (!canFallback) {
              if (isNetworkLikeLoginError(onlineError)) {
                throw new Error(
                  "Koneksi ke server sedang bermasalah, dan login offline belum tersedia untuk akun ini. Silakan login online minimal 1x di perangkat ini.",
                );
              }

              throw onlineError;
            }

            logger.auth(
              "Online login failed because of network issues, trying offline fallback...",
            );

            const offlineResponse = await secureOfflineLogin(
              credentials.email,
              credentials.password,
            );

            if (!offlineResponse?.user || !offlineResponse.session) {
              throw new Error(
                "Login offline tidak tersedia. Silakan coba lagi saat koneksi membaik.",
              );
            }

            clearLogoutFlag();
            updateAuthState(offlineResponse.user, offlineResponse.session);
            setInitialized(true);
          }
        } else {
          // Offline login — error spesifik dilempar langsung dari offlineLogin()
          logger.auth("Offline mode detected - attempting offline login...");
          const offlineResponse = await offlineLogin(
            credentials.email,
            credentials.password,
          );

          if (
            !offlineResponse ||
            !offlineResponse.user ||
            !offlineResponse.session
          ) {
            throw new Error(
              "Login offline gagal. Silakan login online terlebih dahulu.",
            );
          }

          logger.auth("Offline login successful");

          // ✅ PERBAIKAN: Clear logout flag saat offline login berhasil
          clearLogoutFlag();

          updateAuthState(offlineResponse.user, offlineResponse.session);
          setInitialized(true); // ✅ FORCE INITIALIZED AFTER SUCCESSFUL OFFLINE LOGIN
        }
      } catch (error) {
        logger.error("Login error:", error);
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

      // After successful registration, the user should be able to login
      // The first login will record the online login
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    logger.info("🔵 logout: START - INSTANT MODE ⚡");

    // Simpan userId sebelum di-clear untuk clearOfflineSession
    const currentUserId = user?.id;

    // Clear any existing timeout
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }

    // ✅ OPTIMIZATION: Clear state IMMEDIATELY for instant logout
    logger.info("🔵 logout: Clearing state & storage FIRST...");
    updateAuthState(null, null);
    clearCachedAuth();
    setLogoutFlag(); // ✅ Set flag to prevent auto-login from offline session
    logger.info("🔵 logout: Logout flag SET - auto-login prevented");
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
          logger.info("🔵 Calling auth API logout (background)...");
          performLogout().catch((error) => {
            logger.warn("⚠️ Logout API error (non-critical):", error);
          });
        }

        // 2. Clear offline session ONLY untuk user yang logout (keep credentials for future offline login)
        const offlineCleanupPromise = Promise.all([
          clearOfflineSession(currentUserId).catch((error) => {
            logger.warn("⚠️ Clear offline session error:", error);
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
          logger.warn("⚠️ Cache cleanup error:", error);
        });

        // Wait for both with a timeout (max 2 seconds total)
        await Promise.race([
          Promise.all([offlineCleanupPromise, cacheCleanupPromise]),
          new Promise((resolve) => setTimeout(resolve, 2000)),
        ]);

        logger.info("✅ Background cleanup completed");
        logger.info(
          "✅ Offline session cleared (credentials kept for offline login)",
        );
      } catch (error) {
        logger.warn("⚠️ Background cleanup failed:", error);
      }
    })();

    logger.info("✅ logout: COMPLETE (instant!)");

    // ✅ Redirect to login page immediately without waiting
    // Check if window is available (for test environments)
    if (typeof window !== "undefined") {
      logoutTimeoutRef.current = setTimeout(() => {
        window.location.href = "/login";
      }, 100) as unknown as number;
    }
  }, [updateAuthState, user]);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const response = await authApi.resetPassword(email);

      if (!response.success) {
        throw new Error(response.error || "Password reset failed");
      }
    } catch (error) {
      logger.error("Password reset error:", error);
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
      logger.error("Password update error:", error);
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
      logger.error("Refresh session error:", error);
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
