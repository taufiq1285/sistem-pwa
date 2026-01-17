/**
 * Validations Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
} from "../../../lib/validations/auth.schema";

describe("Validations", () => {
  describe("email validation", () => {
    it("should validate correct email format", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.co.id",
        "admin@university.ac.id",
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({ email, password: "test123" });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "notanemail",
        "@example.com",
        "user@",
        "user @example.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        const result = loginSchema.safeParse({ email, password: "test123" });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("NIM validation", () => {
    it("should validate correct NIM format (2 letters + 7 digits)", () => {
      const validNIMs = ["BD2321001", "TI2320045", "SI2221100"];

      validNIMs.forEach((nim) => {
        const result = registerSchema.safeParse({
          email: "mahasiswa@test.com",
          password: "test123",
          confirmPassword: "test123",
          full_name: "Test Mahasiswa",
          role: "mahasiswa",
          nim,
          program_studi: "Teknik Informatika",
          angkatan: 2023,
          semester: 1,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid NIM format", () => {
      const invalidNIMs = [
        "123456789", // all numbers
        "BD23210", // too short
        "BD23210011", // too long
        "BDE2321001", // 3 letters
        "B12321001", // 1 letter
      ];

      invalidNIMs.forEach((nim) => {
        const result = registerSchema.safeParse({
          email: "mahasiswa@test.com",
          password: "test123",
          confirmPassword: "test123",
          full_name: "Test Mahasiswa",
          role: "mahasiswa",
          nim,
          program_studi: "Teknik Informatika",
          angkatan: 2023,
          semester: 1,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("NIDN validation", () => {
    it("should validate 10-digit NIDN", () => {
      const validNIDNs = ["0001018501", "1234567890"];

      validNIDNs.forEach((nidn) => {
        const result = registerSchema.safeParse({
          email: "dosen@test.com",
          password: "test123",
          confirmPassword: "test123",
          full_name: "Dr. Test Dosen",
          role: "dosen",
          nidn,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid NIDN", () => {
      const invalidNIDNs = [
        "123", // too short
        "12345678901", // too long
        "abcd123456", // contains letters
      ];

      invalidNIDNs.forEach((nidn) => {
        const result = registerSchema.safeParse({
          email: "dosen@test.com",
          password: "test123",
          confirmPassword: "test123",
          full_name: "Dr. Test Dosen",
          role: "dosen",
          nidn,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("password validation", () => {
    it("should validate strong password (min 6 characters)", () => {
      const validPasswords = ["test123", "password123", "MyP@ssw0rd!"];

      validPasswords.forEach((password) => {
        const result = loginSchema.safeParse({
          email: "user@test.com",
          password,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject weak password", () => {
      const weakPasswords = [
        "", // empty
        "12345", // too short
        "abc", // too short
      ];

      weakPasswords.forEach((password) => {
        const result = loginSchema.safeParse({
          email: "user@test.com",
          password,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  // Placeholder test
  it("should have validation tests defined", () => {
    expect(true).toBe(true);
  });
});
