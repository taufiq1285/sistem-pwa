/**
 * Auth Context
 * Context definition for authentication state
 */

import { createContext } from 'react';
import type { AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/types/auth.types';

export interface AuthContextValue {
  // State
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  initialized: boolean;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Utilities
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);