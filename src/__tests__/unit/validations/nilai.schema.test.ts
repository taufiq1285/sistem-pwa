/**
 * Nilai Schema Validation Tests
 *
 * Tests for grade validation including:
 * - Grade value validation (0-100)
 * - Bobot nilai validation (must total 100%)
 * - Grade calculation formulas
 * - Letter grade conversion
 * - Pass/fail status determination
 */

import { describe, it, expect } from 'vitest';
import {
  nilaiFormSchema,
  batchNilaiSchema,
  nilaiFilterSchema,
  bobotNilaiSchema,
  calculateNilaiAkhir,
  getDefaultBobotNilai,
  validateBobotNilai,
  getNilaiHuruf,
  getGradeStatus,
} from '../../../lib/validations/nilai.schema';

describe('Nilai Schema Validation', () => {
  describe('nilaiFormSchema - Valid Cases', () => {
    it('should accept valid nilai data with all fields', () => {
      const validData = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: 85,
        nilai_tugas: 90,
        nilai_uts: 88,
        nilai_uas: 92,
        nilai_praktikum: 95,
        nilai_kehadiran: 100,
        keterangan: 'Excellent performance',
      };

      const result = nilaiFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept nilai with minimum values (0)', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: 0,
        nilai_tugas: 0,
        nilai_uts: 0,
        nilai_uas: 0,
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept nilai with maximum values (100)', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: 100,
        nilai_tugas: 100,
        nilai_uts: 100,
        nilai_uas: 100,
        nilai_praktikum: 100,
        nilai_kehadiran: 100,
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept optional grade fields as null', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: null,
        nilai_tugas: null,
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept missing optional grade fields', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept string numbers and transform them', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: '85',
        nilai_tugas: '90.5',
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty keterangan', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        keterangan: '',
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('nilaiFormSchema - Invalid Cases', () => {
    it('should reject invalid mahasiswa_id UUID', () => {
      const data = {
        mahasiswa_id: 'invalid-uuid',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('tidak valid');
      }
    });

    it('should reject invalid kelas_id UUID', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: 'not-a-uuid',
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject keterangan longer than 500 characters', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        keterangan: 'A'.repeat(501),
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle out of range grades (clamp to 0-100)', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: -10,
      };

      const result = nilaiFormSchema.safeParse(data);
      // Should fail validation for negative numbers
      expect(result.success).toBe(false);
    });

    it('should reject grade value above 100', () => {
      const data = {
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_kuis: 150,
      };

      const result = nilaiFormSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('batchNilaiSchema', () => {
    it('should accept valid batch update', () => {
      const data = {
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_list: [
          {
            mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
            nilai_kuis: 85,
            nilai_tugas: 90,
          },
          {
            mahasiswa_id: '123e4567-e89b-12d3-a456-426614174002',
            nilai_kuis: 75,
            nilai_tugas: 80,
          },
        ],
      };

      const result = batchNilaiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty nilai_list', () => {
      const data = {
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_list: [],
      };

      const result = batchNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Minimal harus ada satu mahasiswa');
      }
    });

    it('should reject invalid mahasiswa_id in list', () => {
      const data = {
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        nilai_list: [
          {
            mahasiswa_id: 'invalid',
            nilai_kuis: 85,
          },
        ],
      };

      const result = batchNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('nilaiFilterSchema', () => {
    it('should accept valid filters', () => {
      const data = {
        kelas_id: '123e4567-e89b-12d3-a456-426614174001',
        mahasiswa_id: '123e4567-e89b-12d3-a456-426614174000',
        min_nilai: 60,
        max_nilai: 100,
      };

      const result = nilaiFilterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty filters', () => {
      const result = nilaiFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should reject min_nilai below 0', () => {
      const data = {
        min_nilai: -10,
      };

      const result = nilaiFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject max_nilai above 100', () => {
      const data = {
        max_nilai: 150,
      };

      const result = nilaiFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('bobotNilaiSchema - Valid Cases', () => {
    it('should accept valid bobot that totals 100%', () => {
      const data = {
        kuis: 15,
        tugas: 20,
        uts: 25,
        uas: 30,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept custom bobot that totals 100%', () => {
      const data = {
        kuis: 10,
        tugas: 10,
        uts: 30,
        uas: 40,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept equal distribution (16.67% each, rounded)', () => {
      const data = {
        kuis: 17,
        tugas: 17,
        uts: 17,
        uas: 17,
        praktikum: 16,
        kehadiran: 16,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('bobotNilaiSchema - Invalid Cases', () => {
    it('should reject bobot that totals less than 100%', () => {
      const data = {
        kuis: 10,
        tugas: 10,
        uts: 20,
        uas: 20,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total bobot nilai harus 100%');
      }
    });

    it('should reject bobot that totals more than 100%', () => {
      const data = {
        kuis: 20,
        tugas: 25,
        uts: 25,
        uas: 30,
        praktikum: 10,
        kehadiran: 10,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Total bobot nilai harus 100%');
      }
    });

    it('should reject individual bobot above 100%', () => {
      const data = {
        kuis: 150,
        tugas: -20,
        uts: -10,
        uas: -10,
        praktikum: -5,
        kehadiran: -5,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative bobot values', () => {
      const data = {
        kuis: -5,
        tugas: 20,
        uts: 25,
        uas: 30,
        praktikum: 15,
        kehadiran: 15,
      };

      const result = bobotNilaiSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Grade Calculation - calculateNilaiAkhir', () => {
    it('should calculate final grade with default weights', () => {
      // Default: kuis 15%, tugas 20%, uts 25%, uas 30%, praktikum 5%, kehadiran 5%
      const result = calculateNilaiAkhir(
        80, // kuis: 80 * 0.15 = 12
        85, // tugas: 85 * 0.20 = 17
        90, // uts: 90 * 0.25 = 22.5
        95, // uas: 95 * 0.30 = 28.5
        100, // praktikum: 100 * 0.05 = 5
        100  // kehadiran: 100 * 0.05 = 5
      );
      // Total = 12 + 17 + 22.5 + 28.5 + 5 + 5 = 90

      expect(result).toBe(90);
    });

    it('should calculate final grade with all zeros', () => {
      const result = calculateNilaiAkhir(0, 0, 0, 0, 0, 0);
      expect(result).toBe(0);
    });

    it('should calculate final grade with all 100s', () => {
      const result = calculateNilaiAkhir(100, 100, 100, 100, 100, 100);
      expect(result).toBe(100);
    });

    it('should calculate final grade with custom weights', () => {
      const customWeights = {
        kuis: 10,
        tugas: 10,
        uts: 30,
        uas: 40,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = calculateNilaiAkhir(
        80,  // kuis: 80 * 0.10 = 8
        80,  // tugas: 80 * 0.10 = 8
        80,  // uts: 80 * 0.30 = 24
        80,  // uas: 80 * 0.40 = 32
        80,  // praktikum: 80 * 0.05 = 4
        80,  // kehadiran: 80 * 0.05 = 4
        customWeights
      );
      // Total = 8 + 8 + 24 + 32 + 4 + 4 = 80

      expect(result).toBe(80);
    });

    it('should round result to 2 decimal places', () => {
      const result = calculateNilaiAkhir(
        83.33, // kuis: 83.33 * 0.15 = 12.4995
        88.88, // tugas: 88.88 * 0.20 = 17.776
        91.11, // uts: 91.11 * 0.25 = 22.7775
        95.55, // uas: 95.55 * 0.30 = 28.665
        97.77, // praktikum: 97.77 * 0.05 = 4.8885
        99.99  // kehadiran: 99.99 * 0.05 = 4.9995
      );
      // Total = 12.4995 + 17.776 + 22.7775 + 28.665 + 4.8885 + 4.9995 = 91.6065
      // Rounded to 2 decimal places = 91.61

      expect(result).toBeCloseTo(91.61, 2);
    });

    it('should use default values when parameters are undefined', () => {
      const result = calculateNilaiAkhir();
      expect(result).toBe(0);
    });

    it('should handle null customWeights', () => {
      const result = calculateNilaiAkhir(80, 85, 90, 95, 100, 100, null);
      expect(result).toBe(90);
    });

    it('should calculate realistic passing grade (60)', () => {
      const result = calculateNilaiAkhir(
        60, // kuis: 60 * 0.15 = 9
        60, // tugas: 60 * 0.20 = 12
        60, // uts: 60 * 0.25 = 15
        60, // uas: 60 * 0.30 = 18
        60, // praktikum: 60 * 0.05 = 3
        60  // kehadiran: 60 * 0.05 = 3
      );
      // Total = 60

      expect(result).toBe(60);
    });
  });

  describe('Default Bobot - getDefaultBobotNilai', () => {
    it('should return correct default weights', () => {
      const defaults = getDefaultBobotNilai();

      expect(defaults).toEqual({
        kuis: 15,
        tugas: 20,
        uts: 25,
        uas: 30,
        praktikum: 5,
        kehadiran: 5,
      });
    });

    it('should total to 100%', () => {
      const defaults = getDefaultBobotNilai();
      const total = defaults.kuis + defaults.tugas + defaults.uts +
                    defaults.uas + defaults.praktikum + defaults.kehadiran;

      expect(total).toBe(100);
    });
  });

  describe('Validate Bobot - validateBobotNilai', () => {
    it('should validate correct bobot (100%)', () => {
      const bobot = {
        kuis: 15,
        tugas: 20,
        uts: 25,
        uas: 30,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = validateBobotNilai(bobot);

      expect(result.valid).toBe(true);
      expect(result.total).toBe(100);
    });

    it('should invalidate bobot less than 100%', () => {
      const bobot = {
        kuis: 10,
        tugas: 10,
        uts: 20,
        uas: 20,
        praktikum: 5,
        kehadiran: 5,
      };

      const result = validateBobotNilai(bobot);

      expect(result.valid).toBe(false);
      expect(result.total).toBe(70);
    });

    it('should invalidate bobot more than 100%', () => {
      const bobot = {
        kuis: 20,
        tugas: 25,
        uts: 30,
        uas: 35,
        praktikum: 10,
        kehadiran: 10,
      };

      const result = validateBobotNilai(bobot);

      expect(result.valid).toBe(false);
      expect(result.total).toBe(130);
    });
  });

  describe('Letter Grade - getNilaiHuruf', () => {
    it('should return A for 85+', () => {
      expect(getNilaiHuruf(85)).toBe('A');
      expect(getNilaiHuruf(90)).toBe('A');
      expect(getNilaiHuruf(95)).toBe('A');
      expect(getNilaiHuruf(100)).toBe('A');
    });

    it('should return A- for 80-84', () => {
      expect(getNilaiHuruf(80)).toBe('A-');
      expect(getNilaiHuruf(82)).toBe('A-');
      expect(getNilaiHuruf(84)).toBe('A-');
      expect(getNilaiHuruf(84.99)).toBe('A-');
    });

    it('should return B+ for 75-79', () => {
      expect(getNilaiHuruf(75)).toBe('B+');
      expect(getNilaiHuruf(77)).toBe('B+');
      expect(getNilaiHuruf(79)).toBe('B+');
    });

    it('should return B for 70-74', () => {
      expect(getNilaiHuruf(70)).toBe('B');
      expect(getNilaiHuruf(72)).toBe('B');
      expect(getNilaiHuruf(74)).toBe('B');
    });

    it('should return B- for 65-69', () => {
      expect(getNilaiHuruf(65)).toBe('B-');
      expect(getNilaiHuruf(67)).toBe('B-');
      expect(getNilaiHuruf(69)).toBe('B-');
    });

    it('should return C+ for 60-64', () => {
      expect(getNilaiHuruf(60)).toBe('C+');
      expect(getNilaiHuruf(62)).toBe('C+');
      expect(getNilaiHuruf(64)).toBe('C+');
    });

    it('should return C for 55-59', () => {
      expect(getNilaiHuruf(55)).toBe('C');
      expect(getNilaiHuruf(57)).toBe('C');
      expect(getNilaiHuruf(59)).toBe('C');
    });

    it('should return C- for 50-54', () => {
      expect(getNilaiHuruf(50)).toBe('C-');
      expect(getNilaiHuruf(52)).toBe('C-');
      expect(getNilaiHuruf(54)).toBe('C-');
    });

    it('should return D for 40-49', () => {
      expect(getNilaiHuruf(40)).toBe('D');
      expect(getNilaiHuruf(45)).toBe('D');
      expect(getNilaiHuruf(49)).toBe('D');
    });

    it('should return E for below 40', () => {
      expect(getNilaiHuruf(0)).toBe('E');
      expect(getNilaiHuruf(20)).toBe('E');
      expect(getNilaiHuruf(39)).toBe('E');
    });

    it('should handle boundary cases correctly', () => {
      expect(getNilaiHuruf(84.99)).toBe('A-');
      expect(getNilaiHuruf(85.00)).toBe('A');
      expect(getNilaiHuruf(59.99)).toBe('C');
      expect(getNilaiHuruf(60.00)).toBe('C+');
    });
  });

  describe('Grade Status - getGradeStatus', () => {
    it('should return Lulus for passing grade (60+)', () => {
      const result = getGradeStatus(60);

      expect(result.status).toBe('Lulus');
      expect(result.color).toBe('green');
    });

    it('should return Lulus for grades above passing grade', () => {
      expect(getGradeStatus(75).status).toBe('Lulus');
      expect(getGradeStatus(90).status).toBe('Lulus');
      expect(getGradeStatus(100).status).toBe('Lulus');
    });

    it('should return Tidak Lulus for failing grade', () => {
      const result = getGradeStatus(59);

      expect(result.status).toBe('Tidak Lulus');
      expect(result.color).toBe('red');
    });

    it('should return Tidak Lulus for very low grades', () => {
      expect(getGradeStatus(0).status).toBe('Tidak Lulus');
      expect(getGradeStatus(30).status).toBe('Tidak Lulus');
      expect(getGradeStatus(50).status).toBe('Tidak Lulus');
    });

    it('should accept custom passing grade', () => {
      const result70 = getGradeStatus(69, 70);
      expect(result70.status).toBe('Tidak Lulus');

      const result70Pass = getGradeStatus(70, 70);
      expect(result70Pass.status).toBe('Lulus');
    });

    it('should handle boundary cases with custom passing grade', () => {
      expect(getGradeStatus(59.99, 60).status).toBe('Tidak Lulus');
      expect(getGradeStatus(60.00, 60).status).toBe('Lulus');
      expect(getGradeStatus(69.99, 70).status).toBe('Tidak Lulus');
      expect(getGradeStatus(70.00, 70).status).toBe('Lulus');
    });

    it('should use default passing grade of 60 when not specified', () => {
      expect(getGradeStatus(59.99).status).toBe('Tidak Lulus');
      expect(getGradeStatus(60.00).status).toBe('Lulus');
    });
  });
});
