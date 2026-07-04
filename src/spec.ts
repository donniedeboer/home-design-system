/**
 * Server-safe entry (`home-design-system/spec`) — the PURE layout-DSL logic with no React
 * and, crucially, NO 'use client' stamp (scripts/stamp-use-client.mjs only stamps
 * dist/index.js). Next.js App Router server code (route handlers, server actions) must
 * import `validateLayout`/`evalPredicate`/the DSL constants from HERE: the main entry is a
 * client boundary, and calling a client-marked function from the server throws at runtime
 * ("Attempted to call validateLayout() from the server…").
 *
 * Same single implementation as ever — this barrel just re-exports it un-stamped.
 */
export * from './widgets/dynamicLayout';
export * from './share';
export type * from './widgets/types';
