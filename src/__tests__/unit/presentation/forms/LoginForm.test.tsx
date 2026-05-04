/**
 * LoginForm Unit Tests
 *
 * Verifies offline and poor-network messaging stays clear for users.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/forms/LoginForm";

const mockLogin = vi.fn();

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.onLine = true;
  });

  it("shows offline login guidance when device is offline", () => {
    navigator.onLine = false;

    render(<LoginForm />);

    expect(screen.getByText("Mode Offline")).toBeInTheDocument();
    expect(
      screen.getByText(/Sistem akan memakai kredensial tersimpan untuk login/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Login Offline")).toBeInTheDocument();
  });

  it("shows automatic fallback guidance while trying online login", async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 50)),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /masuk|coba login/i }));

    expect(screen.getByText("Mencoba Login Online")).toBeInTheDocument();
    expect(
      screen.getByText(/login offline akan dicoba otomatis/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
  });

  it("shows network stability message when login fails because offline fallback is unavailable", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(
      new Error(
        "Koneksi ke server sedang bermasalah, dan login offline belum tersedia untuk akun ini. Silakan login online minimal 1x di perangkat ini.",
      ),
    );

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByText("Jaringan Belum Stabil")).toBeInTheDocument();
      expect(
        screen.getByText(/login offline belum tersedia untuk akun ini/i),
      ).toBeInTheDocument();
    });
  });
});
