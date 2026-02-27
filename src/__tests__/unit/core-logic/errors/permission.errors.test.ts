import { describe, it, expect } from "vitest";

import {
  PermissionError,
  OwnershipError,
  AuthenticationError,
  RoleNotFoundError,
  isPermissionError,
  isOwnershipError,
  isAuthenticationError,
  isRBACError,
  getRBACErrorMessage,
} from "@/lib/errors/permission.errors";

describe("permission.errors", () => {
  describe("PermissionError", () => {
    it("membuat error dengan properti yang benar", () => {
      const error = new PermissionError(
        "Forbidden",
        "manage:user",
        "mahasiswa",
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.name).toBe("PermissionError");
      expect(error.code).toBe("PERMISSION_DENIED");
      expect(error.statusCode).toBe(403);
      expect(error.permission).toBe("manage:user");
      expect(error.userRole).toBe("mahasiswa");
      expect(error.toUserMessage()).toBe(
        "Anda tidak memiliki izin untuk melakukan aksi ini",
      );
      expect(error.toLogMessage()).toContain("manage:user");
      expect(error.toLogMessage()).toContain("mahasiswa");
    });
  });

  describe("OwnershipError", () => {
    it("membuat error kepemilikan dengan metadata resource", () => {
      const error = new OwnershipError("Not owner", "kuis", "k-1");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OwnershipError);
      expect(error.name).toBe("OwnershipError");
      expect(error.code).toBe("OWNERSHIP_REQUIRED");
      expect(error.statusCode).toBe(403);
      expect(error.resourceType).toBe("kuis");
      expect(error.resourceId).toBe("k-1");
      expect(error.toUserMessage()).toBe(
        "Anda hanya dapat mengakses resource milik Anda sendiri",
      );
      expect(error.toLogMessage()).toContain("kuis/k-1");
    });
  });

  describe("AuthenticationError", () => {
    it("menggunakan default message", () => {
      const error = new AuthenticationError();

      expect(error.name).toBe("AuthenticationError");
      expect(error.code).toBe("AUTHENTICATION_REQUIRED");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Authentication required");
      expect(error.toUserMessage()).toBe("Silakan login terlebih dahulu");
    });

    it("menerima custom message", () => {
      const error = new AuthenticationError("Token invalid");
      expect(error.message).toBe("Token invalid");
    });
  });

  describe("RoleNotFoundError", () => {
    it("membuat error role not found", () => {
      const error = new RoleNotFoundError("Role missing", "user-1");

      expect(error.name).toBe("RoleNotFoundError");
      expect(error.code).toBe("ROLE_NOT_FOUND");
      expect(error.statusCode).toBe(500);
      expect(error.userId).toBe("user-1");
      expect(error.toUserMessage()).toBe(
        "Terjadi kesalahan sistem. Silakan hubungi administrator",
      );
    });
  });

  describe("type guards", () => {
    it("mendeteksi tiap tipe error dengan benar", () => {
      const pErr = new PermissionError("Forbidden");
      const oErr = new OwnershipError("Not owner");
      const aErr = new AuthenticationError();
      const rErr = new RoleNotFoundError("Role missing");
      const other = new Error("x");

      expect(isPermissionError(pErr)).toBe(true);
      expect(isPermissionError(oErr)).toBe(false);

      expect(isOwnershipError(oErr)).toBe(true);
      expect(isOwnershipError(aErr)).toBe(false);

      expect(isAuthenticationError(aErr)).toBe(true);
      expect(isAuthenticationError(rErr)).toBe(false);

      expect(isRBACError(pErr)).toBe(true);
      expect(isRBACError(oErr)).toBe(true);
      expect(isRBACError(aErr)).toBe(true);
      expect(isRBACError(rErr)).toBe(true);
      expect(isRBACError(other)).toBe(false);
      expect(isRBACError("not-error")).toBe(false);
    });
  });

  describe("getRBACErrorMessage", () => {
    it("mengembalikan user message untuk RBAC errors", () => {
      expect(getRBACErrorMessage(new PermissionError("Forbidden"))).toBe(
        "Anda tidak memiliki izin untuk melakukan aksi ini",
      );
      expect(getRBACErrorMessage(new OwnershipError("Not owner"))).toBe(
        "Anda hanya dapat mengakses resource milik Anda sendiri",
      );
      expect(getRBACErrorMessage(new AuthenticationError())).toBe(
        "Silakan login terlebih dahulu",
      );
      expect(getRBACErrorMessage(new RoleNotFoundError("Role missing"))).toBe(
        "Terjadi kesalahan sistem. Silakan hubungi administrator",
      );
    });

    it("fallback ke message bawaan untuk Error umum dan unknown", () => {
      expect(getRBACErrorMessage(new Error("General error"))).toBe(
        "General error",
      );
      expect(getRBACErrorMessage({})).toBe(
        "Terjadi kesalahan yang tidak diketahui",
      );
      expect(getRBACErrorMessage(null)).toBe(
        "Terjadi kesalahan yang tidak diketahui",
      );
    });
  });
});
