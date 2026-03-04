import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentName } from "@/components/features/kuis/attempt/QuestionDisplay";

describe("QuestionDisplay placeholder", () => {
  it("menampilkan placeholder TODO", () => {
    render(<ComponentName />);
    expect(
      screen.getByText("TODO: Implement [ComponentName]"),
    ).toBeInTheDocument();
  });
});
