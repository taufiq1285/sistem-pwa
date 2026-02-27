import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockIsOnline = vi.fn();

vi.mock("@/lib/offline/network-detector", () => ({
  networkDetector: {
    isOnline: () => mockIsOnline(),
  },
}));

import {
  isOffline,
  withOfflineFallback,
  withOfflineFallbackAll,
  shouldSkipApiCall,
  logOfflineMode,
  logApiError,
} from "@/lib/offline/offline-api-helper";

describe("offline-api-helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnline.mockReturnValue(true);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("isOffline true saat networkDetector offline", () => {
    mockIsOnline.mockReturnValue(false);
    expect(isOffline()).toBe(true);
  });

  it("withOfflineFallback saat offline mengembalikan cached", async () => {
    mockIsOnline.mockReturnValue(false);
    const fn = vi.fn().mockResolvedValue([9]);

    const result = await withOfflineFallback(fn, { cached: [1, 2, 3] });

    expect(result).toEqual([1, 2, 3]);
    expect(fn).not.toHaveBeenCalled();
  });

  it("withOfflineFallback saat offline pakai defaultValue jika cached tidak ada", async () => {
    mockIsOnline.mockReturnValue(false);

    const result = await withOfflineFallback(async () => "x", {
      defaultValue: "fallback",
    });

    expect(result).toBe("fallback");
  });

  it("withOfflineFallback saat online menjalankan fn", async () => {
    mockIsOnline.mockReturnValue(true);
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await withOfflineFallback(fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("withOfflineFallback saat fn error dan skipOnError=true mengembalikan fallback", async () => {
    mockIsOnline.mockReturnValue(true);

    const result = await withOfflineFallback(
      async () => {
        throw new Error("boom");
      },
      { defaultValue: "safe", skipOnError: true },
    );

    expect(result).toBe("safe");
    expect(console.warn).toHaveBeenCalled();
  });

  it("withOfflineFallback saat fn error dan skipOnError=false melempar error", async () => {
    mockIsOnline.mockReturnValue(true);

    await expect(
      withOfflineFallback(
        async () => {
          throw new Error("fatal");
        },
        { skipOnError: false },
      ),
    ).rejects.toThrow("fatal");
  });

  it("withOfflineFallbackAll saat online menjalankan semua fn", async () => {
    mockIsOnline.mockReturnValue(true);

    const result = await withOfflineFallbackAll<number>([
      async () => 1,
      async () => 2,
      async () => 3,
    ]);

    expect(result).toEqual([1, 2, 3]);
  });

  it("withOfflineFallbackAll saat offline mengembalikan default []/fallback", async () => {
    mockIsOnline.mockReturnValue(false);

    const fromDefault = await withOfflineFallbackAll([async () => 1], {
      defaultValue: [7, 8],
    });
    expect(fromDefault).toEqual([7, 8]);

    const fromEmpty = await withOfflineFallbackAll([async () => 1]);
    expect(fromEmpty).toEqual([]);
  });

  it("shouldSkipApiCall mengikuti status offline", () => {
    mockIsOnline.mockReturnValue(false);
    expect(shouldSkipApiCall()).toBe(true);

    mockIsOnline.mockReturnValue(true);
    expect(shouldSkipApiCall()).toBe(false);
  });

  it("logOfflineMode dan logApiError menulis log sesuai kondisi", () => {
    logOfflineMode("fetch-jadwal");
    expect(console.log).toHaveBeenCalledWith(
      "ℹ️ Offline mode - skipping fetch-jadwal, using cached data",
    );

    mockIsOnline.mockReturnValue(false);
    logApiError("sync-data", new Error("x"));
    expect(console.log).toHaveBeenCalledWith(
      "ℹ️ Offline mode - sync-data unavailable",
    );

    mockIsOnline.mockReturnValue(true);
    const err = new Error("api fail");
    logApiError("sync-data", err);
    expect(console.error).toHaveBeenCalledWith("❌ Error in sync-data:", err);
  });
});
