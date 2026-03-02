import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentName } from "@/components/features/materi/MateriUploadForm";

describe("MateriUploadForm placeholder", () => {
  it("menampilkan placeholder TODO", () => {
    render(<ComponentName />);
    expect(screen.getByText("TODO: Implement [ComponentName]")).toBeInTheDocument();
  });
});
