import { defineConfig } from 'vitest/config'
import path from 'path'

// Unit-test config. Scope is intentionally pure functions in `lib/` (validators,
// formatters, slug/url helpers) — fast, dependency-free, no DOM. Component tests
// were deliberately skipped: the UI components pull in the Supabase client +
// auth context and would need heavy mocking for low return. If that changes,
// add `environment: 'jsdom'`, `@vitejs/plugin-react`, and @testing-library.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
})
