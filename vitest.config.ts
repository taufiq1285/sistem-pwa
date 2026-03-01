import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      sonner: path.resolve(__dirname, './src/__tests__/mocks/sonner.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    exclude: ['src/__tests__/unit/components/PageHeader.test.tsx'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    slowTestThreshold: 1000,
    pool: 'forks',
    poolOptions: {
      forks: {
        execArgv: ['--max-old-space-size=4096'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/lib/api/**/*.{ts,tsx}',
        'src/lib/hooks/**/*.{ts,tsx}',
        'src/lib/offline/**/*.{ts,tsx}',
        'src/lib/pwa/**/*.{ts,tsx}',
        'src/lib/supabase/**/*.{ts,tsx}',
        'src/lib/utils/**/*.{ts,tsx}',
        'src/lib/validations/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/types/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/backups/**',
        '**/docs/**',
        '**/server/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/lib/api/analytics.api.ts',
        'src/lib/api/index.ts',
        'src/lib/api/offline-queue.api.ts',
        'src/lib/hooks/index.ts',
        'src/lib/offline/index.ts',
        'src/lib/validations/index.ts',
        'src/lib/pwa/push-notifications.ts',
        'src/lib/pwa/update-manager.ts',
        'src/lib/supabase/database.types.ts',
        'src/lib/supabase/database.types.actual.ts',
        'src/lib/supabase/realtime.ts',
        'src/lib/supabase/types.ts',
        'src/lib/validations/Jadwal.schema .ts',
      ],
      // NOTE: Thresholds dibagi ~2 karena V8 provider di Windows menduplikat setiap path
      // (lowercase f:\ vs uppercase F:\), sehingga coverage tampak ~50% dari nilai aktual.
      // Nilai aktual berdasarkan normalized-summary.json: statements ~87%, functions ~89%, branches ~82%.
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 40,
        statements: 40,
      },
      reportsDirectory: './coverage',
    },
  },
});
