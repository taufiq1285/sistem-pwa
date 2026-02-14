/**
 * useConflicts Hook Unit Tests
 * Comprehensive testing of conflict resolution functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useConflicts } from "@/lib/hooks/useConflicts";
import type { ConflictData } from "@/lib/hooks/useConflicts";

// Mock dependencies
vi.mock("../../../../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../../../../lib/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../../../lib/offline/api-cache", () => ({
  cacheAPI: vi.fn(),
}));

import { supabase as supabaseImport } from "@/lib/supabase/client";
import { useAuth as useAuthImport } from "@/lib/hooks/useAuth";
import { cacheAPI as cacheAPIImport } from "@/lib/offline/api-cache";

// Type the mocks properly
const mockSupabase = vi.mocked(supabaseImport);
const mockUseAuth = vi.mocked(useAuthImport);
const mockCacheAPI = vi.mocked(cacheAPIImport);

describe("useConflicts Hook", () => {
  const mockUser = { id: "test-user-id", name: "Test User" };

  const mockConflictData: ConflictData = {
    id: "conflict-1",
    queue_item_id: "queue-1",
    user_id: "test-user-id",
    table_name: "kuis",
    record_id: "kuis-123",
    client_data: { title: "Client Title", status: "draft" },
    server_data: { title: "Server Title", status: "published" },
    resolution_strategy: "manual",
    resolved_data: null,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-01-28T10:00:00Z",
    local_version: 1,
    remote_version: 2,
    status: "pending",
    winner: null,
  };

  const mockDbConflictRow = {
    id: "conflict-1",
    queue_item_id: "queue-1",
    user_id: "test-user-id",
    table_name: "kuis",
    record_id: "kuis-123",
    client_data: { title: "Client Title", status: "draft" },
    remote_data: { title: "Server Title", status: "published" },
    resolution_strategy: "manual",
    resolved_data: null,
    resolved_by: null,
    resolved_at: null,
    created_at: "2026-01-28T10:00:00Z",
    local_version: 1,
    remote_version: 2,
    status: "pending",
    winner: null,
  };

  let mockSelect: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockOrder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup auth mock
    mockUseAuth.mockReturnValue({
      user: mockUser,
    } as any);

    // Setup Supabase mocks
    mockEq = vi.fn().mockReturnThis();
    mockOrder = vi
      .fn()
      .mockResolvedValue({ data: [mockDbConflictRow], error: null });
    mockSelect = vi.fn().mockReturnValue({
      eq: mockEq.mockReturnValue({
        order: mockOrder,
      }),
    });

    mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    } as any);

    // Setup cache mock
    mockCacheAPI.mockImplementation(async (key, fetchFn) => {
      return await fetchFn();
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Initial state", () => {
    it("should initialize with loading state", () => {
      const { result } = renderHook(() => useConflicts());

      expect(result.current.loading).toBe(true);
      expect(result.current.conflicts).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it("should handle no user logged in", async () => {
      mockUseAuth.mockReturnValue({ user: null } as any);

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conflicts).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe("Fetching conflicts", () => {
    it("should fetch conflicts from database", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("conflict_log");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockEq).toHaveBeenCalledWith("user_id", "test-user-id");
      expect(mockOrder).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
    });

    it("should transform database data to ConflictData interface", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conflicts).toHaveLength(1);
      expect(result.current.conflicts[0]).toEqual(mockConflictData);
    });

    it("should handle fetch errors", async () => {
      const fetchError = new Error("Database error");
      mockOrder.mockResolvedValue({ data: null, error: fetchError });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error?.message).toContain("Database error");
      expect(result.current.loading).toBe(false);
    });

    it("should use cache for offline support", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCacheAPI).toHaveBeenCalledWith(
        `conflicts_${mockUser.id}`,
        expect.any(Function),
        {
          ttl: 5 * 60 * 1000,
          staleWhileRevalidate: true,
        },
      );
    });
  });

  describe("Pending conflicts", () => {
    it("should filter pending conflicts correctly", async () => {
      const resolvedConflict = {
        ...mockConflictData,
        id: "conflict-2",
        status: "resolved" as const,
      };

      mockOrder.mockResolvedValue({
        data: [mockConflictData, resolvedConflict],
        error: null,
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingConflicts).toHaveLength(1);
      expect(result.current.pendingConflicts[0].status).toBe("pending");
    });

    it("should return empty array when no pending conflicts", async () => {
      const resolvedConflict = {
        ...mockConflictData,
        status: "resolved" as const,
      };

      mockOrder.mockResolvedValue({
        data: [resolvedConflict],
        error: null,
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingConflicts).toHaveLength(0);
    });
  });

  describe("Conflict resolution", () => {
    it("should resolve conflict with local winner", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resolvedData = { title: "Final Title", status: "published" };

      await act(async () => {
        await result.current.resolveConflict(
          "conflict-1",
          resolvedData,
          "local",
        );
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("conflict_log");
      expect(mockUpdate).toHaveBeenCalledWith({
        resolved_data: resolvedData,
        winner: "local",
        status: "resolved",
        resolved_by: "test-user-id",
        resolved_at: expect.any(String),
      });
    });

    it("should resolve conflict with remote winner", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const resolvedData = mockConflictData.server_data;

      await act(async () => {
        await result.current.resolveConflict(
          "conflict-1",
          resolvedData,
          "remote",
        );
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        resolved_data: resolvedData,
        winner: "remote",
        status: "resolved",
        resolved_by: "test-user-id",
        resolved_at: expect.any(String),
      });
    });

    it("should resolve conflict with merged data", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const mergedData = {
        title: "Client Title",
        status: "published",
      };

      await act(async () => {
        await result.current.resolveConflict(
          "conflict-1",
          mergedData,
          "merged",
        );
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        resolved_data: mergedData,
        winner: "merged",
        status: "resolved",
        resolved_by: "test-user-id",
        resolved_at: expect.any(String),
      });
    });

    it("should handle resolution errors", async () => {
      const updateError = new Error("Update failed");
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: updateError }),
        }),
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.resolveConflict("conflict-1", {}, "local");
        });
      }).rejects.toThrow("Update failed");
    });

    it("should refresh conflicts after successful resolution", async () => {
      let callCount = 0;
      mockOrder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: [mockConflictData], error: null });
        } else {
          return Promise.resolve({
            data: [{ ...mockConflictData, status: "resolved" }],
            error: null,
          });
        }
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingConflicts).toHaveLength(1);

      await act(async () => {
        await result.current.resolveConflict("conflict-1", {}, "local");
      });

      expect(result.current.pendingConflicts).toHaveLength(0);
    });
  });

  describe("Conflict rejection", () => {
    it("should reject conflict", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.rejectConflict("conflict-1");
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        winner: "remote",
        status: "rejected",
        resolved_by: "test-user-id",
        resolved_at: expect.any(String),
      });
    });

    it("should handle rejection errors", async () => {
      const updateError = new Error("Rejection failed");
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: updateError }),
        }),
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.rejectConflict("conflict-1");
        });
      }).rejects.toThrow("Rejection failed");
    });
  });

  describe("Field conflicts analysis", () => {
    it("should identify field-level conflicts", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fieldConflicts = result.current.getFieldConflicts(mockConflictData);

      expect(fieldConflicts).toEqual([
        {
          field: "title",
          localValue: "Client Title",
          remoteValue: "Server Title",
        },
        {
          field: "status",
          localValue: "draft",
          remoteValue: "published",
        },
      ]);
    });

    it("should handle identical fields", async () => {
      const conflictWithSameFields = {
        ...mockConflictData,
        client_data: { title: "Same Title", author: "John" },
        server_data: { title: "Same Title", author: "Jane" },
      };

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fieldConflicts = result.current.getFieldConflicts(
        conflictWithSameFields,
      );

      expect(fieldConflicts).toEqual([
        {
          field: "author",
          localValue: "John",
          remoteValue: "Jane",
        },
      ]);
    });

    it("should handle missing fields", async () => {
      const conflictWithMissingFields = {
        ...mockConflictData,
        client_data: { title: "Title", newField: "new" },
        server_data: { title: "Title", removedField: "removed" },
      };

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fieldConflicts = result.current.getFieldConflicts(
        conflictWithMissingFields,
      );

      expect(fieldConflicts).toEqual([
        {
          field: "newField",
          localValue: "new",
          remoteValue: undefined,
        },
        {
          field: "removedField",
          localValue: undefined,
          remoteValue: "removed",
        },
      ]);
    });
  });

  describe("Manual refresh", () => {
    it("should allow manual refresh of conflicts", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      vi.clearAllMocks();

      await act(async () => {
        await result.current.refreshConflicts();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("conflict_log");
    });

    it("should handle refresh errors", async () => {
      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refreshError = new Error("Refresh failed");
      mockOrder.mockResolvedValue({ data: null, error: refreshError });

      await act(async () => {
        await result.current.refreshConflicts();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain("Refresh failed");
    });
  });

  describe("Offline behavior", () => {
    it("should handle offline state gracefully", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
      });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work offline with cached data
      expect(mockCacheAPI).toHaveBeenCalled();
    });

    it("should handle cache failures offline", async () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
      });

      const cacheError = new Error("Cache miss");
      mockCacheAPI.mockRejectedValue(cacheError);

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      expect(result.current.error).toBe(null);
    });
  });

  describe("Real-world scenarios", () => {
    it("should handle quiz data conflicts", async () => {
      const quizConflict = {
        ...mockConflictData,
        table_name: "kuis",
        client_data: {
          title: "Mathematical Quiz",
          duration_minutes: 60,
          questions_count: 10,
          is_published: false,
        },
        server_data: {
          title: "Mathematics Quiz", // Different spelling
          duration_minutes: 90, // Different duration
          questions_count: 10, // Same
          is_published: true, // Different publish state
        },
      };

      mockOrder.mockResolvedValue({ data: [quizConflict], error: null });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const fieldConflicts = result.current.getFieldConflicts(quizConflict);

      expect(fieldConflicts).toHaveLength(3);
      expect(fieldConflicts.find((f) => f.field === "title")).toBeTruthy();
      expect(
        fieldConflicts.find((f) => f.field === "duration_minutes"),
      ).toBeTruthy();
      expect(
        fieldConflicts.find((f) => f.field === "is_published"),
      ).toBeTruthy();
    });

    it("should handle multiple conflicts for same user", async () => {
      const multipleConflicts = [
        mockConflictData,
        { ...mockConflictData, id: "conflict-2", table_name: "soal" },
        { ...mockConflictData, id: "conflict-3", table_name: "materi" },
      ];

      mockOrder.mockResolvedValue({ data: multipleConflicts, error: null });

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.conflicts).toHaveLength(3);
      expect(result.current.pendingConflicts).toHaveLength(3);

      // Should group by table
      const tableNames = result.current.conflicts.map((c) => c.table_name);
      expect(new Set(tableNames)).toEqual(new Set(["kuis", "soal", "materi"]));
    });

    it("should handle complex nested data conflicts", async () => {
      const nestedConflict = {
        ...mockConflictData,
        client_data: {
          meta: { version: 1, author: "user1" },
          content: { sections: ["intro", "main"] },
        },
        server_data: {
          meta: { version: 2, author: "user2" },
          content: { sections: ["intro", "main", "conclusion"] },
        },
      };

      const { result } = renderHook(() => useConflicts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle nested object comparison
      const fieldConflicts = result.current.getFieldConflicts(nestedConflict);

      expect(fieldConflicts.some((f) => f.field === "meta")).toBeTruthy();
      expect(fieldConflicts.some((f) => f.field === "content")).toBeTruthy();
    });
  });
});
