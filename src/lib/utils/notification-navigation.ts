import type { Notification } from "@/types/notification.types";
import { getRoleNotificationPath, ROUTES } from "@/config/routes.config";

type NotificationRole = "mahasiswa" | "dosen" | "laboran" | "admin";

export function getNotificationNavigationTarget(
  notification: Notification,
  role?: NotificationRole | null,
): string | null {
  if (
    (notification.type === "tugas_baru" ||
      notification.type === "kuis_published") &&
    notification.data?.kuis_id
  ) {
    return ROUTES.MAHASISWA.KUIS.LIST;
  }

  if (
    notification.type === "tugas_submitted" &&
    notification.data?.attempt_id &&
    notification.data?.kuis_id
  ) {
    return `/dosen/kuis/${notification.data.kuis_id}/results?attempt=${notification.data.attempt_id}`;
  }

  if (
    notification.type === "tugas_graded" &&
    notification.data?.attempt_id &&
    notification.data?.kuis_id
  ) {
    return `/mahasiswa/kuis/${notification.data.kuis_id}/result/${notification.data.attempt_id}`;
  }

  if (notification.type === "perbaikan_nilai_request") {
    return ROUTES.DOSEN.PENILAIAN;
  }

  if (notification.type === "perbaikan_nilai_response") {
    return ROUTES.MAHASISWA.NILAI;
  }

  if (notification.type === "materi_baru") {
    return ROUTES.MAHASISWA.MATERI;
  }

  if (notification.type === "logbook_submitted") {
    return ROUTES.DOSEN.LOGBOOK_REVIEW;
  }

  if (
    notification.type === "logbook_approved" ||
    notification.type === "logbook_rejected" ||
    notification.type === "logbook_revision"
  ) {
    return ROUTES.MAHASISWA.LOGBOOK;
  }

  if (notification.type === "peminjaman_baru") {
    return ROUTES.LABORAN.PEMINJAMAN;
  }

  if (
    notification.type === "peminjaman_disetujui" ||
    notification.type === "peminjaman_ditolak"
  ) {
    return ROUTES.DOSEN.PEMINJAMAN;
  }

  if (notification.type === "jadwal_pending_approval") {
    return ROUTES.LABORAN.JADWAL;
  }

  if (notification.type.startsWith("jadwal_") && role) {
    switch (role) {
      case "dosen":
        return ROUTES.DOSEN.JADWAL;
      case "mahasiswa":
        return ROUTES.MAHASISWA.JADWAL;
      case "laboran":
        return ROUTES.LABORAN.JADWAL;
      default:
        return null;
    }
  }

  if (
    (notification.type === "pengumuman" || notification.type === "sistem") &&
    role
  ) {
    return getRoleNotificationPath(role);
  }

  if (role) {
    return getRoleNotificationPath(role);
  }

  return null;
}
