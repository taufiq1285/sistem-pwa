import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UpdatePrompt } from "@/components/common/UpdatePrompt";

describe("UpdatePrompt", () => {
  it("tidak tampil saat open=false", () => {
    render(
      <UpdatePrompt open={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />,
    );

    expect(screen.queryByText("Update Tersedia")).not.toBeInTheDocument();
  });

  it("menampilkan banner update dan memicu aksi yang benar", async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();

    render(<UpdatePrompt open onUpdate={onUpdate} onDismiss={onDismiss} />);

    expect(screen.getByText("Update Tersedia")).toBeInTheDocument();
    expect(
      screen.getByText("Versi baru aplikasi sudah tersedia."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Perbarui Sekarang" }));
    expect(onUpdate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Nanti" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
