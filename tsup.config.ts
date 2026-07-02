import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // The whole library is presentational UI (many components use hooks / context). Bundling
  // into one file drops per-file 'use client' directives, so stamp the bundle as a client
  // module — this is what lets Next SERVER components import Card/AppShell/etc. directly.
  banner: { js: "'use client';" },
  // Consumers provide React; never bundle it. No next/* is imported anywhere.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2022',
});
