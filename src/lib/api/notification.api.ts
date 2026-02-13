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
import { cacheAPI } from "@/lib/offline/api-cache";
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
  // Create cache key from filters
  const cacheKey = `notifications_${JSON.stringify(filters)}`;

  return cacheAPI(
    cacheKey,
    async () => {
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
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes cache
      staleWhileRevalidate: true, // Return stale data while fetching fresh
    },
  );
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
 * Returns null if fails (best-effort approach)
 */
export async function createNotification(
  data: CreateNotificationData,
): Promise<Notification | null> {
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

    if (error) {
      console.error("createNotification error:", error);
      // Don't throw - return null to prevent blocking main operations
      return null;
    }

    return notification as Notification;
  } catch (error) {
    console.error("createNotification error:", error);
    // Don't throw - return null to prevent blocking main operations
    return null;
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

    if (error) {
      console.error("createBulkNotifications error:", error);
      // Don't throw - return empty array if notification fails
      // This is a best-effort operation that shouldn't block main operations
      return [];
    }

    return (data || []) as Notification[];
  } catch (error) {
    console.error("createBulkNotifications error:", error);
    // Don't throw - return empty array to prevent blocking main operations
    return [];
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Mark notification as read
 */
export async function markAsRead(
  notificationId: string,
): Promise<Notification> {
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
 * Returns null if notification fails (best-effort)
 */
export async function notifyDosenTugasSubmitted(
  dosenId: string,
  mahasiswaNama: string,
  tugasNama: string,
  attemptId: string,
  kuisId: string,
): Promise<Notification | null> {
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

// ============================================================================
// HIGH PRIORITY NOTIFICATIONS: Peminjaman Alat
// ============================================================================

/**
 * Notify laboran when dosen creates borrowing request
 */
export async function notifyLaboranPeminjamanBaru(
  laboranUserIds: string[],
  dosenNama: string,
  namaBarang: string,
  jumlahPinjam: number,
  tanggalPinjam: string,
  keperluan: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = laboranUserIds.map(
    (laboranId) => ({
      user_id: laboranId,
      title: "Pengajuan Peminjaman Baru",
      message: `${dosenNama} mengajukan peminjaman ${jumlahPinjam}x "${namaBarang}" untuk ${tanggalPinjam}. Keperluan: ${keperluan}`,
      type: "peminjaman_baru",
      data: {
        dosen: dosenNama,
        barang: namaBarang,
        jumlah: jumlahPinjam,
        tanggal: tanggalPinjam,
        keperluan: keperluan,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

/**
 * Notify dosen when laboran approves borrowing request
 */
export async function notifyDosenPeminjamanDisetujui(
  dosenUserId: string,
  namaBarang: string,
  jumlahDisetujui: number,
  tanggalPinjam: string,
  tanggalKembali: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Peminjaman Disetujui",
    message: `Peminjaman ${jumlahDisetujui}x "${namaBarang}" untuk ${tanggalPinjam} telah disetujui. Harap kembalikan pada ${tanggalKembali}.`,
    type: "peminjaman_disetujui",
    data: {
      barang: namaBarang,
      jumlah: jumlahDisetujui,
      tanggal_pinjam: tanggalPinjam,
      tanggal_kembali: tanggalKembali,
    },
  });
}

/**
 * Notify dosen when laboran rejects borrowing request
 */
export async function notifyDosenPeminjamanDitolak(
  dosenUserId: string,
  namaBarang: string,
  alasan: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Peminjaman Ditolak",
    message: `Peminjaman "${namaBarang}" ditolak. ${alasan ? `Alasan: ${alasan}` : ""}`,
    type: "peminjaman_ditolak",
    data: {
      barang: namaBarang,
      alasan: alasan,
    },
  });
}

/**
 * Notify laboran when peminjaman is returned late
 */
export async function notifyLaboranPeminjamanTerlambat(
  laboranUserIds: string[],
  dosenNama: string,
  namaBarang: string,
  tanggalRencana: string,
  tanggalAktual: string,
  selisihHari: number,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = laboranUserIds.map(
    (laboranId) => ({
      user_id: laboranId,
      title: "Peminjaman Terlambat!",
      message: `${dosenNama} terlambat mengembalikan "${namaBarang}". Rencana: ${tanggalRencana}, Aktual: ${tanggalAktual} (${selisihHari} hari terlambat).`,
      type: "peminjaman_terlambat",
      data: {
        dosen: dosenNama,
        barang: namaBarang,
        tanggal_rencana: tanggalRencana,
        tanggal_aktual: tanggalAktual,
        selisih_hari: selisihHari,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

// ============================================================================
// HIGH PRIORITY NOTIFICATIONS: Jadwal
// ============================================================================

/**
 * Notify dosen when admin creates new jadwal
 */
export async function notifyDosenJadwalBaru(
  dosenUserId: string,
  mataKuliahNama: string,
  kelasNama: string,
  tanggalPraktikum: string,
  laboratorium: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Jadwal Praktikum Baru",
    message: `Jadwal praktikum "${mataKuliahNama} - ${kelasNama}" telah dibuat untuk ${tanggalPraktikum} di ${laboratorium}.`,
    type: "jadwal_baru",
    data: {
      mata_kuliah: mataKuliahNama,
      kelas: kelasNama,
      tanggal: tanggalPraktikum,
      laboratorium: laboratorium,
    },
  });
}

/**
 * Notify dosen when admin updates jadwal
 */
export async function notifyDosenJadwalDiupdate(
  dosenUserId: string,
  mataKuliahNama: string,
  kelasNama: string,
  tanggalPraktikum: string,
  perubahan: string[],
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Jadwal Praktikum Diupdate",
    message: `Jadwal "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum}) telah diupdate. Perubahan: ${perubahan.join(", ")}.`,
    type: "jadwal_diupdate",
    data: {
      mata_kuliah: mataKuliahNama,
      kelas: kelasNama,
      tanggal: tanggalPraktikum,
      perubahan: perubahan,
    },
  });
}

/**
 * Notify laboran when dosen creates/updates jadwal (for approval)
 */
export async function notifyLaboranJadwalBaru(
  laboranUserIds: string[],
  dosenNama: string,
  mataKuliahNama: string,
  kelasNama: string,
  tanggalPraktikum: string,
  laboratorium: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = laboranUserIds.map(
    (laboranId) => ({
      user_id: laboranId,
      title: "Jadwal Baru Menunggu Approval",
      message: `${dosenNama} membuat jadwal praktikum "${mataKuliahNama} - ${kelasNama}" untuk ${tanggalPraktikum} di ${laboratorium}.`,
      type: "jadwal_pending_approval",
      data: {
        dosen: dosenNama,
        mata_kuliah: mataKuliahNama,
        kelas: kelasNama,
        tanggal: tanggalPraktikum,
        laboratorium: laboratorium,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

/**
 * Notify all mahasiswa in a kelas when jadwal is created/updated/canceled
 */
export async function notifyMahasiswaJadwalChange(
  mahasiswaUserIds: string[],
  mataKuliahNama: string,
  kelasNama: string,
  tanggalPraktikum: string,
  aksi: "baru" | "diupdate" | "dibatalkan",
  details?: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = mahasiswaUserIds.map(
    (mahasiswaId) => ({
      user_id: mahasiswaId,
      title: `Jadwal ${aksi.charAt(0).toUpperCase() + aksi.slice(1)}`,
      message: `Jadwal praktikum "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum}) ${aksi}${details ? `. ${details}` : ""}`,
      type: `jadwal_${aksi}`,
      data: {
        mata_kuliah: mataKuliahNama,
        kelas: kelasNama,
        tanggal: tanggalPraktikum,
        aksi: aksi,
        details: details,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

// ============================================================================
// HIGH PRIORITY NOTIFICATIONS: Kuis Published
// ============================================================================

/**
 * Notify all mahasiswa in a kelas when dosen publishes kuis
 */
export async function notifyMahasiswaKuisPublished(
  mahasiswaUserIds: string[],
  dosenNama: string,
  kuisNama: string,
  kelasNama: string,
  deadline: string,
  kuisId: string,
): Promise<Notification[]> {
  const notifications: CreateNotificationData[] = mahasiswaUserIds.map(
    (mahasiswaId) => ({
      user_id: mahasiswaId,
      title: "Kuis Tersedia",
      message: `${dosenNama} telah mempublish kuis "${kuisNama}" untuk kelas ${kelasNama}. Deadline: ${deadline}`,
      type: "kuis_published",
      data: {
        kuis_id: kuisId,
        kuis: kuisNama,
        dosen: dosenNama,
        kelas: kelasNama,
        deadline: deadline,
      },
    }),
  );

  return createBulkNotifications(notifications);
}

// ============================================================================
// HIGH PRIORITY NOTIFICATIONS: Logbook
// ============================================================================

/**
 * Notify dosen when mahasiswa submits logbook
 */
export async function notifyDosenLogbookSubmitted(
  dosenUserId: string,
  mahasiswaNama: string,
  kelasNama: string,
  mataKuliahNama: string,
  tanggalPraktikum: string,
  logbookId: string,
): Promise<Notification> {
  return createNotification({
    user_id: dosenUserId,
    title: "Logbook Dikirim",
    message: `${mahasiswaNama} telah mengirim logbook untuk praktikum "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum})`,
    type: "logbook_submitted",
    data: {
      mahasiswa: mahasiswaNama,
      kelas: kelasNama,
      mata_kuliah: mataKuliahNama,
      tanggal: tanggalPraktikum,
      logbook_id: logbookId,
    },
  });
}

/**
 * Notify mahasiswa when dosen approves logbook
 */
export async function notifyMahasiswaLogbookApproved(
  mahasiswaUserId: string,
  kelasNama: string,
  mataKuliahNama: string,
  tanggalPraktikum: string,
): Promise<Notification> {
  return createNotification({
    user_id: mahasiswaUserId,
    title: "Logbook Disetujui",
    message: `Logbook praktikum "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum}) telah disetujui.`,
    type: "logbook_approved",
    data: {
      kelas: kelasNama,
      mata_kuliah: mataKuliahNama,
      tanggal: tanggalPraktikum,
    },
  });
}

/**
 * Notify mahasiswa when dosen rejects logbook
 */
export async function notifyMahasiswaLogbookRejected(
  mahasiswaUserId: string,
  kelasNama: string,
  mataKuliahNama: string,
  tanggalPraktikum: string,
  catatan: string,
): Promise<Notification> {
  return createNotification({
    user_id: mahasiswaUserId,
    title: "Logbook Perlu Diperbaiki",
    message: `Logbook praktikum "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum}) ditolak/perlu perbaiki. ${catatan ? `Catatan: ${catatan}` : ""}`,
    type: "logbook_rejected",
    data: {
      kelas: kelasNama,
      mata_kuliah: mataKuliahNama,
      tanggal: tanggalPraktikum,
      catatan: catatan,
    },
  });
}

/**
 * Notify mahasiswa when dosen requests logbook revision
 */
export async function notifyMahasiswaLogbookRevision(
  mahasiswaUserId: string,
  kelasNama: string,
  mataKuliahNama: string,
  tanggalPraktikum: string,
  catatan: string,
): Promise<Notification> {
  return createNotification({
    user_id: mahasiswaUserId,
    title: "Permintaan Perbaikan Logbook",
    message: `Logbook praktikum "${mataKuliahNama} - ${kelasNama}" (${tanggalPraktikum}) perlu diperbaiki. ${catatan}`,
    type: "logbook_revision",
    data: {
      kelas: kelasNama,
      mata_kuliah: mataKuliahNama,
      tanggal: tanggalPraktikum,
      catatan: catatan,
    },
  });
}

// ============================================================================
// HIGH PRIORITY NOTIFICATIONS: Announcement (Admin → All Roles)
// ============================================================================

/**
 * Notify target roles when admin creates announcement
 * @param targetRoles - Array of roles to notify (e.g., ['dosen', 'mahasiswa'])
 * @param judul - Announcement title
 * @param tipe - Announcement type (info, warning, urgent, maintenance)
 * @param prioritas - Priority level (low, normal, high)
 */
export async function notifyUsersAnnouncement(
  targetRoles: string[],
  judul: string,
  tipe: string,
  prioritas: string,
): Promise<void> {
  try {
    console.log("🔔 [ANNOUNCEMENT] Starting notification process...");
    console.log("🔔 [ANNOUNCEMENT] Target roles:", targetRoles);
    console.log("🔔 [ANNOUNCEMENT] Judul:", judul);

    // Fetch all user IDs for target roles
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, email, role")
      .in("role", targetRoles);

    if (fetchError) {
      console.error("❌ [ANNOUNCEMENT] Error fetching users:", fetchError);
      throw fetchError;
    }

    if (!users || users.length === 0) {
      console.log(
        "⚠️ [ANNOUNCEMENT] No users found for target roles:",
        targetRoles,
      );
      return;
    }

    console.log(
      `✅ [ANNOUNCEMENT] Found ${users.length} users:`,
      users.map((u) => `${u.role} (${u.email})`),
    );

    // Determine icon and message based on priority
    const priorityEmoji =
      prioritas === "high" ? "🔴" : prioritas === "normal" ? "📢" : "ℹ️";
    const typeLabel = tipe.charAt(0).toUpperCase() + tipe.slice(1);

    // Create notification for each user
    const notifications = users.map((user) => ({
      user_id: user.id,
      title: `${priorityEmoji} ${typeLabel}: ${judul}`,
      message: `Ada pengumuman ${tipe} baru dari admin. Silakan cek halaman Pengumuman.`,
      type: "pengumuman",
      data: {
        source: "admin",
        announcement_title: judul,
        announcement_type: tipe,
        announcement_priority: prioritas,
      },
    }));

    console.log(
      `📝 [ANNOUNCEMENT] Prepared ${notifications.length} notifications`,
    );

    // Batch insert notifications
    const { data: insertedData, error: insertError } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (insertError) {
      console.error(
        "❌ [ANNOUNCEMENT] Error inserting notifications:",
        insertError,
      );
      console.error(
        "❌ [ANNOUNCEMENT] Error details:",
        JSON.stringify(insertError, null, 2),
      );
      throw insertError;
    }

    console.log(
      `✅ [ANNOUNCEMENT] Successfully sent ${notifications.length} notifications!`,
    );
    console.log("✅ [ANNOUNCEMENT] Inserted data:", insertedData);
  } catch (error) {
    console.error("💥 [ANNOUNCEMENT] CRITICAL ERROR:", error);
    throw error;
  }
}
