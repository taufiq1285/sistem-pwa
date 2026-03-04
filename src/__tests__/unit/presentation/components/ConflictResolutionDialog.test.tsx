import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConflictResolutionDialog } from "@/components/common/ConflictResolutionDialog";

describe("ConflictResolutionDialog", () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    entity: "kuis_jawaban",
    entityId: "12345678-abcd-efgh-ijkl-123456789012",
    localData: {
      nilai: 80,
      catatan: "versi local",
    },
    remoteData: {
      nilai: 90,
      catatan: "versi remote",
    },
    localTimestamp: 1700000000000,
    remoteTimestamp: 1700000100000,
    fieldConflicts: [
      {
        field: "nilai",
        localValue: 80,
        remoteValue: 90,
        winner: "remote" as const,
        reason: "latest",
      },
      {
        field: "catatan",
        localValue: "versi local",
        remoteValue: "versi remote",
        winner: "local" as const,
      },
    ],
    onResolve: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merender informasi konflik utama", () => {
    render(<ConflictResolutionDialog {...baseProps} />);

    expect(screen.getByText("Konflik Data Terdeteksi")).toBeInTheDocument();
    expect(screen.getByText(/Entity:/)).toBeInTheDocument();
    expect(screen.getByText("kuis_jawaban")).toBeInTheDocument();
    expect(screen.getByText("Pilih Strategi Resolusi")).toBeInTheDocument();
  });

  it("strategy local memanggil onResolve local", async () => {
    render(<ConflictResolutionDialog {...baseProps} />);

    await userEvent.click(screen.getByRole("radio", { name: /local/i }));
    await userEvent.click(
      screen.getByRole("button", { name: "Gunakan Local" }),
    );

    expect(baseProps.onResolve).toHaveBeenCalledWith(
      "local",
      baseProps.localData,
    );
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("strategy remote memanggil onResolve remote", async () => {
    render(<ConflictResolutionDialog {...baseProps} />);

    await userEvent.click(screen.getByRole("radio", { name: /remote/i }));
    await userEvent.click(
      screen.getByRole("button", { name: "Gunakan Server" }),
    );

    expect(baseProps.onResolve).toHaveBeenCalledWith(
      "remote",
      baseProps.remoteData,
    );
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cancel memanggil onCancel", async () => {
    render(<ConflictResolutionDialog {...baseProps} />);

    await userEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    expect(baseProps.onOpenChange).toHaveBeenCalledWith(false);
  });
});
