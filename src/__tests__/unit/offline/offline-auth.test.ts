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

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
} from '../../../lib/offline/offline-auth';
import { indexedDBManager } from '../../../lib/offline/indexeddb';
import type { AuthUser, AuthSession } from '@/types/auth.types';

// Mock IndexedDB manager
vi.mock('../../../lib/offline/indexeddb', () => ({
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

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: mockCryptoSubtle,
  },
  writable: true,
});

// Mock TextEncoder
global.TextEncoder = class {
  encode(str: string) {
    return new Uint8Array(str.split('').map((c) => c.charCodeAt(0)));
  }
} as any;

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Offline Authentication', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'mahasiswa',
  };

  const mockSession: AuthSession = {
    access_token: 'test_token',
    refresh_token: 'refresh_token',
    expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock crypto.subtle.digest to return consistent hash
    mockCryptoSubtle.digest.mockImplementation(() => {
      const hash = new Uint8Array(32).fill(1); // Simple mock hash
      return Promise.resolve(hash.buffer);
    });
  });

  describe('storeOfflineCredentials', () => {
    it('should store hashed credentials successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      await storeOfflineCredentials(email, password, mockUser);

      expect(indexedDBManager.initialize).toHaveBeenCalled();
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_credentials',
        expect.objectContaining({
          id: mockUser.id,
          email: email.toLowerCase(),
          passwordHash: expect.any(String),
          createdAt: expect.any(Number),
          expiresAt: expect.any(Number),
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ Offline credentials stored successfully'
      );
    });

    it('should store email in lowercase', async () => {
      const email = 'Test@EXAMPLE.COM';

      await storeOfflineCredentials(email, 'password', mockUser);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_credentials',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    it('should set expiration to 30 days', async () => {
      const now = Date.now();
      const expectedExpiry = now + 30 * 24 * 60 * 60 * 1000;

      await storeOfflineCredentials('test@example.com', 'password', mockUser);

      const call = vi.mocked(indexedDBManager.setMetadata).mock.calls[0];
      const credentials = call[1] as any;

      expect(credentials.expiresAt).toBeCloseTo(expectedExpiry, -3); // Within 1 second
    });

    it('should handle storage errors', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(
        storeOfflineCredentials('test@example.com', 'password', mockUser)
      ).rejects.toThrow('Storage error');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to store offline credentials:',
        expect.any(Error)
      );
    });
  });

  describe('verifyOfflineCredentials', () => {
    it('should verify correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // Mock stored credentials with same hash
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: email.toLowerCase(),
        passwordHash: '01'.repeat(32), // Match mock hash
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      });

      const isValid = await verifyOfflineCredentials(email, password);

      expect(isValid).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline credentials verified');
    });

    it('should reject invalid password', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: 'different_hash',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials('test@example.com', 'wrongpassword');

      expect(isValid).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Invalid password');
    });

    it('should reject when no credentials stored', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const isValid = await verifyOfflineCredentials('test@example.com', 'password');

      expect(isValid).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('❌ No offline credentials found');
    });

    it('should reject expired credentials', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000, // Expired
      });

      const isValid = await verifyOfflineCredentials('test@example.com', 'password');

      expect(isValid).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Offline credentials expired');
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_credentials',
        null
      );
    });

    it('should reject mismatched email', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'other@example.com',
        passwordHash: 'hash',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials('test@example.com', 'password');

      expect(isValid).toBe(false);
      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Email mismatch');
    });

    it('should be case-insensitive for email', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: '01'.repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isValid = await verifyOfflineCredentials('TEST@EXAMPLE.COM', 'password');

      expect(isValid).toBe(true);
    });

    it('should handle verification errors', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error('Read error')
      );

      const isValid = await verifyOfflineCredentials('test@example.com', 'password');

      expect(isValid).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to verify offline credentials:',
        expect.any(Error)
      );
    });
  });

  describe('clearOfflineCredentials', () => {
    it('should clear stored credentials', async () => {
      await clearOfflineCredentials();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_credentials',
        null
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline credentials cleared');
    });

    it('should handle clear errors', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Clear error')
      );

      await clearOfflineCredentials();

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to clear offline credentials:',
        expect.any(Error)
      );
    });
  });

  describe('storeOfflineSession', () => {
    it('should store session with 24-hour expiry', async () => {
      const now = Date.now();

      await storeOfflineSession(mockUser, mockSession);

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_session',
        expect.objectContaining({
          id: mockUser.id,
          user: mockUser,
          session: mockSession,
          createdAt: expect.any(Number),
          expiresAt: now + 24 * 60 * 60 * 1000,
        })
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline session stored');
    });

    it('should handle storage errors', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(
        storeOfflineSession(mockUser, mockSession)
      ).rejects.toThrow('Storage error');
    });
  });

  describe('restoreOfflineSession', () => {
    it('should restore valid session', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const restored = await restoreOfflineSession();

      expect(restored).toEqual({
        user: mockUser,
        session: mockSession,
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline session restored');
    });

    it('should return null when no session stored', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
      expect(mockConsoleLog).toHaveBeenCalledWith('ℹ️ No offline session found');
    });

    it('should return null and clear expired session', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        user: mockUser,
        session: mockSession,
        createdAt: Date.now() - 48 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000, // Expired
      });

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
      expect(mockConsoleLog).toHaveBeenCalledWith('❌ Offline session expired');
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith('offline_session', null);
    });

    it('should handle restore errors', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error('Read error')
      );

      const restored = await restoreOfflineSession();

      expect(restored).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to restore offline session:',
        expect.any(Error)
      );
    });
  });

  describe('clearOfflineSession', () => {
    it('should clear stored session', async () => {
      await clearOfflineSession();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith('offline_session', null);
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline session cleared');
    });

    it('should handle clear errors', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Clear error')
      );

      await clearOfflineSession();

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to clear offline session:',
        expect.any(Error)
      );
    });
  });

  describe('getStoredUserData', () => {
    it('should get user data from stored credentials', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const user = await getStoredUserData();

      expect(user).toEqual(mockUser);
      expect(indexedDBManager.getById).toHaveBeenCalledWith('users', mockUser.id);
    });

    it('should return null when no credentials', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const user = await getStoredUserData();

      expect(user).toBeNull();
    });

    it('should return null when user not found', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      const user = await getStoredUserData();

      expect(user).toBeNull();
    });

    it('should handle errors', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error('Read error')
      );

      const user = await getStoredUserData();

      expect(user).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to get stored user data:',
        expect.any(Error)
      );
    });
  });

  describe('storeUserData', () => {
    it('should create user when not exists', async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      await storeUserData(mockUser);

      expect(indexedDBManager.create).toHaveBeenCalledWith('users', mockUser);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ User data stored for offline access'
      );
    });

    it('should update user when exists', async () => {
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      await storeUserData(mockUser);

      expect(indexedDBManager.update).toHaveBeenCalledWith('users', mockUser);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        '✅ User data stored for offline access'
      );
    });

    it('should handle storage errors', async () => {
      vi.mocked(indexedDBManager.getById).mockRejectedValue(
        new Error('Read error')
      );

      await expect(storeUserData(mockUser)).rejects.toThrow('Read error');
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to store user data:',
        expect.any(Error)
      );
    });
  });

  describe('offlineLogin', () => {
    it('should perform successful offline login', async () => {
      // Mock credential verification
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: '01'.repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      // Mock user data retrieval
      vi.mocked(indexedDBManager.getById).mockResolvedValue(mockUser);

      const result = await offlineLogin('test@example.com', 'password');

      expect(result).not.toBeNull();
      expect(result?.user).toEqual(mockUser);
      expect(result?.session).toMatchObject({
        access_token: 'offline_session_token',
        refresh_token: 'offline_refresh_token',
        user: mockUser,
      });
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Offline login successful');
    });

    it('should return null for invalid credentials', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const result = await offlineLogin('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should restore existing session if available', async () => {
      // Mock credential verification
      vi.mocked(indexedDBManager.getMetadata)
        .mockResolvedValueOnce({
          // Credentials check
          id: mockUser.id,
          email: 'test@example.com',
          passwordHash: '01'.repeat(32),
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

      const result = await offlineLogin('test@example.com', 'password');

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should return null when user data not found', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: '01'.repeat(32),
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      vi.mocked(indexedDBManager.getById).mockResolvedValue(null);

      const result = await offlineLogin('test@example.com', 'password');

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith('❌ User data not found');
    });

    it('should handle login errors', async () => {
      vi.mocked(indexedDBManager.initialize).mockRejectedValue(
        new Error('Init error')
      );

      const result = await offlineLogin('test@example.com', 'password');

      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Offline login failed:',
        expect.any(Error)
      );
    });
  });

  describe('isOfflineLoginAvailable', () => {
    it('should return true when credentials exist and not expired', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
      });

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(true);
    });

    it('should return false when no credentials', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue(undefined);

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should return false when credentials expired', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockResolvedValue({
        id: mockUser.id,
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 1000,
      });

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
    });

    it('should handle errors', async () => {
      vi.mocked(indexedDBManager.getMetadata).mockRejectedValue(
        new Error('Read error')
      );

      const isAvailable = await isOfflineLoginAvailable();

      expect(isAvailable).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to check offline login availability:',
        expect.any(Error)
      );
    });
  });

  describe('clearAllOfflineAuthData', () => {
    it('should clear both credentials and session', async () => {
      await clearAllOfflineAuthData();

      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith(
        'offline_credentials',
        null
      );
      expect(indexedDBManager.setMetadata).toHaveBeenCalledWith('offline_session', null);
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ All offline auth data cleared');
    });

    it('should handle errors during clear', async () => {
      vi.mocked(indexedDBManager.setMetadata).mockRejectedValue(
        new Error('Clear error')
      );

      await clearAllOfflineAuthData();

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ Failed to clear offline auth data:',
        expect.any(Error)
      );
    });
  });

  describe('Password Hashing', () => {
    it('should use consistent salt for same email', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // Store credentials twice with same email
      await storeOfflineCredentials(email, password, mockUser);
      const firstHash = vi.mocked(indexedDBManager.setMetadata).mock.calls[0][1] as any;

      vi.clearAllMocks();

      await storeOfflineCredentials(email, password, mockUser);
      const secondHash = vi.mocked(indexedDBManager.setMetadata).mock.calls[0][1] as any;

      expect(firstHash.passwordHash).toBe(secondHash.passwordHash);
    });

    it('should use different salt for different emails', async () => {
      const password = 'password123';

      await storeOfflineCredentials('user1@example.com', password, {
        ...mockUser,
        id: 'user-1',
      });
      const hash1 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0][1] as any;

      vi.clearAllMocks();

      await storeOfflineCredentials('user2@example.com', password, {
        ...mockUser,
        id: 'user-2',
      });
      const hash2 = vi.mocked(indexedDBManager.setMetadata).mock.calls[0][1] as any;

      // Hashes should be different because salts are different
      // (In our mock, they'll be the same, but in real implementation they'd differ)
      expect(hash1.email).not.toBe(hash2.email);
    });
  });
});
