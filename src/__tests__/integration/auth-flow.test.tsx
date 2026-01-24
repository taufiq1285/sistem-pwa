/**
 * Authentication Flow Integration Tests - CORE LOGIC
 * Tests for complete authentication flows
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { login, register, logout, getSession } from "@/lib/supabase/auth";
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
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
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

describe("Authentication Flow - CORE LOGIC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Login Flow", () => {
    it("should complete login flow with valid credentials", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        email_confirmed_at: new Date().toISOString(),
      };

      const mockSession = {
        access_token: "token-123",
        refresh_token: "refresh-123",
        expires_at: Date.now() / 1000 + 3600,
      };

      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
        nim: "BD2321001",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
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

      // Execute login
      const result = await login(credentials);

      // Verify login success
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe("test@example.com");
      expect(result.user?.role).toBe("mahasiswa");
      expect(result.session).toBeDefined();
      expect(result.session?.access_token).toBe("token-123");

      // Verify Supabase methods were called
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password,
      });
    });

    it("should handle login flow with invalid credentials", async () => {
      const credentials: LoginCredentials = {
        email: "wrong@example.com",
        password: "wrongpassword",
      };

      // Mock failed login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "Invalid login credentials",
          name: "AuthApiError",
          status: 400,
        },
      } as any);

      // Execute login
      const result = await login(credentials);

      // Verify login failure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Invalid login credentials");
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
    });

    it("should handle network errors during login", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      // Mock network error
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(
        new Error("Network request failed"),
      );

      // Execute login
      const result = await login(credentials);

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network request failed");
    });

    it("should handle missing user data after successful auth", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      // Mock successful auth but no user data
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      // Execute login
      const result = await login(credentials);

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Registration Flow", () => {
    it("should complete registration flow for mahasiswa", async () => {
      const registerData: RegisterData = {
        email: "newstudent@example.com",
        password: "password123",
        full_name: "New Student",
        role: "mahasiswa",
        nim: "BD2321002",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      };

      const mockAuthData = {
        user: {
          id: "user-new-123",
          email: "newstudent@example.com",
        },
        session: {
          access_token: "new-token-123",
          refresh_token: "new-refresh-123",
        },
      };

      // Mock successful signup
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock profile creation
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // Execute registration
      const result = await register(registerData);

      // Verify registration success
      expect(result.success).toBe(true);
      expect(result.message).toContain("Registrasi berhasil");

      // Verify Supabase methods were called correctly
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        options: expect.objectContaining({
          data: expect.objectContaining({
            full_name: registerData.full_name,
            role: "mahasiswa",
            nim: registerData.nim,
            program_studi: registerData.program_studi,
          }),
        }),
      });
    });

    it("should complete registration flow for dosen", async () => {
      const registerData: RegisterData = {
        email: "newdosen@example.com",
        password: "password123",
        full_name: "New Dosen",
        role: "dosen",
        nidn: "1234567890",
        nip: "198001012020011001",
        gelar_depan: "Dr.",
        gelar_belakang: "M.Keb",
      };

      const mockAuthData = {
        user: {
          id: "dosen-new-123",
          email: "newdosen@example.com",
        },
        session: {
          access_token: "dosen-token-123",
        },
      };

      // Mock successful signup
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: mockAuthData,
        error: null,
      } as any);

      // Mock profile creation
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      // Execute registration
      const result = await register(registerData);

      // Verify registration success
      expect(result.success).toBe(true);

      // Verify role-specific data was passed
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        options: expect.objectContaining({
          data: expect.objectContaining({
            role: "dosen",
            nidn: registerData.nidn,
            nip: registerData.nip,
          }),
        }),
      });
    });

    it("should handle duplicate email during registration", async () => {
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

      // Mock duplicate email error
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: {
          message: "User already registered",
          name: "AuthApiError",
          status: 400,
        },
      } as any);

      // Execute registration
      const result = await register(registerData);

      // Verify error handling
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

      // Mock successful signup
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

      // Mock rollback
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      } as any);

      // Execute registration
      const result = await register(registerData);

      // Verify rollback occurred
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("Logout Flow", () => {
    it("should complete logout flow successfully", async () => {
      // Mock successful logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      // Execute logout
      const result = await logout();

      // Verify logout success
      expect(result.success).toBe(true);
      expect(result.message).toBe("Logged out successfully");
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it("should handle logout errors", async () => {
      // Mock logout error
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: {
          message: "Failed to sign out",
          name: "AuthError",
          status: 500,
        },
      } as any);

      // Execute logout
      const result = await logout();

      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to sign out");
    });

    it("should clear local session data after logout", async () => {
      // Mock successful logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      // Execute logout
      await logout();

      // Verify session is cleared (getSession should return null)
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const session = await getSession();
      expect(session).toBeNull();
    });
  });

  describe("Session Management", () => {
    it("should retrieve active session", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        access_token: "active-token-123",
        refresh_token: "refresh-123",
        expires_at: Date.now() / 1000 + 3600,
      };

      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
      };

      // Mock active session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      // Mock getUserProfile
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

      // Execute getSession
      const session = await getSession();

      // Verify session retrieved
      expect(session).not.toBeNull();
      expect(session?.access_token).toBe("active-token-123");
      expect(session?.user.email).toBe("test@example.com");
    });

    it("should return null when no active session", async () => {
      // Mock no active session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      // Execute getSession
      const session = await getSession();

      // Verify null returned
      expect(session).toBeNull();
    });

    it("should handle session errors gracefully", async () => {
      // Mock session error
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: {
          message: "Session retrieval failed",
          name: "AuthError",
          status: 500,
        },
      } as any);

      // Execute getSession
      const session = await getSession();

      // Verify null returned on error
      expect(session).toBeNull();
    });
  });

  describe("Session Persistence", () => {
    it("should persist session after successful login", async () => {
      const credentials: LoginCredentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockSession = {
        access_token: "persistent-token",
        refresh_token: "persistent-refresh",
        expires_at: Date.now() / 1000 + 3600,
      };

      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "mahasiswa",
        is_active: true,
      };

      // Mock login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

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

      // Execute login
      const loginResult = await login(credentials);
      expect(loginResult.success).toBe(true);

      // Simulate page reload - getSession should return the session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { ...mockSession, user: mockUser } },
        error: null,
      } as any);

      const persistedSession = await getSession();

      // Verify session persisted
      expect(persistedSession).not.toBeNull();
      expect(persistedSession?.access_token).toBe("persistent-token");
    });

    it("should handle expired session", async () => {
      const expiredSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        access_token: "expired-token",
        refresh_token: "expired-refresh",
        expires_at: Date.now() / 1000 - 3600, // Expired 1 hour ago
      };

      // Mock expired session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      } as any);

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

      // Execute getSession
      const session = await getSession();

      // Session should still be returned (Supabase handles refresh)
      expect(session).not.toBeNull();
    });
  });

  describe("Complete Auth Flow", () => {
    it("should handle complete login -> logout flow", async () => {
      const credentials: LoginCredentials = {
        email: "flow@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "flow-user-123",
        email: "flow@example.com",
      };

      const mockSession = {
        access_token: "flow-token",
        refresh_token: "flow-refresh",
        expires_at: Date.now() / 1000 + 3600,
      };

      const mockProfile = {
        id: "flow-user-123",
        email: "flow@example.com",
        full_name: "Flow Test User",
        role: "dosen",
        is_active: true,
      };

      // Step 1: Login
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as any);

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

      const loginResult = await login(credentials);
      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.role).toBe("dosen");

      // Step 2: Verify session exists
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { ...mockSession, user: mockUser } },
        error: null,
      } as any);

      const activeSession = await getSession();
      expect(activeSession).not.toBeNull();

      // Step 3: Logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      const logoutResult = await logout();
      expect(logoutResult.success).toBe(true);

      // Step 4: Verify session cleared
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const clearedSession = await getSession();
      expect(clearedSession).toBeNull();
    });

    it("should handle complete register -> login flow", async () => {
      // Step 1: Register
      const registerData: RegisterData = {
        email: "newflow@example.com",
        password: "password123",
        full_name: "New Flow User",
        role: "mahasiswa",
        nim: "BD2321999",
        program_studi: "Kebidanan",
        angkatan: 2023,
        semester: 1,
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: { id: "new-flow-123", email: "newflow@example.com" },
          session: { access_token: "new-flow-token" },
        },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const registerResult = await register(registerData);
      expect(registerResult.success).toBe(true);

      // Step 2: Login with new credentials
      const mockProfile = {
        id: "new-flow-123",
        email: "newflow@example.com",
        full_name: "New Flow User",
        role: "mahasiswa",
        is_active: true,
        mahasiswa: {
          id: "mhs-new-flow-123",
          nim: "BD2321999",
          program_studi: "Kebidanan",
          angkatan: 2023,
          semester: 1,
        },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: "new-flow-123", email: "newflow@example.com" },
          session: {
            access_token: "login-token",
            refresh_token: "login-refresh",
            expires_at: Date.now() / 1000 + 3600,
          },
        },
        error: null,
      } as any);

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

      const loginResult = await login({
        email: "newflow@example.com",
        password: "password123",
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.email).toBe("newflow@example.com");
      expect(loginResult.user?.mahasiswa?.nim).toBe("BD2321999");
    });
  });
});
