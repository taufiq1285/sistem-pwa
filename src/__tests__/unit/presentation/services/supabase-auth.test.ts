/**
 * Supabase Auth Service Unit Tests
 * Comprehensive testing of authentication service functionality
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
} from "../../../../lib/supabase/auth";

// Import supabase client to access mocks
import { supabase } from "../../../../lib/supabase/client";

describe("Supabase Auth Service", () => {
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
    // Clear localStorage and sessionStorage
    localStorageMock.clear();
    sessionStorageMock.clear();
    // Add some mock Supabase keys
    localStorageMock.setItem("sb-test-token", "test-value");
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

      // Mock supabase.from for user profile query
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // Mock supabase.from for role-specific data query
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: "mhs-123",
          nim: mockRegisterData.nim,
          program_studi: mockRegisterData.program_studi,
          angkatan: mockRegisterData.angkatan,
          semester: mockRegisterData.semester,
        },
        error: null,
      });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect2 = vi.fn().mockReturnValue({ eq: mockEq2 });

      (supabase.from as any)
        .mockReturnValueOnce({ select: mockSelect }) // For users table
        .mockReturnValueOnce({ select: mockSelect2 }); // For mahasiswa table

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
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      (supabase.auth.signOut as any).mockResolvedValue({
        error: null,
      });

      const result = await logout();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      // Verify localStorage was cleared
      expect(localStorageMock.length).toBe(0);
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
  });

  describe("register", () => {
    it("should register successfully with valid data", async () => {
      // Setup mock for database insertions
      const mockInsert1 = vi.fn().mockResolvedValue({ error: null });
      const mockInsert2 = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any)
        .mockReturnValueOnce({ insert: mockInsert1 }) // For users table
        .mockReturnValueOnce({ insert: mockInsert2 }); // For mahasiswa table

      (supabase.auth.signUp as any).mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: { access_token: "token" },
        },
        error: null,
      });

      const result = await register(mockRegisterData);

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: mockRegisterData.email,
        password: mockRegisterData.password,
        options: {
          data: expect.objectContaining({
            full_name: mockRegisterData.full_name,
            role: mockRegisterData.role,
          }),
        },
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeUndefined();
      expect(result.message).toBeDefined();
    });

    it("should handle registration error", async () => {
      const registerError = { message: "User already registered" };

      (supabase.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: registerError,
      });

      const result = await register(mockRegisterData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Email sudah terdaftar. Silakan gunakan email lain atau login.",
      );
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user successfully", async () => {
      // Mock auth.getUser
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUser.id, email: mockUser.email } },
        error: null,
      });

      // Mock supabase.from for user profile query
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUser,
        error: null,
      });
      const mockAbortSignal = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ abortSignal: mockAbortSignal });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // Mock supabase.from for role-specific data query
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          id: "mhs-123",
          nim: mockRegisterData.nim,
          program_studi: mockRegisterData.program_studi,
          angkatan: mockRegisterData.angkatan,
          semester: mockRegisterData.semester,
        },
        error: null,
      });
      const mockEq2 = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect2 = vi.fn().mockReturnValue({ eq: mockEq2 });

      (supabase.from as any)
        .mockReturnValueOnce({ select: mockSelect }) // For users table
        .mockReturnValueOnce({ select: mockSelect2 }); // For mahasiswa table

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
  });
});
