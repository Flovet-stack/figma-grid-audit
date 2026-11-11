import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts'],
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
    projects: [
      {
        test: { name: 'unit', include: ['test/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
