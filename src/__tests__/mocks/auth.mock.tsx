/**
 * Auth Context Mock
 */

import { vi } from "vitest";
import type { ReactNode } from "react";
import { TEST_UUIDS } from "../test-utils";

export const createMockAuthContext = (overrides = {}) => ({
  user: {
    id: TEST_UUIDS.USER_1,
    email: "test@example.com",
    user_metadata: {
      full_name: "Test User",
      role: "dosen",
    },
    ...overrides,
  },
  profile: {
    id: TEST_UUIDS.USER_1,
    email: "test@example.com",
    full_name: "Test User",
    nama: "Test User",
    role: "dosen",
    ...overrides,
  },
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
});

export const MockAuthProvider = ({
  children,
  value = createMockAuthContext(),
}: {
  children: ReactNode;
  value?: ReturnType<typeof createMockAuthContext>;
}) => {
  return <>{children}</>;
};

export const mockAuthUser = {
  id: TEST_UUIDS.USER_1,
  email: "test@example.com",
  user_metadata: {
    full_name: "Test User",
    role: "dosen",
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: "authenticated",
  app_metadata: {},
};

export const mockAuthSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: "bearer",
  user: mockAuthUser,
};
