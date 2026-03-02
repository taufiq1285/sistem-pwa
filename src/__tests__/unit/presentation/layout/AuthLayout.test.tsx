import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthLayout } from "@/components/layout/AuthLayout";

describe("AuthLayout", () => {
  it("menampilkan branding, children, dan custom class", () => {
    const { container } = render(
      <AuthLayout className="custom-auth-layout">
        <div>Auth Form</div>
      </AuthLayout>,
    );

    expect(screen.getByText("AKBID Mega Buana")).toBeInTheDocument();
    expect(screen.getByText("Sistem Praktikum Kebidanan")).toBeInTheDocument();
    expect(screen.getByText("Auth Form")).toBeInTheDocument();
    expect(container.querySelector(".custom-auth-layout")).toBeInTheDocument();
  });
});
