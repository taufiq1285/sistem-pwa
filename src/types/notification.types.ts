/**
 * Notification Types
 * Type definitions for notification system
 */

export type NotificationType =
  | "tugas_baru" // Dosen creates new tugas
  | "tugas_submitted" // Mahasiswa submits tugas
  | "tugas_graded" // Dosen grades tugas
  | "kuis_baru" // Dosen creates new kuis
  | "dosen_changed" // Dosen reassignment by admin
  | "perbaikan_nilai_request" // Mahasiswa requests grade revision
  | "perbaikan_nilai_response" // Dosen approves/rejects grade revision
  | "pengumuman" // General announcement
  | "sistem" // System notification
  | "other";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: NotificationData;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationData {
  kuis_id?: string;
  attempt_id?: string;
  kelas_id?: string;
  mata_kuliah_id?: string;
  mahasiswa_id?: string;
  dosen_id?: string;
  permintaan_id?: string; // For grade revision requests
  komponen_nilai?: string; // Which grade component
  nilai_baru?: number; // New grade value (for approved requests)
  [key: string]: any;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: NotificationData;
}

export interface UpdateNotificationData {
  is_read?: boolean;
  read_at?: string;
}

export interface NotificationFilters {
  user_id?: string;
  type?: NotificationType;
  is_read?: boolean;
  limit?: number;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
}
