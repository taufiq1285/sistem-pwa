/**
 * Error Handling Utilities Unit Tests
 * Testing custom error classes and error handling functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock import.meta.env
Object.defineProperty(import.meta, "env", {
  value: {
    DEV: true,
  },
  writable: true,
});

// Mock console methods
const mockConsoleWarn = vi.spyOn(console, "warn");
const mockConsoleError = vi.spyOn(console, "error");
const mockConsoleGroup = vi.spyOn(console, "group");
const mockConsoleGroupEnd = vi.spyOn(console, "groupEnd");

// Import after mocking
import {
  BaseApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
  ServiceUnavailableError,
  OfflineError,
  mapStatusToError,
  getErrorMessage,
  handleSupabaseError,
  handleError,
  logError,
  reportError,
  isNetworkError,
  isClientError,
  isServerError,
  shouldRetry,
} from "../../../../lib/utils/errors";

describe("Error Handling Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
    mockConsoleGroup.mockClear();
    mockConsoleGroupEnd.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Error Classes", () => {
    describe("BaseApiError", () => {
      it("should create base error with all properties", () => {
        const details = { field: "value" };
        const error = new BaseApiError("Test error", "TEST_CODE", 500, details);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Test error");
        expect(error.code).toBe("TEST_CODE");
        expect(error.statusCode).toBe(500);
        expect(error.details).toBe(details);
        expect(error.name).toBe("BaseApiError");
        expect(error.timestamp).toBeDefined();
      });

      it("should use default values", () => {
        const error = new BaseApiError("Test");

        expect(error.message).toBe("Test");
        expect(error.code).toBe("UNKNOWN");
        expect(error.statusCode).toBeUndefined();
        expect(error.details).toBeUndefined();
      });

      it("should serialize to JSON", () => {
        const error = new BaseApiError("Test", "TEST_CODE", 500, {
          field: "value",
        });

        const json = error.toJSON();

        expect(json).toEqual({
          code: "TEST_CODE",
          message: "Test",
          statusCode: 500,
          details: { field: "value" },
          timestamp: error.timestamp,
        });
      });
    });

    describe("NetworkError", () => {
      it("should create network error", () => {
        const error = new NetworkError("Network failed");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("NETWORK_ERROR");
        expect(error.name).toBe("NetworkError");
        expect(error.message).toBe("Network failed");
      });

      it("should use default message", () => {
        const error = new NetworkError();

        expect(error.message).toBe("Network error occurred");
      });
    });

    describe("TimeoutError", () => {
      it("should create timeout error", () => {
        const error = new TimeoutError("Request timeout");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("TIMEOUT");
        expect(error.statusCode).toBe(408);
        expect(error.name).toBe("TimeoutError");
        expect(error.message).toBe("Request timeout");
      });

      it("should use default message", () => {
        const error = new TimeoutError();

        expect(error.message).toBe("Request timeout");
      });
    });

    describe("ValidationError", () => {
      it("should create validation error", () => {
        const error = new ValidationError("Invalid data");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("VALIDATION_ERROR");
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe("ValidationError");
      });
    });

    describe("AuthenticationError", () => {
      it("should create authentication error", () => {
        const error = new AuthenticationError("Not logged in");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("UNAUTHORIZED");
        expect(error.statusCode).toBe(401);
        expect(error.name).toBe("AuthenticationError");
      });
    });

    describe("AuthorizationError", () => {
      it("should create authorization error", () => {
        const error = new AuthorizationError("Access denied");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("FORBIDDEN");
        expect(error.statusCode).toBe(403);
        expect(error.name).toBe("AuthorizationError");
      });
    });

    describe("NotFoundError", () => {
      it("should create not found error", () => {
        const error = new NotFoundError("Resource missing");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("NOT_FOUND");
        expect(error.statusCode).toBe(404);
        expect(error.name).toBe("NotFoundError");
      });
    });

    describe("ConflictError", () => {
      it("should create conflict error", () => {
        const error = new ConflictError("Duplicate resource");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("CONFLICT");
        expect(error.statusCode).toBe(409);
        expect(error.name).toBe("ConflictError");
      });
    });

    describe("ServerError", () => {
      it("should create server error", () => {
        const error = new ServerError("Internal error");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("INTERNAL_ERROR");
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe("ServerError");
      });
    });

    describe("ServiceUnavailableError", () => {
      it("should create service unavailable error", () => {
        const error = new ServiceUnavailableError("Service down");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("SERVICE_UNAVAILABLE");
        expect(error.statusCode).toBe(503);
        expect(error.name).toBe("ServiceUnavailableError");
      });
    });

    describe("OfflineError", () => {
      it("should create offline error", () => {
        const error = new OfflineError("No internet");

        expect(error).toBeInstanceOf(BaseApiError);
        expect(error.code).toBe("OFFLINE");
        expect(error.name).toBe("OfflineError");
        expect(error.statusCode).toBeUndefined();
      });
    });
  });

  describe("mapStatusToError", () => {
    it("should map 400 to ValidationError", () => {
      const error = mapStatusToError(400, "Bad request");

      expect(error).toBeInstanceOf(ValidationError);
    });

    it("should map 401 to AuthenticationError", () => {
      const error = mapStatusToError(401, "Unauthorized");

      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it("should map 403 to AuthorizationError", () => {
      const error = mapStatusToError(403, "Forbidden");

      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it("should map 404 to NotFoundError", () => {
      const error = mapStatusToError(404, "Not found");

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("should map 409 to ConflictError", () => {
      const error = mapStatusToError(409, "Conflict");

      expect(error).toBeInstanceOf(ConflictError);
    });

    it("should map 408 to TimeoutError", () => {
      const error = mapStatusToError(408, "Timeout");

      expect(error).toBeInstanceOf(TimeoutError);
    });

    it("should map 500 to ServerError", () => {
      const error = mapStatusToError(500, "Server error");

      expect(error).toBeInstanceOf(ServerError);
    });

    it("should map 503 to ServiceUnavailableError", () => {
      const error = mapStatusToError(503, "Service unavailable");

      expect(error).toBeInstanceOf(ServiceUnavailableError);
    });

    it("should map other 4xx to BaseApiError", () => {
      const error = mapStatusToError(422, "Unprocessable entity");

      expect(error).toBeInstanceOf(BaseApiError);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.statusCode).toBe(422);
    });

    it("should map other 5xx to ServerError", () => {
      const error = mapStatusToError(502, "Bad gateway");

      expect(error).toBeInstanceOf(ServerError);
    });

    it("should map unknown status to BaseApiError", () => {
      const error = mapStatusToError(418, "I'm a teapot");

      expect(error).toBeInstanceOf(BaseApiError);
      expect(error.code).toBe("BAD_REQUEST");
    });

    it("should include details in error", () => {
      const details = { field: "email", issue: "invalid" };
      const error = mapStatusToError(400, "Validation failed", details);

      expect(error.details).toBe(details);
    });
  });

  describe("getErrorMessage", () => {
    it("should return message for BAD_REQUEST", () => {
      const message = getErrorMessage("BAD_REQUEST");
      expect(message).toBe("Permintaan tidak valid");
    });

    it("should return message for UNAUTHORIZED", () => {
      const message = getErrorMessage("UNAUTHORIZED");
      expect(message).toBe("Anda harus login terlebih dahulu");
    });

    it("should return message for FORBIDDEN", () => {
      const message = getErrorMessage("FORBIDDEN");
      expect(message).toBe("Anda tidak memiliki akses ke resource ini");
    });

    it("should return message for NOT_FOUND", () => {
      const message = getErrorMessage("NOT_FOUND");
      expect(message).toBe("Data tidak ditemukan");
    });

    it("should return message for VALIDATION_ERROR", () => {
      const message = getErrorMessage("VALIDATION_ERROR");
      expect(message).toBe("Data yang Anda masukkan tidak valid");
    });

    it("should return message for CONFLICT", () => {
      const message = getErrorMessage("CONFLICT");
      expect(message).toBe("Data sudah ada atau terjadi konflik");
    });

    it("should return message for INTERNAL_ERROR", () => {
      const message = getErrorMessage("INTERNAL_ERROR");
      expect(message).toBe("Terjadi kesalahan pada server");
    });

    it("should return message for SERVICE_UNAVAILABLE", () => {
      const message = getErrorMessage("SERVICE_UNAVAILABLE");
      expect(message).toBe("Layanan sedang tidak tersedia");
    });

    it("should return message for NETWORK_ERROR", () => {
      const message = getErrorMessage("NETWORK_ERROR");
      expect(message).toBe("Terjadi kesalahan jaringan");
    });

    it("should return message for TIMEOUT", () => {
      const message = getErrorMessage("TIMEOUT");
      expect(message).toBe("Permintaan timeout, silakan coba lagi");
    });

    it("should return message for OFFLINE", () => {
      const message = getErrorMessage("OFFLINE");
      expect(message).toBe("Anda sedang offline");
    });

    it("should return message for UNKNOWN", () => {
      const message = getErrorMessage("UNKNOWN");
      expect(message).toBe("Terjadi kesalahan yang tidak diketahui");
    });

    it("should return message for SYNC_ERROR", () => {
      const message = getErrorMessage("SYNC_ERROR");
      expect(message).toBe("Gagal melakukan sinkronisasi data");
    });
  });

  describe("handleSupabaseError", () => {
    it("should handle insufficient privilege error", () => {
      const supabaseError = {
        code: "42501",
        message: "insufficient_privilege",
        hint: "User does not have permission",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe("Insufficient permissions");
    });

    it("should handle unique violation error", () => {
      const supabaseError = {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe("Record already exists");
    });

    it("should handle foreign key violation error", () => {
      const supabaseError = {
        code: "23503",
        message: "foreign key violation",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid reference");
    });

    it("should handle not found error (PGRST116)", () => {
      const supabaseError = {
        code: "PGRST116",
        message: "0 rows returned",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("Record not found");
    });

    it("should handle invalid text representation error", () => {
      const supabaseError = {
        code: "22P02",
        message: "invalid text representation",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Invalid data format");
    });

    it("should handle 401 auth error", () => {
      const supabaseError = {
        status: 401,
        message: "Invalid token",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Invalid token");
    });

    it("should use default message for 401 when no message provided", () => {
      const supabaseError = {
        status: 401,
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("Authentication failed");
    });

    it("should handle unknown Supabase error", () => {
      const supabaseError = {
        code: "XXXXX",
        message: "Unknown error",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe("Unknown error");
    });

    it("should use default message for unknown Supabase error when no message provided", () => {
      const supabaseError = {
        code: "XXXXX",
      };

      const error = handleSupabaseError(supabaseError);

      expect(error).toBeInstanceOf(ServerError);
      expect(error.message).toBe("Database operation failed");
    });
  });

  describe("handleError", () => {
    it("should return BaseApiError as-is", () => {
      const originalError = new ValidationError("Test error");
      const error = handleError(originalError);

      expect(error).toBe(originalError);
    });

    it("should convert TypeError fetch error to NetworkError", () => {
      const typeError = new TypeError("Failed to fetch");
      const error = handleError(typeError);

      expect(error).toBeInstanceOf(NetworkError);
    });

    it("should convert timeout Error to TimeoutError", () => {
      const timeoutError = new Error("Request timeout");
      const error = handleError(timeoutError);

      expect(error).toBeInstanceOf(TimeoutError);
    });

    it("should convert object with code to SupabaseError", () => {
      const supabaseError = { code: "23505", message: "Duplicate" };
      const error = handleError(supabaseError);

      expect(error).toBeInstanceOf(ConflictError);
    });

    it("should convert object with status to HTTPError", () => {
      const httpError = { status: 404, message: "Not found" };
      const error = handleError(httpError);

      expect(error).toBeInstanceOf(NotFoundError);
    });

    it("should convert standard Error to BaseApiError", () => {
      const standardError = new Error("Something went wrong");
      const error = handleError(standardError);

      expect(error).toBeInstanceOf(BaseApiError);
      expect(error.code).toBe("UNKNOWN");
    });

    it("should convert unknown error to BaseApiError", () => {
      const unknownError = "string error";
      const error = handleError(unknownError);

      expect(error).toBeInstanceOf(BaseApiError);
      expect(error.code).toBe("UNKNOWN");
      expect(error.details).toEqual({ originalError: "string error" });
    });
  });

  describe("logError", () => {
    it("should log network error as warning in DEV", () => {
      const networkError = new NetworkError("Network failed");
      (import.meta.env as any).DEV = true;

      logError(networkError, "API Call");

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining("Offline (API Call)"),
      );
    });

    it("should log other errors with group in DEV", () => {
      const validationError = new ValidationError("Invalid data");
      (import.meta.env as any).DEV = true;

      logError(validationError, "Validation");

      expect(mockConsoleGroup).toHaveBeenCalled();
      expect(mockConsoleError).toHaveBeenCalledWith("Message:", "Invalid data");
      expect(mockConsoleGroupEnd).toHaveBeenCalled();
    });

    it("should include status code in log if present", () => {
      const authError = new AuthenticationError("Unauthorized");
      (import.meta.env as any).DEV = true;

      logError(authError);

      expect(mockConsoleError).toHaveBeenCalledWith("Status:", 401);
    });

    it("should include details in log if present", () => {
      const error = new ValidationError("Invalid", { field: "email" });
      (import.meta.env as any).DEV = true;

      logError(error);

      expect(mockConsoleError).toHaveBeenCalledWith("Details:", {
        field: "email",
      });
    });
  });

  describe("reportError", () => {
    it("should log error in production", () => {
      (import.meta.env as any).DEV = false;
      const consoleErrorSpy = vi.spyOn(console, "error");

      const error = new ServerError("Internal error");
      reportError(error, { context: "test" });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error occurred:",
        expect.any(Object),
        { context: "test" },
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("isNetworkError", () => {
    it("should identify NetworkError", () => {
      const error = new NetworkError();
      expect(isNetworkError(error)).toBe(true);
    });

    it("should identify TimeoutError as network error", () => {
      const error = new TimeoutError();
      expect(isNetworkError(error)).toBe(true);
    });

    it("should identify OfflineError as network error", () => {
      const error = new OfflineError();
      expect(isNetworkError(error)).toBe(true);
    });

    it("should not identify ValidationError as network error", () => {
      const error = new ValidationError();
      expect(isNetworkError(error)).toBe(false);
    });

    it("should not identify ServerError as network error", () => {
      const error = new ServerError();
      expect(isNetworkError(error)).toBe(false);
    });
  });

  describe("isClientError", () => {
    it("should identify 4xx as client error", () => {
      const error = new ValidationError();
      expect(isClientError(error)).toBe(true);
    });

    it("should identify 401 as client error", () => {
      const error = new AuthenticationError();
      expect(isClientError(error)).toBe(true);
    });

    it("should identify 403 as client error", () => {
      const error = new AuthorizationError();
      expect(isClientError(error)).toBe(true);
    });

    it("should identify 404 as client error", () => {
      const error = new NotFoundError();
      expect(isClientError(error)).toBe(true);
    });

    it("should not identify 5xx as client error", () => {
      const error = new ServerError();
      expect(isClientError(error)).toBe(false);
    });

    it("should handle errors without status code", () => {
      const error = new OfflineError();
      expect(isClientError(error)).toBe(false);
    });
  });

  describe("isServerError", () => {
    it("should identify 5xx as server error", () => {
      const error = new ServerError();
      expect(isServerError(error)).toBe(true);
    });

    it("should identify 503 as server error", () => {
      const error = new ServiceUnavailableError();
      expect(isServerError(error)).toBe(true);
    });

    it("should not identify 4xx as server error", () => {
      const error = new ValidationError();
      expect(isServerError(error)).toBe(false);
    });

    it("should handle errors without status code", () => {
      const error = new OfflineError();
      expect(isServerError(error)).toBe(false);
    });
  });

  describe("shouldRetry", () => {
    it("should return false when max attempts reached", () => {
      const error = new NetworkError();
      const result = shouldRetry(error, 5, 5);

      expect(result).toBe(false);
    });

    it("should return true for network error under max attempts", () => {
      const error = new NetworkError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(true);
    });

    it("should return true for TimeoutError", () => {
      const error = new TimeoutError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(true);
    });

    it("should return true for server error (5xx)", () => {
      const error = new ServerError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(true);
    });

    it("should return false for client error (4xx)", () => {
      const error = new ValidationError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(false);
    });

    it("should return false for AuthenticationError", () => {
      const error = new AuthenticationError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(false);
    });

    it("should return false for AuthorizationError", () => {
      const error = new AuthorizationError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(false);
    });

    it("should return false for NotFoundError", () => {
      const error = new NotFoundError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(false);
    });

    it("should return false for ConflictError", () => {
      const error = new ConflictError();
      const result = shouldRetry(error, 1, 3);

      expect(result).toBe(false);
    });
  });
});
