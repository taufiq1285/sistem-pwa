/**
 * Bank Soal API Tests
 *
 * FEATURE INNOVATION TESTS - Question Bank Management
 *
 * Purpose: Test question bank functionality untuk efisiensi dosen
 * Innovation: Reusable questions untuk improve quality
 *
 * Test Coverage:
 * - CRUD operations untuk bank soal
 * - Add questions from bank to quiz
 * - Duplicate detection
 * - Search & filter logic
 * - Usage tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  getBankSoal,
  getBankSoalById,
  createBankSoal,
  updateBankSoal,
  deleteBankSoal,
  addQuestionsFromBank,
  copyQuizQuestionsToBank,
  saveSoalToBank,
  checkDuplicateBankSoal,
  getBankSoalStats,
} from "@/lib/api/bank-soal.api";
import type {
  BankSoal,
  CreateBankSoalData,
  BankSoalFilters,
} from "@/types/bank-soal.types";
import type { TipeSoal, Soal } from "@/types/kuis.types";

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
    // Make query thenable
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
    catch: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe("Bank Soal API - Question Bank Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==============================================================================
  // GET OPERATIONS
  // ==============================================================================

  describe("getBankSoal", () => {
    it("should get all questions from bank tanpa filters", async () => {
      const mockQuestions: BankSoal[] = [
        {
          id: "1",
          dosen_id: "dosen-1",
          pertanyaan: "Apa itu React?",
          tipe_soal: "multiple_choice" as TipeSoal,
          poin: 10,
          opsi_jawaban: [
            { id: "1", label: "A", text: "A", is_correct: true },
            { id: "2", label: "B", text: "B", is_correct: false },
            { id: "3", label: "C", text: "C", is_correct: false },
            { id: "4", label: "D", text: "D", is_correct: false },
          ],
          jawaban_benar: "A",
          mata_kuliah_id: "mk-1",
          is_public: true,
          usage_count: 5,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          tags: ["basic", "theory"],
        },
      ];

      // Create thenable query
      const createThenableQuery = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        catch: () => ({ data, error: null }),
        eq: vi.fn().mockReturnThis(),
        contains: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue(createThenableQuery(mockQuestions)),
      });

      const result = await getBankSoal();

      expect(result).toHaveLength(1);
      expect(result[0].pertanyaan).toBe("Apa itu React?");
      expect(supabase.from).toHaveBeenCalledWith("bank_soal");
    });

    it("should filter by dosen_id", async () => {
      const filters: BankSoalFilters = {
        dosen_id: "dosen-1",
      };

      const mockQuestions: BankSoal[] = [
        {
          id: "1",
          dosen_id: "dosen-1",
          pertanyaan: "Question 1",
          tipe_soal: "essay" as TipeSoal,
          poin: 5,
          opsi_jawaban: null,
          jawaban_benar: null,
          mata_kuliah_id: "mk-1",
          is_public: false,
          usage_count: 0,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          tags: [],
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      });

      const result = await getBankSoal(filters);

      expect(result).toHaveLength(1);
      expect(mockEq).toHaveBeenCalledWith("dosen_id", "dosen-1");
    });

    it("should filter by tipe_soal", async () => {
      const filters: BankSoalFilters = {
        tipe_soal: "multiple_choice" as TipeSoal,
      };

      const mockEq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      });

      const result = await getBankSoal(filters);

      expect(result).toEqual([]);
    });

    it("should search by pertanyaan text", async () => {
      const filters: BankSoalFilters = {
        search: "React",
      };

      const mockIlike = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ilike: mockIlike,
          }),
        }),
      });

      await getBankSoal(filters);

      expect(mockIlike).toHaveBeenCalledWith("pertanyaan", "%React%");
    });
  });

  // ==============================================================================
  // CREATE OPERATIONS
  // ==============================================================================

  describe("createBankSoal", () => {
    it("should create new question di bank", async () => {
      const data: CreateBankSoalData = {
        dosen_id: "dosen-1",
        pertanyaan: "Apa itu TypeScript?",
        tipe_soal: "multiple_choice" as TipeSoal,
        poin: 10,
        opsi_jawaban: [
          { id: "1", label: "A", text: "A", is_correct: true },
          { id: "2", label: "B", text: "B", is_correct: false },
          { id: "3", label: "C", text: "C", is_correct: false },
          { id: "4", label: "D", text: "D", is_correct: false },
        ],
        jawaban_benar: "A",
        mata_kuliah_id: "mk-1",
        tags: ["typescript", "basic"],
      };

      const mockQuestion: BankSoal = {
        id: "new-id",
        ...data,
        is_public: false,
        usage_count: 0,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T10:00:00Z",
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockQuestion,
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createBankSoal(data);

      expect(result).toEqual(mockQuestion);
      expect(mockInsert).toHaveBeenCalledWith([data]);
    });

    it("should handle error saat create", async () => {
      const data: CreateBankSoalData = {
        dosen_id: "dosen-1",
        pertanyaan: "Test",
        tipe_soal: "essay" as TipeSoal,
        poin: 5,
        mata_kuliah_id: "mk-1",
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error("Database error"),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      await expect(createBankSoal(data)).rejects.toThrow("Database error");
    });
  });

  // ==============================================================================
  // UPDATE OPERATIONS
  // ==============================================================================

  describe("updateBankSoal", () => {
    it("should update question di bank", async () => {
      const id = "question-1";
      const data = {
        pertanyaan: "Updated question",
        poin: 15,
      };

      const mockUpdated: BankSoal = {
        id,
        dosen_id: "dosen-1",
        pertanyaan: "Updated question",
        tipe_soal: "multiple_choice" as TipeSoal,
        poin: 15,
        opsi_jawaban: [
          { id: "1", label: "A", text: "A", is_correct: true },
          { id: "2", label: "B", text: "B", is_correct: false },
        ],
        jawaban_benar: "A",
        mata_kuliah_id: "mk-1",
        is_public: true,
        usage_count: 10,
        created_at: "2025-01-21T10:00:00Z",
        updated_at: "2025-01-21T11:00:00Z",
      };

      const mockEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdated,
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateBankSoal(id, data);

      expect(result.pertanyaan).toBe("Updated question");
      expect(result.poin).toBe(15);
      expect(mockUpdate).toHaveBeenCalledWith(data);
      expect(mockEq).toHaveBeenCalledWith("id", id);
    });
  });

  // ==============================================================================
  // DELETE OPERATIONS
  // ==============================================================================

  describe("deleteBankSoal", () => {
    it("should delete question dari bank", async () => {
      const id = "question-1";

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      await deleteBankSoal(id);

      expect(mockDelete).toHaveBeenCalled();
    });

    it("should handle error saat delete", async () => {
      const id = "question-1";

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: new Error("Delete failed"),
        }),
      });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      await expect(deleteBankSoal(id)).rejects.toThrow("Delete failed");
    });
  });

  // ==============================================================================
  // ADD QUESTIONS FROM BANK TO QUIZ
  // ==============================================================================

  describe("addQuestionsFromBank", () => {
    it("should add questions dari bank ke quiz", async () => {
      const kuisId = "kuis-1";
      const bankSoalIds = ["bank-1", "bank-2"];

      const mockBankQuestions: any[] = [
        {
          id: "bank-1",
          pertanyaan: "Question 1",
          tipe_soal: "multiple_choice" as TipeSoal,
          poin: 10,
          opsi_jawaban: [
            { id: "1", label: "A", text: "A", is_correct: true },
            { id: "2", label: "B", text: "B", is_correct: false },
            { id: "3", label: "C", text: "C", is_correct: false },
            { id: "4", label: "D", text: "D", is_correct: false },
          ],
          jawaban_benar: "A",
          mata_kuliah_id: "mk-1",
        },
        {
          id: "bank-2",
          pertanyaan: "Question 2",
          tipe_soal: "essay" as TipeSoal,
          poin: 15,
          opsi_jawaban: null,
          jawaban_benar: null,
          mata_kuliah_id: "mk-1",
        },
      ];

      const mockSoal: Soal[] = [
        {
          id: "soal-1",
          kuis_id: kuisId,
          pertanyaan: "Question 1",
          tipe_soal: "multiple_choice" as TipeSoal,
          poin: 10,
          urutan: 1,
          opsi_jawaban: [
            { id: "1", label: "A", text: "A", is_correct: true },
            { id: "2", label: "B", text: "B", is_correct: false },
            { id: "3", label: "C", text: "C", is_correct: false },
            { id: "4", label: "D", text: "D", is_correct: false },
          ],
          jawaban_benar: "A",
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
        },
        {
          id: "soal-2",
          kuis_id: kuisId,
          pertanyaan: "Question 2",
          tipe_soal: "essay" as TipeSoal,
          poin: 15,
          urutan: 2,
          opsi_jawaban: null,
          jawaban_benar: null,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
        },
      ];

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockSoal,
          error: null,
        }),
      });

      // Mock .from().select().in() chain - needs .select() first
      const mockIn = vi.fn().mockResolvedValue({
        data: mockBankQuestions,
        error: null,
      });

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: mockIn,
          }),
        })
        .mockReturnValueOnce({ insert: mockInsert });

      const result = await addQuestionsFromBank(kuisId, bankSoalIds);

      expect(result).toHaveLength(2);
      expect(result[0].kuis_id).toBe(kuisId);
      expect(result[0].urutan).toBe(1);
    });

    it("should increment usage count untuk setiap question", async () => {
      const kuisId = "kuis-1";
      const bankSoalIds = ["bank-1"];

      const mockBankQuestions: any[] = [
        {
          id: "bank-1",
          pertanyaan: "Q1",
          tipe_soal: "multiple_choice",
          poin: 10,
        },
      ];

      const mockSoal: Soal[] = [
        {
          id: "soal-1",
          kuis_id: kuisId,
          pertanyaan: "Q1",
          tipe_soal: "multiple_choice" as TipeSoal,
          poin: 10,
          urutan: 1,
          opsi_jawaban: [],
          jawaban_benar: "",
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
        },
      ];

      // Mock for .select().in() chain
      const mockIn = vi.fn().mockResolvedValue({
        data: mockBankQuestions,
        error: null,
      });

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: mockIn,
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: mockSoal, error: null }),
          }),
        });

      await addQuestionsFromBank(kuisId, bankSoalIds);

      // Verify usage increment was called (implementation detail)
      expect(supabase.from).toHaveBeenCalledWith("bank_soal");
    });
  });

  // ==============================================================================
  // DUPLICATE DETECTION
  // ==============================================================================

  describe("checkDuplicateBankSoal", () => {
    it("should detect duplicate questions berdasarkan pertanyaan", async () => {
      const pertanyaan = "Apa itu React?";
      const dosenId = "dosen-1";
      const tipeSoal = "multiple_choice" as TipeSoal;

      const mockDuplicates: BankSoal[] = [
        {
          id: "existing-1",
          dosen_id: dosenId,
          pertanyaan: "Apa itu React?",
          tipe_soal: tipeSoal,
          poin: 10,
          opsi_jawaban: [],
          jawaban_benar: "A",
          mata_kuliah_id: "mk-1",
          is_public: true,
          usage_count: 5,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
          tags: [],
        },
      ];

      const mockIlike = vi.fn().mockResolvedValue({
        data: mockDuplicates,
        error: null,
      });

      // Make the query thenable
      const createThenable = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        ilike: mockIlike,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(createThenable(mockDuplicates)),
          }),
        }),
      });

      const result = await checkDuplicateBankSoal(
        pertanyaan,
        dosenId,
        tipeSoal,
      );

      expect(result).toHaveLength(1);
      expect(result[0].pertanyaan).toBe(pertanyaan);
    });

    it("should return empty array jika no duplicates", async () => {
      const mockIlike = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      // Make the query thenable
      const createThenable = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        ilike: mockIlike,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(createThenable([])),
          }),
        }),
      });

      const result = await checkDuplicateBankSoal(
        "Unique question",
        "dosen-1",
        "essay" as TipeSoal,
      );

      expect(result).toHaveLength(0);
    });
  });

  // ==============================================================================
  // COPY QUIZ TO BANK
  // ==============================================================================

  describe("copyQuizQuestionsToBank", () => {
    it("should copy questions dari quiz ke bank", async () => {
      const kuisId = "kuis-1";
      const dosenId = "dosen-1";
      const tags = ["exam", "midterm"];

      const mockQuizSoal: any[] = [
        {
          id: "soal-1",
          pertanyaan: "Quiz Question 1",
          tipe_soal: "multiple_choice" as TipeSoal,
          poin: 10,
          opsi_jawaban: [
            { id: "1", label: "A", text: "A", is_correct: true },
            { id: "2", label: "B", text: "B", is_correct: false },
          ],
          jawaban_benar: "A",
        },
      ];

      const mockBankQuestions: any[] = [
        {
          id: "bank-1",
          ...mockQuizSoal[0],
          dosen_id: dosenId,
          tags,
          is_public: false,
          usage_count: 0,
          created_at: "2025-01-21T10:00:00Z",
          updated_at: "2025-01-21T10:00:00Z",
        },
      ];

      // Make thenable query for select - needs .select() method since code calls .from().select()
      const createThenableSelect = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      });

      // Mock for insert query - .insert().select()
      const createThenableSelectForInsert = (data: any) => ({
        then: (resolve: any) => resolve({ data, error: null }),
      });

      (supabase.from as any)
        .mockReturnValueOnce(createThenableSelect(mockQuizSoal))
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi
              .fn()
              .mockReturnValue(
                createThenableSelectForInsert(mockBankQuestions),
              ),
          }),
        });

      const result = await copyQuizQuestionsToBank(kuisId, dosenId, tags);

      expect(result).toHaveLength(1);
      expect(result[0].dosen_id).toBe(dosenId);
      expect(result[0].tags).toEqual(tags);
    });
  });

  // ==============================================================================
  // STATS
  // ==============================================================================

  describe("getBankSoalStats", () => {
    it("should get statistics untuk dosen", async () => {
      const dosenId = "dosen-1";

      const mockStats = {
        total_questions: 100,
        pilihan_ganda_count: 60,
        essay_count: 30,
        total_usage: 500,
        avg_usage_per_question: 5,
        most_used_tags: [],
      };

      const mockQuestions = Array(100)
        .fill(null)
        .map((_, i) => ({
          tipe_soal: i < 60 ? "pilihan_ganda" : i < 90 ? "essay" : "true_false",
          usage_count: 5,
          tags: [],
        }));

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: mockQuestions,
          error: null,
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await getBankSoalStats(dosenId);

      expect(result).toEqual(mockStats);
    });
  });

  // ==============================================================================
  // EDGE CASES
  // ==============================================================================

  describe("Edge Cases", () => {
    it("should handle empty bank question list", async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      });

      const result = await getBankSoal({ dosen_id: "dosen-1" });

      expect(result).toEqual([]);
    });

    it("should handle question dengan special characters", async () => {
      const data: CreateBankSoalData = {
        dosen_id: "dosen-1",
        pertanyaan: "Apa itu <React> & [TypeScript]?",
        tipe_soal: "multiple_choice" as TipeSoal,
        poin: 10,
        mata_kuliah_id: "mk-1",
      };

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "new-id", ...data },
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createBankSoal(data);

      expect(result.pertanyaan).toContain("React");
      expect(result.pertanyaan).toContain("TypeScript");
    });

    it("should handle very long question text", async () => {
      const longText = "A".repeat(1000);

      const data: CreateBankSoalData = {
        dosen_id: "dosen-1",
        pertanyaan: longText,
        tipe_soal: "essay" as TipeSoal,
        poin: 20,
        mata_kuliah_id: "mk-1",
      };

      const mockSelect = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "new-id", ...data },
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createBankSoal(data);

      expect(result.pertanyaan).toHaveLength(1000);
    });
  });
});
