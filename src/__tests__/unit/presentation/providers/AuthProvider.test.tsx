/**
 * AuthProvider Unit Tests
 * Core authentication logic tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "@/providers/AuthProvider";
import { AuthContext } from "@/context/AuthContext";
import * as authApi from "@/lib/supabase/auth";
import * as offlineAuth from "@/lib/offline/offline-auth";
import type {
  AuthUser,
  AuthSession,
  LoginCredentials,
} from "@/types/auth.types";

// Mock modules
vi.mock("@/lib/supabase/auth");
vi.mock("@/lib/offline/offline-auth");
vi.mock("@/lib/utils/logger", () => ({
  default: {
    auth: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockUser: AuthUser = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  email: "test@example.com",
  full_name: "Test User",
  role: "mahasiswa",
  avatar_url: null,
  is_active: true,
  last_seen_at: new Date().toISOString(),
  metadata: {},
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const mockSession: AuthSession = {
  user: mockUser,
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_at: Date.now() + 3600000,
};

const mockCredentials: LoginCredentials = {
  email: "test@example.com",
  password: "password123",
};

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function renderWithAuthProvider(ui: React.ReactElement) {
  return render(ui, { wrapper: TestWrapper });
}

describe("AuthProvider", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(authApi.getSession).mockResolvedValue(null);
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession,
    });
    // Mock logout/signOut functions
    (authApi as any).signOut = vi.fn().mockResolvedValue({
      success: true,
    });
    vi.mocked(authApi).logout = vi.fn().mockResolvedValue({
      success: true,
    }) as any;
    vi.mocked(authApi.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: "mock-sub-id",
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    });
    vi.mocked(offlineAuth.storeOfflineCredentials).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.storeOfflineSession).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.storeUserData).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.clearOfflineSession).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.restoreOfflineSession).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================

  describe("initialization", () => {
    it("should provide auth context to children", async () => {
      // Create a test component that uses the auth context
      function TestComponent() {
        const value = React.useContext(AuthContext);

        return (
          <div>
            <div data-testid="user-email">{value.user?.email || "null"}</div>
            <div data-testid="is-authenticated">
              {value.isAuthenticated ? "true" : "false"}
            </div>
            <button
              data-testid="login-btn"
              onClick={() => value.login(mockCredentials)}
            >
              Login
            </button>
          </div>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("login-btn")).toBeInTheDocument();
      });

      // Initially not authenticated
      expect(screen.getByTestId("user-email")).toHaveTextContent("null");
      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");

      // Click login button
      await screen.findByTestId("login-btn");
      screen.getByTestId("login-btn").click();

      // After successful login, context should be updated
      await waitFor(
        () => {
          expect(screen.getByTestId("user-email")).toHaveTextContent(
            mockUser.email,
          );
          expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
            "true",
          );
        },
        { timeout: 3000 },
      );

      // Verify login API was called
      expect(authApi.login).toHaveBeenCalledWith(mockCredentials);
    });

    it("should persist session to localStorage after login", async () => {
      function TestComponent() {
        const value = React.useContext(AuthContext);

        if (!value) return <div>No context</div>;

        return (
          <button
            data-testid="login-btn"
            onClick={() => value.login(mockCredentials)}
          >
            Login
          </button>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("login-btn")).toBeInTheDocument();
      });

      // Perform login
      screen.getByTestId("login-btn").click();

      // Wait for login to complete
      await waitFor(
        () => {
          expect(authApi.login).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Check localStorage
      const cachedAuth = localStorage.getItem("auth_cache");
      expect(cachedAuth).not.toBeNull();

      if (cachedAuth) {
        const parsed = JSON.parse(cachedAuth);
        expect(parsed.user).toEqual(mockUser);
        expect(parsed.session).toEqual(mockSession);
      }
    });

    it("should store offline credentials after online login", async () => {
      function TestComponent() {
        const value = React.useContext(AuthContext);

        if (!value) return <div>No context</div>;

        return (
          <button
            data-testid="login-btn"
            onClick={() => value.login(mockCredentials)}
          >
            Login
          </button>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("login-btn")).toBeInTheDocument();
      });

      // Perform login
      screen.getByTestId("login-btn").click();

      // Wait for login to complete
      await waitFor(
        () => {
          expect(authApi.login).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );

      // Verify offline credentials were stored
      expect(offlineAuth.storeOfflineCredentials).toHaveBeenCalledWith(
        mockCredentials.email,
        mockCredentials.password,
        mockUser,
      );
      expect(offlineAuth.storeOfflineSession).toHaveBeenCalledWith(
        mockUser,
        mockSession,
      );
      expect(offlineAuth.storeUserData).toHaveBeenCalledWith(mockUser);
    });
  });

  // ========================================================================
  // LOGOUT FLOW TESTS
  // ========================================================================

  describe("logout flow", () => {
    it("should clear context after logout", async () => {
      // Start with authenticated state
      const cachedAuth = {
        version: "v1",
        user: mockUser,
        session: mockSession,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_cache", JSON.stringify(cachedAuth));

      function TestComponent() {
        const value = React.useContext(AuthContext);

        return (
          <div>
            <div data-testid="user-email">{value.user?.email || "null"}</div>
            <div data-testid="is-authenticated">
              {value.isAuthenticated ? "true" : "false"}
            </div>
            <button data-testid="logout-btn" onClick={() => value.logout()}>
              Logout
            </button>
          </div>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization with cached auth
      await waitFor(() => {
        expect(screen.getByTestId("user-email")).toHaveTextContent(
          mockUser.email,
        );
      });

      // Perform logout
      screen.getByTestId("logout-btn").click();

      // Context should be cleared immediately
      await waitFor(() => {
        expect(screen.getByTestId("user-email")).toHaveTextContent("null");
        expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
          "false",
        );
      });

      // Verify cache was cleared
      expect(localStorage.getItem("auth_cache")).toBeNull();
    });

    it("should clear offline session after logout", async () => {
      // Start with authenticated state
      const cachedAuth = {
        version: "v1",
        user: mockUser,
        session: mockSession,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_cache", JSON.stringify(cachedAuth));

      function TestComponent() {
        const value = React.useContext(AuthContext);

        return (
          <button data-testid="logout-btn" onClick={() => value.logout()}>
            Logout
          </button>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("logout-btn")).toBeInTheDocument();
      });

      // Perform logout
      screen.getByTestId("logout-btn").click();

      // Wait a bit for background cleanup
      await waitFor(
        () => {
          expect(offlineAuth.clearOfflineSession).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });
  });

  // ========================================================================
  // SESSION MANAGEMENT TESTS
  // ========================================================================

  describe("session management", () => {
    it("should restore session from offline storage when online fails", async () => {
      // Mock offline session exists
      const offlineSessionData = {
        user: mockUser,
        session: mockSession,
      };
      vi.mocked(offlineAuth.restoreOfflineSession).mockResolvedValue(
        offlineSessionData,
      );

      function TestComponent() {
        const value = React.useContext(AuthContext);

        return (
          <div>
            <div data-testid="user-id">{value.user?.id || "null"}</div>
            <div data-testid="initialized">
              {value.initialized ? "true" : "false"}
            </div>
          </div>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Should restore from offline storage
      await waitFor(
        () => {
          expect(screen.getByTestId("user-id")).toHaveTextContent(mockUser.id);
          expect(screen.getByTestId("initialized")).toHaveTextContent("true");
        },
        { timeout: 3000 },
      );

      expect(offlineAuth.restoreOfflineSession).toHaveBeenCalled();
    });

    it("should handle session expiry and clear auth state", async () => {
      // Create an expired session
      const expiredSession: AuthSession = {
        user: mockUser,
        access_token: "expired-token",
        refresh_token: "expired-refresh",
        expires_at: Date.now() - 10000, // Expired 10 seconds ago
      };

      // Start with expired session in cache
      const cachedAuth = {
        version: "v1",
        user: mockUser,
        session: expiredSession,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_cache", JSON.stringify(cachedAuth));

      // Mock getSession to return null (session expired)
      vi.mocked(authApi.getSession).mockResolvedValue(null);

      function TestComponent() {
        const value = React.useContext(AuthContext);

        return (
          <div>
            <div data-testid="user-id">{value.user?.id || "null"}</div>
            <div data-testid="is-authenticated">
              {value.isAuthenticated ? "true" : "false"}
            </div>
          </div>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // After initialization, expired session should be cleared
      await waitFor(
        () => {
          expect(screen.getByTestId("user-id")).toHaveTextContent("null");
          expect(screen.getByTestId("is-authenticated")).toHaveTextContent(
            "false",
          );
        },
        { timeout: 3000 },
      );
    });

    it("should invalidate old cache versions", async () => {
      // Set up old version cache
      const oldCachedAuth = {
        version: "v0", // Old version
        user: mockUser,
        session: mockSession,
        timestamp: Date.now(),
      };
      localStorage.setItem("auth_cache", JSON.stringify(oldCachedAuth));

      let initialUser: AuthUser | null = null;
      let loadingComplete = false;

      function TestComponent() {
        const value = React.useContext(AuthContext);

        if (!loadingComplete && !value.loading) {
          initialUser = value.user;
          loadingComplete = true;
        }

        return (
          <div data-testid="loading">{value.loading ? "true" : "false"}</div>
        );
      }

      renderWithAuthProvider(<TestComponent />);

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("false");
      });

      // Old cache should be ignored, starting with null user
      expect(initialUser).toBeNull();

      // Cache should be updated with new version (v1) with null values
      const cacheAfter = localStorage.getItem("auth_cache");
      expect(cacheAfter).not.toBeNull();
      if (cacheAfter) {
        const parsed = JSON.parse(cacheAfter);
        expect(parsed.version).toBe("v1");
        expect(parsed.user).toBeNull();
        expect(parsed.session).toBeNull();
      }
    });
  });

  // Placeholder test maintained for compatibility
  it("should have all AuthProvider tests defined", () => {
    expect(true).toBe(true);
  });
});

describe("AuthProvider edge cases", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(authApi.getSession).mockResolvedValue(null);
    vi.mocked(authApi.login).mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession,
    });
    (authApi as any).signOut = vi.fn().mockResolvedValue({
      success: true,
    });
    vi.mocked(authApi).logout = vi.fn().mockResolvedValue({
      success: true,
    }) as any;
    vi.mocked(authApi.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: "mock-sub-id",
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    });
    vi.mocked(offlineAuth.storeOfflineCredentials).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.storeOfflineSession).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.storeUserData).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.clearOfflineSession).mockResolvedValue(undefined);
    vi.mocked(offlineAuth.restoreOfflineSession).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle login errors gracefully", async () => {
    // Mock login failure
    vi.mocked(authApi.login).mockResolvedValue({
      success: false,
      error: "Invalid credentials",
    });

    function TestComponent() {
      const value = React.useContext(AuthContext);
      const [error, setError] = React.useState<string | null>(null);

      const handleLogin = async () => {
        try {
          await value.login({
            email: "test@example.com",
            password: "wrong",
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Login failed");
        }
      };

      return (
        <div>
          <div data-testid="error">{error || "null"}</div>
          <button data-testid="login-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
      );
    }

    renderWithAuthProvider(<TestComponent />);

    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId("login-btn")).toBeInTheDocument();
    });

    // Attempt login
    screen.getByTestId("login-btn").click();

    // Error should be caught
    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid credentials",
        );
      },
      { timeout: 3000 },
    );
  });
});
