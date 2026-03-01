import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.js'],
      exclude: ['**/*.test.js', 'bin/**'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
      },
    },
  },
});
