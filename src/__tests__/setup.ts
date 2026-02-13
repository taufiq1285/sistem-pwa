/**
 * Test Setup
 *
 * Global test setup and configuration
 * Imports jest-dom matchers for better assertions
 */

import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// Suppress React act() warnings in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === "string" &&
    ((args[0].includes("Warning: An update to") &&
      args[0].includes("was not wrapped in act")) ||
      args[0].includes("IndexedDB initialization failed"))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock window.matchMedia for tests
Object.defineProperty(window, "matchMedia", {
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

// Mock navigator.onLine
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

// Mock crypto.randomUUID if not available
if (!global.crypto) {
  global.crypto = {} as Crypto;
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (() => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }) as () => `${string}-${string}-${string}-${string}-${string}`;
}
