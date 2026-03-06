/**
 * Online-First Authentication Manager
 *
 * Purpose: Ensure users must login online first before they can use offline mode
 * This prevents users from creating offline credentials without proper online authentication
 *
 * Features:
 * - Track if user has logged in online before
 * - Verify online login history before allowing offline access
 * - Maintain security by requiring initial online authentication
 */

import { indexedDBManager } from "./indexeddb";
import type { AuthUser, AuthSession } from "@/types/auth.types";

// Import the required functions from offline-auth.ts
import {
  verifyOfflineCredentials,
  restoreOfflineSession,
  getStoredUserData,
  storeOfflineSession,
} from "./offline-auth";

// ============================================================================
// TYPES
// ============================================================================

interface OnlineLoginRecord {
  id: string;
  userId: string;
  email: string;
  firstOnlineLoginAt: number;
  lastOnlineLoginAt: number;
  onlineLoginCount: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ONLINE_LOGIN_RECORD_KEY = "online_login_record";

// ============================================================================
// ONLINE LOGIN TRACKING
// ============================================================================

/**
 * Record that user has logged in online
 * This should be called after successful online login
 */
export async function recordOnlineLogin(
  user: AuthUser,
  session: AuthSession
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
export async function getOnlineLoginRecord(userId: string): Promise<OnlineLoginRecord | null> {
  try {
    await indexedDBManager.initialize();

    const record = await indexedDBManager.getMetadata(ONLINE_LOGIN_RECORD_KEY) as OnlineLoginRecord | null;
    
    // Check if this is the record for the requested user
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
 * This is required before allowing offline login
 */
export async function hasLoggedInOnlineBefore(userId: string): Promise<boolean> {
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
 * Checks if user has previously logged in online
 */
export async function canLoginOffline(email: string): Promise<boolean> {
  try {
    // First, get the stored credentials to find the user ID
    const credentials = (await indexedDBManager.getMetadata("offline_credentials")) as any;
    
    if (!credentials || credentials.email.toLowerCase() !== email.toLowerCase()) {
      console.log("❌ No matching offline credentials found for email:", email);
      return false;
    }

    // Check if this user has logged in online before
    const hasLoggedIn = await hasLoggedInOnlineBefore(credentials.id);
    
    if (!hasLoggedIn) {
      console.log("❌ User has never logged in online before, offline login not allowed:", email);
      return false;
    }

    console.log("✅ User has logged in online before, offline login allowed:", email);
    return true;
  } catch (error) {
    console.error("❌ Failed to verify offline login eligibility:", error);
    return false;
  }
}

/**
 * Clear online login record (on logout if needed)
 */
export async function clearOnlineLoginRecord(userId: string): Promise<void> {
  try {
    await indexedDBManager.initialize();

    // In practice, we might want to keep this record to maintain the fact that
    // the user has logged in online before, even after logout
    // So this function might not actually remove the record
    
    console.log("ℹ️ Online login record preserved for user (to maintain online-first requirement):", userId);
  } catch (error) {
    console.error("❌ Failed to clear online login record:", error);
  }
}

/**
 * Enhanced offline login that checks online-first requirement
 */
export async function secureOfflineLogin(
  email: string,
  password: string,
): Promise<{ user: AuthUser; session: AuthSession } | null> {
  try {
    // First, verify that this user has logged in online before
    const credentials = (await indexedDBManager.getMetadata("offline_credentials")) as any;
    
    if (credentials && credentials.email.toLowerCase() === email.toLowerCase()) {
      const canLogin = await canLoginOffline(email);
      
      if (!canLogin) {
        console.log("🔒 Blocking offline login - user must login online first:", email);
        return null;
      }
    }

    // Now perform the standard offline login
    const isValid = await verifyOfflineCredentials(email, password);
    
    if (!isValid) {
      return null;
    }

    // Get stored session
    const storedSession = await restoreOfflineSession();
    
    if (storedSession) {
      return storedSession;
    }

    // If no session but credentials valid, get user data
    const userData = await getStoredUserData();
    
    if (!userData) {
      console.error("❌ User data not found");
      return null;
    }

    // Create minimal offline session
    const offlineSession: AuthSession = {
      access_token: "offline_session_token",
      refresh_token: "offline_refresh_token",
      expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours
      user: userData,
    };

    // Store the session
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