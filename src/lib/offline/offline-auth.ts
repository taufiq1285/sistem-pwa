/**
 * Offline Authentication Manager
 *
 * Purpose: Enable login functionality when offline by storing and verifying credentials locally
 *
 * Features:
 * - Store user credentials securely in IndexedDB
 * - Verify credentials offline using stored hash
 * - Session management for offline mode
 * - Automatic sync when back online
 *
 * Security Notes:
 * - Passwords are hashed before storage (SHA-256)
 * - Only last successful login credentials are stored
 * - Credentials cleared on logout
 * - Auto-expire after 30 days
 */

import { indexedDBManager } from "./indexeddb";
import type { AuthUser, AuthSession } from "@/types/auth.types";

interface OnlineLoginRecord {
  id: string;
  userId: string;
  email: string;
  firstOnlineLoginAt: number;
  lastOnlineLoginAt: number;
  onlineLoginCount: number;
}

const ONLINE_LOGIN_RECORD_KEY = "online_login_record";

interface StoredCredentials {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  expiresAt: number;
}

interface StoredSession {
  id: string;
  user: AuthUser;
  session: AuthSession;
  createdAt: number;
  expiresAt: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CREDENTIALS_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// ============================================================================
// PASSWORD HASHING (Simple SHA-256 via Web Crypto API)
// ============================================================================

/**
 * Hash password using SHA-256
 * NOTE: For production, consider using more secure methods like bcrypt
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * Generate salt from email (deterministic but user-specific)
 */
function generateSalt(email: string): string {
  return `praktikum_${email}_salt`;
}

// ============================================================================
// CREDENTIALS MANAGEMENT
// ============================================================================

/**
 * Store user credentials after successful login
 */
export async function storeOfflineCredentials(
  email: string,
  password: string,
  user: AuthUser,
): Promise<void> {
  try {
    await indexedDBManager.initialize();

    const salt = generateSalt(email);
    const passwordHash = await hashPassword(password, salt);

    const credentials: StoredCredentials = {
      id: user.id,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: Date.now(),
      expiresAt: Date.now() + CREDENTIALS_EXPIRY,
    };

    // Store in IndexedDB metadata (more secure than users table)
    await indexedDBManager.setMetadata("offline_credentials", credentials);

    console.log("✅ Offline credentials stored successfully");
  } catch (error) {
    console.error("❌ Failed to store offline credentials:", error);
    throw error;
  }
}

/**
 * Verify credentials against stored hash
 */
export async function verifyOfflineCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  try {
    await indexedDBManager.initialize();

    const stored = (await indexedDBManager.getMetadata(
      "offline_credentials",
    )) as StoredCredentials | undefined;

    if (!stored) {
      console.log("❌ No offline credentials found");
      return false;
    }

    // Check if credentials expired
    if (Date.now() >= stored.expiresAt) {
      console.log("❌ Offline credentials expired");
      await clearOfflineCredentials();
      return false;
    }

    // Check if email matches
    if (stored.email.toLowerCase() !== email.toLowerCase()) {
      console.log("❌ Email mismatch");
      return false;
    }

    // Verify password hash
    const salt = generateSalt(email);
    const inputHash = await hashPassword(password, salt);

    const isValid = inputHash === stored.passwordHash;

    if (isValid) {
      console.log("✅ Offline credentials verified");
    } else {
      console.log("❌ Invalid password");
    }

    return isValid;
  } catch (error) {
    console.error("❌ Failed to verify offline credentials:", error);
    return false;
  }
}

/**
 * Clear offline credentials (on logout)
 */
export async function clearOfflineCredentials(): Promise<void> {
  try {
    await indexedDBManager.initialize();
    await indexedDBManager.setMetadata("offline_credentials", null);
    console.log("✅ Offline credentials cleared");
  } catch (error) {
    console.error("❌ Failed to clear offline credentials:", error);
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Store session for offline access
 */
export async function storeOfflineSession(
  user: AuthUser,
  session: AuthSession,
): Promise<void> {
  try {
    await indexedDBManager.initialize();

    const storedSession: StoredSession = {
      id: user.id,
      user,
      session,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_EXPIRY,
    };

    await indexedDBManager.setMetadata("offline_session", storedSession);
    console.log("✅ Offline session stored");
  } catch (error) {
    console.error("❌ Failed to store offline session:", error);
    throw error;
  }
}

/**
 * Restore session from offline storage
 */
export async function restoreOfflineSession(): Promise<{
  user: AuthUser;
  session: AuthSession;
} | null> {
  try {
    await indexedDBManager.initialize();

    const stored = (await indexedDBManager.getMetadata("offline_session")) as
      | StoredSession
      | undefined;

    if (!stored) {
      console.log("ℹ️ No offline session found");
      return null;
    }

    // Check if session expired
    if (Date.now() >= stored.expiresAt) {
      console.log("❌ Offline session expired");
      await clearOfflineSession();
      return null;
    }

    console.log("✅ Offline session restored");
    return {
      user: stored.user,
      session: stored.session,
    };
  } catch (error) {
    console.error("❌ Failed to restore offline session:", error);
    return null;
  }
}

/**
 * Clear offline session
 */
export async function clearOfflineSession(): Promise<void> {
  try {
    await indexedDBManager.initialize();
    await indexedDBManager.setMetadata("offline_session", null);
    console.log("✅ Offline session cleared");
  } catch (error) {
    console.error("❌ Failed to clear offline session:", error);
  }
}

/**
 * Get stored user data for offline mode
 */
export async function getStoredUserData(): Promise<AuthUser | null> {
  try {
    await indexedDBManager.initialize();

    const credentials = (await indexedDBManager.getMetadata(
      "offline_credentials",
    )) as StoredCredentials | undefined;

    if (!credentials) {
      return null;
    }

    // Get user from users store
    const user = await indexedDBManager.getById<AuthUser>(
      "users",
      credentials.id,
    );

    return user || null;
  } catch (error) {
    console.error("❌ Failed to get stored user data:", error);
    return null;
  }
}

/**
 * Store user data for offline access
 */
export async function storeUserData(user: AuthUser): Promise<void> {
  try {
    await indexedDBManager.initialize();

    // Check if user exists
    const existingUser = await indexedDBManager.getById<AuthUser>(
      "users",
      user.id,
    );

    if (existingUser) {
      await indexedDBManager.update("users", user);
    } else {
      await indexedDBManager.create("users", user);
    }

    console.log("✅ User data stored for offline access");
  } catch (error) {
    console.error("❌ Failed to store user data:", error);
    throw error;
  }
}

// ============================================================================
// OFFLINE LOGIN
// ============================================================================

/**
 * Record that user has logged in online
 */
export async function recordOnlineLogin(
  user: AuthUser,
  session: AuthSession,
): Promise<void> {
  try {
    await indexedDBManager.initialize();
    const existingRecord = await getOnlineLoginRecord(user.id);
    const newRecord: OnlineLoginRecord = {
      id: user.id,
      userId: user.id,
      email: user.email,
      firstOnlineLoginAt: existingRecord?.firstOnlineLoginAt || Date.now(),
      lastOnlineLoginAt: Date.now(),
      onlineLoginCount: (existingRecord?.onlineLoginCount || 0) + 1,
    };
    await indexedDBManager.setMetadata(ONLINE_LOGIN_RECORD_KEY, newRecord);
    console.log("✅ Online login recorded for user:", user.id);
  } catch (error) {
    console.error("❌ Failed to record online login:", error);
    throw error;
  }
}

/**
 * Get online login record for user
 */
export async function getOnlineLoginRecord(
  userId: string,
): Promise<OnlineLoginRecord | null> {
  try {
    await indexedDBManager.initialize();
    const record = (await indexedDBManager.getMetadata(
      ONLINE_LOGIN_RECORD_KEY,
    )) as OnlineLoginRecord | null;
    if (record && record.userId === userId) {
      return record;
    }
    return null;
  } catch (error) {
    console.error("❌ Failed to get online login record:", error);
    return null;
  }
}

/**
 * Check if user has logged in online before
 */
export async function hasLoggedInOnlineBefore(
  userId: string,
): Promise<boolean> {
  try {
    const record = await getOnlineLoginRecord(userId);
    return record !== null;
  } catch (error) {
    console.error("❌ Failed to check online login history:", error);
    return false;
  }
}

/**
 * Verify that user can login offline
 */
export async function canLoginOffline(email: string): Promise<boolean> {
  try {
    const credentials = (await indexedDBManager.getMetadata(
      "offline_credentials",
    )) as any;

    if (
      !credentials ||
      credentials.email.toLowerCase() !== email.toLowerCase()
    ) {
      console.log("❌ No matching offline credentials found for email:", email);
      return false;
    }

    const hasLoggedIn = await hasLoggedInOnlineBefore(credentials.id);
    if (!hasLoggedIn) {
      console.log(
        "❌ User has never logged in online before, offline login not allowed:",
        email,
      );
      return false;
    }

    console.log(
      "✅ User has logged in online before, offline login allowed:",
      email,
    );
    return true;
  } catch (error) {
    console.error("❌ Failed to verify offline login eligibility:", error);
    return false;
  }
}

export async function clearOnlineLoginRecord(userId: string): Promise<void> {
  try {
    await indexedDBManager.initialize();
    console.log(
      "ℹ️ Online login record preserved for user (to maintain online-first requirement):",
      userId,
    );
  } catch (error) {
    console.error("❌ Failed to clear online login record:", error);
  }
}

export async function secureOfflineLogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser; session: AuthSession } | null> {
  try {
    const credentials = (await indexedDBManager.getMetadata(
      "offline_credentials",
    )) as any;

    if (
      credentials &&
      credentials.email.toLowerCase() === email.toLowerCase()
    ) {
      const canLogin = await canLoginOffline(email);
      if (!canLogin) {
        console.log(
          "🔒 Blocking offline login - user must login online first:",
          email,
        );
        return null;
      }
    }

    const isValid = await verifyOfflineCredentials(email, password);
    if (!isValid) return null;

    const storedSession = await restoreOfflineSession();
    if (storedSession) return storedSession;

    const userData = await getStoredUserData();
    if (!userData) {
      console.error("❌ User data not found");
      return null;
    }

    const offlineSession: AuthSession = {
      access_token: "offline_session_token",
      refresh_token: "offline_refresh_token",
      expires_at: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000),
      user: userData,
    };

    await storeOfflineSession(userData, offlineSession);
    console.log("✅ Secure offline login successful");

    return {
      user: userData,
      session: offlineSession,
    };
  } catch (error) {
    console.error("❌ Secure offline login failed:", error);
    return null;
  }
}

/**
 * Perform offline login
 * Returns user and session if credentials are valid
 */
export async function offlineLogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser; session: AuthSession } | null> {
  try {
    // Calling the integrated secureOfflineLogin
    return await secureOfflineLogin(email, password);
  } catch (error) {
    console.error("❌ Offline login failed:", error);
    return null;
  }
}

/**
 * Check if offline login is available
 */
export async function isOfflineLoginAvailable(): Promise<boolean> {
  try {
    await indexedDBManager.initialize();

    const credentials = (await indexedDBManager.getMetadata(
      "offline_credentials",
    )) as StoredCredentials | undefined;

    if (!credentials) {
      return false;
    }

    // Check if not expired
    return Date.now() < credentials.expiresAt;
  } catch (error) {
    console.error("❌ Failed to check offline login availability:", error);
    return false;
  }
}

/**
 * Clear all offline auth data (on logout)
 */
export async function clearAllOfflineAuthData(): Promise<void> {
  try {
    await Promise.all([clearOfflineCredentials(), clearOfflineSession()]);
    console.log("✅ All offline auth data cleared");
  } catch (error) {
    console.error("❌ Failed to clear offline auth data:", error);
  }
}
