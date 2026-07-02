// Stamp the built bundle as a React Client Component module.
//
// The whole design system is presentational UI, and many components use hooks / context
// (useRouter, useState, createPortal…). tsup bundles everything into one dist/index.js and
// DROPS per-file 'use client' directives (and a tsup `banner` gets treeshaken away). Without
// the directive, importing e.g. <Card> into a Next.js SERVER component throws. Prepending
// 'use client' to the bundle marks the whole library as a client boundary — correct, since it
// holds no server-only code — so Next apps can import any component from server components.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../dist/index.js', import.meta.url);
const src = readFileSync(FILE, 'utf8');
const directive = "'use client';\n";
if (!src.startsWith("'use client'") && !src.startsWith('"use client"')) {
  writeFileSync(FILE, directive + src);
  console.log("stamp-use-client: prepended 'use client' to dist/index.js");
} else {
  console.log("stamp-use-client: already present");
}
