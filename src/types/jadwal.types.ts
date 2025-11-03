/**
 * Jadwal (Schedule) Types - DATE-BASED VERSION
 * 
 * Purpose: Define types for specific date schedules
 * Used by: Dosen Dashboard, Schedule Page, Calendar
 * 
 * CHANGE: Now uses tanggal_praktikum (specific date) instead of recurring hari
 */

import type { Database } from './database.types';

// ========================================
// BASE TYPES FROM DATABASE
// ========================================

type JadwalTable = Database['public']['Tables'] extends { jadwal: { Row: infer R } }
  ? R
  : {
      id: string;
      kelas: string;
      laboratorium_id: string;
      tanggal_praktikum: string;  // ✅ PRIMARY: Specific date
      hari?: string | null;        // ✅ COMPUTED: Auto from tanggal
      jam_mulai: string;
      jam_selesai: string;
      minggu_ke?: number | null;
      topik?: string | null;
      catatan?: string | null;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };

type BookingTable = Database['public']['Tables'] extends { booking: { Row: infer R } }
  ? R
  : {
      id: string;
      kelas_id: string;
      laboratorium_id: string;
      dosen_id: string;
      tanggal: string;
      jam_mulai: string;
      jam_selesai: string;
      keperluan: string;
      status: 'pending' | 'approved' | 'rejected' | 'cancelled';
      catatan?: string | null;
      approval_by?: string | null;
      approval_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };

type LaboratoriumTable = Database['public']['Tables'] extends { laboratorium: { Row: infer R } }
  ? R
  : {
      id: string;
      nama_lab: string;
      kode_lab: string;
      kapasitas: number;
      deskripsi?: string | null;
      fasilitas?: any | null;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };

// ========================================
// EXTENDED TYPES WITH RELATIONS
// ========================================

export interface Jadwal extends JadwalTable {
  laboratorium?: Laboratorium;
}

export interface Booking extends BookingTable {
  kelas?: {
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
    };
  };
  laboratorium?: Laboratorium;
  dosen?: {
    gelar_depan?: string;
    gelar_belakang?: string;
    users?: {
      full_name: string;
    };
  };
  approved_by?: {
    full_name: string;
  };
}

export interface Laboratorium extends LaboratoriumTable {
  jadwal?: Jadwal[];
  booking?: Booking[];
}

// ========================================
// DASHBOARD SPECIFIC TYPES
// ========================================

export interface TodaySchedule {
  id: string;
  kelas: string;
  tanggal_praktikum: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  minggu_ke?: number;
  laboratorium_id: string;
  nama_lab: string;
  kode_lab: string;
  kapasitas: number;
  topik?: string;
  catatan?: string;
  is_now: boolean;
  is_upcoming: boolean;
  is_past: boolean;
  time_status: 'past' | 'ongoing' | 'upcoming';
}

export interface WeeklySchedule {
  tanggal: string;
  hari: string;
  schedules: TodaySchedule[];
}

export interface ScheduleStats {
  total_classes_today: number;
  total_classes_week: number;
  total_classes_month: number;
  next_class?: {
    kelas: string;
    tanggal: string;
    jam_mulai: string;
    nama_lab: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'class' | 'quiz' | 'booking' | 'exam';
  color?: string;
  description?: string;
  location?: string;
  metadata?: {
    jadwal_id?: string;
    kelas?: string;
    laboratorium_id?: string;
    tanggal_praktikum?: string;
    topik?: string;
    [key: string]: any;
  };
}

// ========================================
// BOOKING TYPES
// ========================================

export interface AvailableSlot {
  laboratorium_id: string;
  nama_lab: string;
  tanggal: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  jam_mulai: string;
  jam_selesai: string;
  is_available: boolean;
  booked_by?: {
    dosen_name: string;
    keperluan: string;
  };
}

export interface BookingRequest {
  kelas_id: string;
  laboratorium_id: string;
  dosen_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  keperluan: string;
  catatan?: string;
}

// ========================================
// FORM DATA TYPES - DATE-BASED
// ========================================

export interface CreateJadwalData {
  kelas: string;
  laboratorium_id: string;
  tanggal_praktikum: string | Date;  // ✅ REQUIRED: Specific date
  // hari: removed from form (auto-computed in API)
  jam_mulai: string;
  jam_selesai: string;
  minggu_ke?: number;
  topik?: string;
  catatan?: string;
  is_active?: boolean;
}

export interface UpdateJadwalData extends Partial<CreateJadwalData> {
  id: string;
}

export interface CreateBookingData {
  kelas_id: string;
  laboratorium_id: string;
  dosen_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  keperluan: string;
  catatan?: string;
}

export interface UpdateBookingData extends Partial<CreateBookingData> {
  id: string;
}

export interface ApproveBookingData {
  booking_id: string;
  approval_by: string;
  status: 'approved' | 'rejected';
  catatan?: string;
}

export interface CreateLaboratoriumData {
  nama_lab: string;
  kode_lab: string;
  kapasitas: number;
  deskripsi?: string;
  fasilitas?: string[];
  is_active?: boolean;
}

export interface UpdateLaboratoriumData extends Partial<CreateLaboratoriumData> {
  id: string;
}

// ========================================
// FILTER & QUERY TYPES - DATE-BASED
// ========================================

export interface JadwalFilters {
  kelas?: string;
  laboratorium_id?: string;
  tanggal_praktikum?: string;  // ✅ Filter by specific date
  tanggal_mulai?: string;      // ✅ Date range start
  tanggal_selesai?: string;    // ✅ Date range end
  hari?: string;               // Still available for filtering
  minggu_ke?: number;
  is_active?: boolean;
}

export interface BookingFilters {
  kelas_id?: string;
  laboratorium_id?: string;
  dosen_id?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export interface LaboratoriumFilters {
  is_active?: boolean;
  search?: string;
  has_availability?: boolean;
  tanggal?: string;
}

// ========================================
// CONSTANTS
// ========================================

export const HARI_OPTIONS = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
] as const;

export const JAM_PRAKTIKUM = [
  { value: '07:00', label: '07:00' },
  { value: '08:00', label: '08:00' },
  { value: '09:00', label: '09:00' },
  { value: '10:00', label: '10:00' },
  { value: '11:00', label: '11:00' },
  { value: '12:00', label: '12:00' },
  { value: '13:00', label: '13:00' },
  { value: '14:00', label: '14:00' },
  { value: '15:00', label: '15:00' },
  { value: '16:00', label: '16:00' },
  { value: '17:00', label: '17:00' },
] as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const BOOKING_STATUS_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
} as const;

export const BOOKING_STATUS_COLORS = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  cancelled: 'gray',
} as const;

export const EVENT_TYPE_COLORS = {
  class: '#3b82f6',
  quiz: '#ef4444',
  red: '#10b981',
  exam: '#f59e0b',
} as const;

export const LABORATORIUM_LIST = [
  'Lab Keterampilan Dasar Praktik Kebidanan',
  'Lab ANC (Antenatal Care)',
  'Lab PNC (Postnatal Care)',
  'Lab INC (Intranatal Care)',
  'Lab BBL (Bayi Baru Lahir)',
  'Lab Pelayanan KB',
  'Lab Konseling & Pendidikan Kesehatan',
  'Lab Kebidanan Komunitas',
  'Lab Bayi, Balita, Anak Prasekolah',
  'Ruangan Depo Alat',
] as const;