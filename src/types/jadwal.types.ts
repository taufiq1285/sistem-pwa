/**
 * Jadwal Types - SIMPLIFIED VERSION
 * Support both kelas (old) and kelas_id (new)
 */

// ========================================
// BASE JADWAL TYPE - Support both fields
// ========================================

export interface Jadwal {
  id: string;
  kelas?:
    | string
    | null
    | {
        nama_kelas?: string | null;
        mata_kuliah?: { nama_mk?: string | null } | null;
      };
  kelas_id?: string | null; // ✅ NEW: UUID reference to kelas table
  laboratorium_id: string;
  tanggal_praktikum: string;
  hari?: string | null;
  jam_mulai: string;
  jam_selesai: string;
  minggu_ke?: number | null;
  topik?: string | null;
  deskripsi?: string | null;
  catatan?: string | null;
  is_active?: boolean;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at?: string;
  updated_at?: string;
  laboratorium?: {
    id: string;
    nama_lab: string;
    kode_lab: string;
    kapasitas: number;
  };
  kelas_relation?: {
    id: string;
    nama_kelas: string;
    mata_kuliah?: {
      nama_mk: string;
    };
  };
}

// ========================================
// FORM DATA TYPES
// ========================================

export interface CreateJadwalData {
  kelas?: string; // ❌ OLD: Keep for backward compatibility
  kelas_id?: string; // ✅ NEW: Primary field to use
  laboratorium_id: string;
  tanggal_praktikum: string | Date;
  jam_mulai: string;
  jam_selesai: string;
  minggu_ke?: number;
  topik?: string;
  deskripsi?: string;
  catatan?: string;
  is_active?: boolean;
}

export interface UpdateJadwalData extends Partial<CreateJadwalData> {
  id: string;
}

// ========================================
// CALENDAR & DASHBOARD TYPES
// ========================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "class" | "quiz" | "booking" | "exam";
  color?: string;
  description?: string;
  location?: string;
  metadata?: {
    jadwal_id?: string;
    kelas?: string;
    kelas_id?: string;
    laboratorium_id?: string;
    tanggal_praktikum?: string;
    topik?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
}

export interface TodaySchedule {
  id: string;
  kelas_id?: string;
  kelas?: string;
  tanggal_praktikum: string;
  kode_mk: string;
  nama_mk: string;
  nama_kelas: string;
  sks: number;
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
  dosen_name: string;
  dosen_gelar: string;
  is_now: boolean;
  is_upcoming: boolean;
  is_past: boolean;
  time_status: "past" | "ongoing" | "upcoming";
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

export interface JadwalPraktikum {
  jadwal_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  tanggal_praktikum: string;
  minggu_ke: number | null;
  topik: string;
  deskripsi: string | null;
  catatan: string | null;
  kode_mk: string;
  nama_mk: string;
  kode_kelas: string;
  nama_kelas: string;
  kode_lab: string;
  nama_lab: string;
  lokasi: string;
  nama_dosen: string;
}

// ========================================
// FILTER TYPES
// ========================================

export interface JadwalFilters {
  kelas?: string; // ❌ OLD: String filter
  kelas_id?: string; // ✅ NEW: UUID filter
  laboratorium_id?: string;
  tanggal_praktikum?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  hari?: string;
  minggu_ke?: number;
  is_active?: boolean;
}

// ========================================
// BOOKING TYPES
// ========================================

export interface Booking {
  id: string;
  kelas_id: string;
  laboratorium_id: string;
  dosen_id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  keperluan: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  catatan?: string | null;
  approval_by?: string | null;
  approval_at?: string | null;
  created_at?: string;
  updated_at?: string;
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

export interface BookingFilters {
  kelas_id?: string;
  laboratorium_id?: string;
  dosen_id?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
}

// ========================================
// LABORATORIUM TYPES
// ========================================

export interface Laboratorium {
  id: string;
  nama_lab: string;
  kode_lab: string;
  kapasitas: number;
  deskripsi?: string | null;
  fasilitas?: string[] | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLaboratoriumData {
  nama_lab: string;
  kode_lab: string;
  kapasitas: number;
  deskripsi?: string;
  fasilitas?: string[];
  is_active?: boolean;
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
  { value: "senin", label: "Senin" },
  { value: "selasa", label: "Selasa" },
  { value: "rabu", label: "Rabu" },
  { value: "kamis", label: "Kamis" },
  { value: "jumat", label: "Jumat" },
  { value: "sabtu", label: "Sabtu" },
] as const;

export const JAM_PRAKTIKUM = [
  { value: "07:00", label: "07:00" },
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "12:00", label: "12:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
  { value: "16:00", label: "16:00" },
  { value: "17:00", label: "17:00" },
] as const;

export const BOOKING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export const BOOKING_STATUS_LABELS = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
} as const;

export const BOOKING_STATUS_COLORS = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
  cancelled: "gray",
} as const;

export const EVENT_TYPE_COLORS = {
  class: "#3b82f6",
  quiz: "#ef4444",
  booking: "#10b981",
  exam: "#f59e0b",
} as const;

export const LABORATORIUM_LIST = [
  "Lab Keterampilan Dasar Praktik Kebidanan",
  "Lab ANC (Antenatal Care)",
  "Lab PNC (Postnatal Care)",
  "Lab INC (Intranatal Care)",
  "Lab BBL (Bayi Baru Lahir)",
  "Lab Pelayanan KB",
  "Lab Konseling & Pendidikan Kesehatan",
  "Lab Kebidanan Komunitas",
  "Lab Bayi, Balita, Anak Prasekolah",
  "Ruangan Depo Alat",
] as const;
