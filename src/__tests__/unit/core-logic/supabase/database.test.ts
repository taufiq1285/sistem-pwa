/**
 * Supabase Database Helpers Unit Tests
 * Testing database connection and query utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock console
const mockConsoleError = vi.spyOn(console, "error");

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Import after mocking
import {
  fetchData,
  checkConnection,
  getTableCount,
} from "../../../../lib/supabase/database";
import { supabase } from "../../../../lib/supabase/client";
import type { TableName } from "../../../../lib/supabase/database";

describe("Supabase Database Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchData", () => {
    it("should return data when query succeeds", async () => {
      const mockData = { id: 1, name: "Test" };
      const mockQuery = Promise.resolve({
        data: mockData,
        error: null,
      });

      const result = await fetchData(mockQuery);

      expect(result).toEqual(mockData);
    });

    it("should throw error when query fails", async () => {
      const mockError = { message: "Query failed" } as any;
      const mockQuery = Promise.resolve({
        data: null,
        error: mockError,
      });

      await expect(fetchData(mockQuery)).rejects.toThrow("Query failed");
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Database error:",
        mockError,
      );
    });

    it("should throw error when no data returned", async () => {
      const mockQuery = Promise.resolve({
        data: null,
        error: null,
      });

      await expect(fetchData(mockQuery)).rejects.toThrow("No data returned");
    });

    it("should work with different data types", async () => {
      const stringData = { value: "test" };
      const numberData = 42;
      const arrayData = [1, 2, 3];
      const objectData = { a: 1, b: 2 };

      const stringQuery = Promise.resolve({
        data: stringData,
        error: null,
      });
      const numberQuery = Promise.resolve({
        data: numberData,
        error: null,
      });
      const arrayQuery = Promise.resolve({
        data: arrayData,
        error: null,
      });
      const objectQuery = Promise.resolve({
        data: objectData,
        error: null,
      });

      await expect(fetchData(stringQuery)).resolves.toEqual(stringData);
      await expect(fetchData(numberQuery)).resolves.toEqual(numberData);
      await expect(fetchData(arrayQuery)).resolves.toEqual(arrayData);
      await expect(fetchData(objectQuery)).resolves.toEqual(objectData);
    });

    it("should handle rejected promises", async () => {
      const rejectionError = new Error("Network error");
      const mockQuery = Promise.reject(rejectionError);

      await expect(fetchData(mockQuery)).rejects.toThrow("Network error");
    });
  });

  describe("checkConnection", () => {
    it("should return true when connection succeeds", async () => {
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockLimit.mockReturnValue({
        count: null,
        error: null,
      });

      const result = await checkConnection();

      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(mockSelect).toHaveBeenCalledWith("count");
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it("should return false when connection fails", async () => {
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      const connectionError = new Error("Connection failed");
      mockLimit.mockRejectedValue(connectionError);

      const result = await checkConnection();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Connection check failed:",
        connectionError,
      );
      expect(result).toBe(false);
    });

    it("should handle table not found error", async () => {
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      const notFoundError = { message: "Table not found" };
      mockLimit.mockResolvedValue({
        count: null,
        error: notFoundError,
      });

      const result = await checkConnection();

      expect(result).toBe(false);
    });

    it("should work with different network conditions", async () => {
      // Test with slow connection
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockLimit.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ count: null, error: null });
            }, 100);
          }),
      );

      const result = await checkConnection();

      expect(result).toBe(true);
    });
  });

  describe("getTableCount", () => {
    it("should return count when query succeeds", async () => {
      const tableName: TableName = "users";
      const mockCount = 42;

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: mockCount,
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: mockCount,
        error: null,
      });

      const result = await getTableCount(tableName);

      expect(supabase.from).toHaveBeenCalledWith(tableName);
      expect(mockSelect).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
      expect(result).toBe(mockCount);
    });

    it("should return 0 when count is null", async () => {
      const tableName: TableName = "mahasiswa";

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: null,
        error: null,
      });

      const result = await getTableCount(tableName);

      expect(result).toBe(0);
    });

    it("should throw error when query fails", async () => {
      const tableName: TableName = "kelas";
      const countError = new Error("Count failed");

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: vi.fn(),
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockRejectedValue(countError);

      await expect(getTableCount(tableName)).rejects.toThrow("Count failed");
    });

    it("should work with all valid table names", async () => {
      const tableNames: TableName[] = [
        "users",
        "kelas",
        "laboratorium",
        "dosen",
        "mata_kuliah",
        "mahasiswa",
        "admin",
        "laboran",
        "jadwal_praktikum",
        "kelas_mahasiswa",
      ];

      for (const tableName of tableNames) {
        const mockSelect = vi.fn();
        const mockTable = {
          select: mockSelect.mockReturnValue({
            count: vi.fn(),
          }),
        };

        (supabase.from as any).mockReturnValue(mockTable);
        mockSelect.mockResolvedValue({
          count: 100,
          error: null,
        });

        const result = await getTableCount(tableName);

        expect(supabase.from).toHaveBeenCalledWith(tableName);
        expect(result).toBe(100);
      }
    });

    it("should handle empty table", async () => {
      const tableName: TableName = "mahasiswa";

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: vi.fn(),
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: 0,
        error: null,
      });

      const result = await getTableCount(tableName);

      expect(result).toBe(0);
    });

    it("should handle large counts", async () => {
      const tableName: TableName = "users";
      const largeCount = 999999;

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: vi.fn(),
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: largeCount,
        error: null,
      });

      const result = await getTableCount(tableName);

      expect(result).toBe(largeCount);
    });
  });

  describe("Integration scenarios", () => {
    it("should check connection before operations", async () => {
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockLimit.mockResolvedValue({
        count: null,
        error: null,
      });

      const isConnected = await checkConnection();

      expect(isConnected).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith("users");
    });

    it("should get count for monitoring", async () => {
      const tableName: TableName = "mahasiswa";

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: vi.fn(),
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: 150,
        error: null,
      });

      const count = await getTableCount(tableName);

      expect(count).toBe(150);
      expect(mockSelect).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
    });

    it("should handle connection check and count in sequence", async () => {
      // 1. Check connection
      const connectionSelect = vi.fn();
      const connectionLimit = vi.fn();
      const connectionTable = {
        select: connectionSelect.mockReturnValue({ limit: connectionLimit }),
      };

      (supabase.from as any).mockReturnValue(connectionTable);
      connectionLimit.mockResolvedValue({
        count: null,
        error: null,
      });

      const connected = await checkConnection();
      expect(connected).toBe(true);

      // 2. Get table count
      const countSelect = vi.fn();
      const countTable = {
        select: countSelect.mockReturnValue({
          count: vi.fn(),
        }),
      };

      (supabase.from as any).mockReturnValue(countTable);
      countSelect.mockResolvedValue({
        count: 200,
        error: null,
      });

      const count = await getTableCount("users");
      expect(count).toBe(200);

      // Verify both operations used same supabase client
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error handling", () => {
    it("should log errors to console", async () => {
      const mockError = { message: "Database error" } as any;
      const mockQuery = Promise.resolve({
        data: null,
        error: mockError,
      });

      try {
        await fetchData(mockQuery);
      } catch (e) {
        // Expected
      }

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Database error:",
        mockError,
      );
    });

    it("should log connection check errors", async () => {
      const connectionError = new Error("Network timeout");
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockLimit.mockRejectedValue(connectionError);

      await checkConnection();

      expect(mockConsoleError).toHaveBeenCalledWith(
        "Connection check failed:",
        connectionError,
      );
    });

    it("should throw on fetch data error with message", async () => {
      const customError = new Error("Custom error message") as any;
      const mockQuery = Promise.resolve({
        data: null,
        error: customError,
      });

      await expect(fetchData(mockQuery)).rejects.toThrow(
        "Custom error message",
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle null data response", async () => {
      const mockQuery = Promise.resolve({
        data: null,
        error: null,
      });

      await expect(fetchData(mockQuery)).rejects.toThrow("No data returned");
    });

    it("should handle undefined count", async () => {
      const tableName: TableName = "users";

      const mockSelect = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({
          count: undefined,
        }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockSelect.mockResolvedValue({
        count: undefined,
        error: null,
      });

      const result = await getTableCount(tableName);

      expect(result).toBe(0);
    });

    it("should handle connection with zero count", async () => {
      const mockSelect = vi.fn();
      const mockLimit = vi.fn();
      const mockTable = {
        select: mockSelect.mockReturnValue({ limit: mockLimit }),
      };

      (supabase.from as any).mockReturnValue(mockTable);
      mockLimit.mockResolvedValue({
        count: 0,
        error: null,
      });

      const result = await checkConnection();

      expect(result).toBe(true);
    });
  });
});
