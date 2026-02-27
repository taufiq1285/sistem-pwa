import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startSupabaseWarmup } from "@/lib/supabase/warmup";
import { logger } from "@/lib/utils/logger";

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("startSupabaseWarmup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("mengembalikan noop jika disabled", () => {
    const stop = startSupabaseWarmup({ enabled: false });

    expect(typeof stop).toBe("function");
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("⏸️ Supabase warm-up disabled");
  });

  it("skip jika pingUrl kosong", () => {
    const stop = startSupabaseWarmup({ enabled: true, pingUrl: "" });

    expect(typeof stop).toBe("function");
    expect(fetch).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "⚠️ Supabase warm-up skipped: ping URL not configured",
    );
  });

  it("menjalankan warm-up saat startup jika runOnStart true", async () => {
    const stop = startSupabaseWarmup({
      enabled: true,
      pingUrl: "https://example.supabase.co/rest/v1/",
      runOnStart: true,
      intervalMs: 60_000,
      timeoutMs: 5000,
      respectOnlineStatus: false,
      onlyWhenVisible: false,
    });

    await Promise.resolve();
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/",
      expect.objectContaining({
        method: "GET",
        cache: "no-cache",
        mode: "cors",
      }),
    );

    expect(logger.info).toHaveBeenCalledWith(
      "✅ Supabase warm-up started",
      expect.objectContaining({ intervalMs: 60_000 }),
    );

    stop();
  });

  it("event online memicu warm-up", async () => {
    const stop = startSupabaseWarmup({
      enabled: true,
      pingUrl: "https://example.supabase.co/rest/v1/",
      runOnStart: false,
      intervalMs: 60_000,
      respectOnlineStatus: false,
      onlyWhenVisible: false,
    });

    expect(fetch).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("online"));

    await Promise.resolve();
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);

    stop();
  });

  it("cleanup menghentikan interval dan melepas event listener", async () => {
    const removeWindowSpy = vi.spyOn(window, "removeEventListener");
    const removeDocumentSpy = vi.spyOn(document, "removeEventListener");

    const stop = startSupabaseWarmup({
      enabled: true,
      pingUrl: "https://example.supabase.co/rest/v1/",
      runOnStart: false,
      intervalMs: 10_000,
      respectOnlineStatus: false,
      onlyWhenVisible: false,
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).toHaveBeenCalledTimes(1);

    stop();

    await vi.advanceTimersByTimeAsync(20_000);
    expect(fetch).toHaveBeenCalledTimes(1);

    expect(removeWindowSpy).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
    expect(removeDocumentSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(logger.info).toHaveBeenCalledWith("🛑 Supabase warm-up stopped");
  });
});
