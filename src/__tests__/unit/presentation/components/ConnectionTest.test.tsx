import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectionTest } from "@/components/common/ConnectionTest";

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockSupabase = vi.mocked(await import("@/lib/supabase/client")).supabase;

describe("ConnectionTest", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubEnv("VITE_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv(
      "VITE_SUPABASE_ANON_KEY",
      "anon-key-very-long-example-1234567890",
    );
  });

  it("menampilkan status connected saat query sukses", async () => {
    const select = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    (mockSupabase.from as any).mockReturnValue({ select });

    render(<ConnectionTest />);

    expect(
      await screen.findByText(
        "✅ Connected to Supabase! Database schema is ready.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Test Again" }),
    ).toBeInTheDocument();
  });

  it("menampilkan status error saat query gagal", async () => {
    const select = vi.fn().mockResolvedValue({
      error: new Error("DB unavailable"),
    });

    (mockSupabase.from as any).mockReturnValue({ select });

    render(<ConnectionTest />);

    expect(
      await screen.findByText("❌ Connection failed: DB unavailable"),
    ).toBeInTheDocument();
  });

  it("klik tombol Test Again memicu test ulang", async () => {
    const select = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: null });

    (mockSupabase.from as any).mockReturnValue({ select });

    render(<ConnectionTest />);

    await screen.findByText(
      "✅ Connected to Supabase! Database schema is ready.",
    );

    await userEvent.click(screen.getByRole("button", { name: "Test Again" }));

    await waitFor(() => {
      expect(select).toHaveBeenCalledTimes(4);
    });
  });
});
