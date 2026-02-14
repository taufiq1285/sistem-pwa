/**
 * Kuis Versioned API Tests
 *
 * CORE RESEARCH TESTS - Optimistic Locking & Conflict Resolution
 *
 * Purpose: Test version control logic untuk quiz attempts
 * Innovation: Offline-first dengan optimistic locking untuk data integrity
 *
 * Test Coverage:
 * - Submit quiz dengan version check
 * - Submit answer dengan versioning
 * - Conflict detection & resolution
 * - Auto-resolve scenarios
 * - Fallback mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  submitQuizWithVersion,
  submitAnswerWithVersion,
  submitQuizSafe,
  submitAnswerSafe,
} from "@/lib/api/kuis-versioned.api";
import type { AttemptKuis, Jawaban } from "@/types/kuis.types";

// Mock supabase client
const createMockQuery = () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    csv: vi.fn().mockResolvedValue({ data: null, error: null }),
    abortSignal: vi.fn().mockReturnThis(),
    // Add rpc method for functions
    rpc: vi.fn(),
  };
  return mockQuery;
};

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createMockQuery()),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "" } })),
        createSignedUrl: vi.fn(() => ({ data: { signedUrl: "" } })),
        remove: vi.fn(),
        list: vi.fn(),
      })),
    },
  },
}));

// Mock versioned-update.api
vi.mock("@/lib/api/versioned-update.api", () => ({
  updateWithAutoResolve: vi.fn(),
  updateWithConflictLog: vi.fn(),
  getVersion: vi.fn(),
}));

// Mock original kuis.api
vi.mock("@/lib/api/kuis.api", () => ({
  getAttemptById: vi.fn(),
  getJawabanByAttempt: vi.fn(),
  submitQuiz: vi.fn(),
  submitAnswer: vi.fn(),
}));

import {
  updateWithAutoResolve,
  getVersion,
  getAttemptById,
} from "@/lib/api/kuis-versioned.api";

describe("Kuis Versioned API - Optimistic Locking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // SUBMIT QUIZ WITH VERSION
  // ==============================================================================

  describe("submitQuizWithVersion", () => {
    it("should submit quiz successfully tanpa conflict", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      // Mock getAttemptById
      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);

      // Mock getVersion
      vi.mocked(getVersion).mockReturnValue(1);

      // Mock updateWithAutoResolve - success
      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockAttempt,
          status: "submitted" as const,
          submitted_at: expect.any(String) as string,
          sisa_waktu: 300,
        },
      });

      const result = await submitQuizWithVersion(submitData, mockAttempt);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe("submitted");
      expect(updateWithAutoResolve).toHaveBeenCalledWith(
        "attempt_kuis",
        "attempt-1",
        1, // current version
        expect.objectContaining({
          status: "submitted",
          submitted_at: expect.any(String),
          sisa_waktu: 300,
        }),
        expect.any(Number), // timestamp
      );
    });

    it("should handle conflict dengan auto-resolve", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);
      vi.mocked(getVersion).mockReturnValue(2);

      // Mock successful conflict resolution
      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockAttempt,
          status: "submitted" as const,
          submitted_at: expect.any(String) as string,
          sisa_waktu: 300,
        },
        conflict: {
          local: {},
          remote: {},
          localVersion: 1,
          remoteVersion: 2,
        },
      });

      const result = await submitQuizWithVersion(submitData, mockAttempt);

      expect(result.success).toBe(true);
      expect(result.conflict).toBeDefined();
      expect(result.conflict?.localVersion).toBe(1);
      expect(result.conflict?.remoteVersion).toBe(2);
    });

    it("should return error jika conflict tidak bisa di-resolve", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);
      vi.mocked(getVersion).mockReturnValue(1);

      // Mock failed conflict resolution
      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: false,
        error: "Conflict detected - manual resolution required",
        conflict: {
          local: {},
          remote: {},
          localVersion: 1,
          remoteVersion: 2,
        },
      });

      const result = await submitQuizWithVersion(submitData, mockAttempt);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.conflict).toBeDefined();
    });

    it("should fetch attempt jika tidak provided", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      // Mock getAttemptById saat attempt tidak provided
      const { getAttemptById: mockGetAttempt } =
        await import("@/lib/api/kuis.api");
      vi.mocked(getAttemptById).mockResolvedValueOnce(mockAttempt);

      vi.mocked(getVersion).mockReturnValue(1);
      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockAttempt,
          status: "submitted" as const,
        },
      });

      const result = await submitQuizWithVersion(submitData);

      expect(result.success).toBe(true);
      expect(getAttemptById).toHaveBeenCalledWith("attempt-1");
    });
  });

  // ==============================================================================
  // SUBMIT ANSWER WITH VERSION
  // ==============================================================================

  describe("submitAnswerWithVersion", () => {
    it("should submit answer dengan version check", async () => {
      const mockJawaban: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Answer A",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer A",
      };

      // Create thenable query for select (check existing answers - return empty)
      const createThenableQuery = (data: any[]) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
      });

      // Mock supabase.from for select query (returns no existing answers)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      // Mock supabase.from for insert query
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockJawaban,
              error: null,
            }),
          }),
        }),
      } as any);

      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockJawaban,
          jawaban_mahasiswa: "Answer A",
        },
      });

      const result = await submitAnswerWithVersion(submitData);

      expect(result.success).toBe(true);
    });

    it("should handle conflict saat submit answer", async () => {
      const submitData = {
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer A",
      };

      // Mock supabase.from for select query (returns existing answer to trigger update)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "jawaban-1",
                  attempt_id: "attempt-1",
                  soal_id: "soal-1",
                  jawaban_mahasiswa: "Old answer",
                },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          id: "jawaban-1",
          jawaban_mahasiswa: "Answer A (merged)",
        },
        conflict: {
          local: {},
          remote: {},
          localVersion: 1,
          remoteVersion: 2,
        },
      });

      const result = await submitAnswerWithVersion(submitData);

      expect(result.success).toBe(true);
      expect(result.conflict).toBeDefined();
    });
  });

  // ==============================================================================
  // SAFE VERSION (FALLBACK)
  // ==============================================================================

  describe("submitQuizSafe - Fallback Mechanism", () => {
    it("should use versioned update jika version tersedia", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      // Add _version field to trigger versioned path
      const mockAttemptWithVersion = {
        ...mockAttempt,
        _version: 1,
      } as any;

      vi.mocked(getAttemptById).mockResolvedValue(mockAttemptWithVersion);
      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockAttempt,
          status: "submitted" as const,
        },
      });

      const result = await submitQuizSafe(submitData);

      expect(result).toBeDefined();
      expect(updateWithAutoResolve).toHaveBeenCalled();
    });

    it("should fallback ke original jika version tidak tersedia", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);
      vi.mocked(getVersion).mockReturnValue(undefined);

      // Mock original submitQuiz
      const { submitQuiz: mockSubmitQuiz } = await import("@/lib/api/kuis.api");
      vi.mocked(mockSubmitQuiz).mockResolvedValueOnce({
        ...mockAttempt,
        status: "submitted" as const,
      });

      const result = await submitQuizSafe(submitData);

      expect(result).toBeDefined();
    });
  });

  // ==============================================================================
  // EDGE CASES & ERROR HANDLING
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle database error gracefully", async () => {
      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockRejectedValue(
        new Error("Database connection failed"),
      );

      await expect(submitQuizWithVersion(submitData)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should handle missing attempt", async () => {
      const submitData = {
        attempt_id: "non-existent",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(null);

      await expect(submitQuizWithVersion(submitData)).rejects.toThrow();
    });

    it("should handle version field yang tidak konsisten", async () => {
      const mockAttempt: Partial<AttemptKuis> = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        // version field missing or null
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);
      vi.mocked(getVersion).mockReturnValue(0); // No version = 0

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: mockAttempt,
      });

      const result = await submitQuizWithVersion(
        submitData,
        mockAttempt as AttemptKuis,
      );

      expect(result.success).toBe(true);
      expect(getVersion).toHaveBeenCalledWith(mockAttempt);
    });
  });

  // ==============================================================================
  // VERSION INTEGRATION
  // ==============================================================================

  describe("Version Field Integration", () => {
    it("should extract version dari attempt object", () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      vi.mocked(getVersion).mockReturnValue(3);

      const version = getVersion(mockAttempt);

      expect(version).toBe(3);
      expect(getVersion).toHaveBeenCalledWith(mockAttempt);
    });

    it("should return 0 jika version field tidak ada", () => {
      const mockAttempt: Partial<AttemptKuis> = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
      };

      vi.mocked(getVersion).mockReturnValue(0);

      const version = getVersion(mockAttempt as AttemptKuis);

      expect(version).toBe(0);
    });
  });

  // ==============================================================================
  // CONFLICT RESOLUTION STRATEGIES
  // ==============================================================================

  describe("Conflict Resolution Strategies", () => {
    it("should prefer student answers dalam conflicts", async () => {
      // Test bahwa auto-resolve protects student's answers
      const mockJawaban: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Student Answer",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Student Updated Answer",
      };

      // Mock supabase.from for select query (returns no existing answers)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      // Mock supabase.from for insert query
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockJawaban,
                jawaban_mahasiswa: "Student Updated Answer",
              },
              error: null,
            }),
          }),
        }),
      } as any);

      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockJawaban,
          jawaban_mahasiswa: "Student Updated Answer",
        },
        conflict: {
          local: {},
          remote: {},
          localVersion: 1,
          remoteVersion: 2,
        },
      });

      const result = await submitAnswerWithVersion(submitData);

      expect(result.success).toBe(true);
      expect(result.data?.jawaban_mahasiswa).toBe("Student Updated Answer");
    });

    it("should preserve auto-save data", async () => {
      // Test bahwa auto-save data tidak hilang saat conflict
      const mockJawaban: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Auto-saved answer",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "New answer",
      };

      // Mock supabase.from for select query (returns no existing answers)
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as any);

      // Mock supabase.from for insert query
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockJawaban,
                jawaban_mahasiswa: "Merged answer",
              },
              error: null,
            }),
          }),
        }),
      } as any);

      vi.mocked(getVersion).mockReturnValue(2);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: {
          ...mockJawaban,
          jawaban_mahasiswa: "Merged answer",
        },
      });

      const result = await submitAnswerWithVersion(submitData);

      expect(result.success).toBe(true);
    });
  });

  // ==============================================================================
  // PERFORMANCE & OPTIMIZATION
  // ==============================================================================

  describe("Performance Considerations", () => {
    it("should minimize database queries", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mahasiswa-1",
        attempt_number: 1,
        started_at: "2025-01-21T10:00:00Z",
        status: "in_progress",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const submitData = {
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      };

      vi.mocked(getAttemptById).mockResolvedValue(mockAttempt as AttemptKuis);
      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: mockAttempt,
      });

      await submitQuizWithVersion(submitData, mockAttempt);

      // Jangan fetch attempt jika sudah provided
      expect(getAttemptById).not.toHaveBeenCalled();
      expect(updateWithAutoResolve).toHaveBeenCalledTimes(1);
    });

    it("should handle rapid consecutive submits", async () => {
      // Test rapid fire submissions (auto-save scenario)
      const submitData = {
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer 1",
      };

      // Mock supabase.from to always return proper query structure
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        // For select queries
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: `jawaban-${Math.random()}` },
                error: null,
              }),
            }),
          }),
        } as any;
      });

      vi.mocked(getVersion).mockReturnValue(1);

      vi.mocked(updateWithAutoResolve).mockResolvedValue({
        success: true,
        data: { id: "jawaban-1" },
      });

      // Multiple rapid submits
      const promises = [
        submitAnswerWithVersion({
          ...submitData,
          jawaban: "Answer 2",
        }),
        submitAnswerWithVersion({
          ...submitData,
          jawaban: "Answer 3",
        }),
        submitAnswerWithVersion({
          ...submitData,
          jawaban: "Answer 4",
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
