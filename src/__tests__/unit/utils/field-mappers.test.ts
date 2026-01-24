/**
 * Tests for field-mappers.ts
 */

import { describe, it, expect } from "vitest";
import {
  mapSoalToDatabase,
  mapSoalFromDatabase,
  mapSoalArrayFromDatabase,
  mapFieldsToDatabase,
  mapFieldsFromDatabase,
} from "@/lib/utils/field-mappers";
import type { Soal } from "@/types/kuis.types";

describe("field-mappers", () => {
  describe("mapSoalToDatabase", () => {
    it("should map Soal type to database format", () => {
      const soalData: Partial<Soal> = {
        id: "soal-1",
        kuis_id: "kuis-1",
        pertanyaan: "Apa ibukota Indonesia?",
        tipe_soal: "multiple_choice" as any,
        opsi_jawaban: ["Jakarta", "Bandung", "Surabaya"] as any,
        jawaban_benar: "Jakarta",
        penjelasan: "Jakarta adalah ibukota",
        poin: 10,
        urutan: 1,
      };

      const result = mapSoalToDatabase(soalData);

      expect(result).toEqual({
        id: "soal-1",
        kuis_id: "kuis-1",
        pertanyaan: "Apa ibukota Indonesia?",
        tipe: "multiple_choice", // tipe_soal -> tipe
        pilihan_jawaban: ["Jakarta", "Bandung", "Surabaya"], // opsi_jawaban -> pilihan_jawaban
        jawaban_benar: "Jakarta",
        pembahasan: "Jakarta adalah ibukota", // penjelasan -> pembahasan
        poin: 10,
        urutan: 1,
      });
    });

    it("should handle partial data", () => {
      const soalData: Partial<Soal> = {
        pertanyaan: "Test question",
      };

      const result = mapSoalToDatabase(soalData);

      expect(result).toEqual({
        pertanyaan: "Test question",
      });
    });

    it("should handle undefined optional fields", () => {
      const soalData: Partial<Soal> = {
        id: "soal-1",
        pertanyaan: "Test",
      };

      const result = mapSoalToDatabase(soalData);

      expect(result.id).toBe("soal-1");
      expect(result.pertanyaan).toBe("Test");
      expect(result.tipe).toBeUndefined();
      expect(result.pilihan_jawaban).toBeUndefined();
    });
  });

  describe("mapSoalFromDatabase", () => {
    it("should map database format to Soal type", () => {
      const dbData = {
        id: "soal-1",
        kuis_id: "kuis-1",
        pertanyaan: "Apa ibukota Indonesia?",
        tipe: "multiple_choice" as any,
        pilihan_jawaban: ["Jakarta", "Bandung", "Surabaya"] as any,
        jawaban_benar: "Jakarta",
        pembahasan: "Jakarta adalah ibukota",
        poin: 10,
        urutan: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      const result = mapSoalFromDatabase(dbData);

      expect(result).toEqual({
        id: "soal-1",
        kuis_id: "kuis-1",
        pertanyaan: "Apa ibukota Indonesia?",
        tipe_soal: "multiple_choice", // tipe -> tipe_soal
        opsi_jawaban: ["Jakarta", "Bandung", "Surabaya"], // pilihan_jawaban -> opsi_jawaban
        jawaban_benar: "Jakarta",
        penjelasan: "Jakarta adalah ibukota", // pembahasan -> penjelasan
        poin: 10,
        urutan: 1,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      });
    });

    it("should handle partial database data", () => {
      const dbData = {
        pertanyaan: "Test question",
      };

      const result = mapSoalFromDatabase(dbData);

      expect(result.pertanyaan).toBe("Test question");
      expect(result.tipe_soal).toBeUndefined();
      expect(result.opsi_jawaban).toBeUndefined();
    });
  });

  describe("mapSoalArrayFromDatabase", () => {
    it("should map array of database records to Soal array", () => {
      const dbDataArray = [
        {
          id: "soal-1",
          pertanyaan: "Question 1",
          tipe: "essay",
          poin: 5,
        },
        {
          id: "soal-2",
          pertanyaan: "Question 2",
          tipe: "multiple_choice",
          pilihan_jawaban: ["A", "B"],
          poin: 10,
        },
      ];

      const result = mapSoalArrayFromDatabase(dbDataArray);

      expect(result).toHaveLength(2);
      expect(result[0].tipe_soal).toBe("essay");
      expect(result[1].tipe_soal).toBe("multiple_choice");
      expect(result[1].opsi_jawaban).toEqual(["A", "B"]);
    });

    it("should handle empty array", () => {
      const result = mapSoalArrayFromDatabase([]);

      expect(result).toEqual([]);
    });
  });

  describe("mapFieldsToDatabase", () => {
    it("should map type fields to database fields", () => {
      const data = {
        opsi_jawaban: ["A", "B"] as any,
        penjelasan: "Explanation",
        tipe_soal: "essay" as any,
        normal_field: "value",
      };

      const result = mapFieldsToDatabase(data);

      expect(result).toEqual({
        pilihan_jawaban: ["A", "B"], // opsi_jawaban -> pilihan_jawaban
        pembahasan: "Explanation", // penjelasan -> pembahasan
        tipe: "essay", // tipe_soal -> tipe
        normal_field: "value", // unchanged
      });
    });

    it("should handle unknown fields", () => {
      const data = {
        unknown_field: "value",
        another_field: 123,
      };

      const result = mapFieldsToDatabase(data);

      expect(result).toEqual({
        unknown_field: "value",
        another_field: 123,
      });
    });

    it("should handle empty object", () => {
      const result = mapFieldsToDatabase({});

      expect(result).toEqual({});
    });
  });

  describe("mapFieldsFromDatabase", () => {
    it("should map database fields to type fields", () => {
      const data = {
        pilihan_jawaban: ["A", "B"] as any,
        pembahasan: "Explanation",
        tipe: "essay" as any,
        normal_field: "value",
      };

      const result = mapFieldsFromDatabase(data);

      expect(result).toEqual({
        opsi_jawaban: ["A", "B"], // pilihan_jawaban -> opsi_jawaban
        penjelasan: "Explanation", // pembahasan -> penjelasan
        tipe_soal: "essay", // tipe -> tipe_soal
        normal_field: "value", // unchanged
      });
    });

    it("should handle unknown fields", () => {
      const data = {
        unknown_field: "value",
        another_field: 123,
      };

      const result = mapFieldsFromDatabase(data);

      expect(result).toEqual({
        unknown_field: "value",
        another_field: 123,
      });
    });

    it("should handle empty object", () => {
      const result = mapFieldsFromDatabase({});

      expect(result).toEqual({});
    });

    it("should handle bidirectional mapping consistency", () => {
      const originalData = {
        opsi_jawaban: ["A", "B"] as any,
        penjelasan: "Test",
        tipe_soal: "essay" as any,
      };

      const dbFormat = mapFieldsToDatabase(originalData);
      const backToType = mapFieldsFromDatabase(dbFormat);

      expect(backToType).toEqual(originalData);
    });
  });
});
