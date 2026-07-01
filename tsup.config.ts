import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Consumers provide React; never bundle it. No next/* is imported anywhere.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2022',
});
