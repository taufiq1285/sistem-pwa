import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictFieldRow } from "@/components/features/sync/ConflictFieldRow";

describe("ConflictFieldRow", () => {
  it("menampilkan field label dan nilai local/remote", () => {
    render(
      <ConflictFieldRow
        conflict={{
          field: "nama_mk",
          localValue: "Anatomi",
          remoteValue: "Fisiologi",
          reason: "Updated in both places",
        }}
        selectedWinner="remote"
        onWinnerChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Nama Mk")).toBeInTheDocument();
    expect(screen.getByText("nama_mk")).toBeInTheDocument();
    expect(screen.getByText("Anatomi")).toBeInTheDocument();
    expect(screen.getByText("Fisiologi")).toBeInTheDocument();
    expect(screen.getByText(/updated in both places/i)).toBeInTheDocument();
  });

  it("memanggil onWinnerChange saat pilihan radio berubah", async () => {
    const user = userEvent.setup();
    const onWinnerChange = vi.fn();

    render(
      <ConflictFieldRow
        conflict={{
          field: "topik",
          localValue: "Topik A",
          remoteValue: "Topik B",
        }}
        selectedWinner="remote"
        onWinnerChange={onWinnerChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: /use local/i }));

    expect(onWinnerChange).toHaveBeenCalledWith("local");
  });
});
