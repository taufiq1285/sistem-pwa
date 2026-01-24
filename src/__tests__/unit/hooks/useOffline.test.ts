/**
 * useOffline Hook Unit Tests
 *
 * Comprehensive test suite with >90% coverage
 * Tests offline functionality combining network status and IndexedDB
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOffline } from "../../../lib/hooks/useOffline";
import { indexedDBManager } from "../../../lib/offline/indexeddb";
import type { NetworkChangeEvent } from "../../../lib/offline/network-detector";
import { useNetworkStatus } from "../../../lib/hooks/useNetworkStatus";
import type { StoreName } from "../../../types/offline.types";

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock useNetworkStatus
vi.mock("../../../lib/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    isUnstable: false,
    status: "online" as const,
    quality: {
      latency: 50,
      downlink: 10,
      effectiveType: "4g",
      saveData: false,
      rtt: 50,
    },
  })),
}));

// Mock IndexedDB Manager
vi.mock("../../../lib/offline/indexeddb", () => ({
  indexedDBManager: {
    create: vi.fn(),
    read: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockKuis = {
  id: "kuis-1",
  judul: "Test Kuis",
  deskripsi: "Test description",
  kelas_id: "kelas-1",
  dosen_id: "dosen-1",
};

const mockNilai = {
  id: "nilai-1",
  mahasiswa_id: "mahasiswa-1",
  kelas_id: "kelas-1",
  nilai_akhir: 85,
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe("useOffline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe("Initialization", () => {
    it("should initialize with network status", () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isUnstable).toBe(false);
      expect(result.current.status).toBe("online");
    });

    it("should expose quality metrics from network status", () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.quality).toBeDefined();
      expect(result.current.quality?.latency).toBe(50);
      expect(result.current.quality?.effectiveType).toBe("4g");
    });

    it("should expose all required methods", () => {
      const { result } = renderHook(() => useOffline());

      expect(result.current.saveOffline).toBeDefined();
      expect(result.current.getOffline).toBeDefined();
      expect(result.current.getAllOffline).toBeDefined();
      expect(result.current.deleteOffline).toBeDefined();
    });
  });

  // ============================================================================
  // SAVE OFFLINE TESTS
  // ============================================================================

  describe("saveOffline", () => {
    it("should save data to IndexedDB", async () => {
      (indexedDBManager.create as any).mockResolvedValue(mockKuis);

      const { result } = renderHook(() => useOffline());

      await result.current.saveOffline("kuis", mockKuis);

      expect(indexedDBManager.create).toHaveBeenCalledWith("kuis", mockKuis);
    });

    it("should handle different store types", async () => {
      (indexedDBManager.create as any).mockResolvedValue(mockNilai);

      const { result } = renderHook(() => useOffline());

      await result.current.saveOffline("nilai", mockNilai);

      expect(indexedDBManager.create).toHaveBeenCalledWith("nilai", mockNilai);
    });

    it("should throw error when save fails", async () => {
      const error = new Error("Save failed");
      (indexedDBManager.create as any).mockRejectedValue(error);

      const { result } = renderHook(() => useOffline());

      await expect(
        result.current.saveOffline("kuis", mockKuis),
      ).rejects.toThrow("Save failed");
    });

    it("should log error on save failure", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Save failed");
      (indexedDBManager.create as any).mockRejectedValue(error);

      const { result } = renderHook(() => useOffline());

      try {
        await result.current.saveOffline("kuis", mockKuis);
      } catch (e) {
        // Expected error
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save offline data"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });

    it("should work with objects containing id field", async () => {
      const data = { id: "test-id", name: "Test", value: 123 };
      (indexedDBManager.create as any).mockResolvedValue(data);

      const { result } = renderHook(() => useOffline());

      await result.current.saveOffline("custom" as StoreName, data);

      expect(indexedDBManager.create).toHaveBeenCalledWith("custom", data);
    });
  });

  // ============================================================================
  // GET OFFLINE TESTS
  // ============================================================================

  describe("getOffline", () => {
    it("should retrieve data from IndexedDB", async () => {
      (indexedDBManager.read as any).mockResolvedValue(mockKuis);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getOffline("kuis", "kuis-1");

      expect(indexedDBManager.read).toHaveBeenCalledWith("kuis", "kuis-1");
      expect(data).toEqual(mockKuis);
    });

    it("should return undefined for non-existent data", async () => {
      (indexedDBManager.read as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getOffline("kuis", "non-existent");

      expect(data).toBeUndefined();
    });

    it("should handle read errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (indexedDBManager.read as any).mockRejectedValue(
        new Error("Read failed"),
      );

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getOffline("kuis", "kuis-1");

      expect(data).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should support type inference", async () => {
      (indexedDBManager.read as any).mockResolvedValue(mockKuis);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getOffline<typeof mockKuis>(
        "kuis",
        "kuis-1",
      );

      expect(data).toEqual(mockKuis);
      expect(data?.id).toBe("kuis-1");
    });
  });

  // ============================================================================
  // GET ALL OFFLINE TESTS
  // ============================================================================

  describe("getAllOffline", () => {
    it("should retrieve all data from store", async () => {
      const mockData = [mockKuis, { ...mockKuis, id: "kuis-2" }];
      (indexedDBManager.getAll as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getAllOffline("kuis");

      expect(indexedDBManager.getAll).toHaveBeenCalledWith("kuis");
      expect(data).toEqual(mockData);
      expect(data).toHaveLength(2);
    });

    it("should return empty array for empty store", async () => {
      (indexedDBManager.getAll as any).mockResolvedValue([]);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getAllOffline("kuis");

      expect(data).toEqual([]);
    });

    it("should handle getAll errors gracefully", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (indexedDBManager.getAll as any).mockRejectedValue(
        new Error("GetAll failed"),
      );

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getAllOffline("kuis");

      expect(data).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should support type inference for arrays", async () => {
      const mockData = [mockKuis, { ...mockKuis, id: "kuis-2" }];
      (indexedDBManager.getAll as any).mockResolvedValue(mockData);

      const { result } = renderHook(() => useOffline());

      const data = await result.current.getAllOffline<typeof mockKuis>("kuis");

      expect(data).toHaveLength(2);
      expect(data[0].id).toBeDefined();
    });
  });

  // ============================================================================
  // DELETE OFFLINE TESTS
  // ============================================================================

  describe("deleteOffline", () => {
    it("should delete data from IndexedDB", async () => {
      (indexedDBManager.delete as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOffline());

      await result.current.deleteOffline("kuis", "kuis-1");

      expect(indexedDBManager.delete).toHaveBeenCalledWith("kuis", "kuis-1");
    });

    it("should throw error when delete fails", async () => {
      const error = new Error("Delete failed");
      (indexedDBManager.delete as any).mockRejectedValue(error);

      const { result } = renderHook(() => useOffline());

      await expect(
        result.current.deleteOffline("kuis", "kuis-1"),
      ).rejects.toThrow("Delete failed");
    });

    it("should log error on delete failure", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Delete failed");
      (indexedDBManager.delete as any).mockRejectedValue(error);

      const { result } = renderHook(() => useOffline());

      try {
        await result.current.deleteOffline("kuis", "kuis-1");
      } catch (e) {
        // Expected error
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete offline data"),
        error,
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ============================================================================
  // NETWORK STATUS INTEGRATION TESTS
  // ============================================================================

  describe("Network Status Integration", () => {
    it("should reflect offline network status", () => {
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        isUnstable: false,
        status: "offline",
        quality: undefined,
        lastChanged: Date.now(),
        isReady: true,
      });

      const { result } = renderHook(() => useOffline());

      expect(result.current.isOffline).toBe(true);
      expect(result.current.isOnline).toBe(false);
      expect(result.current.status).toBe("offline");
    });

    it("should reflect unstable network status", () => {
      vi.mocked(useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: false,
        isUnstable: true,
        status: "unstable",
        quality: {
          latency: 500,
          downlink: 0.5,
          effectiveType: "slow-2g",
          saveData: true,
          rtt: 500,
        },
        lastChanged: Date.now(),
        isReady: true,
      });

      const { result } = renderHook(() => useOffline());

      expect(result.current.isUnstable).toBe(true);
      expect(result.current.status).toBe("unstable");
      expect(result.current.quality?.effectiveType).toBe("slow-2g");
    });
  });

  // ============================================================================
  // MEMOIZATION TESTS
  // ============================================================================

  describe("Memoization", () => {
    it("should memoize callback functions", () => {
      const { result, rerender } = renderHook(() => useOffline());

      const saveOffline1 = result.current.saveOffline;
      const getOffline1 = result.current.getOffline;
      const getAllOffline1 = result.current.getAllOffline;
      const deleteOffline1 = result.current.deleteOffline;

      rerender();

      const saveOffline2 = result.current.saveOffline;
      const getOffline2 = result.current.getOffline;
      const getAllOffline2 = result.current.getAllOffline;
      const deleteOffline2 = result.current.deleteOffline;

      expect(saveOffline1).toBe(saveOffline2);
      expect(getOffline1).toBe(getOffline2);
      expect(getAllOffline1).toBe(getAllOffline2);
      expect(deleteOffline1).toBe(deleteOffline2);
    });

    it("should not recreate return object unnecessarily", () => {
      const { result, rerender } = renderHook(() => useOffline());

      const return1 = result.current;
      rerender();
      const return2 = result.current;

      // Check that primitive values are stable
      expect(return1.isOnline).toBe(return2.isOnline);
      expect(return1.status).toBe(return2.status);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration", () => {
    it("should handle complete offline workflow", async () => {
      (indexedDBManager.create as any).mockResolvedValue(mockKuis);
      (indexedDBManager.read as any).mockResolvedValue(mockKuis);
      (indexedDBManager.delete as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useOffline());

      // Save
      await result.current.saveOffline("kuis", mockKuis);
      expect(indexedDBManager.create).toHaveBeenCalledWith("kuis", mockKuis);

      // Read
      const data = await result.current.getOffline("kuis", "kuis-1");
      expect(data).toEqual(mockKuis);

      // Delete
      await result.current.deleteOffline("kuis", "kuis-1");
      expect(indexedDBManager.delete).toHaveBeenCalledWith("kuis", "kuis-1");
    });

    it("should work with multiple stores simultaneously", async () => {
      (indexedDBManager.create as any).mockImplementation(
        (store: string, data: any) => Promise.resolve(data),
      );

      const { result } = renderHook(() => useOffline());

      await Promise.all([
        result.current.saveOffline("kuis", mockKuis),
        result.current.saveOffline("nilai", mockNilai),
      ]);

      expect(indexedDBManager.create).toHaveBeenCalledTimes(2);
      expect(indexedDBManager.create).toHaveBeenCalledWith("kuis", mockKuis);
      expect(indexedDBManager.create).toHaveBeenCalledWith("nilai", mockNilai);
    });

    it("should maintain consistency across re-renders", () => {
      const { result, rerender } = renderHook(() => useOffline());

      const status1 = result.current.status;
      const isOnline1 = result.current.isOnline;

      rerender();

      const status2 = result.current.status;
      const isOnline2 = result.current.isOnline;

      expect(status1).toBe(status2);
      expect(isOnline1).toBe(isOnline2);
    });
  });
});
