import { defineConfig } from 'tsup';

export default defineConfig({
  // `spec` is the SERVER-SAFE entry (pure DSL, no React) — stamp-use-client.mjs stamps ONLY
  // index.js, so spec.js stays importable from Next server code.
  entry: { index: 'src/index.ts', spec: 'src/spec.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // NB: the 'use client' stamp is applied by scripts/stamp-use-client.mjs AFTER tsup — a tsup/
  // esbuild `banner` gets treeshaken away (it's a bare directive string), so we prepend it here.
  // Consumers provide React; never bundle it. No next/* is imported anywhere.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  target: 'es2022',
});
