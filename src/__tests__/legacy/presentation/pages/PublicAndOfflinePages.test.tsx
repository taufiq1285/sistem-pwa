import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomePage } from "@/pages/public/HomePage";
import OfflinePage from "@/pages/public/OfflinePage";
import MahasiswaOfflineSyncPage from "@/pages/mahasiswa/OfflineSyncPage";

vi.mock("react-router-dom", () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

describe("Public + Offline Placeholder Pages", () => {
  it("HomePage menampilkan hero utama dan tombol auth", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /sistem informasi praktikum akademi kebidanan mega buana/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /akademi kebidanan mega buana/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Masuk" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Daftar" })).toBeInTheDocument();
  });

  it("OfflinePage placeholder tampil", () => {
    render(<OfflinePage />);

    expect(
      screen.getByText(/Anda Sedang Offline/i),
    ).toBeInTheDocument();
  });

  it("Mahasiswa OfflineSyncPage placeholder tampil", () => {
    render(<MahasiswaOfflineSyncPage />);

    expect(
      screen.getByText(/Sinkronisasi Offline/i),
    ).toBeInTheDocument();
  });
});
