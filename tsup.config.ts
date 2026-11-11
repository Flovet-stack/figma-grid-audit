import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/core/index.ts',
    react: 'src/wrappers/react.tsx',
    vue: 'src/wrappers/vue.ts',
    svelte: 'src/wrappers/svelte.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  minify: true,
  clean: true,
  external: ['react'],
});
