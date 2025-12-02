/// <reference types="vitest" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

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
      'Cache-Control': 'no-store',
    },
  },
  build: {
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react'
          }
          
          // Supabase
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          
          // Charts library
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts'
          }
          
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date'
          }
          
          // Icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || 
              id.includes('node_modules/zod') ||
              id.includes('node_modules/@hookform')) {
            return 'vendor-forms'
          }
          
          // UI components (Radix UI)
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui'
          }
          
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor-misc'
          }
        },
        
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk'
          return `assets/js/${facadeModuleId}-[hash].js`
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    sourcemap: false,
    target: 'esnext',
    cssCodeSplit: true,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})