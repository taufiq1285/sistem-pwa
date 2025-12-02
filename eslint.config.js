import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'backups']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Relaxed rules for production code - balance between quality and pragmatism
      '@typescript-eslint/no-explicit-any': 'off', // Disabled - allow any type
      '@typescript-eslint/no-unused-vars': 'off', // Disabled - allow unused vars
      '@typescript-eslint/ban-ts-comment': 'off', // Disabled - allow @ts-ignore
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off', // Disabled
      'react-refresh/only-export-components': 'off', // Allow exporting constants with components
      'react-hooks/exhaustive-deps': 'off', // Disabled - allow missing dependencies
      'no-empty': 'off', // Disabled - allow empty blocks
    },
  },
  {
    // Relaxed rules for test files
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])
