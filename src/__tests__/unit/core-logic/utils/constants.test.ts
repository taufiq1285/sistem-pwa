/**
 * Tests for constants.ts
 */

import { describe, it, expect } from "vitest";
import {
  API_CONFIG,
  PAGINATION,
  FILE_UPLOAD,
  QUIZ,
  STORAGE_KEYS,
  ROLES,
  SYNC,
  NETWORK,
  VALIDATION,
  DATE_FORMATS,
  HTTP_STATUS,
  QUIZ_STATUS,
  ATTEMPT_STATUS,
  QUESTION_TYPE,
  PEMINJAMAN_STATUS,
  KONDISI_BARANG,
  ATTENDANCE_STATUS,
  SYNC_STATUS,
  NILAI_HURUF,
  SEMESTER,
  isQuizAvailable,
  isAttemptEditable,
  isBarangAvailable,
  getNilaiHuruf,
  type QuizStatus,
  type AttemptStatus,
  type QuestionType,
  type PeminjamanStatus,
  type KondisiBarang,
  type AttendanceStatus,
  type SyncStatus,
  type NilaiHuruf,
  type Semester,
} from "@/lib/utils/constants";

describe("constants", () => {
  describe("API_CONFIG", () => {
    it("should have correct timeout value", () => {
      expect(API_CONFIG.TIMEOUT).toBe(30000);
    });

    it("should have retry configuration", () => {
      expect(API_CONFIG.RETRY_ATTEMPTS).toBe(3);
      expect(API_CONFIG.RETRY_DELAY).toBe(1000);
    });
  });

  describe("PAGINATION", () => {
    it("should have default and max page size", () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(10);
      expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
    });

    it("should have page size options", () => {
      expect(PAGINATION.PAGE_SIZE_OPTIONS).toEqual([10, 20, 50, 100]);
    });
  });

  describe("FILE_UPLOAD", () => {
    it("should have max size of 10MB", () => {
      expect(FILE_UPLOAD.MAX_SIZE).toBe(10 * 1024 * 1024);
    });

    it("should have allowed image types", () => {
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain("image/jpeg");
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain("image/png");
    });

    it("should have allowed document types", () => {
      expect(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES).toContain("application/pdf");
    });
  });

  describe("QUIZ", () => {
    it("should have min and max questions", () => {
      expect(QUIZ.MIN_QUESTIONS).toBe(1);
      expect(QUIZ.MAX_QUESTIONS).toBe(100);
    });

    it("should have min and max options", () => {
      expect(QUIZ.MIN_OPTIONS).toBe(2);
      expect(QUIZ.MAX_OPTIONS).toBe(6);
    });

    it("should have auto-save interval of 30 seconds", () => {
      expect(QUIZ.AUTO_SAVE_INTERVAL).toBe(30000);
    });
  });

  describe("STORAGE_KEYS", () => {
    it("should have all required storage keys", () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe("auth_token");
      expect(STORAGE_KEYS.USER).toBe("user_data");
      expect(STORAGE_KEYS.THEME).toBe("theme");
      expect(STORAGE_KEYS.OFFLINE_DATA).toBe("offline_data");
    });
  });

  describe("ROLES", () => {
    it("should have all user roles", () => {
      expect(ROLES.ADMIN).toBe("admin");
      expect(ROLES.DOSEN).toBe("dosen");
      expect(ROLES.LABORAN).toBe("laboran");
      expect(ROLES.MAHASISWA).toBe("mahasiswa");
    });
  });

  describe("HTTP_STATUS", () => {
    it("should have common status codes", () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    });
  });

  describe("QUIZ_STATUS", () => {
    it("should have correct status values", () => {
      expect(QUIZ_STATUS.DRAFT).toBe("draft");
      expect(QUIZ_STATUS.PUBLISHED).toBe("published");
      expect(QUIZ_STATUS.ARCHIVED).toBe("archived");
    });
  });

  describe("ATTEMPT_STATUS", () => {
    it("should have correct status values", () => {
      expect(ATTEMPT_STATUS.IN_PROGRESS).toBe("in_progress");
      expect(ATTEMPT_STATUS.SUBMITTED).toBe("submitted");
      expect(ATTEMPT_STATUS.GRADED).toBe("graded");
      expect(ATTEMPT_STATUS.PENDING_SYNC).toBe("pending_sync");
    });
  });

  describe("QUESTION_TYPE", () => {
    it("should have all question types", () => {
      expect(QUESTION_TYPE.MULTIPLE_CHOICE).toBe("multiple_choice");
      expect(QUESTION_TYPE.TRUE_FALSE).toBe("true_false");
      expect(QUESTION_TYPE.ESSAY).toBe("essay");
      expect(QUESTION_TYPE.SHORT_ANSWER).toBe("short_answer");
    });
  });

  describe("ATTENDANCE_STATUS", () => {
    it("should have all attendance status values", () => {
      expect(ATTENDANCE_STATUS.HADIR).toBe("hadir");
      expect(ATTENDANCE_STATUS.IZIN).toBe("izin");
      expect(ATTENDANCE_STATUS.SAKIT).toBe("sakit");
      expect(ATTENDANCE_STATUS.ALPHA).toBe("alpha");
    });
  });

  describe("NILAI_HURUF", () => {
    it("should have all grade values", () => {
      expect(NILAI_HURUF.A).toBe("A");
      expect(NILAI_HURUF.B).toBe("B");
      expect(NILAI_HURUF.C).toBe("C");
      expect(NILAI_HURUF.D).toBe("D");
      expect(NILAI_HURUF.E).toBe("E");
    });
  });

  describe("SEMESTER", () => {
    it("should have semester values 1-8", () => {
      expect(SEMESTER.S1).toBe(1);
      expect(SEMESTER.S8).toBe(8);
    });
  });

  // Helper Functions Tests
  describe("isQuizAvailable", () => {
    it("should return false if quiz is not published", () => {
      const start = new Date();
      start.setDate(start.getDate() - 10);
      const end = new Date();
      end.setDate(end.getDate() + 10);

      expect(isQuizAvailable("draft", start, end)).toBe(false);
    });

    it("should return false if quiz is archived", () => {
      const start = new Date();
      start.setDate(start.getDate() - 10);
      const end = new Date();
      end.setDate(end.getDate() + 10);

      expect(isQuizAvailable("archived", start, end)).toBe(false);
    });

    it("should return true if quiz is published and within date range", () => {
      const start = new Date();
      start.setMinutes(start.getMinutes() - 10);
      const end = new Date();
      end.setMinutes(end.getMinutes() + 10);

      expect(isQuizAvailable("published", start, end)).toBe(true);
    });

    it("should return false if quiz is not started yet", () => {
      const start = new Date();
      start.setMinutes(start.getMinutes() + 10);
      const end = new Date();
      end.setMinutes(end.getMinutes() + 20);

      expect(isQuizAvailable("published", start, end)).toBe(false);
    });

    it("should return false if quiz has ended", () => {
      const start = new Date();
      start.setMinutes(start.getMinutes() - 20);
      const end = new Date();
      end.setMinutes(end.getMinutes() - 10);

      expect(isQuizAvailable("published", start, end)).toBe(false);
    });
  });

  describe("isAttemptEditable", () => {
    it("should return true if status is in_progress", () => {
      expect(isAttemptEditable("in_progress")).toBe(true);
    });

    it("should return false if status is submitted", () => {
      expect(isAttemptEditable("submitted")).toBe(false);
    });

    it("should return false if status is graded", () => {
      expect(isAttemptEditable("graded")).toBe(false);
    });

    it("should return false if status is pending_sync", () => {
      expect(isAttemptEditable("pending_sync")).toBe(false);
    });
  });

  describe("isBarangAvailable", () => {
    it("should return true if kondisi is baik", () => {
      expect(isBarangAvailable("baik")).toBe(true);
    });

    it("should return true if kondisi is rusak_ringan", () => {
      expect(isBarangAvailable("rusak_ringan")).toBe(true);
    });

    it("should return false if kondisi is rusak_berat", () => {
      expect(isBarangAvailable("rusak_berat")).toBe(false);
    });

    it("should return false if kondisi is maintenance", () => {
      expect(isBarangAvailable("maintenance")).toBe(false);
    });
  });

  describe("getNilaiHuruf", () => {
    it("should return A for score >= 80", () => {
      expect(getNilaiHuruf(80)).toBe("A");
      expect(getNilaiHuruf(90)).toBe("A");
      expect(getNilaiHuruf(100)).toBe("A");
    });

    it("should return B for score >= 70", () => {
      expect(getNilaiHuruf(70)).toBe("B");
      expect(getNilaiHuruf(79)).toBe("B");
    });

    it("should return C for score >= 60", () => {
      expect(getNilaiHuruf(60)).toBe("C");
      expect(getNilaiHuruf(69)).toBe("C");
    });

    it("should return D for score >= 50", () => {
      expect(getNilaiHuruf(50)).toBe("D");
      expect(getNilaiHuruf(59)).toBe("D");
    });

    it("should return E for score < 50", () => {
      expect(getNilaiHuruf(0)).toBe("E");
      expect(getNilaiHuruf(49)).toBe("E");
    });

    it("should handle edge case of exactly 80", () => {
      expect(getNilaiHuruf(80)).toBe("A");
    });

    it("should handle edge case of exactly 70", () => {
      expect(getNilaiHuruf(70)).toBe("B");
    });

    it("should handle edge case of exactly 60", () => {
      expect(getNilaiHuruf(60)).toBe("C");
    });

    it("should handle edge case of exactly 50", () => {
      expect(getNilaiHuruf(50)).toBe("D");
    });
  });

  // Type exports should be available
  describe("Type exports", () => {
    it("should export QuizStatus type", () => {
      const status: QuizStatus = "draft";
      expect(status).toBeDefined();
    });

    it("should export AttemptStatus type", () => {
      const status: AttemptStatus = "in_progress";
      expect(status).toBeDefined();
    });

    it("should export QuestionType type", () => {
      const type: QuestionType = "multiple_choice";
      expect(type).toBeDefined();
    });

    it("should export PeminjamanStatus type", () => {
      const status: PeminjamanStatus = "pending";
      expect(status).toBeDefined();
    });

    it("should export KondisiBarang type", () => {
      const kondisi: KondisiBarang = "baik";
      expect(kondisi).toBeDefined();
    });

    it("should export AttendanceStatus type", () => {
      const status: AttendanceStatus = "hadir";
      expect(status).toBeDefined();
    });

    it("should export SyncStatus type", () => {
      const status: SyncStatus = "pending";
      expect(status).toBeDefined();
    });

    it("should export NilaiHuruf type", () => {
      const grade: NilaiHuruf = "A";
      expect(grade).toBeDefined();
    });

    it("should export Semester type", () => {
      const semester: Semester = 1;
      expect(semester).toBeDefined();
    });
  });
});
