import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KelolaMahasiswaDialog } from "@/components/features/kelas/KelolaMahasiswaDialog";

const {
  mockToast,
  mockGetEnrolledStudents,
  mockGetAllMahasiswa,
  mockEnrollStudent,
  mockCreateOrEnrollMahasiswa,
  mockUnsubscribe,
} = vi.hoisted(() => ({
  mockToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  mockGetEnrolledStudents: vi.fn(),
  mockGetAllMahasiswa: vi.fn(),
  mockEnrollStudent: vi.fn(),
  mockCreateOrEnrollMahasiswa: vi.fn(),
  mockUnsubscribe: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/lib/api/kelas.api", () => ({
  getEnrolledStudents: (...args: unknown[]) => mockGetEnrolledStudents(...args),
  getAllMahasiswa: (...args: unknown[]) => mockGetAllMahasiswa(...args),
  enrollStudent: (...args: unknown[]) => mockEnrollStudent(...args),
  createOrEnrollMahasiswa: (...args: unknown[]) =>
    mockCreateOrEnrollMahasiswa(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn(function () {
        return this;
      }),
      subscribe: vi.fn((cb: (status: string) => void) => {
        cb("SUBSCRIBED");
        return { unsubscribe: mockUnsubscribe };
      }),
      unsubscribe: mockUnsubscribe,
    })),
  },
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("@/components/ui/input", () => ({
  Input: ({ ...props }: any) => <input {...props} />,
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));
vi.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <th>{children}</th>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}));
vi.mock("@/components/ui/alert-dialog", () => ({
  AlertDialog: ({ open, children }: any) =>
    open ? <div>{children}</div> : null,
  AlertDialogAction: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogCancel: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h3>{children}</h3>,
}));
vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
  AvatarImage: () => null,
}));
vi.mock("@/components/ui/alert", () => ({
  Alert: ({ children }: any) => <div>{children}</div>,
  AlertDescription: ({ children }: any) => <p>{children}</p>,
}));
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, id }: any) => (
    <input
      aria-label={id || "checkbox"}
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
    />
  ),
}));
vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

describe("KelolaMahasiswaDialog", () => {
  const kelas = { id: "kelas-1", nama_kelas: "TI-1A", kuota: 2 };

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetEnrolledStudents.mockResolvedValue([
      {
        id: "enroll-1",
        mahasiswa_id: "mhs-1",
        is_active: true,
        enrolled_at: "2025-01-01",
        mahasiswa: {
          nim: "001",
          users: { full_name: "Andi", email: "andi@test.com" },
        },
      },
    ]);

    mockGetAllMahasiswa.mockResolvedValue([
      {
        id: "mhs-1",
        nim: "001",
        users: { full_name: "Andi", email: "andi@test.com" },
      },
      {
        id: "mhs-2",
        nim: "002",
        users: { full_name: "Budi", email: "budi@test.com" },
      },
    ]);
  });

  it("load data saat dialog dibuka dan menampilkan mahasiswa terdaftar", async () => {
    render(
      <KelolaMahasiswaDialog
        open={true}
        onOpenChange={vi.fn()}
        kelas={kelas}
      />,
    );

    await waitFor(() => {
      expect(mockGetEnrolledStudents).toHaveBeenCalledWith("kelas-1");
      expect(mockGetAllMahasiswa).toHaveBeenCalled();
    });

    expect(screen.getByText(/Kelola Mahasiswa - TI-1A/i)).toBeInTheDocument();
    expect(screen.getByText("Andi")).toBeInTheDocument();
    expect(screen.getByText("Realtime Active")).toBeInTheDocument();
  });

  it("menambah mahasiswa terpilih ke kelas", async () => {
    const user = userEvent.setup();
    mockEnrollStudent.mockResolvedValue({});

    render(
      <KelolaMahasiswaDialog
        open={true}
        onOpenChange={vi.fn()}
        kelas={kelas}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Tambah Mahasiswa/i)).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("mahasiswa-mhs-2"));
    await user.click(screen.getByRole("button", { name: /Tambah ke Kelas/i }));

    await waitFor(() => {
      expect(mockEnrollStudent).toHaveBeenCalledWith("kelas-1", "mhs-2");
      expect(mockToast.success).toHaveBeenCalled();
    });
  });

  it("validasi field wajib saat tambah mahasiswa baru", async () => {
    const user = userEvent.setup();

    render(
      <KelolaMahasiswaDialog
        open={true}
        onOpenChange={vi.fn()}
        kelas={kelas}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Mahasiswa Baru/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /Mahasiswa Baru/i }));
    await user.click(screen.getByRole("button", { name: /Tambah Mahasiswa/i }));

    expect(mockToast.error).toHaveBeenCalledWith("Semua field wajib diisi");
  });

  it("menampilkan alert saat kelas penuh", async () => {
    mockGetEnrolledStudents.mockResolvedValue([
      {
        id: "enroll-1",
        mahasiswa_id: "mhs-1",
        is_active: true,
        enrolled_at: "2025-01-01",
        mahasiswa: {
          nim: "001",
          users: { full_name: "Andi", email: "andi@test.com" },
        },
      },
      {
        id: "enroll-2",
        mahasiswa_id: "mhs-2",
        is_active: true,
        enrolled_at: "2025-01-02",
        mahasiswa: {
          nim: "002",
          users: { full_name: "Budi", email: "budi@test.com" },
        },
      },
    ]);

    render(
      <KelolaMahasiswaDialog
        open={true}
        onOpenChange={vi.fn()}
        kelas={{ ...kelas, kuota: 2 }}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Kelas sudah penuh! Tidak bisa menambah mahasiswa baru./i,
        ),
      ).toBeInTheDocument();
    });
  });
});
