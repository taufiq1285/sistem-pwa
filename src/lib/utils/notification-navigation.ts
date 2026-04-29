import type { Notification } from "@/types/notification.types";

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
    return "/mahasiswa/kuis";
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
    return "/dosen/penilaian";
  }

  if (notification.type === "perbaikan_nilai_response") {
    return "/mahasiswa/nilai";
  }

  if (notification.type === "materi_baru") {
    return "/mahasiswa/materi";
  }

  if (notification.type === "logbook_submitted") {
    return "/dosen/logbook-review";
  }

  if (
    notification.type === "logbook_approved" ||
    notification.type === "logbook_rejected" ||
    notification.type === "logbook_revision"
  ) {
    return "/mahasiswa/logbook";
  }

  if (notification.type === "peminjaman_baru") {
    return "/laboran/peminjaman";
  }

  if (
    notification.type === "peminjaman_disetujui" ||
    notification.type === "peminjaman_ditolak"
  ) {
    return "/dosen/peminjaman";
  }

  if (notification.type === "jadwal_pending_approval") {
    return "/laboran/jadwal";
  }

  if (notification.type.startsWith("jadwal_") && role) {
    return `/${role}/jadwal`;
  }

  if (
    (notification.type === "pengumuman" || notification.type === "sistem") &&
    role
  ) {
    return `/${role}/notifikasi`;
  }

  if (role) {
    return `/${role}/notifikasi`;
  }

  return null;
}
