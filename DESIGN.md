# home-design-system

The dark-first design language + React components shared across the home apps. **One
source of truth** — read this before building or restyling any app's UI.

## Consume it

Install: `npm i github:donniedeboer/home-design-system`, then add
`transpilePackages: ['home-design-system']` to `next.config.ts` (it ships TS/TSX source).

- **CSS** — in `app/globals.css`:
  ```css
  @import "tailwindcss";
  @import "home-design-system/theme.css";   /* @theme tokens + base layer + .card etc. */
  ```
  then override ONLY the accent block for your app (see Per-app identity).
- **Components** — `import { Modal, TopNav, ProfileProvider } from "home-design-system"`.
- **Non-React** (the Python/HTML app) — vendor `home-design-system/tokens.css`
  (`design-tokens.css`) directly; it's the portable `:root` copy.

## The rule: the suite is everything *except* the accent

Surfaces (`surface-0..3`), text (`fg`/`fg-muted`/`fg-subtle`), borders, radii, shadows,
status colors, the type scale, and the component recipes are **identical in every app.**
Dark-only — no light theme, no switcher.

## Per-app identity = two things

1. The `--color-accent*` block (7 vars) — override it in your `@theme`. Recipes for
   emerald / indigo / sky are at the bottom of `tokens.css`. A new app starts on neutral slate.
2. The logo glyph (`icon.svg` + the `<Logo>` mark).

## Hard rules

- The **accent** is for the single primary action, focus rings, the active-nav pill,
  links-on-hover, and selection — **never** for data/category colors.
- **Data hues are per-app and local** (e.g. nutrition's macro colors live in nutrition's
  own `@theme`, never here).
- Numeric/tabular data uses `tabular-nums` (already in the base layer).

## Component recipes (className strings)

- Card: `bg-surface-0 border border-border rounded-xl shadow-soft` (or `.card`)
- Primary button: `h-9 px-4 rounded-lg bg-accent text-accent-fg font-medium hover:bg-accent-hover`
- Secondary: `… bg-surface-0 border border-border hover:bg-surface-2`
- Ghost: `… text-fg-muted hover:bg-surface-2 hover:text-fg`
- Danger: `… bg-danger-subtle text-danger hover:bg-danger hover:text-white`
- Input: `w-full bg-surface-0 border border-border-strong rounded-lg px-3 py-2 focus:border-accent focus:ring-2 focus:ring-ring/40 focus:outline-none`
- Chip: `inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs bg-surface-2 text-fg-muted`

## Components

- **Modal** — phone-first bottom sheet / desktop modal (ESC + backdrop close, scroll lock, stacking).
- **TopNav** — sticky app bar. Props: `appName`, `links: NavLink[]`, optional `profileSwitcher`.
- **ProfileProvider / ProfileSwitcher / ProfileAvatar** — Netflix-style household profiles
  (no auth). **Requires a profiles backend** (`/api/profiles` + a `profiles` table) — see
  the `home-dev-common` assets. Pass a **unique `cookieName` per app** (cookies are
  host-scoped, so tailnet-shared apps would otherwise collide). Utilities that don't use
  profiles simply don't import these.
- **Logo** — the accent-tile mark; override the inner glyph + `icon.svg` per app.
