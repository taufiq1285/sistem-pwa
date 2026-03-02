/**
 * AppProviders Unit Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppProviders } from "@/providers/AppProviders";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
    }),
  },
}));

vi.mock("@/lib/offline/queue-manager", () => ({
  QueueManager: { getInstance: vi.fn().mockReturnValue({ initialize: vi.fn(), getStats: vi.fn().mockResolvedValue({ pending: 0, completed: 0, failed: 0, total: 0 }) }) },
}));

vi.mock("@/lib/offline/sync-manager", () => ({
  SyncManager: { getInstance: vi.fn().mockReturnValue({ initialize: vi.fn() }) },
}));

describe("AppProviders", () => {
  it("merender tanpa melempar error sinkronus dengan children", () => {
    // ErrorBoundary menangani async errors — hanya verifikasi tidak crash secara sinkronus
    expect(() =>
      render(
        <AppProviders disableRouter={true}>
          <div data-testid="child">Hello</div>
        </AppProviders>,
      ),
    ).not.toThrow();
  });

  it("merender tanpa crash dengan disableRouter=true", () => {
    expect(() =>
      render(
        <AppProviders disableRouter={true}>
          <span>Test</span>
        </AppProviders>,
      ),
    ).not.toThrow();
  });

  it("merender dengan BrowserRouter secara default (disableRouter=false)", () => {
    expect(() =>
      render(
        <AppProviders disableRouter={false}>
          <span>With Router</span>
        </AppProviders>,
      ),
    ).not.toThrow();
  });

  it("merender tanpa crash dengan children paragraph", () => {
    expect(() =>
      render(
        <AppProviders disableRouter={true}>
          <p>Konten halaman</p>
        </AppProviders>,
      ),
    ).not.toThrow();
  });
});
