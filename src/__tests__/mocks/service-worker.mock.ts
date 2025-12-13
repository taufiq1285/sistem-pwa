/**
 * Service Worker Mock
 */

import { vi } from "vitest";

export const createServiceWorkerMock = () => ({
  register: vi.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: {
      state: "activated",
    },
    update: vi.fn(),
    unregister: vi.fn(),
  }),
  ready: Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      state: "activated",
    },
    update: vi.fn(),
    unregister: vi.fn(),
  }),
});

export const serviceWorkerMock = createServiceWorkerMock();
