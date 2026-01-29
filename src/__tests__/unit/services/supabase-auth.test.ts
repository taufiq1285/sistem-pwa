/**
 * Supabase Auth Service Unit Tests
 * Comprehensive testing of authentication service functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type {
  AuthUser,
  LoginCredentials,
  RegisterData,
} from "../../../types/auth.types";

// Create mock functions first (hoisted for vi.mock)
const mockSupabaseAuth = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

const mockSupabaseFrom = vi.hoisted(() => vi.fn());
const mockSupabaseSelect = vi.hoisted(() => vi.fn());
const mockSupabaseSingle = vi.hoisted(() => vi.fn());
const mockSupabaseEq = vi.hoisted(() => vi.fn());

// Mock dependencies
vi.mock("../../../lib/supabase/client", () => ({
  supabase: {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  },
}));

vi.mock("../../../lib/middleware", () => ({
  clearUserRoleCache: vi.fn(),
}));

vi.mock("../../../lib/utils/logger", () => ({
  logger: {
    auth: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Import after mocking
import {
  login,
  logout,
  register,
  getCurrentUser,
  getCurrentSession,
  refreshSession,
  resetPassword,
  getUserProfile,
} from "../../../lib/supabase/auth";

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

    // Setup default mock chain for database queries
    const mockQueryChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      single: mockSupabaseSingle,
      maybeSingle: mockSupabaseSingle,
      insert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
    };

    mockSupabaseFrom.mockReturnValue(mockQueryChain as any);
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

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: mockSession,
        },
        error: null,
      });

      mockSupabaseSingle
        .mockResolvedValueOnce({
          data: mockUser,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await login(mockCredentials);

      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: mockCredentials.email,
        password: mockCredentials.password,
      });

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject(mockUser);
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe("mock-token");
    });

    it("should handle login error", async () => {
      const loginError = { message: "Invalid credentials" };

      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: loginError,
      });

      const result = await login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: null,
      });

      const result = await logout();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should handle logout error", async () => {
      const logoutError = { message: "Logout failed" };

      mockSupabaseAuth.signOut.mockResolvedValue({
        error: logoutError,
      });

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Logout failed");
    });
  });

  describe("register", () => {
    it("should register successfully with valid data", async () => {
      mockSupabaseFrom.mockImplementation(
        () =>
          ({
            insert: vi.fn().mockResolvedValue({ error: null }),
          }) as any,
      );

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: {
          user: { id: mockUser.id, email: mockUser.email },
          session: { access_token: "token" },
        },
        error: null,
      });

      mockSupabaseSingle.mockResolvedValue({
        data: mockUser,
        error: null,
      });

      const result = await register(mockRegisterData);

      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
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
      const registerError = { message: "Email already exists" };

      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: registerError,
      });

      const result = await register(mockRegisterData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email already exists");
    });
  });

  describe("getCurrentUser", () => {
    it("should get current user successfully", async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: mockUser.id, email: mockUser.email } },
        error: null,
      });

      mockSupabaseSingle
        .mockResolvedValueOnce({
          data: mockUser,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: null,
        });

      const result = await getCurrentUser();

      expect(result).toMatchObject(mockUser);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledTimes(1);
    });

    it("should return null when no user", async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
