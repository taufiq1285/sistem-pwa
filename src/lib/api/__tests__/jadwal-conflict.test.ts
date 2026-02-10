/**
 * Unit Test: Conflict Detection untuk Jadwal Praktikum
 *
 * Skenario yang diuji:
 * 1. Dosen A booking Lab X jam 08:00-10:00 (pending) ✅
 * 2. Dosen B mencoba booking Lab X jam 08:00-10:00 → Harus REJECT ❌
 * 3. Dosen B booking Lab X jam 10:00-12:00 → Harus SUKSES ✅ (tidak overlap)
 * 4. Dosen B booking Lab X jam 09:00-11:00 → Harus REJECT ❌ (overlap dengan 08:00-10:00)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkJadwalConflictByDate } from '../jadwal.api';

describe('Conflict Detection - Jadwal Praktikum', () => {
  // Test data setup
  const labId = 'test-lab-id';
  const date = '2026-02-15';

  beforeEach(async () => {
    // Reset database before each test
    await cleanupTestData();
  });

  afterEach(async () => {
    // Cleanup after each test
    await cleanupTestData();
  });

  describe('Skenario 1: Exact Overlap (Bentrok Total)', () => {
    it('should reject booking when time range exactly matches existing jadwal', async () => {
      // Setup: Dosen A booking jam 08:00-10:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Test: Dosen B coba booking jam 08:00-10:00 (sama persis)
      const hasConflict = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00'
      });

      // Expect: Harus ada conflict
      expect(hasConflict).toBe(true);
    });
  });

  describe('Skenario 2: Partial Overlap (Bentrok Sebagian)', () => {
    it('should reject booking when time range overlaps partially', async () => {
      // Setup: Dosen A booking jam 08:00-10:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Test: Dosen B coba booking jam 09:00-11:00 (overlap jam 09:00-10:00)
      const hasConflict1 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '09:00',
        end: '11:00'
      });

      // Test: Dosen B coba booking jam 07:00-09:00 (overlap jam 08:00-09:00)
      const hasConflict2 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '07:00',
        end: '09:00'
      });

      // Expect: Keduanya harus ada conflict
      expect(hasConflict1).toBe(true);
      expect(hasConflict2).toBe(true);
    });
  });

  describe('Skenario 3: Contained Within (Dalam Range)', () => {
    it('should reject booking when new booking is within existing range', async () => {
      // Setup: Dosen A booking jam 08:00-12:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '12:00',
        status: 'pending'
      });

      // Test: Dosen B coba booking jam 09:00-11:00 (sepenuhnya dalam range 08:00-12:00)
      const hasConflict = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '09:00',
        end: '11:00'
      });

      // Expect: Harus ada conflict
      expect(hasConflict).toBe(true);
    });
  });

  describe('Skenario 4: No Overlap (Tidak Bentrok)', () => {
    it('should allow booking when time range does not overlap', async () => {
      // Setup: Dosen A booking jam 08:00-10:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Test: Dosen B booking jam 10:00-12:00 (bersebelahan, tidak overlap)
      const hasConflict1 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '10:00',
        end: '12:00'
      });

      // Test: Dosen B booking jam 06:00-08:00 (bersebelahan, tidak overlap)
      const hasConflict2 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '06:00',
        end: '08:00'
      });

      // Expect: Tidak boleh ada conflict
      expect(hasConflict1).toBe(false);
      expect(hasConflict2).toBe(false);
    });
  });

  describe('Skenario 5: Different Lab (Lab Berbeda)', () => {
    it('should allow booking when different lab is used', async () => {
      // Setup: Dosen A booking Lab X jam 08:00-10:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: 'lab-x-id',
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Test: Dosen B booking Lab Y jam 08:00-10:00 (lab berbeda)
      const hasConflict = await checkJadwalConflictByDate({
        lab_id: 'lab-y-id', // Lab berbeda
        date,
        start: '08:00',
        end: '10:00'
      });

      // Expect: Tidak boleh ada conflict (lab berbeda)
      expect(hasConflict).toBe(false);
    });
  });

  describe('Skenario 6: Different Date (Tanggal Berbeda)', () => {
    it('should allow booking when different date is used', async () => {
      // Setup: Dosen A booking tanggal 2026-02-15 jam 08:00-10:00
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date: '2026-02-15',
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Test: Dosen B booking tanggal 2026-02-16 jam 08:00-10:00 (tanggal berbeda)
      const hasConflict = await checkJadwalConflictByDate({
        lab_id: labId,
        date: '2026-02-16', // Tanggal berbeda
        start: '08:00',
        end: '10:00'
      });

      // Expect: Tidak boleh ada conflict (tanggal berbeda)
      expect(hasConflict).toBe(false);
    });
  });

  describe('Skenario 7: Status Checking (Approved vs Pending)', () => {
    it('should check BOTH pending and approved status', async () => {
      // Setup 1: Dosen A booking jam 08:00-10:00 (status: pending)
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending'
      });

      // Setup 2: Dosen B booking jam 13:00-15:00 (status: approved)
      await createTestJadwal({
        dosen_id: 'dosen-b-id',
        lab_id: labId,
        date,
        start: '13:00',
        end: '15:00',
        status: 'approved'
      });

      // Test 1: Coba overlap dengan jadwal pending
      const hasConflict1 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '09:00',
        end: '11:00'
      });

      // Test 2: Coba overlap dengan jadwal approved
      const hasConflict2 = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '14:00',
        end: '16:00'
      });

      // Expect: Keduanya harus ada conflict
      expect(hasConflict1).toBe(true); // Overlap dengan pending
      expect(hasConflict2).toBe(true); // Overlap dengan approved
    });
  });

  describe('Skenario 8: Inactive Jadwal (Sudah Dihapus)', () => {
    it('should ignore inactive jadwal (is_active = false)', async () => {
      // Setup: Dosen A booking jam 08:00-10:00 (is_active = false / sudah dihapus)
      await createTestJadwal({
        dosen_id: 'dosen-a-id',
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00',
        status: 'pending',
        is_active: false
      });

      // Test: Dosen B booking jam 08:00-10:00 (sama persis)
      const hasConflict = await checkJadwalConflictByDate({
        lab_id: labId,
        date,
        start: '08:00',
        end: '10:00'
      });

      // Expect: Tidak boleh ada conflict (jadwal A sudah tidak active)
      expect(hasConflict).toBe(false);
    });
  });
});

// Helper functions untuk testing
async function createTestJadwal(params: {
  dosen_id: string;
  lab_id: string;
  date: string;
  start: string;
  end: string;
  status: string;
  is_active?: boolean;
}) {
  // Implementasi insert ke database untuk testing
  // Gunakan Supabase client untuk insert
}

async function cleanupTestData() {
  // Implementasi cleanup data test
  // Hapus semua jadwal dengan dosen_id = 'dosen-a-id' atau 'dosen-b-id'
}
