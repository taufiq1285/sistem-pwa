import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KuisEditPage from "@/pages/dosen/kuis/KuisEditPage";

vi.mock("@/pages/dosen/kuis/KuisBuilderPage", () => ({
  default: () => <div data-testid="kuis-builder-page">Mock Kuis Builder Page</div>,
}));

describe("KuisEditPage", () => {
  it("render wrapper KuisBuilderPage", () => {
    render(<KuisEditPage />);

    expect(screen.getByTestId("kuis-builder-page")).toBeInTheDocument();
    expect(screen.getByText(/mock kuis builder page/i)).toBeInTheDocument();
  });
});
