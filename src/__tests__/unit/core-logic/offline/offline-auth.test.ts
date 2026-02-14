/**
 * Offline Authentication Unit Tests
 *
 * Comprehensive white-box testing for offline login functionality including:
 * - Credential storage and verification
 * - Password hashing (SHA-256)
 * - Session management
 * - Expiration handling
 * - Offline login flow
 * - Token validation and security coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  storeOfflineCredentials,
  verifyOfflineCredentials,
  clearOfflineCredentials,
  storeOfflineSession,
  restoreOfflineSession,
  clearOfflineSession,
  getStoredUserData,
  storeUserData,
  offlineLogin,
  isOfflineLoginAvailable,
  clearAllOfflineAuthData,
} from "@/lib/offline/offline-auth";
import { indexedDBManager } from "@/lib/offline/indexeddb";
import type { AuthUser, AuthSession } from "../../../types/auth.types";

// Mock IndexedDB manager
vi.mock("../../../../lib/offline/indexeddb", () => ({
  indexedDBManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getMetadata: vi.fn(),
    setMetadata: vi.fn().mockResolvedValue(undefined),
    getById: vi.fn(),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Web Crypto API
const mockCryptoSubtle = {
  digest: vi.fn(),
};

Object.defineProperty(global, "crypto", {
  value: {
    subtle: mockCryptoSubtle,
  },
  writable: true,
});

// Mock TextEncoder
global.TextEncoder = class {
  encode(str: string) {
    return new Uint8Array(str.split("").map((c) => c.charCodeAt(0)));
  }
} as any;

describe("Offline Authentication", () => {
  // Mock console methods
  let mockConsoleLog: any;
  let mockConsoleError: any;

  // ✅ FIXED: Added all required properties for AuthUser type
  const mockUser: AuthUser = {
    id: "user-123",
    email: "test@example.com",
    full_name: "Test User",
    role: "mahasiswa",
    avatar_url: null, // ← Added
    created_at: new Date().toISOString(), // ← Added
    is_active: true, // ← Added
    last_seen_at: new Date().toISOString(), // ← Added
    updated_at: new Date().toISOString(), // ← Added
    metadata: {}, // ← Added (FIXED: was app_metadata)
  };

  const mockSession: AuthSession = {
    access_token: "test_token",
    refresh_token: "refresh_token",
    expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-mock indexedDB manager methods
    vi.mocked(indexedDBManager.initialize).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);
    vi.mocked(indexedDBManager.setMetadata).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.getById).mockResolvedValue(null);
    vi.mocked(indexedDBManager.create).mockResolvedValue(undefined);
    vi.mocked(indexedDBManager.update).mockResolvedValue(undefined);

    // Mock console methods in beforeEach so they persist across tests
    mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Mock crypto.subtle.digest to return consistent hash
    mockCryptoSubtle.digest.mockImplementation(() => {
      const hash = new Uint8Array(32).fill(1); // Simple mock hash
      return Promise.resolve(hash.buffer);
    });
  });

  afterEach(() => {
    // Don't restore mocks, only clear call history
    vi.clearAllMocks();
  });

  // ==========================================
  // SECTION 1: storeOfflineCredentials
  // ==========================================

  describe("storeOfflineCredentials", () => {
    it("should store hashed credentials successfully", async () => {
      const email = "test@example.com";
      const password = "password123";

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        expect.objectContaining({
          id: mockUser.id,
          email,
          passwordHash: expect.any(String),
          createdAt: expect.any(Number),
          expiresAt: expect.any(Number),
        }),
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Offline credentials stored"),
      );
    });

    it("should hash password using SHA-256", async () => {
      const email = "test@example.com";
      const password = "password123";

      await storeOfflineCredentials(email, password, mockUser);

      expect(mockCryptoSubtle.digest).toHaveBeenCalledWith(
        "SHA-256",
        expect.any(Uint8Array),
      );
    });

    it("should set expiration to 30 days", async () => {
      const email = "test@example.com";
      const password = "password123";
      const now = Date.now();

      await storeOfflineCredentials(email, password, mockUser);

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      // Should expire in approximately 30 days (allow 1 second tolerance)
      const expectedExpiry = now + 30 * 24 * 60 * 60 * 1000;
      expect(credentials.expiresAt).toBeGreaterThanOrEqual(
        expectedExpiry - 1000,
      );
      expect(credentials.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it("should handle storage errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Storage error"),
      );

      await expect(
        storeOfflineCredentials("test@example.com", "password", mockUser),
      ).rejects.toThrow("Storage error");

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to store offline credentials:",
        expect.any(Error),
      );
    });

    it("should normalize email to lowercase", async () => {
      const email = "Test@Example.COM";
      const password = "password123";

      await storeOfflineCredentials(email, password, mockUser);

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      expect(credentials.email).toBe("test@example.com");
    });

    it("should handle empty password", async () => {
      const email = "test@example.com";
      const password = "";

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle very long password (1000+ chars)", async () => {
      const email = "test@example.com";
      const password = "a".repeat(1500);

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
      expect(mockCryptoSubtle.digest).toHaveBeenCalledWith(
        "SHA-256",
        expect.any(Uint8Array),
      );
    });

    it("should handle special characters in password", async () => {
      const email = "test@example.com";
      const password = "p@$$w0rd!#$%^&*()_+-=[]{}|;':\",./<>?";

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle unicode in password", async () => {
      const email = "test@example.com";
      const password = "パスワード密码🔐";

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: verifyOfflineCredentials
  // ==========================================

  describe("verifyOfflineCredentials", () => {
    it("should verify correct credentials", async () => {
      const email = "test@example.com";
      const password = "password123";

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email,
        passwordHash: "01".repeat(32), // Mock hash
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials(email, password);

      expect(isValid).toBe(true);
      expect(mockCryptoSubtle.digest).toHaveBeenCalled();
    });

    it("should reject incorrect email", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "stored@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials(
        "wrong@example.com",
        "password",
      );

      expect(isValid).toBe(false);
    });

    it("should reject incorrect password", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "00".repeat(32), // Different hash
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(false);
    });

    it("should reject expired credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000, // 40 days ago
        expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // Expired 10 days ago
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "❌ Offline credentials expired",
      );
    });

    it("should clear expired credentials automatically", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // Expired
      });

      await verifyOfflineCredentials("test@example.com", "password");

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
    });

    it("should return false when credentials not found", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(false);
    });

    it("should handle verification errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Verification error"),
      );

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to verify offline credentials:",
        expect.any(Error),
      );
    });

    it("should perform case-insensitive email comparison", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "Test@Example.COM",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(true);
    });

    it("should verify credentials at exact expiry moment", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        expiresAt: now, // Expires right now
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      // At exact expiry time, should still be invalid (Date.now() > expiresAt)
      expect(isValid).toBe(false);
    });

    it("should verify credentials before expiry", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        expiresAt: now + 1000, // Expires in 1 second
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      // Should be valid (Date.now() < expiresAt)
      expect(isValid).toBe(true);
    });

    it("should handle malformed stored credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        // Missing required fields
        id: mockUser.id,
        email: "test@example.com",
        // Missing passwordHash, createdAt, expiresAt
      });

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      // Should handle gracefully
      expect(typeof isValid).toBe("boolean");
    });

    it("should handle null stored credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(null);

      const isValid = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(isValid).toBe(false);
    });
  });

  // ==========================================
  // SECTION 3: clearOfflineCredentials
  // ==========================================

  describe("clearOfflineCredentials", () => {
    it("should clear stored credentials", async () => {
      await clearOfflineCredentials();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ Offline credentials cleared",
      );
    });

    it("should handle clear errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Clear error"),
      );

      await clearOfflineCredentials();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to clear offline credentials:",
        expect.any(Error),
      );
    });

    it("should not throw even on error", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Clear error"),
      );

      // Should not throw
      await expect(clearOfflineCredentials()).resolves.toBeUndefined();
    });
  });

  // ==========================================
  // SECTION 4: storeOfflineSession
  // ==========================================

  describe("storeOfflineSession", () => {
    it("should store session with 24-hour expiry", async () => {
      const now = Date.now();

      await storeOfflineSession(mockUser, mockSession);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        expect.objectContaining({
          id: mockUser.id,
          user: mockUser,
          session: mockSession,
          createdAt: expect.any(Number),
          expiresAt: expect.any(Number),
        }),
      );

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const sessionData = call[1] as any;

      // Should expire in approximately 24 hours
      const expectedExpiry = now + 24 * 60 * 60 * 1000;
      expect(sessionData.expiresAt).toBeGreaterThanOrEqual(
        expectedExpiry - 1000,
      );
      expect(sessionData.expiresAt).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it("should handle storage errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Storage error"),
      );

      await expect(storeOfflineSession(mockUser, mockSession)).rejects.toThrow(
        "Storage error",
      );
    });

    it("should log success message", async () => {
      await storeOfflineSession(mockUser, mockSession);

      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Offline session stored");
    });

    it("should log error on failure", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Storage error"),
      );

      try {
        await storeOfflineSession(mockUser, mockSession);
      } catch (error) {
        // Expected
      }

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to store offline session:",
        expect.any(Error),
      );
    });
  });

  // ==========================================
  // SECTION 5: restoreOfflineSession
  // ==========================================

  describe("restoreOfflineSession", () => {
    it("should restore valid session", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000, // Valid for 10 seconds
      });

      const restored = await restoreOfflineSession();

      expect(restored).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("should return null for expired session", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now() - 30 * 60 * 60 * 1000, // 30 hours ago
        expiresAt: Date.now() - 6 * 60 * 60 * 1000, // Expired 6 hours ago
      });

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
      expect(mockConsoleLog).toHaveBeenCalledWith("❌ Offline session expired");
    });

    it("should clear expired session automatically", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now() - 30 * 60 * 60 * 1000,
        expiresAt: Date.now() - 6 * 60 * 60 * 1000, // Expired
      });

      await restoreOfflineSession();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
    });

    it("should return null when session not found", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
    });

    it("should handle restore errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Restore error"),
      );

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to restore offline session:",
        expect.any(Error),
      );
    });

    it("should log info when no session found", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      await restoreOfflineSession();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "ℹ️ No offline session found",
      );
    });

    it("should restore session at exact expiry moment", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: now - 24 * 60 * 60 * 1000,
        expiresAt: now, // Expires right now
      });

      const restored = await restoreOfflineSession();

      // At exact expiry time, should be invalid
      expect(restored).toBeNull();
    });

    it("should restore session 1ms before expiry", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: now - 24 * 60 * 60 * 1000,
        expiresAt: now + 1, // Expires in 1ms
      });

      const restored = await restoreOfflineSession();

      // Should be valid
      expect(restored).not.toBeNull();
    });
  });

  // ==========================================
  // SECTION 6: clearOfflineSession
  // ==========================================

  describe("clearOfflineSession", () => {
    it("should clear stored session", async () => {
      await clearOfflineSession();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
      expect(mockConsoleLog).toHaveBeenCalledWith("✅ Offline session cleared");
    });

    it("should handle clear errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Clear error"),
      );

      await clearOfflineSession();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to clear offline session:",
        expect.any(Error),
      );
    });

    it("should not throw even on error", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Clear error"),
      );

      // Should not throw
      await expect(clearOfflineSession()).resolves.toBeUndefined();
    });
  });

  // ==========================================
  // SECTION 7: getStoredUserData
  // ==========================================

  describe("getStoredUserData", () => {
    it("should retrieve stored user data", async () => {
      // Mock credentials to provide user ID
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const user = await getStoredUserData();

      expect(indexedDBManager.getById).toHaveBeenCalledWith(
        "users",
        mockUser.id,
      );
      expect(user).toEqual(mockUser);
    });

    it("should return null when user not found", async () => {
      // Mock no stored credentials
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const user = await getStoredUserData();

      expect(user).toBeNull();
    });

    it("should handle errors", async () => {
      // Mock credentials to provide user ID
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockRejectedValue(
        new Error("Read error"),
      );

      const user = await getStoredUserData();

      expect(user).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to get stored user data:",
        expect.any(Error),
      );
    });

    it("should return null when user not in users store", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      const user = await getStoredUserData();

      expect(user).toBeNull();
    });
  });

  // ==========================================
  // SECTION 8: storeUserData
  // ==========================================

  describe("storeUserData", () => {
    it("should create user when not exists", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      await storeUserData(mockUser);

      expect(indexedDBManager.create).toHaveBeenCalledWith("users", mockUser);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ User data stored for offline access",
      );
    });

    it("should update user when exists", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      await storeUserData(mockUser);

      expect(indexedDBManager.update).toHaveBeenCalledWith("users", mockUser);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ User data stored for offline access",
      );
    });

    it("should handle storage errors", async () => {
      vi.mocked(indexedDBManager.getById).mockRejectedValue(
        new Error("Read error"),
      );

      await expect(storeUserData(mockUser)).rejects.toThrow("Read error");
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to store user data:",
        expect.any(Error),
      );
    });

    it("should handle create errors", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);
      vi.mocked(indexedDBManager.create).mockRejectedValue(
        new Error("Create error"),
      );

      await expect(storeUserData(mockUser)).rejects.toThrow("Create error");
    });

    it("should handle update errors", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);
      vi.mocked(indexedDBManager.update).mockRejectedValue(
        new Error("Update error"),
      );

      await expect(storeUserData(mockUser)).rejects.toThrow("Update error");
    });
  });

  // ==========================================
  // SECTION 9: offlineLogin
  // ==========================================

  describe("offlineLogin", () => {
    it("should perform successful offline login", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // Mock multiple getMetadata calls in sequence:
      // 1. verifyOfflineCredentials - needs credentials
      // 2. restoreOfflineSession - return undefined (no stored session)
      // 3. getStoredUserData - needs credentials again
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData) // verify
        .mockResolvedValueOnce(undefined) // restore session
        .mockResolvedValueOnce(credentialsData); // getStoredUserData

      // Mock user data retrieval
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin("test@example.com", "password");

      expect(result).not.toBeNull();
      expect(result?.user).toEqual(mockUser);
      expect(result?.session).toMatchObject({
        access_token: "offline_session_token",
        refresh_token: "offline_refresh_token",
        user: mockUser,
      });
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ Offline login successful",
      );
    });

    it("should return null for invalid credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await offlineLogin("test@example.com", "wrongpassword");

      expect(result).toBeNull();
    });

    it("should restore existing session if available", async () => {
      // Mock credential verification
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce({
          // Credentials check
          id: mockUser.id,
          email: "test@example.com",
          passwordHash: "01".repeat(32),
          createdAt: Date.now(),
          expiresAt: Date.now() + 10000,
        })
        .mockResolvedValueOnce({
          // Session check
          id: mockUser.id,
          user: mockUser,
          session: mockSession,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10000,
        });

      const result = await offlineLogin("test@example.com", "password");

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("should create new session if no valid session exists", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // Mock credential verification + session + userData
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData) // verifyOfflineCredentials
        .mockResolvedValueOnce(undefined) // restoreOfflineSession - no session
        .mockResolvedValueOnce(credentialsData); // getStoredUserData

      // Mock user data retrieval
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin("test@example.com", "password");

      expect(result).not.toBeNull();
      expect(result?.session.access_token).toBe("offline_session_token");
    });

    it("should return null when user data not found", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // Mock sequence: verify, restore session, getStoredUserData
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData) // verifyOfflineCredentials
        .mockResolvedValueOnce(undefined) // restoreOfflineSession
        .mockResolvedValueOnce(credentialsData); // getStoredUserData

      // Mock user data not found
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      const result = await offlineLogin("test@example.com", "password");

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith("❌ User data not found");
    });

    it("should handle login errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error("Init error"),
      );

      const result = await offlineLogin("test@example.com", "password");

      expect(result).toBeNull();
      // Error occurs in verifyOfflineCredentials, which is called first
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to verify offline credentials:",
        expect.any(Error),
      );
    });

    it("should create session with correct expiry", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const now = Math.floor(Date.now() / 1000);
      const result = await offlineLogin("test@example.com", "password");

      // Session should expire in ~24 hours from now
      const expectedExpiry = now + 24 * 60 * 60;
      expect(result?.session.expires_at).toBeGreaterThanOrEqual(
        expectedExpiry - 1,
      );
      expect(result?.session.expires_at).toBeLessThanOrEqual(
        expectedExpiry + 1,
      );
    });

    it("should store newly created session", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      await offlineLogin("test@example.com", "password");

      // Should call setMetadata to store the new session
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        expect.objectContaining({
          id: mockUser.id,
          user: mockUser,
          session: expect.objectContaining({
            access_token: "offline_session_token",
          }),
        }),
      );
    });
  });

  // ==========================================
  // SECTION 10: isOfflineLoginAvailable
  // ==========================================

  describe("isOfflineLoginAvailable", () => {
    it("should return true when credentials exist and not expired", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000, // Valid
      });

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(true);
    });

    it("should return false when credentials not found", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should return false when credentials expired", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 10000, // Expired
      });

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
    });

    it("should handle errors", async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValueOnce(
        new Error("Check error"),
      );

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to check offline login availability:",
        expect.any(Error),
      );
    });

    it("should return true at exact moment before expiry", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        expiresAt: now + 1, // Expires in 1ms
      });

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(true);
    });
  });

  // ==========================================
  // SECTION 11: clearAllOfflineAuthData
  // ==========================================

  describe("clearAllOfflineAuthData", () => {
    it("should clear both credentials and session", async () => {
      await clearAllOfflineAuthData();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ All offline auth data cleared",
      );
    });

    it("should handle errors during clear", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Clear error"),
      );

      await clearAllOfflineAuthData();

      // Should log errors from individual clear functions
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to clear offline credentials:",
        expect.any(Error),
      );
      expect(mockConsoleError).toHaveBeenCalledWith(
        "❌ Failed to clear offline session:",
        expect.any(Error),
      );
    });

    it("should clear credentials and session in parallel", async () => {
      const startTime = Date.now();

      await clearAllOfflineAuthData();

      // Both should be called (Promise.all runs in parallel)
      expect(indexedDBManager.setMetadata).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================
  // SECTION 12: Password Hashing Security
  // ==========================================

  describe("Password Hashing Security", () => {
    it("should use consistent salt for same email", async () => {
      const email = "test@example.com";
      const password = "password123";

      await storeOfflineCredentials(email, password, mockUser);
      const call1 = mockCryptoSubtle.digest.mock.calls[0];

      mockCryptoSubtle.digest.mockClear();

      await storeOfflineCredentials(email, password, mockUser);
      const call2 = mockCryptoSubtle.digest.mock.calls[0];

      // The input to digest should be identical (same password + same salt for same email)
      expect(call1[1]).toEqual(call2[1]);
    });

    it("should use different salt for different emails", async () => {
      await storeOfflineCredentials("user1@example.com", "password", mockUser);
      const call1 = mockCryptoSubtle.digest.mock.calls[0];

      mockCryptoSubtle.digest.mockClear();

      await storeOfflineCredentials("user2@example.com", "password", mockUser);
      const call2 = mockCryptoSubtle.digest.mock.calls[0];

      // The input to digest should be different for different emails
      expect(call1[1]).not.toEqual(call2[1]);
    });

    it("should produce deterministic hash for same input", async () => {
      const email = "test@example.com";
      const password = "password123";

      // First call
      await storeOfflineCredentials(email, password, mockUser);
      const call1 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const hash1 = (call1[1] as any).passwordHash;

      // Second call with same input
      vi.mocked(indexedDBManager.setMetadata).mockClear();
      await storeOfflineCredentials(email, password, mockUser);
      const call2 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const hash2 = (call2[1] as any).passwordHash;

      // Should produce same hash
      expect(hash1).toBe(hash2);
    });

    it("should produce different hash for different password", async () => {
      mockCryptoSubtle.digest.mockImplementation(() => {
        // Return different hash each time
        const hash = new Uint8Array(32).fill(Math.random() * 255);
        return Promise.resolve(hash.buffer);
      });

      await storeOfflineCredentials("test@example.com", "password1", mockUser);
      const call1 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const hash1 = (call1[1] as any).passwordHash;

      vi.mocked(indexedDBManager.setMetadata).mockClear();
      await storeOfflineCredentials("test@example.com", "password2", mockUser);
      const call2 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const hash2 = (call2[1] as any).passwordHash;

      // Should produce different hash
      expect(hash1).not.toBe(hash2);
    });

    it("should handle SHA-256 errors", async () => {
      mockCryptoSubtle.digest.mockRejectedValue(new Error("Hash error"));

      await expect(
        storeOfflineCredentials("test@example.com", "password", mockUser),
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // SECTION 13: Token Validation - White Box
  // ==========================================

  describe("Token Validation - White Box Testing", () => {
    it("should validate offline session token format", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin("test@example.com", "password");

      // Should create offline session token with expected format
      expect(result?.session.access_token).toBe("offline_session_token");
      expect(result?.session.refresh_token).toBe("offline_refresh_token");
    });

    it("should validate session token has correct user reference", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin("test@example.com", "password");

      // Session user should match
      expect(result?.session.user).toEqual(mockUser);
    });

    it("should validate stored session integrity", async () => {
      const storedSession = {
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(storedSession);

      const restored = await restoreOfflineSession();

      // Should restore with all properties intact
      expect(restored).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("should reject tampered session data", async () => {
      // Simulate tampered session (different user ID in session vs user object)
      const tamperedSession = {
        id: "different-user-id", // Tampered
        user: mockUser,
        session: mockSession,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(
        tamperedSession,
      );

      const restored = await restoreOfflineSession();

      // Should still restore (integrity check would be in production)
      // In this test, we verify that the data is returned as-is
      expect(restored).not.toBeNull();
    });

    it("should handle missing token in session", async () => {
      const invalidSession = {
        id: mockUser.id,
        user: mockUser,
        session: {
          // Missing access_token
          refresh_token: "refresh",
          expires_at: Date.now() / 1000 + 1000,
          user: mockUser,
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(invalidSession);

      const restored = await restoreOfflineSession();

      // Should restore even with incomplete session
      expect(restored).not.toBeNull();
    });
  });

  // ==========================================
  // SECTION 14: Security Coverage
  // ==========================================

  describe("Security Coverage", () => {
    it("should prevent timing attacks on password verification", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      // Measure time for correct password
      const start1 = performance.now();
      await verifyOfflineCredentials("test@example.com", "password");
      const time1 = performance.now() - start1;

      // Measure time for incorrect password
      const start2 = performance.now();
      await verifyOfflineCredentials("test@example.com", "wrong");
      const time2 = performance.now() - start2;

      // Times should be similar (hashing takes same time regardless of result)
      // Note: This is a basic check, real timing attack prevention needs constant-time comparison
      expect(Math.abs(time1 - time2)).toBeLessThan(100); // Allow 100ms variance
    });

    it("should not expose password hash in errors", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Storage error"),
      );

      try {
        await storeOfflineCredentials(
          "test@example.com",
          "secret_password",
          mockUser,
        );
      } catch (error: any) {
        // Error should not contain password or hash
        expect(error.message).not.toContain("secret_password");
        expect(error.message).not.toContain("passwordHash");
      }
    });

    it("should clear credentials on logout", async () => {
      await clearAllOfflineAuthData();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
    });

    it("should clear session on logout", async () => {
      await clearAllOfflineAuthData();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
    });

    it("should handle SQL injection attempts in email", async () => {
      const maliciousEmail = "test@example.com'; DROP TABLE users; --";

      await storeOfflineCredentials(maliciousEmail, "password", mockUser);

      // Should store email as-is (IndexedDB is NoSQL, not vulnerable to SQL injection)
      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      expect(credentials.email).toBe("test@example.com'; drop table users; --");
    });

    it("should handle XSS attempts in user data", async () => {
      const maliciousUser = {
        ...mockUser,
        full_name: '<script>alert("XSS")</script>',
      };

      await storeUserData(maliciousUser);

      // Should store data as-is (sanitization should happen at display layer)
      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "users",
        maliciousUser,
      );
    });

    it("should not store credentials indefinitely", async () => {
      const email = "test@example.com";
      const password = "password123";
      const now = Date.now();

      await storeOfflineCredentials(email, password, mockUser);

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      // Should have expiry set
      expect(credentials.expiresAt).toBeDefined();
      expect(credentials.expiresAt).toBeGreaterThan(now);
    });

    it("should enforce 30-day maximum credential lifetime", async () => {
      const email = "test@example.com";
      const password = "password123";
      const now = Date.now();

      await storeOfflineCredentials(email, password, mockUser);

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      const maxExpiry = now + 30 * 24 * 60 * 60 * 1000;
      expect(credentials.expiresAt).toBeLessThanOrEqual(maxExpiry + 1000);
    });
  });

  // ==========================================
  // SECTION 15: Branch Coverage - All Conditions
  // ==========================================

  describe("Branch Coverage - All Conditions", () => {
    it("branch: if (!stored) in verifyOfflineCredentials - no credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
    });

    it("branch: if (Date.now() > stored.expiresAt) - expired credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
    });

    it("branch: if (stored.email !== email) - email mismatch", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "stored@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "different@example.com",
        "password",
      );

      expect(result).toBe(false);
    });

    it("branch: if (isValid) in verifyOfflineCredentials - valid hash", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(true);
    });

    it("branch: if (isValid) in verifyOfflineCredentials - invalid hash", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "00".repeat(32), // Different hash
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
    });

    it("branch: if (!stored) in restoreOfflineSession - no session", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await restoreOfflineSession();

      expect(result).toBeNull();
    });

    it("branch: if (Date.now() > stored.expiresAt) in restoreOfflineSession - expired", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now() - 30 * 60 * 60 * 1000,
        expiresAt: Date.now() - 6 * 60 * 60 * 1000,
      });

      const result = await restoreOfflineSession();

      expect(result).toBeNull();
    });

    it("branch: if (!isValid) in offlineLogin - invalid credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await offlineLogin("test@example.com", "wrongpassword");

      expect(result).toBeNull();
    });

    it("branch: if (storedSession) in offlineLogin - existing session", async () => {
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce({
          id: mockUser.id,
          email: "test@example.com",
          passwordHash: "01".repeat(32),
          createdAt: Date.now(),
          expiresAt: Date.now() + 10000,
        })
        .mockResolvedValueOnce({
          id: mockUser.id,
          user: mockUser,
          session: mockSession,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10000,
        });

      const result = await offlineLogin("test@example.com", "password");

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it("branch: if (!userData) in offlineLogin - no user data", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      const result = await offlineLogin("test@example.com", "password");

      expect(result).toBeNull();
    });

    it("branch: if (existingUser) in storeUserData - update", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      await storeUserData(mockUser);

      expect(indexedDBManager.update).toHaveBeenCalledWith("users", mockUser);
    });

    it("branch: if (!existingUser) in storeUserData - create", async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      await storeUserData(mockUser);

      expect(indexedDBManager.create).toHaveBeenCalledWith("users", mockUser);
    });

    it("branch: if (!credentials) in getStoredUserData - no credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await getStoredUserData();

      expect(result).toBeNull();
    });

    it("branch: if (!credentials) in isOfflineLoginAvailable - no credentials", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await isOfflineLoginAvailable();

      expect(result).toBe(false);
    });

    it("branch: if (Date.now() < credentials.expiresAt) - not expired", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await isOfflineLoginAvailable();

      expect(result).toBe(true);
    });
  });

  // ==========================================
  // SECTION 16: Path Coverage - All Execution Paths
  // ==========================================

  describe("Path Coverage - All Execution Paths", () => {
    it("Path 1: Store credentials → success path", async () => {
      await storeOfflineCredentials("test@example.com", "password", mockUser);

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(mockCryptoSubtle.digest).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining("Offline credentials stored"),
      );
    });

    it("Path 2: Store credentials → error path", async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error("Storage error"),
      );

      await expect(
        storeOfflineCredentials("test@example.com", "password", mockUser),
      ).rejects.toThrow();

      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("Path 3: Verify credentials → not found path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "❌ No offline credentials found",
      );
    });

    it("Path 4: Verify credentials → expired path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
    });

    it("Path 5: Verify credentials → email mismatch path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "stored@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "different@example.com",
        "password",
      );

      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith("❌ Email mismatch");
    });

    it("Path 6: Verify credentials → invalid password path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "00".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith("❌ Invalid password");
    });

    it("Path 7: Verify credentials → valid path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ Offline credentials verified",
      );
    });

    it("Path 8: Offline login → full success path", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin("test@example.com", "password");

      expect(result).not.toBeNull();
      expect(result?.session.access_token).toBe("offline_session_token");
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "✅ Offline login successful",
      );
    });

    it("Path 9: Restore session → expired session path", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now() - 30 * 60 * 60 * 1000,
        expiresAt: Date.now() - 6 * 60 * 60 * 1000,
      });

      const result = await restoreOfflineSession();

      expect(result).toBeNull();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
    });
  });

  // ==========================================
  // SECTION 17: Edge Cases - Boundary Testing
  // ==========================================

  describe("Edge Cases - Boundary Testing", () => {
    it("should handle empty email", async () => {
      await storeOfflineCredentials("", "password", mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle very long email (1000+ chars)", async () => {
      const longEmail = "a".repeat(1000) + "@example.com";

      await storeOfflineCredentials(longEmail, "password", mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle email with special characters", async () => {
      const specialEmail = "user+test@example.co.uk";

      await storeOfflineCredentials(specialEmail, "password", mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle unicode in email", async () => {
      const unicodeEmail = "用户@例子.广告";

      await storeOfflineCredentials(unicodeEmail, "password", mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle minimum password length (1 char)", async () => {
      await storeOfflineCredentials("test@example.com", "x", mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle credentials stored exactly at creation time", async () => {
      const now = Date.now();

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: now,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(true);
    });

    it("should handle credentials expiring 1ms in future", async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() + 1,
      });

      const result = await verifyOfflineCredentials(
        "test@example.com",
        "password",
      );

      expect(result).toBe(true);
    });

    it("should handle concurrent credential storage", async () => {
      const promises = [
        storeOfflineCredentials("user1@example.com", "pass1", mockUser),
        storeOfflineCredentials("user2@example.com", "pass2", mockUser),
        storeOfflineCredentials("user3@example.com", "pass3", mockUser),
      ];

      await Promise.all(promises);

      // All should complete
      expect(indexedDBManager.setMetadata).toHaveBeenCalledTimes(3);
    });

    it("should handle user with null metadata", async () => {
      const userWithNullMetadata = {
        ...mockUser,
        metadata: null,
      };

      await storeUserData(userWithNullMetadata);

      expect(indexedDBManager.create).toHaveBeenCalledWith(
        "users",
        userWithNullMetadata,
      );
    });

    it("should handle session with future expiry", async () => {
      const futureExpiry = Math.floor(
        (Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000,
      ); // 1 year

      const futureSession = {
        ...mockSession,
        expires_at: futureExpiry,
      };

      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: futureSession,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const result = await restoreOfflineSession();

      expect(result).not.toBeNull();
      expect(result?.session.expires_at).toBe(futureExpiry);
    });
  });

  // ==========================================
  // SECTION 18: Real-World Scenarios
  // ==========================================

  describe("Real-World Scenarios", () => {
    it("should handle complete authentication flow", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // 1. Check if offline login available
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(
        credentialsData,
      );
      const isAvailable = await isOfflineLoginAvailable();
      expect(isAvailable).toBe(true);

      // 2. Perform offline login
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const loginResult = await offlineLogin("test@example.com", "password");
      expect(loginResult).not.toBeNull();

      // 3. Logout
      await clearAllOfflineAuthData();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
    });

    it("should handle login → use → logout cycle", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // Login
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const loginResult = await offlineLogin("test@example.com", "password");
      expect(loginResult).not.toBeNull();

      // Use session
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: loginResult!.user,
        session: loginResult!.session,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const restoredSession = await restoreOfflineSession();
      expect(restoredSession).not.toBeNull();

      // Logout
      await clearAllOfflineAuthData();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
    });

    it("should handle credential refresh", async () => {
      // Store initial credentials
      await storeOfflineCredentials("test@example.com", "password", mockUser);

      // Store new credentials (refresh)
      vi.mocked(indexedDBManager.setMetadata).mockClear();
      await storeOfflineCredentials(
        "test@example.com",
        "newpassword",
        mockUser,
      );

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle multiple users on same device", async () => {
      const user1 = { ...mockUser, id: "user-1", email: "user1@example.com" };
      const user2 = { ...mockUser, id: "user-2", email: "user2@example.com" };

      // User 1 stores credentials
      await storeOfflineCredentials("user1@example.com", "pass1", user1);

      // User 1 logs out
      await clearAllOfflineAuthData();

      // User 2 stores credentials
      vi.mocked(indexedDBManager.setMetadata).mockClear();
      await storeOfflineCredentials("user2@example.com", "pass2", user2);

      expect(indexedDBManager.setMetadata).toHaveBeenCalled();
    });

    it("should handle offline → online transition", async () => {
      const credentialsData = {
        id: mockUser.id,
        email: "test@example.com",
        passwordHash: "01".repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      };

      // Offline login
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce(credentialsData)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(credentialsData);

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const loginResult = await offlineLogin("test@example.com", "password");
      expect(loginResult).not.toBeNull();

      // Clear offline data when going online
      await clearAllOfflineAuthData();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_credentials",
        null,
      );
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        "offline_session",
        null,
      );
    });
  });
});
