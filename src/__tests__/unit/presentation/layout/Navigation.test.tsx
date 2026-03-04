import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";

vi.mock("@/components/layout/Sidebar", () => ({
  Sidebar: ({ userName }: { userName?: string }) => (
    <div>Sidebar {userName}</div>
  ),
}));

vi.mock("@/components/layout/MobileNav", () => ({
  MobileNav: ({ userName }: { userName?: string }) => (
    <div>MobileNav {userName}</div>
  ),
}));

describe("Navigation", () => {
  it("merender Sidebar dan MobileNav", () => {
    render(
      <MemoryRouter>
        <Navigation
          userRole="admin"
          userName="Nav User"
          userEmail="nav@example.com"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Sidebar Nav User")).toBeInTheDocument();
    expect(screen.getByText("MobileNav Nav User")).toBeInTheDocument();
  });
});
