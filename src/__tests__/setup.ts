/**
 * Test Setup
 *
 * Global test setup and configuration
 * Imports jest-dom matchers for better assertions
 */

import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

const verboseTestLogs = process.env.VITEST_VERBOSE_LOGS === "true";
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  group: console.group,
  groupEnd: console.groupEnd,
};

const shouldSuppressConsoleMessage = (args: any[]) => {
  if (!args.length) return true;

  const firstArg = args[0];
  if (typeof firstArg !== "string") {
    return true;
  }

  if (
    (firstArg.includes("Warning: An update to") &&
      firstArg.includes("was not wrapped in act")) ||
    firstArg.includes("IndexedDB initialization failed")
  ) {
    return true;
  }

  return true;
};

const createConsoleSilencer =
  (method: keyof typeof originalConsole) =>
  (...args: any[]) => {
    if (verboseTestLogs || !shouldSuppressConsoleMessage(args)) {
      originalConsole[method].call(console, ...args);
    }
  };

console.log = createConsoleSilencer("log");
console.info = createConsoleSilencer("info");
console.warn = createConsoleSilencer("warn");
console.error = createConsoleSilencer("error");
console.group = createConsoleSilencer("group");
console.groupEnd = createConsoleSilencer("groupEnd");

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
