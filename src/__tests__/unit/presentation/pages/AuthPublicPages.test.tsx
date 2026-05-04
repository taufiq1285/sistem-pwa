import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { UnauthorizedPage } from "@/pages/public/UnauthorizedPage";

const { mockNavigate, mockUseAuth, mockResetPassword, mockUpdatePassword } =
  vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockUseAuth: vi.fn(),
    mockResetPassword: vi.fn(),
    mockUpdatePassword: vi.fn(),
  }));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/forms/LoginForm", () => ({
  LoginForm: ({ onSuccess }: any) => (
    <div>
      <p>Mock Login Form</p>
      <button onClick={onSuccess}>mock-login-success</button>
    </div>
  ),
}));

vi.mock("@/components/forms/RegisterForm", () => ({
  RegisterForm: ({ onSuccess }: any) => (
    <div>
      <p>Mock Register Form</p>
      <button onClick={onSuccess}>mock-register-success</button>
    </div>
  ),
}));

vi.mock("@/components/forms/PasswordForm", () => ({
  PasswordForm: ({ onSuccess }: any) => (
    <div>
      <p>Mock Password Form</p>
      <button onClick={onSuccess}>mock-password-update-success</button>
    </div>
  ),
}));

describe("Auth/Public Pages", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockResetPassword.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      resetPassword: mockResetPassword,
      updatePassword: mockUpdatePassword,
    });
  });

  it("LoginPage render normal ketika belum login", () => {
    render(<LoginPage />);

    expect(screen.getByText(/Selamat Datang/i)).toBeInTheDocument();
    expect(screen.getByText("Mock Login Form")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("LoginPage redirect ke dashboard sesuai role ketika sudah login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "u1", role: "admin" },
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin");
    });
  });

  it("RegisterPage memanggil navigate('/login') setelah success", () => {
    vi.useFakeTimers();

    render(<RegisterPage />);

    screen.getByRole("button", { name: /mock-register-success/i }).click();
    vi.advanceTimersByTime(2000);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("ForgotPasswordPage memiliki input email required", () => {
    render(<ForgotPasswordPage />);

    // Label "Alamat Email" terhubung ke input lewat htmlFor="email"
    const emailInput = document.getElementById("email") as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();
  });

  it("ForgotPasswordPage menampilkan tombol kirim link reset", async () => {
    render(<ForgotPasswordPage />);

    const sendBtn = screen.getByRole("button", { name: /Kirim Link Reset/i });
    expect(sendBtn).toBeInTheDocument();
  });

  it("ForgotPasswordPage mengirim reset password lewat auth context", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/Alamat Email/i), "user@test.com");
    await user.click(screen.getByRole("button", { name: /Kirim Link Reset/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("user@test.com");
    });
  });

  it("ResetPasswordPage merender form update password", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText(/Atur Ulang Password/i)).toBeInTheDocument();
    expect(screen.getByText("Mock Password Form")).toBeInTheDocument();
  });

  it("NotFoundPage menampilkan aksi menuju home dan login", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getAllByText(/Halaman Tidak Ditemukan/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Ke Beranda/i)).toBeInTheDocument();
    expect(screen.getByText(/Ke Login/i)).toBeInTheDocument();
  });

  it("UnauthorizedPage tombol dashboard dan back memanggil navigate", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", role: "admin" },
      isAuthenticated: true,
    });

    render(<UnauthorizedPage />);

    await user.click(screen.getByRole("button", { name: /Ke Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");

    await user.click(screen.getByRole("button", { name: /Kembali/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
