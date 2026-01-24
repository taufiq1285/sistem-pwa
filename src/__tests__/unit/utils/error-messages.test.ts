/**
 * Tests for error-messages.ts
 */

import { describe, it, expect } from "vitest";
import {
  ERROR_MESSAGES,
  formatError,
  createError,
  getSupabaseErrorMessage,
} from "@/lib/utils/error-messages";

describe("error-messages", () => {
  describe("ERROR_MESSAGES", () => {
    it("should have AUTH error messages", () => {
      expect(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED).toBeDefined();
      expect(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS).toBeDefined();
      expect(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS).toBeDefined();
      expect(ERROR_MESSAGES.AUTH.WEAK_PASSWORD).toBeDefined();
    });

    it("should have PERMISSION error messages", () => {
      expect(ERROR_MESSAGES.PERMISSION.FORBIDDEN).toBeDefined();
      expect(typeof ERROR_MESSAGES.PERMISSION.MISSING_PERMISSION).toBe(
        "function",
      );
      expect(ERROR_MESSAGES.PERMISSION.NOT_OWNER).toBeDefined();
    });

    it("should have QUIZ error messages", () => {
      expect(ERROR_MESSAGES.QUIZ.NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.QUIZ.NOT_ACTIVE).toBeDefined();
      expect(ERROR_MESSAGES.QUIZ.NOT_PUBLISHED).toBeDefined();
      expect(ERROR_MESSAGES.QUIZ.ALREADY_SUBMITTED).toBeDefined();
      expect(ERROR_MESSAGES.QUIZ.TIME_EXPIRED).toBeDefined();
      expect(ERROR_MESSAGES.QUIZ.MAX_ATTEMPTS_REACHED).toBeDefined();
    });

    it("should have VALIDATION error messages", () => {
      expect(typeof ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD).toBe("function");
      expect(ERROR_MESSAGES.VALIDATION.INVALID_EMAIL).toBeDefined();
      expect(typeof ERROR_MESSAGES.VALIDATION.MIN_LENGTH).toBe("function");
      expect(typeof ERROR_MESSAGES.VALIDATION.MAX_LENGTH).toBe("function");
    });

    it("should have NETWORK error messages", () => {
      expect(ERROR_MESSAGES.NETWORK.OFFLINE).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK.TIMEOUT).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK.SERVER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK.NOT_FOUND).toBeDefined();
    });

    it("should have DATABASE error messages", () => {
      expect(ERROR_MESSAGES.DATABASE.QUERY_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.DATABASE.INSERT_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.DATABASE.UPDATE_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.DATABASE.DELETE_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.DATABASE.DUPLICATE_ENTRY).toBeDefined();
    });

    it("should have GENERIC error messages", () => {
      expect(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.GENERIC.TRY_AGAIN).toBeDefined();
      expect(ERROR_MESSAGES.GENERIC.CONTACT_ADMIN).toBeDefined();
    });
  });

  describe("ERROR_MESSAGES functions", () => {
    it("should generate MISSING_PERMISSION message correctly", () => {
      const msg = ERROR_MESSAGES.PERMISSION.MISSING_PERMISSION("read:users");
      expect(msg).toContain("read:users");
      expect(msg).toContain("Izin diperlukan");
    });

    it("should generate REQUIRED_FIELD message correctly", () => {
      const msg = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD("Email");
      expect(msg).toBe("Email wajib diisi.");
    });

    it("should generate MIN_LENGTH message correctly", () => {
      const msg = ERROR_MESSAGES.VALIDATION.MIN_LENGTH("Password", 8);
      expect(msg).toBe("Password minimal 8 karakter.");
    });

    it("should generate MAX_LENGTH message correctly", () => {
      const msg = ERROR_MESSAGES.VALIDATION.MAX_LENGTH("Username", 50);
      expect(msg).toBe("Username maksimal 50 karakter.");
    });
  });

  describe("formatError", () => {
    it("should return message from Error object", () => {
      const error = new Error("Test error");
      expect(formatError(error)).toBe("Test error");
    });

    it("should return string as-is", () => {
      expect(formatError("String error")).toBe("String error");
    });

    it("should return generic error for unknown type", () => {
      expect(formatError(12345)).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
      expect(formatError(null)).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
      expect(formatError(undefined)).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
    });

    it("should return generic error for object without message", () => {
      expect(formatError({})).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
    });
  });

  describe("createError", () => {
    it("should create Error with message", () => {
      const error = createError("Test error");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    it("should attach context to error", () => {
      const context = { userId: "123", action: "delete" };
      const error = createError("Failed to delete", context);
      expect((error as any).context).toEqual(context);
    });

    it("should not attach context if not provided", () => {
      const error = createError("Test error");
      expect((error as any).context).toBeUndefined();
    });
  });

  describe("getSupabaseErrorMessage", () => {
    it("should return generic error for null error", () => {
      expect(getSupabaseErrorMessage(null)).toBe(
        ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR,
      );
    });

    it("should return generic error for undefined error", () => {
      expect(getSupabaseErrorMessage(undefined)).toBe(
        ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR,
      );
    });

    it("should map PGRST116 to NOT_FOUND", () => {
      const error = { code: "PGRST116" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.NETWORK.NOT_FOUND,
      );
    });

    it("should map 23505 to DUPLICATE_ENTRY", () => {
      const error = { code: "23505" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.DATABASE.DUPLICATE_ENTRY,
      );
    });

    it("should detect Invalid login message", () => {
      const error = { message: "Invalid login credentials" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    });

    it("should detect already registered message", () => {
      const error = { message: "User already registered" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS,
      );
    });

    it("should return error message if available", () => {
      const error = { message: "Custom error message" };
      expect(getSupabaseErrorMessage(error)).toBe("Custom error message");
    });

    it("should return generic error for error_code without message", () => {
      // error_code is assigned to 'code' variable but not used for known codes
      // Since no message field exists, returns generic error
      const error = { error_code: "Custom error" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR,
      );
    });

    it("should return message from error.error field if available", () => {
      const error = { error: "Custom error" };
      expect(getSupabaseErrorMessage(error)).toBe("Custom error");
    });

    it("should prefer code over message for known errors", () => {
      const error = { code: "PGRST116", message: "Some other message" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.NETWORK.NOT_FOUND,
      );
    });

    it("should return generic error for unknown error structure", () => {
      expect(getSupabaseErrorMessage({})).toBe(
        ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR,
      );
    });

    it("should handle error with both code and message fields", () => {
      const error = { code: "PGRST116", message: "Row not found" };
      expect(getSupabaseErrorMessage(error)).toBe(
        ERROR_MESSAGES.NETWORK.NOT_FOUND,
      );
    });
  });
});
