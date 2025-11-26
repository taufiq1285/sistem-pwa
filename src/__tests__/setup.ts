/**
 * Test Setup
 *
 * Global test setup and configuration
 * Imports jest-dom matchers for better assertions
 */

import '@testing-library/jest-dom/vitest';

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});
