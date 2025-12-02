/**
 * Jadwal Schema Validation Tests
 *
 * Tests for schedule validation including:
 * - Time format validation
 * - Duration validation (min 30 minutes)
 * - Date validation (not in past)
 * - Conflict checking
 * - Time overlap detection
 */

import { describe, it, expect } from 'vitest';
import {
  jadwalSchema,
  createJadwalSchema,
  updateJadwalSchema,
  jadwalFilterSchema,
  jadwalConflictCheckSchema,
  isTimeOverlap,
  timeToMinutes,
  calculateDuration,
  parseCreateJadwalForm,
  safeParseCreateJadwal,
} from '../../../lib/validations/Jadwal.schema ';

describe('Jadwal Schema Validation', () => {
  describe('jadwalSchema - Valid Cases', () => {
    it('should accept valid jadwal data', () => {
      const validData = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        topik: 'Praktikum ANC: Pemeriksaan Leopold I-IV',
        catatan: 'Bawa alat peraga',
        is_active: true,
      };

      const result = jadwalSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept kelas with uppercase letters and numbers', () => {
      const data = {
        kelas: 'A-1',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept minimum duration of 30 minutes', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '08:30',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept topik with minimum 10 characters', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        topik: '1234567890', // Exactly 10 chars
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty topik', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        topik: '',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('jadwalSchema - Invalid Cases', () => {
    it('should reject kelas with lowercase letters', () => {
      const data = {
        kelas: 'a',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('huruf kapital');
      }
    });

    it('should reject kelas longer than 10 characters', () => {
      const data = {
        kelas: 'ABCDEFGHIJK',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID for laboratorium_id', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: 'invalid-uuid',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01');
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: pastDate,
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('masa lalu');
      }
    });

    it('should reject invalid time format', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '25:00', // Invalid hour
        jam_selesai: '10:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('HH:MM');
      }
    });

    it('should reject when jam_selesai <= jam_mulai', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '10:00',
        jam_selesai: '08:00',
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lebih besar');
      }
    });

    it('should reject duration less than 30 minutes', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '08:29', // Only 29 minutes
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimal 30 menit');
      }
    });

    it('should reject topik less than 10 characters when provided', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        topik: 'Short', // Only 5 chars
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('minimal 10 karakter');
      }
    });

    it('should reject topik longer than 200 characters', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        topik: 'A'.repeat(201),
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject catatan longer than 500 characters', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        catatan: 'A'.repeat(501),
      };

      const result = jadwalSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateJadwalSchema', () => {
    it('should accept partial updates', () => {
      const data = {
        kelas: 'B',
      };

      const result = updateJadwalSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty update', () => {
      const result = updateJadwalSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('jadwalFilterSchema', () => {
    it('should accept valid filters', () => {
      const data = {
        kelas: 'A',
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        hari: 'senin',
        is_active: true,
        sortBy: 'tanggal_praktikum',
        sortOrder: 'desc',
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should use default sortBy and sortOrder', () => {
      const result = jadwalFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sortBy).toBe('tanggal_praktikum');
        expect(result.data.sortOrder).toBe('asc');
      }
    });

    it('should reject invalid hari enum', () => {
      const data = {
        hari: 'invalid-day',
      };

      const result = jadwalFilterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('jadwalConflictCheckSchema', () => {
    it('should accept valid conflict check data', () => {
      const data = {
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept exclude_id for update operations', () => {
      const data = {
        laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
        tanggal_praktikum: new Date('2025-12-31'),
        jam_mulai: '08:00',
        jam_selesai: '10:00',
        exclude_id: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = jadwalConflictCheckSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('Time Utilities', () => {
    describe('timeToMinutes', () => {
      it('should convert time to minutes correctly', () => {
        expect(timeToMinutes('00:00')).toBe(0);
        expect(timeToMinutes('01:00')).toBe(60);
        expect(timeToMinutes('08:30')).toBe(510);
        expect(timeToMinutes('23:59')).toBe(1439);
      });
    });

    describe('calculateDuration', () => {
      it('should calculate duration correctly', () => {
        expect(calculateDuration('08:00', '10:00')).toBe(120);
        expect(calculateDuration('08:00', '08:30')).toBe(30);
        expect(calculateDuration('09:15', '10:45')).toBe(90);
      });

      it('should return negative for invalid order', () => {
        expect(calculateDuration('10:00', '08:00')).toBe(-120);
      });
    });

    describe('isTimeOverlap', () => {
      it('should detect overlap correctly', () => {
        // Complete overlap
        expect(isTimeOverlap('08:00', '10:00', '08:00', '10:00')).toBe(true);

        // Partial overlap (start in middle)
        expect(isTimeOverlap('08:00', '10:00', '09:00', '11:00')).toBe(true);

        // Partial overlap (end in middle)
        expect(isTimeOverlap('09:00', '11:00', '08:00', '10:00')).toBe(true);

        // One inside another
        expect(isTimeOverlap('08:00', '12:00', '09:00', '10:00')).toBe(true);
      });

      it('should not detect overlap for non-overlapping times', () => {
        // Back to back
        expect(isTimeOverlap('08:00', '10:00', '10:00', '12:00')).toBe(false);

        // Separated
        expect(isTimeOverlap('08:00', '10:00', '11:00', '13:00')).toBe(false);
      });
    });
  });

  describe('Helper Functions', () => {
    describe('parseCreateJadwalForm', () => {
      it('should parse valid data', () => {
        const data = {
          kelas: 'A',
          laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
          tanggal_praktikum: new Date('2025-12-31'),
          jam_mulai: '08:00',
          jam_selesai: '10:00',
        };

        expect(() => parseCreateJadwalForm(data)).not.toThrow();
      });

      it('should throw on invalid data', () => {
        const data = {
          kelas: 'invalid-lowercase',
        };

        expect(() => parseCreateJadwalForm(data)).toThrow();
      });
    });

    describe('safeParseCreateJadwal', () => {
      it('should return success for valid data', () => {
        const data = {
          kelas: 'A',
          laboratorium_id: '123e4567-e89b-12d3-a456-426614174000',
          tanggal_praktikum: new Date('2025-12-31'),
          jam_mulai: '08:00',
          jam_selesai: '10:00',
        };

        const result = safeParseCreateJadwal(data);
        expect(result.success).toBe(true);
      });

      it('should return error for invalid data', () => {
        const data = {
          kelas: 'invalid',
        };

        const result = safeParseCreateJadwal(data);
        expect(result.success).toBe(false);
      });
    });
  });
});
