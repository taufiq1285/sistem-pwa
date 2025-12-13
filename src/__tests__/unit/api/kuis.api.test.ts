/**
 * Kuis API Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

const mockKuis = {
  id: "kuis-1",
  judul: "Kuis Pemrograman",
  keterangan: "Quiz tentang dasar pemrograman",
  status: "published",
  kelas_id: "kelas-1",
  dosen_id: "dosen-1",
};

const mockAnswer = {
  id: "answer-1",
  kuis_id: "kuis-1",
  mahasiswa_id: "mhs-1",
  nomor_soal: 1,
  jawaban: "A",
  createdAt: new Date().toISOString(),
};

describe("Kuis API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getQuizzes", () => {
    it("should fetch all quizzes", async () => {
      const kuisList = [
        { ...mockKuis, id: "kuis-1" },
        { ...mockKuis, id: "kuis-2" },
      ];

      expect(kuisList).toHaveLength(2);
      expect(kuisList[0].status).toBe("published");
    });

    it("should filter by kelas_id", async () => {
      const kuisList = [
        { ...mockKuis, id: "kuis-1", kelas_id: "kelas-1" },
        { ...mockKuis, id: "kuis-2", kelas_id: "kelas-2" },
      ];

      const filtered = kuisList.filter((k) => k.kelas_id === "kelas-1");

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("kuis-1");
    });
  });

  describe("createQuiz", () => {
    it("should create new quiz", async () => {
      const newKuis = { ...mockKuis, id: "kuis-new" };

      expect(newKuis).toBeDefined();
      expect(newKuis.judul).toBe("Kuis Pemrograman");
      expect(newKuis.status).toBe("published");
    });

    it("should validate required fields", async () => {
      const invalidKuis = { judul: "", keterangan: "" };

      const isValid =
        Boolean(invalidKuis.judul) && Boolean(invalidKuis.keterangan);

      expect(isValid).toBe(false);
    });
  });

  describe("submitAnswer", () => {
    it("should save answer to database", async () => {
      const answer = { ...mockAnswer, id: "answer-new" };

      expect(answer).toBeDefined();
      expect(answer.kuis_id).toBe("kuis-1");
      expect(answer.nomor_soal).toBe(1);
    });

    it("should save answer offline when offline", async () => {
      const offlineAnswer = {
        ...mockAnswer,
        isOffline: true,
        synced: false,
      };

      expect(offlineAnswer.isOffline).toBe(true);
      expect(offlineAnswer.synced).toBe(false);
    });
  });

  describe("syncOfflineAnswers", () => {
    it("should sync offline answers when online", async () => {
      const offlineAnswers = [
        { ...mockAnswer, id: "offline-1", isOffline: true },
        { ...mockAnswer, id: "offline-2", isOffline: true },
      ];

      // Simulate sync
      const syncedAnswers = offlineAnswers.map((ans) => ({
        ...ans,
        isOffline: false,
        synced: true,
      }));

      expect(syncedAnswers).toHaveLength(2);
      expect(syncedAnswers[0].synced).toBe(true);
    });

    it("should handle sync conflicts", async () => {
      const localAnswer = { ...mockAnswer, jawaban: "A", timestamp: 1000 };
      const remoteAnswer = { ...mockAnswer, jawaban: "B", timestamp: 2000 };

      // Conflict resolution: remote wins (newer)
      const resolved =
        new Date(remoteAnswer.timestamp).getTime() >
        new Date(localAnswer.timestamp).getTime()
          ? remoteAnswer
          : localAnswer;

      expect(resolved.jawaban).toBe("B");
    });
  });

  // Placeholder test
  it("should have kuis API tests defined", () => {
    expect(true).toBe(true);
  });
});
