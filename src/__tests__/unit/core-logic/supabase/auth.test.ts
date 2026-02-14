/**
 * Supabase Auth Helper Unit Tests
 * Comprehensive testing of authentication functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
} from "../../../../types/auth.types";

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("../../../../lib/middleware", () => ({
  clearUserRoleCache: vi.fn(),
}));

vi.mock("../../../../lib/utils/logger", () => ({
  logger: {
    auth: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocking
import {
  login,
  logout,
  register,
  getCurrentUser,
  getSession,
  refreshSession,
  resetPassword,
  updatePassword,
  isAuthenticated,
  onAuthStateChange,
} from "../../../../lib/supabase/auth";

// Import supabase client to access mocks
import { supabase } from "../../../../lib/supabase/client";
import { clearUserRoleCache } from "../../../../lib/middleware";

describe("Supabase Auth Helper", () => {
  const mockUser: AuthUser = {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "test@example.com",
    full_name: "Test User",
    role: "mahasiswa",
    avatar_url: null,
    is_active: true,
    last_seen_at: new Date().toISOString(),
    metadata: {},
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const mockCredentials: LoginCredentials = {
    email: "test@example.com",
    password: "password123",
  };

  const mockRegisterData: RegisterData = {
    email: "test@example.com",
    password: "password123",
    full_name: "Test User",
    role: "mahasiswa",
    nim: "12345678",
    program_studi: "Informatika",
    angkatan: 2020,
    semester: 6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Add some mock Supabase keys to test cleanup
    localStorageMock.setItem("sb-test-token", "test-value");
    localStorageMock.setItem("sb-refresh-token", "refresh-value");
    localStorageMock.setItem("sb-other-key", "other-value");
    sessionStorageMock.setItem("sb-test-session", "test-session");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockSession = {
        access_token: "mock-token",
        refresh_token: "mock-refresh",
        expires_at: Date.now() + 3600000,
      };

      // Mock signInWithPassword
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: mockSession,
        },
        error: null,
      });

      // Mock getUserProfile (by mocking supabase.from)
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await login(mockCredentials);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockCredentials.email,
        password: mockCredentials.password,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe("mock-token");
    });

    it("should handle login error", async () => {
      const loginError = { message: "Invalid credentials" };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: loginError,
      });

      const result = await login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });

    it("should handle missing user after login", async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No user returned from login");
    });
  });

  describe("register", () => {
    it("should register mahasiswa successfully", async () => {
      // Mock signUp
      (supabase.auth.signUp as any).mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: { access_token: "token" },
        },
        error: null,
      });

      // Mock database inserts
      const mockInsert1 = vi.fn().mockResolvedValue({ error: null });
      const mockInsert2 = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any)
        .mockReturnValueOnce({ insert: mockInsert1 }) // users table
        .mockReturnValueOnce({ insert: mockInsert2 }); // mahasiswa table

      const result = await register(mockRegisterData);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: mockRegisterData.email,
        password: mockRegisterData.password,
        options: {
          data: expect.objectContaining({
            full_name: mockRegisterData.full_name,
            role: mockRegisterData.role,
            nim: mockRegisterData.nim,
            program_studi: mockRegisterData.program_studi,
            angkatan: mockRegisterData.angkatan,
            semester: mockRegisterData.semester,
          }),
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("Registrasi berhasil");
    });

    it("should handle registration error - already registered", async () => {
      const registerError = { message: "User already registered" };

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: registerError,
      });

      const result = await register(mockRegisterData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email sudah terdaftar");
    });

    it("should handle profile creation failure with rollback", async () => {
      // Mock signUp
      (supabase.auth.signUp as any).mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: { access_token: "token" },
        },
        error: null,
      });

      // Mock database insert failure
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: "Duplicate key" },
      });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      // Mock signOut for rollback
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      // Mock fetch for rollback edge function
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        } as Response),
      );

      const result = await register(mockRegisterData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("logout", () => {
    it("should logout successfully and clear storage", async () => {
      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      const result = await logout();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(clearUserRoleCache).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);

      // Verify localStorage was cleared of Supabase keys
      expect(localStorageMock.getItem("sb-test-token")).toBeNull();
      expect(localStorageMock.getItem("sb-refresh-token")).toBeNull();
      expect(localStorageMock.getItem("sb-other-key")).toBeNull();
    });

    it("should handle logout error", async () => {
      const logoutError = { message: "Logout failed" };

      (supabase.auth.signOut as any).mockResolvedValue({
        error: logoutError,
      });

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Logout failed");
    });

    it("should clear sessionStorage as well", async () => {
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      await logout();

      expect(sessionStorageMock.getItem("sb-test-session")).toBeNull();
    });
  });

  describe("getSession", () => {
    it("should get session successfully", async () => {
      const mockSession = {
        access_token: "mock-token",
        refresh_token: "mock-refresh",
        expires_at: Date.now() + 3600000,
        user: { id: mockUser.id },
      };

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock getUserProfile
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getSession();

      expect(result).toBeDefined();
      expect(result?.user).toBeDefined();
      expect(result?.access_token).toBe("mock-token");
    });

    it("should return null when no session", async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getSession();

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe("refreshSession", () => {
    it("should refresh session successfully", async () => {
      const mockSession = {
        access_token: "new-token",
        refresh_token: "new-refresh",
        expires_at: Date.now() + 3600000,
        user: { id: mockUser.id },
      };

      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock getUserProfile
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await refreshSession();

      expect(result).toBeDefined();
      expect(result?.access_token).toBe("new-token");
      expect(result?.user).toBeDefined();
    });

    it("should return null when refresh fails", async () => {
      (supabase.auth.refreshSession as any).mockResolvedValue({
        data: { session: null },
        error: { message: "Refresh failed" },
      });

      const result = await refreshSession();

      expect(result).toBeNull();
    });
  });

  describe("resetPassword", () => {
    it("should send reset password email successfully", async () => {
      (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
        error: null,
      });

      const result = await resetPassword("test@example.com");

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Password reset email sent");
    });

    it("should handle reset password error", async () => {
      const resetError = { message: "Email not found" };

      (supabase.auth.resetPasswordForEmail as any).mockResolvedValue({
        error: resetError,
      });

      const result = await resetPassword("test@example.com");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email not found");
    });
  });

  describe("updatePassword", () => {
    it("should update password successfully", async () => {
      (supabase.auth.updateUser as any).mockResolvedValue({
        error: null,
      });

      const result = await updatePassword("newPassword123");

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("Password updated successfully");
    });

    it("should handle update password error", async () => {
      const updateError = { message: "Password too weak" };

      (supabase.auth.updateUser as any).mockResolvedValue({
        error: updateError,
      });

      const result = await updatePassword("weak");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password too weak");
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user successfully", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUser.id, email: mockUser.email } },
        error: null,
      });

      // Mock getUserProfile
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await getCurrentUser();

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should return null when no user", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: "Get user failed" },
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when user has session", async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: { id: mockUser.id } } },
        error: null,
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when no session", async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it("should return false on error", async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: { message: "Session error" },
      });

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("onAuthStateChange", () => {
    it("should setup auth state change listener", () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      (supabase.auth.onAuthStateChange as any).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it("should call unsubscribe function", () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      (supabase.auth.onAuthStateChange as any).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(mockCallback);
      unsubscribe();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
