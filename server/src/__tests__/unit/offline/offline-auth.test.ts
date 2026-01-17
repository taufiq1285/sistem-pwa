/**
 * Offline Authentication Unit Tests
 *
 * Tests for offline login functionality including:
 * - Credential storage and verification
 * - Password hashing (SHA-256)
 * - Session management
 * - Expiration handling
 * - Offline login flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "../../../lib/offline/offline-auth";
import { indexedDBManager } from "../../../lib/offline/indexeddb";
import type { AuthUser, AuthSession } from "../../../types/auth.types";

// Mock IndexedDB manager
vi.mock("../../../lib/offline/indexeddb", () => ({
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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

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
  });

  describe("Password Hashing", () => {
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
  });
});
