/// <reference types="vitest" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cache-Control": "no-store",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    minify: "esbuild",
    chunkSizeWarningLimit: 3000, // Increased for large app
    rollupOptions: {
      output: {
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    sourcemap: false,
    target: "esnext",
    cssCodeSplit: true,
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
    ],
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["server/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
      exclude: [
        // UI/Presentation Layer (tested via E2E)
        "src/pages/**",
        "src/components/ui/**",
        "src/layouts/**",
        "src/routes/**",
        // Config and setup files
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/App.tsx",
        // Static exports and constants
        "src/**/index.ts",
        "src/lib/constants/**",
        // External library wrappers
        "src/lib/supabase/client.ts",
        "src/lib/utils/logger.ts",
        // Development utilities
        "src/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
      thresholds: {
        global: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85,
        },
        // Higher standards for critical business logic
        "src/lib/api/**": {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        "src/lib/utils/**": {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
  },
});
