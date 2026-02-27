import { describe, expect, it } from "vitest";

import {
  attemptKuisRule,
  conflictRules,
  getRuleForEntity,
  hasConflictRule,
  jawabanRule,
  kehadiranRule,
  kuisRule,
  materiRule,
  nilaiRule,
  soalRule,
} from "@/lib/offline/conflict-rules.config";

describe("conflict-rules.config", () => {
  it("exports rules in the expected priority order", () => {
    expect(conflictRules.map((rule) => rule.entity)).toEqual([
      "attempt_kuis",
      "jawaban",
      "kehadiran",
      "nilai",
      "materi",
      "soal",
      "kuis",
    ]);
  });

  it("gets a rule for a known entity and reports missing ones", () => {
    expect(getRuleForEntity("attempt_kuis")).toBe(attemptKuisRule);
    expect(getRuleForEntity("unknown_entity")).toBeUndefined();

    expect(hasConflictRule("jawaban")).toBe(true);
    expect(hasConflictRule("missing_rule")).toBe(false);
  });

  it("defines protected and server-authoritative fields for each rule", () => {
    expect(attemptKuisRule.protectedFields).toContain("mahasiswa_id");
    expect(attemptKuisRule.serverAuthoritativeFields).toContain("total_score");

    expect(jawabanRule.protectedFields).toContain("jawaban_mahasiswa");
    expect(jawabanRule.serverAuthoritativeFields).toContain("graded_at");

    expect(nilaiRule.protectedFields).toContain("kelas_id");
    expect(nilaiRule.serverAuthoritativeFields).toContain("nilai_huruf");

    expect(kehadiranRule.protectedFields).toContain("waktu_check_in");
    expect(kehadiranRule.serverAuthoritativeFields).toContain("status");

    expect(materiRule.protectedFields).toContain("dosen_id");
    expect(materiRule.serverAuthoritativeFields).toContain("cache_version");

    expect(soalRule.protectedFields).toContain("kuis_id");
    expect(soalRule.serverAuthoritativeFields).toContain("jawaban_benar");

    expect(kuisRule.protectedFields).toContain("kelas_id");
    expect(kuisRule.serverAuthoritativeFields).toContain("published_at");
  });

  it("validates attempt_kuis conflicts correctly", () => {
    expect(
      attemptKuisRule.validator?.(
        {
          status: "submitted",
          submitted_at: "2026-02-27T10:00:00Z",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
        {
          status: "submitted",
          submitted_at: "2026-02-27T10:05:00Z",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
      ),
    ).toBe("Duplicate submission detected - needs manual review");

    expect(
      attemptKuisRule.validator?.(
        {
          status: "draft",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
        {
          status: "draft",
          mahasiswa_id: "mhs-2",
          kuis_id: "kuis-1",
        },
      ),
    ).toBe("Student ID mismatch - data corruption?");

    expect(
      attemptKuisRule.validator?.(
        {
          status: "draft",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
        {
          status: "draft",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-2",
        },
      ),
    ).toBe("Quiz ID mismatch - data corruption?");

    expect(
      attemptKuisRule.validator?.(
        {
          status: "draft",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
        {
          status: "submitted",
          mahasiswa_id: "mhs-1",
          kuis_id: "kuis-1",
        },
      ),
    ).toBeNull();
  });

  it("validates jawaban conflicts correctly", () => {
    expect(
      jawabanRule.validator?.(
        {
          jawaban_mahasiswa: "A",
          soal_id: "soal-1",
        },
        {
          jawaban_mahasiswa: "B",
          soal_id: "soal-1",
          graded_at: "2026-02-27T10:00:00Z",
        },
      ),
    ).toBe("Cannot modify answer after grading");

    expect(
      jawabanRule.validator?.(
        {
          jawaban_mahasiswa: "A",
          soal_id: "soal-1",
        },
        {
          jawaban_mahasiswa: "A",
          soal_id: "soal-2",
        },
      ),
    ).toBe("Question ID mismatch - data corruption?");

    expect(
      jawabanRule.validator?.(
        {
          jawaban_mahasiswa: "A",
          soal_id: "soal-1",
        },
        {
          jawaban_mahasiswa: "A",
          soal_id: "soal-1",
        },
      ),
    ).toBeNull();
  });

  it("validates nilai conflicts correctly", () => {
    expect(
      nilaiRule.validator?.(
        {
          nilai_akhir: 90,
          mahasiswa_id: "mhs-1",
        },
        {
          nilai_akhir: 60,
          mahasiswa_id: "mhs-1",
        },
      ),
    ).toBe("Large grade difference detected: 30 points");

    expect(
      nilaiRule.validator?.(
        {
          nilai_akhir: 80,
          mahasiswa_id: "mhs-1",
        },
        {
          nilai_akhir: 75,
          mahasiswa_id: "mhs-2",
        },
      ),
    ).toBe("Student ID mismatch");

    expect(
      nilaiRule.validator?.(
        {
          nilai_akhir: 80,
          mahasiswa_id: "mhs-1",
        },
        {
          nilai_akhir: 75,
          mahasiswa_id: "mhs-1",
        },
      ),
    ).toBeNull();
  });

  it("validates kehadiran and materi conflicts correctly", () => {
    expect(
      kehadiranRule.validator?.(
        {
          mahasiswa_id: "mhs-1",
          jadwal_id: "jadwal-1",
        },
        {
          mahasiswa_id: "mhs-2",
          jadwal_id: "jadwal-1",
        },
      ),
    ).toBe("Student ID mismatch");

    expect(
      kehadiranRule.validator?.(
        {
          mahasiswa_id: "mhs-1",
          jadwal_id: "jadwal-1",
        },
        {
          mahasiswa_id: "mhs-1",
          jadwal_id: "jadwal-2",
        },
      ),
    ).toBe("Schedule ID mismatch");

    expect(
      kehadiranRule.validator?.(
        {
          mahasiswa_id: "mhs-1",
          jadwal_id: "jadwal-1",
        },
        {
          mahasiswa_id: "mhs-1",
          jadwal_id: "jadwal-1",
        },
      ),
    ).toBeNull();

    expect(
      materiRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
        },
        {
          dosen_id: "dsn-2",
          kelas_id: "kelas-1",
        },
      ),
    ).toBe("Teacher ID mismatch");

    expect(
      materiRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
        },
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-2",
        },
      ),
    ).toBe("Class ID mismatch");

    expect(
      materiRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
        },
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
        },
      ),
    ).toBeNull();
  });

  it("validates soal and kuis conflicts correctly", () => {
    expect(
      soalRule.validator?.(
        {
          kuis_id: "kuis-1",
        },
        {
          kuis_id: "kuis-2",
        },
      ),
    ).toBe("Quiz ID mismatch");

    expect(
      soalRule.validator?.(
        {
          kuis_id: "kuis-1",
        },
        {
          kuis_id: "kuis-1",
        },
      ),
    ).toBeNull();

    expect(
      kuisRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "draft",
        },
        {
          dosen_id: "dsn-2",
          kelas_id: "kelas-1",
          status: "draft",
        },
      ),
    ).toBe("Teacher ID mismatch");

    expect(
      kuisRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "draft",
        },
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-2",
          status: "draft",
        },
      ),
    ).toBe("Class ID mismatch");

    expect(
      kuisRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "draft",
        },
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "published",
        },
      ),
    ).toBe("Cannot unpublish quiz");

    expect(
      kuisRule.validator?.(
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "published",
        },
        {
          dosen_id: "dsn-1",
          kelas_id: "kelas-1",
          status: "published",
        },
      ),
    ).toBeNull();
  });
});
