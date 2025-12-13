/**
 * Auth API Unit Tests - CORE LOGIC
 * Tests for authentication functionality
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  register,
  logout,
  getSession,
  getCurrentUser,
} from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import type { LoginCredentials, RegisterData } from "@/types/auth.types";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    auth: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Auth API - CORE LOGIC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: 1234567890,
      };

      // Mock successful login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      } as any);

      // Mock getUserProfile
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            abortSignal: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await login(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password,
      });
    });

    it("should return error with invalid credentials", async () => {
      const credentials: LoginCredentials = {
        email: "wrong@example.com",
        password: "wrongpassword",
      };

      // Mock failed login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          name: "AuthError",
          status: 400,
        },
      } as any);

      const result = await login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Invalid login credentials");
    });

    it("should handle network errors during login", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      // Mock network error
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("register", () => {
    it("should register new mahasiswa successfully", async () => {
      const registerData: RegisterData = {
        email: "mahasiswa@example.com",
        password: "password123",
        full_name: "Test Mahasiswa",
        role: "mahasiswa",
        nim: "BD2321001",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      };

      const mockAuthData = {
        user: { id: "user-123", email: "mahasiswa@example.com" },
        session: { access_token: "token-123" },
      };

      // Mock successful signup
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock user profile creation
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await register(registerData);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Registrasi berhasil");
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        options: expect.objectContaining({
          data: expect.objectContaining({
            full_name: registerData.full_name,
            role: "mahasiswa",
            nim: registerData.nim,
          }),
        }),
      });
    });

    it("should register new dosen successfully", async () => {
      const registerData: RegisterData = {
        email: "dosen@example.com",
        password: "password123",
        full_name: "Test Dosen",
        role: "dosen",
        nidn: "1234567890",
        nip: "198001012020011001",
        gelar_depan: "Dr.",
        gelar_belakang: "M.Keb",
      };

      const mockAuthData = {
        user: { id: "user-456", email: "dosen@example.com" },
        session: { access_token: "token-456" },
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await register(registerData);

      expect(result.success).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        options: expect.objectContaining({
          data: expect.objectContaining({
            role: "dosen",
            nidn: registerData.nidn,
          }),
        }),
      });
    });

    it("should return error when email already exists", async () => {
      const registerData: RegisterData = {
        email: "existing@example.com",
        password: "password123",
        full_name: "Test User",
        role: "mahasiswa",
        nim: "BD2321001",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      };

      // Mock email already exists error
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "User already registered",
          name: "AuthError",
          status: 400,
        },
      } as any);

      const result = await register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email sudah terdaftar");
    });

    it("should handle profile creation failure with rollback", async () => {
      const registerData: RegisterData = {
        email: "test@example.com",
        password: "password123",
        full_name: "Test User",
        role: "mahasiswa",
        nim: "BD2321001",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      };

      const mockAuthData = {
        user: { id: "user-123", email: "test@example.com" },
        session: { access_token: "token-123" },
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock profile creation failure
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: { message: "Duplicate NIM", code: "23505" },
        }),
      } as any);

      // Mock signOut for rollback
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      // Mock fetch for rollback function
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as any);

      const result = await register(registerData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      const result = await logout();

      expect(result.success).toBe(true);
      expect(result.message).toBe("Logged out successfully");
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: "Logout failed", name: "AuthError", status: 500 },
      } as any);

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Logout failed");
    });
  });

  describe("getSession", () => {
    it("should return current session when logged in", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@example.com" },
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: 1234567890,
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      // Mock getUserProfile
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            abortSignal: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getSession();

      expect(result).not.toBeNull();
      expect(result?.user).toBeDefined();
      expect(result?.access_token).toBe("token-123");
    });

    it("should return null when not logged in", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const result = await getSession();

      expect(result).toBeNull();
    });

    it("should handle session errors", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: "Session error", name: "AuthError", status: 500 },
      } as any);

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("should return current user when authenticated", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Mock getUserProfile
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            abortSignal: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getCurrentUser();

      expect(result).not.toBeNull();
      expect(result?.id).toBe("user-123");
      expect(result?.role).toBe("mahasiswa");
    });

    it("should return null when not authenticated", async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
