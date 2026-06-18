# home-design-system

Dark-first shared design system for the home apps — design tokens + React components.

Install:
```
npm i github:donniedeboer/home-design-system
```
…then add `transpilePackages: ['home-design-system']` to `next.config.ts` (it ships
TS/TSX source). See **[DESIGN.md](./DESIGN.md)** for the design language, how to consume the
tokens, and the component API. This is the single source of truth for the suite's look —
change conventions here, not in each app.
