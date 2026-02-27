import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClient } from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {},
    from: vi.fn(),
  })),
}));

describe("supabase/client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("throws error when VITE_SUPABASE_URL is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");

    await expect(import("@/lib/supabase/client")).rejects.toThrow(
      "Missing VITE_SUPABASE_URL environment variable",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("throws error when VITE_SUPABASE_ANON_KEY is missing", async () => {
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    await expect(import("@/lib/supabase/client")).rejects.toThrow(
      "Missing VITE_SUPABASE_ANON_KEY environment variable",
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("creates client with expected config", async () => {
    const module = await import("@/lib/supabase/client");

    expect(module.supabase).toBeDefined();
    expect(createClient).toHaveBeenCalledTimes(1);

    const [url, key, options] = vi.mocked(createClient).mock.calls[0];

    expect(url).toBe("https://example.supabase.co");
    expect(key).toBe("anon-key");

    expect(options).toMatchObject({
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-application-name": "sistem-praktikum-pwa",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    });

    expect(options?.auth?.storage).toBe(window.localStorage);
    expect(typeof options?.global?.fetch).toBe("function");
  });

  it("uses custom fetch that passes AbortSignal", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    await import("@/lib/supabase/client");
    const [, , options] = vi.mocked(createClient).mock.calls[0];

    await options?.global?.fetch?.("https://example.com/test", {
      method: "GET",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe("https://example.com/test");
    expect(calledOptions.method).toBe("GET");
    expect(calledOptions.signal).toBeInstanceOf(AbortSignal);
  });
});
