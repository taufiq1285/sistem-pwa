/**
 * Auth API Unit Tests - CORE LOGIC
 * Target: src/lib/api/auth.api.ts
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as authApi from "@/lib/api/auth.api";
import * as supabaseAuth from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";

vi.mock("@/lib/supabase/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe("auth.api - CORE LOGIC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("delegation & error handling", () => {
    it("login: delegate ke supabaseAuth.login", async () => {
      const credentials = {
        email: "test@example.com",
        password: "Strong123",
      };
      const expected = { success: true };

      vi.mocked(supabaseAuth.login).mockResolvedValue(expected as any);

      const result = await authApi.login(credentials as any);

      expect(result).toEqual(expected);
      expect(supabaseAuth.login).toHaveBeenCalledWith(credentials);
      expect(logger.debug).toHaveBeenCalled();
    });

    it("login: throw ulang saat supabaseAuth.login gagal", async () => {
      const err = new Error("login failed");
      vi.mocked(supabaseAuth.login).mockRejectedValue(err);

      await expect(
        authApi.login({ email: "x@y.com", password: "123" } as any),
      ).rejects.toThrow("login failed");

      expect(logger.error).toHaveBeenCalled();
    });

    it("register: delegate ke supabaseAuth.register", async () => {
      const payload = {
        email: "mhs@example.com",
        password: "Strong123",
        full_name: "Mahasiswa Uji",
        role: "mahasiswa",
      };
      const expected = { success: true };

      vi.mocked(supabaseAuth.register).mockResolvedValue(expected as any);

      const result = await authApi.register(payload as any);

      expect(result).toEqual(expected);
      expect(supabaseAuth.register).toHaveBeenCalledWith(payload);
      expect(logger.debug).toHaveBeenCalled();
    });

    it("register: throw ulang saat gagal", async () => {
      const err = new Error("register failed");
      vi.mocked(supabaseAuth.register).mockRejectedValue(err);

      await expect(authApi.register({} as any)).rejects.toThrow("register failed");
      expect(logger.error).toHaveBeenCalled();
    });

    it("logout: delegate ke supabaseAuth.logout", async () => {
      const expected = { success: true };
      vi.mocked(supabaseAuth.logout).mockResolvedValue(expected as any);

      const result = await authApi.logout();

      expect(result).toEqual(expected);
      expect(supabaseAuth.logout).toHaveBeenCalledTimes(1);
      expect(logger.debug).toHaveBeenCalled();
    });

    it("logout: throw ulang saat gagal", async () => {
      const err = new Error("logout failed");
      vi.mocked(supabaseAuth.logout).mockRejectedValue(err);

      await expect(authApi.logout()).rejects.toThrow("logout failed");
      expect(logger.error).toHaveBeenCalled();
    });

    it("getSession: return null jika terjadi error", async () => {
      vi.mocked(supabaseAuth.getSession).mockRejectedValue(
        new Error("session error"),
      );

      const result = await authApi.getSession();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it("refreshSession: return data saat sukses", async () => {
      const expected = { access_token: "abc" };
      vi.mocked(supabaseAuth.refreshSession).mockResolvedValue(expected as any);

      const result = await authApi.refreshSession();

      expect(result).toEqual(expected);
      expect(supabaseAuth.refreshSession).toHaveBeenCalledTimes(1);
    });

    it("refreshSession: return null saat error", async () => {
      vi.mocked(supabaseAuth.refreshSession).mockRejectedValue(
        new Error("refresh error"),
      );

      const result = await authApi.refreshSession();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it("resetPassword: delegate dan throw ulang saat error", async () => {
      const successResp = { success: true };
      vi.mocked(supabaseAuth.resetPassword).mockResolvedValue(successResp as any);

      await expect(authApi.resetPassword("u@test.com")).resolves.toEqual(successResp);

      const err = new Error("reset error");
      vi.mocked(supabaseAuth.resetPassword).mockRejectedValue(err);

      await expect(authApi.resetPassword("u@test.com")).rejects.toThrow("reset error");
      expect(logger.error).toHaveBeenCalled();
    });

    it("updatePassword: delegate dan throw ulang saat error", async () => {
      const successResp = { success: true };
      vi.mocked(supabaseAuth.updatePassword).mockResolvedValue(successResp as any);

      await expect(authApi.updatePassword("NewStrong123")).resolves.toEqual(successResp);

      const err = new Error("update error");
      vi.mocked(supabaseAuth.updatePassword).mockRejectedValue(err);

      await expect(authApi.updatePassword("NewStrong123")).rejects.toThrow("update error");
      expect(logger.error).toHaveBeenCalled();
    });

    it("getCurrentUser: return null saat error", async () => {
      vi.mocked(supabaseAuth.getCurrentUser).mockRejectedValue(
        new Error("user error"),
      );

      const result = await authApi.getCurrentUser();

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });

    it("isAuthenticated: return false saat error", async () => {
      vi.mocked(supabaseAuth.isAuthenticated).mockRejectedValue(
        new Error("auth check error"),
      );

      const result = await authApi.isAuthenticated();

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it("onAuthStateChange: delegate callback dan return subscription handler", () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      const mockedSubscription = {
        data: {
          subscription: {
            unsubscribe,
          },
        },
      };

      vi.mocked(supabaseAuth.onAuthStateChange).mockReturnValue(
        mockedSubscription as any,
      );

      const result = authApi.onAuthStateChange(callback as any);

      expect(supabaseAuth.onAuthStateChange).toHaveBeenCalledWith(callback);
      expect(result).toEqual(mockedSubscription);
    });
  });

  describe("helper functions", () => {
    it("isValidEmail: valid & invalid", () => {
      expect(authApi.isValidEmail("user@example.com")).toBe(true);
      expect(authApi.isValidEmail("invalid-email")).toBe(false);
      expect(authApi.isValidEmail("user@domain")).toBe(false);
    });

    it("isValidPassword: mengembalikan error lengkap jika lemah", () => {
      const weak = authApi.isValidPassword("abc");

      expect(weak.isValid).toBe(false);
      expect(weak.errors).toContain("Password minimal 6 karakter");
      expect(weak.errors).toContain(
        "Password harus mengandung minimal 1 huruf besar",
      );
      expect(weak.errors).toContain("Password harus mengandung minimal 1 angka");
    });

    it("isValidPassword: valid untuk password kuat", () => {
      const strong = authApi.isValidPassword("Strong123");
      expect(strong.isValid).toBe(true);
      expect(strong.errors).toEqual([]);
    });

    it("formatUserDisplayName: dosen dengan gelar depan dan belakang", () => {
      const user = {
        full_name: "Budi Santoso",
        role: "dosen",
        dosen: {
          gelar_depan: "Dr.",
          gelar_belakang: "M.Kom",
        },
      };

      expect(authApi.formatUserDisplayName(user as any)).toBe(
        "Dr. Budi Santoso, M.Kom",
      );
    });

    it("formatUserDisplayName: non-dosen tetap full_name", () => {
      const user = {
        full_name: "Siti Aminah",
        role: "mahasiswa",
      };

      expect(authApi.formatUserDisplayName(user as any)).toBe("Siti Aminah");
    });

    it("getUserIdentifier: pilih identitas sesuai role", () => {
      const mahasiswa = {
        role: "mahasiswa",
        email: "mhs@example.com",
        mahasiswa: { nim: "BD2321001" },
      };
      const dosen = {
        role: "dosen",
        email: "dsn@example.com",
        dosen: { nip: "198001012020011001", nidn: "0123456789" },
      };
      const laboran = {
        role: "laboran",
        email: "lab@example.com",
        laboran: { nip: "197901012010011001" },
      };
      const admin = {
        role: "admin",
        email: "admin@example.com",
      };

      expect(authApi.getUserIdentifier(mahasiswa as any)).toBe("BD2321001");
      expect(authApi.getUserIdentifier(dosen as any)).toBe("198001012020011001");
      expect(authApi.getUserIdentifier(laboran as any)).toBe("197901012010011001");
      expect(authApi.getUserIdentifier(admin as any)).toBe("admin@example.com");
    });

    it("getUserIdentifier: default case (unknown role) returns email (line 233)", () => {
      const unknown = {
        role: "guest",
        email: "guest@example.com",
      };
      expect(authApi.getUserIdentifier(unknown as any)).toBe("guest@example.com");
    });

    it("getUserIdentifier: dosen fallback ke nidn lalu email", () => {
      const dosenWithNidnOnly = {
        role: "dosen",
        email: "nidn@example.com",
        dosen: { nip: "", nidn: "99887766" },
      };
      const dosenWithoutIdentifiers = {
        role: "dosen",
        email: "fallback@example.com",
        dosen: { nip: "", nidn: "" },
      };

      expect(authApi.getUserIdentifier(dosenWithNidnOnly as any)).toBe("99887766");
      expect(authApi.getUserIdentifier(dosenWithoutIdentifiers as any)).toBe(
        "fallback@example.com",
      );
    });

    it("getUserIdentifier: mahasiswa dan laboran fallback ke email", () => {
      const mahasiswa = {
        role: "mahasiswa",
        email: "mhs-fallback@example.com",
        mahasiswa: { nim: "" },
      };
      const laboran = {
        role: "laboran",
        email: "lab-fallback@example.com",
        laboran: { nip: "" },
      };

      expect(authApi.getUserIdentifier(mahasiswa as any)).toBe(
        "mhs-fallback@example.com",
      );
      expect(authApi.getUserIdentifier(laboran as any)).toBe(
        "lab-fallback@example.com",
      );
    });

    it("isValidPassword: password tanpa huruf kecil (lines 184-185)", () => {
      // Password yang punya uppercase & angka tapi tidak ada lowercase
      const result = authApi.isValidPassword("ABCDEF1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password harus mengandung minimal 1 huruf kecil");
    });

    it("isValidPassword: password dengan huruf kecil tidak cover lowercase branch = valid huruf kecil", () => {
      // Password punya lowercase, uppercase, angka - tapi pendek → tidak kena line 184
      const result = authApi.isValidPassword("Abc1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Password minimal 6 karakter");
      expect(result.errors).not.toContain("Password harus mengandung minimal 1 huruf kecil");
    });
  });
});
