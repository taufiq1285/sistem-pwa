/**
 * Kuis Versioned Simple API Tests
 *
 * CORE ALTERNATIVE IMPLEMENTATION TESTS - Simplified Auto-Save
 *
 * Purpose: Test simplified version tanpa version checking
 * Innovation: Direct Supabase operations untuk offline-first
 *
 * Test Coverage:
 * - Submit answer (upsert logic)
 * - Submit quiz dengan auto-notification
 * - Batch answer submission
 * - Grade answer
 * - Backward compatibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  submitAnswerSafe,
  submitQuizSafe,
  submitAllAnswersWithVersion,
  gradeAnswerWithVersion,
  submitAnswerWithVersion,
} from "@/lib/api/kuis-versioned-simple.api";
import type { Jawaban, AttemptKuis } from "@/types/kuis.types";

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
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
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

// Mock notification.api
vi.mock("@/lib/api/notification.api", () => ({
  notifyDosenTugasSubmitted: vi.fn(),
}));

// Mock kuis.api
vi.mock("@/lib/api/kuis.api", () => ({
  getAttemptById: vi.fn(),
  getJawabanByAttempt: vi.fn(),
}));

describe("Kuis Versioned Simple API - Simplified Auto-Save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // SUBMIT ANSWER (UPSERT LOGIC)
  // ==============================================================================

  describe("submitAnswerSafe", () => {
    it("should create new answer if not exists", async () => {
      const mockNewAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Answer A",
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      } as any;

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [], // No existing answer
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNewAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer A",
      });

      expect(result.id).toBe("jawaban-1");
      expect(result.is_synced).toBe(true);
    });

    it("should update existing answer", async () => {
      const mockExistingAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Old Answer",
        created_at: "2025-01-21T09:00:00Z",
        updated_at: "2025-01-21T09:00:00Z",
      };

      const mockUpdatedAnswer: Jawaban = {
        ...mockExistingAnswer,
        jawaban_mahasiswa: "New Answer",
        updated_at: "2025-01-21T10:00:00Z",
        is_synced: true,
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Check existing
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [mockExistingAnswer],
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Update
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedAnswer,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "New Answer",
      });

      expect(result.jawaban_mahasiswa).toBe("New Answer");
      expect(result.is_synced).toBe(true);
    });

    it("should handle insert errors", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Insert failed" },
            }),
          }),
        }),
      });

      await expect(
        submitAnswerSafe({
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "Answer",
        }),
      ).rejects.toThrow("Insert failed");
    });

    it("should handle update errors", async () => {
      const mockExistingAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Old Answer",
        created_at: "2025-01-21T09:00:00Z",
        updated_at: "2025-01-21T09:00:00Z",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [mockExistingAnswer],
                  error: null,
                }),
              }),
            }),
          };
        } else {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Update failed" },
                  }),
                }),
              }),
            }),
          };
        }
      });

      await expect(
        submitAnswerSafe({
          attempt_id: "attempt-1",
          soal_id: "soal-1",
          jawaban: "New Answer",
        }),
      ).rejects.toThrow("Update failed");
    });
  });

  // ==============================================================================
  // SUBMIT QUIZ
  // ==============================================================================

  describe("submitQuizSafe", () => {
    it("should submit quiz dan notify dosen", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mhs-1",
        status: "submitted",
        submitted_at: "2025-01-21T11:00:00Z",
        sisa_waktu: 300,
        kuis: {
          id: "kuis-1",
          judul: "Biologi Quiz 1",
          kelas_id: "kelas-1",
          kelas: {
            id: "kelas-1",
            dosen_id: "dosen-1",
            nama_kelas: "Kelas A",
            dosen: {
              id: "dosen-1",
              user_id: "user-dosen-1",
            },
          } as any,
        } as any,
        mahasiswa: {
          id: "mhs-1",
          nim: "12345",
          user: {
            full_name: "Ahmad",
          },
        } as any,
      } as any;

      const { notifyDosenTugasSubmitted } =
        await import("@/lib/api/notification.api");
      vi.mocked(notifyDosenTugasSubmitted).mockResolvedValue({} as any);

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAttempt,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await submitQuizSafe({
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      });

      expect(result.status).toBe("submitted");
      expect(notifyDosenTugasSubmitted).toHaveBeenCalledWith(
        "user-dosen-1",
        "Ahmad",
        "Biologi Quiz 1",
        "attempt-1",
        "kuis-1",
      );
    });

    it("should handle notification failure gracefully", async () => {
      const mockAttempt: AttemptKuis = {
        id: "attempt-1",
        kuis_id: "kuis-1",
        mahasiswa_id: "mhs-1",
        status: "submitted",
        submitted_at: "2025-01-21T11:00:00Z",
        sisa_waktu: 300,
        kuis: {
          id: "kuis-1",
          judul: "Biologi Quiz 1",
          kelas_id: "kelas-1",
          kelas: {
            id: "kelas-1",
            dosen_id: "dosen-1",
            nama_kelas: "Kelas A",
            dosen: {
              id: "dosen-1",
              user_id: null,
            },
          } as any,
        } as any,
        mahasiswa: {
          id: "mhs-1",
          nim: "12345",
          user: {
            full_name: "Ahmad",
          },
        } as any,
      } as any;

      const { notifyDosenTugasSubmitted } =
        await import("@/lib/api/notification.api");
      vi.mocked(notifyDosenTugasSubmitted).mockResolvedValue({} as any);

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAttempt,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await submitQuizSafe({
        attempt_id: "attempt-1",
        sisa_waktu: 300,
      });

      // Should still succeed even if notification not sent
      expect(result.status).toBe("submitted");
    });

    it("should handle submit quiz errors", async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Submit failed" },
              }),
            }),
          }),
        }),
      });

      await expect(
        submitQuizSafe({
          attempt_id: "attempt-1",
          sisa_waktu: 300,
        }),
      ).rejects.toThrow("Submit failed");
    });
  });

  // ==============================================================================
  // BATCH ANSWER SUBMISSION
  // ==============================================================================

  describe("submitAllAnswersWithVersion", () => {
    it("should submit all answers successfully", async () => {
      const answers = {
        "soal-1": "Answer 1",
        "soal-2": "Answer 2",
        "soal-3": "Answer 3",
      };

      // Mock no existing answers
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "jawaban-new" },
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAllAnswersWithVersion("attempt-1", answers);

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.conflicts).toBe(0);
      expect(result.results).toHaveLength(3);
    });

    it("should handle partial failures in batch submission", async () => {
      const answers = {
        "soal-1": "Answer 1",
        "soal-2": "Answer 2",
        "soal-3": "Answer 3",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        // Check existing - always return select mock
        if (callCount % 2 === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "jawaban-1" },
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Insert - even calls (not used since insert is on odd calls)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      // Override specific insert calls using call count tracking
      let insertCallCount = 0;
      const originalInsert = vi.fn();
      originalInsert.mockImplementation(() => {
        insertCallCount++;
        if (insertCallCount === 1) {
          // First insert succeeds
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "jawaban-1" },
                error: null,
              }),
            }),
          };
        } else if (insertCallCount === 2) {
          // Second insert fails
          throw new Error("Insert failed");
        } else {
          // Third insert succeeds
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "jawaban-3" },
                error: null,
              }),
            }),
          };
        }
      });

      // Override the insert method from the mockImplementation
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
          insert: originalInsert,
        };
      });

      const result = await submitAllAnswersWithVersion("attempt-1", answers);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it("should handle rapid consecutive submissions", async () => {
      const answers = {
        "soal-1": "Answer A",
        "soal-2": "Answer B",
        "soal-3": "Answer C",
        "soal-4": "Answer D",
        "soal-5": "Answer E",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "jawaban-new" },
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAllAnswersWithVersion("attempt-1", answers);

      expect(result.success).toBe(5);
      expect(result.failed).toBe(0);
    });

    it("should handle empty answers object", async () => {
      const result = await submitAllAnswersWithVersion("attempt-1", {});

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  // ==============================================================================
  // GRADE ANSWER
  // ==============================================================================

  describe("gradeAnswerWithVersion", () => {
    it("should grade answer successfully", async () => {
      const mockGradedAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Answer A",
        poin_diperoleh: 10,
        is_correct: true,
        feedback: "Good job!",
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockGradedAnswer,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await gradeAnswerWithVersion(
        "jawaban-1",
        10,
        true,
        "Good job!",
      );

      expect(result.poin_diperoleh).toBe(10);
      expect(result.is_correct).toBe(true);
      expect(result.feedback).toBe("Good job!");
    });

    it("should grade answer without feedback", async () => {
      const mockGradedAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Answer A",
        poin_diperoleh: 0,
        is_correct: false,
        feedback: null,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockGradedAnswer,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await gradeAnswerWithVersion("jawaban-1", 0, false);

      expect(result.poin_diperoleh).toBe(0);
      expect(result.is_correct).toBe(false);
      expect(result.feedback).toBeNull();
    });

    it("should handle grading errors", async () => {
      (supabase.from as any).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Grade failed" },
              }),
            }),
          }),
        }),
      });

      await expect(
        gradeAnswerWithVersion("jawaban-1", 10, true, "Good!"),
      ).rejects.toThrow("Grade failed");
    });
  });

  // ==============================================================================
  // BACKWARD COMPATIBILITY
  // ==============================================================================

  describe("submitAnswerWithVersion - Alias", () => {
    it("should work as alias for submitAnswerSafe", async () => {
      const mockAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Answer A",
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerWithVersion({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer A",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should return error object on failure", async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Insert failed" },
            }),
          }),
        }),
      });

      const result = await submitAnswerWithVersion({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "Answer A",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ==============================================================================
  // EDGE CASES
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle very long answer text", async () => {
      const longAnswer = "A".repeat(10000);

      const mockAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: longAnswer,
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: longAnswer,
      });

      expect(result.jawaban_mahasiswa).toBe(longAnswer);
    });

    it("should handle special characters in answer", async () => {
      const specialAnswer =
        "<script>alert('xss')</script> & 'quotes' \"double\"";

      const mockAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: specialAnswer,
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: specialAnswer,
      });

      expect(result.jawaban_mahasiswa).toContain("<script>");
    });

    it("should handle empty answer", async () => {
      const mockAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "",
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: "",
      });

      expect(result.jawaban_mahasiswa).toBe("");
    });

    it("should handle null answer gracefully", async () => {
      const mockAnswer: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: null as any,
        is_synced: true,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAnswer,
              error: null,
            }),
          }),
        }),
      });

      const result = await submitAnswerSafe({
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban: null as any,
      });

      expect(result).toBeDefined();
    });
  });

  // ==============================================================================
  // INTEGRATION TESTS
  // ==============================================================================

  describe("Integration Tests", () => {
    it("should handle complete quiz workflow", async () => {
      // 1. Submit answers (batch)
      const answers = {
        "soal-1": "Answer 1",
        "soal-2": "Answer 2",
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "jawaban-new" },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "jawaban-1",
                  poin_diperoleh: 10,
                  is_correct: true,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Submit all answers
      const batchResult = await submitAllAnswersWithVersion(
        "attempt-1",
        answers,
      );
      expect(batchResult.success).toBe(2);

      // Grade answer
      const gradedAnswer = await gradeAnswerWithVersion(
        "jawaban-1",
        10,
        true,
        "Good!",
      );
      expect(gradedAnswer.poin_diperoleh).toBe(10);
    });

    it("should handle auto-save scenario", async () => {
      // Simulate rapid auto-saves for same question
      const autoSaves = ["Answer draft 1", "Answer draft 2", "Answer final"];

      const mockExisting: Jawaban = {
        id: "jawaban-1",
        attempt_id: "attempt-1",
        soal_id: "soal-1",
        jawaban_mahasiswa: "Old answer",
        created_at: "2025-01-21T09:00:00Z",
        updated_at: "2025-01-21T09:00:00Z",
      };

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        // Always return both select and insert/update methods
        if (callCount % 2 === 1) {
          // Check existing
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: callCount === 1 ? [] : [mockExisting],
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockExisting, jawaban_mahasiswa: autoSaves[0] },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...mockExisting,
                      jawaban_mahasiswa:
                        autoSaves[Math.floor(callCount / 2) - 1],
                      updated_at: "2025-01-21T10:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          // Insert or update (not used since we already provide methods above)
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: callCount === 2 ? [] : [mockExisting],
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockExisting, jawaban_mahasiswa: autoSaves[0] },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...mockExisting,
                      jawaban_mahasiswa:
                        autoSaves[Math.floor(callCount / 2) - 1],
                      updated_at: "2025-01-21T10:00:00Z",
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
      });

      // Simulate rapid auto-saves
      const results = await Promise.all(
        autoSaves.map((answer) =>
          submitAnswerSafe({
            attempt_id: "attempt-1",
            soal_id: "soal-1",
            jawaban: answer,
          }),
        ),
      );

      expect(results).toHaveLength(3);
      expect(results[2].jawaban_mahasiswa).toBe("Answer final");
    });
  });
});
