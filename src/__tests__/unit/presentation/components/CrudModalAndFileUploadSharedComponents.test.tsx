import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { CrudModal } from "@/components/shared/CrudModal/CrudModal";
import { CreateModal } from "@/components/shared/CrudModal/CreateModal";
import { EditModal } from "@/components/shared/CrudModal/EditModal";
import { DeleteDialog } from "@/components/shared/CrudModal/DeleteDialog";
import { ComponentName as SharedFileUpload } from "@/components/shared/FileUpload/FileUpload";

describe("CrudModal", () => {
  it("merender title dan description", () => {
    render(
      <CrudModal
        open
        onOpenChange={vi.fn()}
        title="Modal CRUD"
        description="Deskripsi modal"
        footerContent={<button type="button">Aksi</button>}
      >
        <div>Konten Modal</div>
      </CrudModal>,
    );

    expect(screen.getByText("Modal CRUD")).toBeInTheDocument();
    expect(screen.getByText("Deskripsi modal")).toBeInTheDocument();
    expect(screen.getByText("Konten Modal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aksi" })).toBeInTheDocument();
  });
});

describe("CreateModal", () => {
  it("submit form create dan menutup modal saat sukses", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <CreateModal
        open
        onOpenChange={onOpenChange}
        title="Create Data"
        onSubmit={onSubmit}
      >
        <input name="nama" defaultValue="Data Baru" />
      </CreateModal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ nama: "Data Baru" }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("EditModal", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("menampilkan state no data ketika data null", () => {
    render(
      <EditModal
        open
        onOpenChange={vi.fn()}
        data={null}
        onSubmit={vi.fn()}
        title="Edit Data"
      >
        <input name="nama" defaultValue="x" />
      </EditModal>,
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it("submit form edit dan menutup modal", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <EditModal
        open
        onOpenChange={onOpenChange}
        data={{ id: "1", nama: "Lama" }}
        onSubmit={onSubmit}
      >
        <input name="nama" defaultValue="Baru" />
      </EditModal>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ nama: "Baru" }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("DeleteDialog", () => {
  it("menjalankan onConfirm ketika tombol delete ditekan", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <DeleteDialog
        open
        onOpenChange={onOpenChange}
        title="Hapus data"
        itemName="record"
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe("Shared FileUpload (placeholder)", () => {
  it("merender placeholder TODO", () => {
    render(<SharedFileUpload />);
    expect(screen.getByText(/TODO: Implement/i)).toBeInTheDocument();
  });
});
