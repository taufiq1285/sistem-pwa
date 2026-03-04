import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "@/pages/public/HomePage";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe("Public HomePage", () => {
  it("menampilkan hero utama dan tombol auth", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

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
});
