/**
 * Data Normalization Utilities Unit Tests
 * Comprehensive tests for data normalization functions
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeFullName,
  normalizeNIM,
  normalizeEmail,
  normalizeKelasNama,
  normalizeKodeKelas,
  normalizePhone,
  normalizeProgramStudi,
  normalizeDosenNama,
  normalizeMataKuliahNama,
  normalize,
} from '@/lib/utils/normalize';

describe('Data Normalization Utilities', () => {
  describe('normalizeFullName', () => {
    it('should convert to title case', () => {
      expect(normalizeFullName('siti nurhaliza')).toBe('Siti Nurhaliza');
      expect(normalizeFullName('SITI NURHALIZA')).toBe('Siti Nurhaliza');
      expect(normalizeFullName('SiTi NuRhAlIzA')).toBe('Siti Nurhaliza');
    });

    it('should trim whitespace', () => {
      expect(normalizeFullName('  Siti Nurhaliza  ')).toBe('Siti Nurhaliza');
      expect(normalizeFullName('\tSiti Nurhaliza\t')).toBe('Siti Nurhaliza');
    });

    it('should normalize multiple spaces', () => {
      expect(normalizeFullName('Siti  Nurhaliza')).toBe('Siti Nurhaliza');
      expect(normalizeFullName('Siti   Nurhaliza   Binti   Ahmad')).toBe(
        'Siti Nurhaliza Binti Ahmad'
      );
    });

    it('should handle empty string', () => {
      expect(normalizeFullName('')).toBe('');
    });

    it('should handle single name', () => {
      expect(normalizeFullName('madonna')).toBe('Madonna');
    });

    it('should handle names with special characters', () => {
      expect(normalizeFullName('siti-nurhaliza')).toBe('Siti-nurhaliza');
    });
  });

  describe('normalizeNIM', () => {
    it('should convert to uppercase', () => {
      expect(normalizeNIM('bd2321001')).toBe('BD2321001');
      expect(normalizeNIM('ab1234567')).toBe('AB1234567');
    });

    it('should trim whitespace', () => {
      expect(normalizeNIM('  BD2321001  ')).toBe('BD2321001');
    });

    it('should remove all spaces', () => {
      expect(normalizeNIM('BD 2321 001')).toBe('BD2321001');
      expect(normalizeNIM('BD 23 21 00 1')).toBe('BD2321001');
    });

    it('should handle empty string', () => {
      expect(normalizeNIM('')).toBe('');
    });

    it('should handle mixed case with spaces', () => {
      expect(normalizeNIM(' bd 2321 001 ')).toBe('BD2321001');
    });
  });

  describe('normalizeEmail', () => {
    it('should convert to lowercase', () => {
      expect(normalizeEmail('SITI@MAHASISWA.AC.ID')).toBe('siti@mahasiswa.ac.id');
      expect(normalizeEmail('Siti@Mahasiswa.AC.ID')).toBe('siti@mahasiswa.ac.id');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  siti@mahasiswa.ac.id  ')).toBe('siti@mahasiswa.ac.id');
    });

    it('should handle empty string', () => {
      expect(normalizeEmail('')).toBe('');
    });

    it('should handle complex emails', () => {
      expect(normalizeEmail('SITI.NUR.HALIZA@MAHASISWA.AC.ID')).toBe(
        'siti.nur.haliza@mahasiswa.ac.id'
      );
    });
  });

  describe('normalizeKelasNama', () => {
    it('should convert to title case', () => {
      expect(normalizeKelasNama('kelas a')).toBe('Kelas A');
      expect(normalizeKelasNama('KELAS A')).toBe('Kelas A');
    });

    it('should handle parentheses', () => {
      expect(normalizeKelasNama('kelas a (pin merah)')).toBe('Kelas A (Pin Merah)');
      expect(normalizeKelasNama('KELAS A (PIN MERAH)')).toBe('Kelas A (Pin Merah)');
    });

    it('should handle hyphens', () => {
      expect(normalizeKelasNama('kelas a-1')).toBe('Kelas A-1');
      expect(normalizeKelasNama('kelas a -praktikum')).toBe('Kelas A -Praktikum');
    });

    it('should normalize multiple spaces', () => {
      expect(normalizeKelasNama('kelas  a')).toBe('Kelas A');
    });

    it('should trim whitespace', () => {
      expect(normalizeKelasNama('  kelas a  ')).toBe('Kelas A');
    });

    it('should handle empty string', () => {
      expect(normalizeKelasNama('')).toBe('');
    });
  });

  describe('normalizeKodeKelas', () => {
    it('should convert to uppercase', () => {
      expect(normalizeKodeKelas('kl-a')).toBe('KL-A');
      expect(normalizeKodeKelas('kelas-a')).toBe('KELAS-A');
    });

    it('should remove spaces', () => {
      expect(normalizeKodeKelas('KL A')).toBe('KLA');
      expect(normalizeKodeKelas('KELAS A')).toBe('KELASA');
    });

    it('should trim whitespace', () => {
      expect(normalizeKodeKelas('  kl-a  ')).toBe('KL-A');
    });

    it('should handle empty string', () => {
      expect(normalizeKodeKelas('')).toBe('');
    });

    it('should handle mixed case with spaces', () => {
      expect(normalizeKodeKelas(' kl a 01 ')).toBe('KLA01');
    });
  });

  describe('normalizePhone', () => {
    it('should preserve plus sign', () => {
      expect(normalizePhone('+62 812 3456 7890')).toBe('+6281234567890');
      expect(normalizePhone('+1-555-1234')).toBe('+15551234');
    });

    it('should remove spaces', () => {
      expect(normalizePhone('0812 3456 7890')).toBe('081234567890');
    });

    it('should remove special characters except plus', () => {
      expect(normalizePhone('(021) 123-4567')).toBe('0211234567');
      expect(normalizePhone('021-123-4567')).toBe('0211234567');
    });

    it('should trim whitespace', () => {
      expect(normalizePhone('  08123456789  ')).toBe('08123456789');
    });

    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('');
    });

    it('should handle complex phone formats', () => {
      expect(normalizePhone('+62 (812) 345-6789')).toBe('+628123456789');
      expect(normalizePhone('+62 812.345.6789')).toBe('+628123456789');
    });
  });

  describe('normalizeProgramStudi', () => {
    it('should convert to title case', () => {
      expect(normalizeProgramStudi('kebidanan')).toBe('Kebidanan');
      expect(normalizeProgramStudi('KEPERAWATAN')).toBe('Keperawatan');
      expect(normalizeProgramStudi('teknik informatika')).toBe('Teknik Informatika');
    });

    it('should normalize spaces', () => {
      expect(normalizeProgramStudi('teknik  informatika')).toBe('Teknik Informatika');
    });

    it('should trim whitespace', () => {
      expect(normalizeProgramStudi('  kebidanan  ')).toBe('Kebidanan');
    });

    it('should handle empty string', () => {
      expect(normalizeProgramStudi('')).toBe('');
    });

    it('should handle multi-word programs', () => {
      expect(normalizeProgramStudi('SISTEM INFORMASI BISNIS')).toBe(
        'Sistem Informasi Bisnis'
      );
    });
  });

  describe('normalizeDosenNama', () => {
    it('should convert to title case', () => {
      expect(normalizeDosenNama('budi santoso')).toBe('Budi Santoso');
      expect(normalizeDosenNama('BUDI SANTOSO')).toBe('Budi Santoso');
    });

    it('should handle titles with dots', () => {
      expect(normalizeDosenNama('dr. budi santoso')).toBe('Dr. Budi Santoso');
      expect(normalizeDosenNama('DR. BUDI SANTOSO')).toBe('Dr. Budi Santoso');
      expect(normalizeDosenNama('prof. dr. budi santoso')).toBe(
        'Prof. Dr. Budi Santoso'
      );
    });

    it('should normalize spaces', () => {
      expect(normalizeDosenNama('dr.  budi  santoso')).toBe('Dr. Budi Santoso');
    });

    it('should trim whitespace', () => {
      expect(normalizeDosenNama('  dr. budi santoso  ')).toBe('Dr. Budi Santoso');
    });

    it('should handle empty string', () => {
      expect(normalizeDosenNama('')).toBe('');
    });

    it('should handle complex titles', () => {
      expect(normalizeDosenNama('prof. dr. h. budi santoso, m.kom')).toBe(
        'Prof. Dr. H. Budi Santoso, M.kom'
      );
    });
  });

  describe('normalizeMataKuliahNama', () => {
    it('should convert to title case', () => {
      expect(normalizeMataKuliahNama('praktikum kebidanan')).toBe(
        'Praktikum Kebidanan'
      );
      expect(normalizeMataKuliahNama('PRAKTIKUM KEPERAWATAN')).toBe(
        'Praktikum Keperawatan'
      );
    });

    it('should normalize spaces', () => {
      expect(normalizeMataKuliahNama('praktikum  kebidanan')).toBe(
        'Praktikum Kebidanan'
      );
    });

    it('should trim whitespace', () => {
      expect(normalizeMataKuliahNama('  praktikum kebidanan  ')).toBe(
        'Praktikum Kebidanan'
      );
    });

    it('should handle empty string', () => {
      expect(normalizeMataKuliahNama('')).toBe('');
    });

    it('should handle long course names', () => {
      expect(
        normalizeMataKuliahNama('PRAKTIKUM KEBIDANAN KOMUNITAS DAN KELUARGA')
      ).toBe('Praktikum Kebidanan Komunitas Dan Keluarga');
    });
  });

  describe('normalize object', () => {
    it('should export all normalization functions', () => {
      expect(normalize.fullName).toBe(normalizeFullName);
      expect(normalize.nim).toBe(normalizeNIM);
      expect(normalize.email).toBe(normalizeEmail);
      expect(normalize.kelasNama).toBe(normalizeKelasNama);
      expect(normalize.kodeKelas).toBe(normalizeKodeKelas);
      expect(normalize.phone).toBe(normalizePhone);
      expect(normalize.programStudi).toBe(normalizeProgramStudi);
      expect(normalize.dosenNama).toBe(normalizeDosenNama);
      expect(normalize.mataKuliahNama).toBe(normalizeMataKuliahNama);
    });

    it('should work via normalize object', () => {
      expect(normalize.fullName('siti nurhaliza')).toBe('Siti Nurhaliza');
      expect(normalize.nim('bd2321001')).toBe('BD2321001');
      expect(normalize.email('SITI@EMAIL.COM')).toBe('siti@email.com');
    });
  });

  describe('edge cases', () => {
    it('should handle null as empty string', () => {
      expect(normalizeFullName(null as any)).toBe('');
      expect(normalizeNIM(null as any)).toBe('');
      expect(normalizeEmail(null as any)).toBe('');
    });

    it('should handle undefined as empty string', () => {
      expect(normalizeFullName(undefined as any)).toBe('');
      expect(normalizeNIM(undefined as any)).toBe('');
      expect(normalizeEmail(undefined as any)).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(normalizeFullName('   ')).toBe('');
      expect(normalizeKelasNama('   ')).toBe('');
      expect(normalizeProgramStudi('   ')).toBe('');
    });

    it('should handle unicode characters', () => {
      expect(normalizeFullName('siti nûrhaliza')).toBe('Siti Nûrhaliza');
      expect(normalizeEmail('SITI@ÑOÑO.COM')).toBe('siti@ñoño.com');
    });

    it('should handle numbers in names', () => {
      expect(normalizeFullName('kelas 1a')).toBe('Kelas 1a');
      expect(normalizeKelasNama('kelas 1a')).toBe('Kelas 1a');
    });

    it('should handle very long inputs', () => {
      const longName = 'a '.repeat(100).trim();
      const result = normalizeFullName(longName);
      expect(result.split(' ').every((word) => word === 'A')).toBe(true);
    });
  });

  describe('real-world examples', () => {
    it('should normalize typical student data', () => {
      expect(normalizeFullName('  SITI NURHALIZA BINTI AHMAD  ')).toBe(
        'Siti Nurhaliza Binti Ahmad'
      );
      expect(normalizeNIM(' bd 2321 001 ')).toBe('BD2321001');
      expect(normalizeEmail('  SITI.NURHALIZA@MAHASISWA.AC.ID  ')).toBe(
        'siti.nurhaliza@mahasiswa.ac.id'
      );
      expect(normalizePhone('+62 812-3456-7890')).toBe('+6281234567890');
      expect(normalizeProgramStudi('  KEBIDANAN  ')).toBe('Kebidanan');
    });

    it('should normalize typical dosen data', () => {
      expect(normalizeDosenNama('  DR. BUDI SANTOSO, M.KOM  ')).toBe(
        'Dr. Budi Santoso, M.kom'
      );
      expect(normalizeEmail('  BUDI.SANTOSO@DOSEN.AC.ID  ')).toBe(
        'budi.santoso@dosen.ac.id'
      );
    });

    it('should normalize typical kelas data', () => {
      expect(normalizeKelasNama('  KELAS A (PIN MERAH)  ')).toBe(
        'Kelas A (Pin Merah)'
      );
      expect(normalizeKodeKelas('  KL A 01  ')).toBe('KLA01');
      expect(normalizeMataKuliahNama('  PRAKTIKUM KEBIDANAN DASAR  ')).toBe(
        'Praktikum Kebidanan Dasar'
      );
    });
  });
});
