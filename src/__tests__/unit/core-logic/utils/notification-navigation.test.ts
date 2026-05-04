import { describe, expect, it } from "vitest";
import { ROUTES } from "@/config/routes.config";
import { getNotificationNavigationTarget } from "@/lib/utils/notification-navigation";
import type { Notification } from "@/types/notification.types";

function buildNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: "notif-1",
    user_id: "user-1",
    type: "sistem",
    title: "Sistem",
    message: "Pesan sistem",
    is_read: false,
    created_at: new Date().toISOString(),
    data: null,
    ...overrides,
  };
}

describe("getNotificationNavigationTarget", () => {
  it("mengarah ke peminjaman laboran untuk notifikasi peminjaman baru", () => {
    const target = getNotificationNavigationTarget(
      buildNotification({ type: "peminjaman_baru" }),
      "laboran",
    );

    expect(target).toBe(ROUTES.LABORAN.PEMINJAMAN);
  });

  it("mengarah ke jadwal laboran untuk notifikasi jadwal pending approval", () => {
    const target = getNotificationNavigationTarget(
      buildNotification({ type: "jadwal_pending_approval" }),
      "laboran",
    );

    expect(target).toBe(ROUTES.LABORAN.JADWAL);
  });

  it("mengarah ke jadwal sesuai role untuk notifikasi jadwal umum", () => {
    const target = getNotificationNavigationTarget(
      buildNotification({ type: "jadwal_diupdate" }),
      "laboran",
    );

    expect(target).toBe(ROUTES.LABORAN.JADWAL);
  });

  it("mengarah ke halaman notifikasi role untuk pengumuman umum", () => {
    const target = getNotificationNavigationTarget(
      buildNotification({ type: "pengumuman" }),
      "laboran",
    );

    expect(target).toBe(ROUTES.LABORAN.NOTIFIKASI);
  });

  it("mengembalikan null untuk jadwal umum jika role tidak diketahui", () => {
    const target = getNotificationNavigationTarget(
      buildNotification({ type: "jadwal_diupdate" }),
      undefined,
    );

    expect(target).toBeNull();
  });
});
