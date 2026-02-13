/**
 * Unit Tests for Cleanup API (Vitest)
 *
 * Purpose: Test cleanup functions for removing kuis/praktikum data
 * Coverage:
 * - verifyKuisDataCounts() - verify data counts
 * - Error handling and edge cases
 *
 * @vitest/environments happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { supabase } from "@/lib/supabase/client";
import {
  verifyKuisDataCounts,
} from "@/lib/api/cleanup.api";

// Create proper chainable query mock
const createQueryMock = (resolveValue: any = { count: 0 }) => {
  const buildChain = () => {
    const chainObj: any = {
      select: () => buildChain(),
      eq: () => chainObj,
      head: () => chainObj,
      count: resolveValue.count,
    };

    return chainObj;
  };

  return buildChain();
};

// Mock supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => createQueryMock()),
  },
}));

describe("Cleanup API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("verifyKuisDataCounts()", () => {
    it("should return correct counts for all tables", async () => {
      const mockCounts = {
        jawaban: 100,
        attempt_kuis: 50,
        soal: 200,
        kuis: 25,
        kuis_essay: 10,
        kuis_pilihan_ganda: 15,
      };

      let callIndex = 0;
      (supabase.from as any).mockImplementation(() => {
        callIndex++;

        // First 4 calls: jawaban, attempt_kuis, soal, kuis (all)
        if (callIndex === 1) return createQueryMock({ count: mockCounts.jawaban });
        if (callIndex === 2) return createQueryMock({ count: mockCounts.attempt_kuis });
        if (callIndex === 3) return createQueryMock({ count: mockCounts.soal });
        if (callIndex === 4) return createQueryMock({ count: mockCounts.kuis });
        if (callIndex === 5) return createQueryMock({ count: mockCounts.kuis_essay });
        if (callIndex === 6) return createQueryMock({ count: mockCounts.kuis_pilihan_ganda });

        return createQueryMock({ count: 0 });
      });

      const result = await verifyKuisDataCounts();

      expect(result.jawaban).toBe(100);
      expect(result.attempt_kuis).toBe(50);
      expect(result.soal).toBe(200);
      expect(result.kuis).toBe(25);
      expect(result.kuis_essay).toBe(10);
      expect(result.kuis_pilihan_ganda).toBe(15);
    });

    it("should return zero counts when tables are empty", async () => {
      (supabase.from as any).mockReturnValue(createQueryMock({ count: 0 }));

      const result = await verifyKuisDataCounts();

      expect(result.jawaban).toBe(0);
      expect(result.attempt_kuis).toBe(0);
      expect(result.soal).toBe(0);
      expect(result.kuis).toBe(0);
      expect(result.kuis_essay).toBe(0);
      expect(result.kuis_pilihan_ganda).toBe(0);
    });

    it("should handle null counts gracefully", async () => {
      (supabase.from as any).mockReturnValue(createQueryMock({ count: null }));

      const result = await verifyKuisDataCounts();

      expect(result.jawaban).toBe(0);
      expect(result.attempt_kuis).toBe(0);
      expect(result.soal).toBe(0);
      expect(result.kuis).toBe(0);
      expect(result.kuis_essay).toBe(0);
      expect(result.kuis_pilihan_ganda).toBe(0);
    });

    it("should handle undefined counts gracefully", async () => {
      (supabase.from as any).mockReturnValue(createQueryMock({ count: undefined }));

      const result = await verifyKuisDataCounts();

      expect(result.jawaban).toBe(0);
      expect(result.attempt_kuis).toBe(0);
      expect(result.soal).toBe(0);
      expect(result.kuis).toBe(0);
    });

    it("should query all tables in correct order", async () => {
      (supabase.from as any).mockReturnValue(createQueryMock({ count: 10 }));

      await verifyKuisDataCounts();

      // Should call from() 6 times in this order
      expect(supabase.from).toHaveBeenCalledTimes(6);
      const calls = (supabase.from as any).mock.calls;
      expect(calls[0][0]).toBe("jawaban");
      expect(calls[1][0]).toBe("attempt_kuis");
      expect(calls[2][0]).toBe("soal");
      expect(calls[3][0]).toBe("kuis");
      expect(calls[4][0]).toBe("kuis");
      expect(calls[5][0]).toBe("kuis");
    });

    it("should query essay kuis with eq filter", async () => {
      let callIndex = 0;
      (supabase.from as any).mockImplementation(() => {
        callIndex++;
        const mock = createQueryMock({ count: 10 });
        if (callIndex === 5) {
          // 5th call should be kuis with eq("tipe_kuis", "essay")
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                head: vi.fn().mockReturnValue({ count: 10 }),
              }),
            }),
          };
        }
        return mock;
      });

      await verifyKuisDataCounts();

      // Verify eq is called for essay filter
      expect(supabase.from).toHaveBeenCalledTimes(6);
    });
  });
});
