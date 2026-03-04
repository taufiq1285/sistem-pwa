import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { UnauthorizedPage } from "@/pages/public/UnauthorizedPage";

const { mockNavigate, mockUseAuth, mockResetPasswordForEmail } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockUseAuth: vi.fn(),
    mockResetPasswordForEmail: vi.fn(),
  }),
);

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

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) =>
        mockResetPasswordForEmail(...args),
    },
  },
}));

describe("Auth/Public Pages", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
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

    const emailInput = screen.getByRole("textbox", {
      name: /Email Address/i,
    }) as HTMLInputElement;

    expect(emailInput).toBeRequired();
  });

  it("ForgotPasswordPage sukses mengirim reset email", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByRole("textbox", { name: /Email Address/i }),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument();
    });
  });

  it("NotFoundPage menampilkan aksi menuju home dan login", () => {
    render(<NotFoundPage />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Login/i)).toBeInTheDocument();
  });

  it("UnauthorizedPage tombol dashboard dan back memanggil navigate", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "u1", role: "admin" },
      isAuthenticated: true,
    });

    render(<UnauthorizedPage />);

    await user.click(screen.getByRole("button", { name: /Go to Dashboard/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard");

    await user.click(screen.getByRole("button", { name: /Go Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
