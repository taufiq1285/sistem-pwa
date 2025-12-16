/**
 * Notification API
 *
 * Purpose: Handle notification operations
 * Features:
 * - CRUD operations for notifications
 * - Get notifications by user
 * - Mark as read/unread
 * - Get unread count
 * - Batch operations
 */

import { supabase } from "@/lib/supabase/client";
import { handleError } from "@/lib/utils/errors";
import type {
  Notification,
  CreateNotificationData,
  UpdateNotificationData,
  NotificationFilters,
  NotificationSummary,
} from "@/types/notification.types";

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get notifications for a user
 */
export async function getNotifications(
  filters: NotificationFilters = {},
): Promise<Notification[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw handleError(error);

    return (data || []) as Notification[];
  } catch (error) {
    console.error("getNotifications error:", error);
    throw handleError(error);
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw handleError(error);

    return count || 0;
  } catch (error) {
    console.error("getUnreadCount error:", error);
    throw handleError(error);
  }
}

/**
 * Get notification summary
 */
export async function getNotificationSummary(
  userId: string,
): Promise<NotificationSummary> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("type, is_read")
      .eq("user_id", userId);

    if (error) throw handleError(error);

    const notifications = data || [];
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.is_read).length;

    const by_type: Record<string, number> = {};
    notifications.forEach((n) => {
      by_type[n.type] = (by_type[n.type] || 0) + 1;
    });

    return {
      total,
      unread,
      by_type: by_type as any,
    };
  } catch (error) {
    console.error("getNotificationSummary error:", error);
    throw handleError(error);
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a single notification
 */
export async function createNotification(
  data: CreateNotificationData,
): Promise<Notification> {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) throw handleError(error);

    return notification as Notification;
  } catch (error) {
    console.error("createNotification error:", error);
    throw handleError(error);
  }
}

/**
 * Create multiple notifications (batch)
 * Useful for notifying all students in a class
 */
export async function createBulkNotifications(
  notifications: CreateNotificationData[],
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(
        notifications.map((n) => ({
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          data: n.data || {},
          is_read: false,
        })),
      )
      .select();

    if (error) throw handleError(error);

    return (data || []) as Notification[];
  } catch (error) {
    console.error("createBulkNotifications error:", error);
    throw handleError(error);
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .single();

    if (error) throw handleError(error);

    return data as Notification;
  } catch (error) {
    console.error("markAsRead error:", error);
    throw handleError(error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) throw handleError(error);
  } catch (error) {
    console.error("markAllAsRead error:", error);
    throw handleError(error);
  }
}

/**
 * Update notification
 */
export async function updateNotification(
  id: string,
  data: UpdateNotificationData,
): Promise<Notification> {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw handleError(error);

    return notification as Notification;
  } catch (error) {
    console.error("updateNotification error:", error);
    throw handleError(error);
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw handleError(error);
  } catch (error) {
    console.error("deleteNotification error:", error);
    throw handleError(error);
  }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId)
      .eq("is_read", true);

    if (error) throw handleError(error);
  } catch (error) {
    console.error("deleteReadNotifications error:", error);
    throw handleError(error);
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR AUTO-NOTIFICATION
// ============================================================================

/**
 * Notify dosen when mahasiswa submits tugas praktikum
 */
export async function notifyDosenTugasSubmitted(
  dosenId: string,
  mahasiswaNama: string,
  tugasNama: string,
  attemptId: string,
  kuisId: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenId,
    title: "Tugas Praktikum Dikerjakan",
    message: `${mahasiswaNama} telah mengerjakan tugas "${tugasNama}"`,
    type: "tugas_submitted",
    data: {
      attempt_id: attemptId,
      kuis_id: kuisId,
    },
  });
}

/**
 * Notify all mahasiswa in a kelas when dosen creates new tugas
 */
export async function notifyMahasiswaTugasBaru(
  mahasiswaIds: string[],
  dosenNama: string,
  tugasNama: string,
  kuisId: string,
  kelasId: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = mahasiswaIds.map(
    (mahasiswaId) => ({
      user_id: mahasiswaId,
      title: "Tugas Praktikum Baru",
      message: `${dosenNama} telah membuat tugas baru: "${tugasNama}"`,
      type: "tugas_baru",
      data: {
        kuis_id: kuisId,
        kelas_id: kelasId,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

/**
 * Notify mahasiswa when dosen grades their tugas
 */
export async function notifyMahasiswaTugasGraded(
  mahasiswaId: string,
  tugasNama: string,
  nilai: number,
  attemptId: string,
  kuisId: string,
): Promise<Notification> {
  return createNotification({
    user_id: mahasiswaId,
    title: "Tugas Dinilai",
    message: `Tugas "${tugasNama}" Anda telah dinilai. Nilai: ${nilai}`,
    type: "tugas_graded",
    data: {
      attempt_id: attemptId,
      kuis_id: kuisId,
      nilai: nilai,
    },
  });
}

/**
 * Notify all mahasiswa in a kelas when dosen is changed/reassigned
 */
export async function notifyMahasiswaDosenChanged(
  mahasiswaUserIds: string[],
  kelasNama: string,
  mataKuliahNama: string,
  dosenLamaNama: string,
  dosenBaruNama: string,
  kelasId: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = mahasiswaUserIds.map(
    (userId) => ({
      user_id: userId,
      title: "Perubahan Dosen",
      message: `Kelas "${mataKuliahNama} - ${kelasNama}" sekarang diampu oleh ${dosenBaruNama} (menggantikan ${dosenLamaNama})`,
      type: "dosen_changed",
      data: {
        kelas_id: kelasId,
        dosen_lama: dosenLamaNama,
        dosen_baru: dosenBaruNama,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

/**
 * Notify new dosen when assigned to a kelas
 */
export async function notifyDosenNewAssignment(
  dosenUserId: string,
  kelasNama: string,
  mataKuliahNama: string,
  jumlahMahasiswa: number,
  kelasId: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Penugasan Kelas Baru",
    message: `Anda ditugaskan mengajar "${mataKuliahNama} - ${kelasNama}" (${jumlahMahasiswa} mahasiswa)`,
    type: "dosen_changed",
    data: {
      kelas_id: kelasId,
      jumlah_mahasiswa: jumlahMahasiswa,
    },
  });
}

/**
 * Notify old dosen when removed from a kelas
 */
export async function notifyDosenRemoval(
  dosenUserId: string,
  kelasNama: string,
  mataKuliahNama: string,
  dosenPenggantiNama: string,
  kelasId: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Perubahan Penugasan Kelas",
    message: `Kelas "${mataKuliahNama} - ${kelasNama}" Anda telah dialihkan ke ${dosenPenggantiNama}`,
    type: "dosen_changed",
    data: {
      kelas_id: kelasId,
      dosen_pengganti: dosenPenggantiNama,
    },
  });
}
