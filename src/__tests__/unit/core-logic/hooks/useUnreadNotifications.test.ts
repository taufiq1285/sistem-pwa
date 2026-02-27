import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUnreadNotifications } from "@/lib/hooks/useUnreadNotifications";
import type { Pengumuman } from "@/types/common.types";

const mockUseAuth = vi.fn();
const mockGetAllAnnouncements = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/lib/api/announcements.api", () => ({
  getAllAnnouncements: (...args: any[]) => mockGetAllAnnouncements(...args),
}));

let idCounter = 0;
function createAnnouncement(partial: Partial<Pengumuman>): Pengumuman {
  idCounter += 1;
  return {
    id: partial.id ?? `ann-${idCounter}`,
    judul: partial.judul ?? "Judul",
    konten: partial.konten ?? "Konten",
    tipe: partial.tipe ?? "info",
    prioritas: partial.prioritas ?? "normal",
    target_role: partial.target_role ?? ["mahasiswa"],
    tanggal_mulai: partial.tanggal_mulai ?? null,
    tanggal_selesai: partial.tanggal_selesai ?? null,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
    attachment_url: partial.attachment_url ?? null,
    target_kelas_id: partial.target_kelas_id ?? null,
    ...partial,
  } as Pengumuman;
}

describe("useUnreadNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idCounter = 0;

    mockUseAuth.mockReturnValue({
      user: { id: "u-1", role: "mahasiswa" },
    });

    mockGetAllAnnouncements.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("mengembalikan kosong dan tidak memanggil API jika user tidak ada", async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(mockGetAllAnnouncements).not.toHaveBeenCalled();
  });

  it("mengembalikan kosong dan tidak memanggil API jika role admin", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", role: "admin" },
    });

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(mockGetAllAnnouncements).not.toHaveBeenCalled();
  });

  it("memfilter announcement sesuai role dan rentang aktif", async () => {
    const nowIso = "2026-02-26T12:00:00.000Z";

    const activeForRole = createAnnouncement({
      id: "a-1",
      target_role: ["mahasiswa"],
      tanggal_mulai: "2026-02-26T11:59:00.000Z",
      tanggal_selesai: "2026-02-26T12:01:00.000Z",
      created_at: "2026-02-25T12:00:00.000Z",
    });

    const roleMismatch = createAnnouncement({
      id: "a-2",
      target_role: ["dosen"],
      tanggal_mulai: null,
      tanggal_selesai: null,
    });

    const notStartedYet = createAnnouncement({
      id: "a-3",
      target_role: ["mahasiswa"],
      tanggal_mulai: "2026-02-26T12:01:00.000Z",
      tanggal_selesai: null,
    });

    const alreadyEnded = createAnnouncement({
      id: "a-4",
      target_role: ["mahasiswa"],
      tanggal_mulai: null,
      tanggal_selesai: "2026-02-26T11:59:00.000Z",
    });

    const forAllRoles = createAnnouncement({
      id: "a-5",
      target_role: [],
      tanggal_mulai: null,
      tanggal_selesai: null,
      created_at: "2026-02-24T12:00:00.000Z",
    });

    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(nowIso);

    mockGetAllAnnouncements.mockResolvedValue([
      activeForRole,
      roleMismatch,
      notStartedYet,
      alreadyEnded,
      forAllRoles,
    ]);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    expect(result.current.notifications.map((n) => n.id)).toEqual([
      "a-1",
      "a-5",
    ]);
    expect(result.current.unreadCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("mengurutkan high priority lebih dulu lalu created_at terbaru", async () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-02-26T12:00:00.000Z",
    );

    const normalNewest = createAnnouncement({
      id: "n-new",
      prioritas: "normal",
      target_role: ["mahasiswa"],
      created_at: "2026-02-26T11:00:00.000Z",
    });

    const highOlder = createAnnouncement({
      id: "h-old",
      prioritas: "high",
      target_role: ["mahasiswa"],
      created_at: "2026-02-26T09:00:00.000Z",
    });

    const highNewest = createAnnouncement({
      id: "h-new",
      prioritas: "high",
      target_role: ["mahasiswa"],
      created_at: "2026-02-26T11:30:00.000Z",
    });

    mockGetAllAnnouncements.mockResolvedValue([
      normalNewest,
      highOlder,
      highNewest,
    ]);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(3));

    expect(result.current.notifications.map((n) => n.id)).toEqual([
      "h-new",
      "h-old",
      "n-new",
    ]);
  });

  it("menghitung unread hanya untuk announcement dalam 7 hari", async () => {
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-02-26T12:00:00.000Z").getTime(),
    );
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-02-26T12:00:00.000Z",
    );

    const within7Days = createAnnouncement({
      id: "u-1",
      target_role: ["mahasiswa"],
      created_at: "2026-02-20T12:00:00.000Z",
    });

    const olderThan7Days = createAnnouncement({
      id: "u-2",
      target_role: ["mahasiswa"],
      created_at: "2026-02-18T12:00:00.000Z",
    });

    const noCreatedAt = createAnnouncement({
      id: "u-3",
      target_role: ["mahasiswa"],
      created_at: null,
    });

    mockGetAllAnnouncements.mockResolvedValue([
      within7Days,
      olderThan7Days,
      noCreatedAt,
    ]);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => expect(result.current.notifications).toHaveLength(3));

    expect(result.current.unreadCount).toBe(1);
  });

  it("menangani error API dan reset state", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockGetAllAnnouncements.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("boom");
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it("refresh memanggil load ulang data", async () => {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-02-26T12:00:00.000Z",
    );

    mockGetAllAnnouncements
      .mockResolvedValueOnce([createAnnouncement({ id: "first" })])
      .mockResolvedValueOnce([createAnnouncement({ id: "second" })]);

    const { result } = renderHook(() => useUnreadNotifications());

    await waitFor(() => {
      expect(result.current.notifications.map((n) => n.id)).toEqual(["first"]);
    });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.notifications.map((n) => n.id)).toEqual(["second"]);
    });

    expect(mockGetAllAnnouncements).toHaveBeenCalledTimes(2);
  });

  it("auto-refresh setiap 60 detik", async () => {
    vi.useFakeTimers();
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
      "2026-02-26T12:00:00.000Z",
    );

    mockGetAllAnnouncements.mockResolvedValue([
      createAnnouncement({ id: "a" }),
    ]);

    renderHook(() => useUnreadNotifications());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetAllAnnouncements).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(mockGetAllAnnouncements).toHaveBeenCalledTimes(2);
  });
});
