import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  platform: 'browser',
  clean: true,
  publint: { level: 'error' },
  attw: { level: 'error', profile: 'esm-only' },
});
