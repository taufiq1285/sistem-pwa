/**
 * Test Utilities
 */

import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Record<string, unknown>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
}

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'mahasiswa',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockKuis = (overrides = {}) => ({
  id: 'test-kuis-id',
  kelas_id: 'test-kelas-id',
  dosen_id: 'test-dosen-id',
  judul: 'Test Quiz',
  deskripsi: 'Test Description',
  durasi_menit: 60,
  tanggal_mulai: new Date().toISOString(),
  tanggal_selesai: new Date(Date.now() + 86400000).toISOString(),
  max_attempts: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
