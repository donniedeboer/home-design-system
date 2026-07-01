/**
 * Contrast gate + CSS mirror generator for the derived accent registry.
 *
 *   node --experimental-strip-types scripts/check-accents.ts          # verify
 *   node --experimental-strip-types scripts/check-accents.ts --css     # + print CSS
 *
 * Verification is INDEPENDENT of accents.ts: contrast is recomputed here from the
 * emitted hex values, so a bug in the module's math can't hide behind self-report.
 * Exits non-zero if any primary-button (fg × fill) or (fg × hover-fill) pair — or
 * any accent-text-on-canvas link — is below WCAG AA 4.5:1.
 */

import { accents, accentThemeBlock, accentCssVars, type Accent, type AccentName } from '../src/tokens/accents.ts';

const AA = 4.5;
const CANVAS = '#1c1b19'; // --color-surface-1, where accent-text links live

// ---- independent WCAG contrast (do NOT import from the module under test) ----
function lum(hex: string): number {
  const h = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function cr(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const f = (n: number) => n.toFixed(2).padStart(6);
const mark = (n: number) => (n >= AA ? 'ok ' : 'FAIL');

let failed = 0;
console.log('accent    ink        fg×btn      fg×btn-hover   text×canvas');
console.log('─'.repeat(66));
for (const name of Object.keys(accents) as AccentName[]) {
  const a: Accent = accents[name];
  const btn = cr(a.accentFg, a.accentBtn);
  const hov = cr(a.accentFg, a.accentBtnHover);
  const txt = cr(a.accentText, CANVAS);
  const ink = a.accentFg.toLowerCase() === '#ffffff' ? 'white     ' : 'deep-tint ';
  if (btn < AA || hov < AA || txt < AA) failed++;
  console.log(
    name.padEnd(9), ink,
    `${f(btn)} ${mark(btn)}`, ` ${f(hov)} ${mark(hov)}`, `  ${f(txt)} ${mark(txt)}`,
  );
}
console.log('─'.repeat(66));

if (process.argv.includes('--css')) {
  console.log('\n/* ── design-tokens.css :root default (neutral) ── */');
  console.log(accentThemeBlock('neutral').replace('@theme {\n', '').replace('\n}', ''));
  console.log('\n/* ── per-app recipe comments (paste into both token files) ── */');
  const order: AccentName[] = ['omni', 'persona', 'pulse', 'scout', 'golinks', 'devbot'];
  const label: Record<string, string> = {
    omni: 'Omni (indigo)', persona: 'Persona (orchid)', pulse: 'Pulse (emerald)',
    scout: 'Scout (teal)', golinks: 'go-links (sky)', devbot: 'devbot (amber)',
  };
  for (const name of order) {
    const a = accents[name];
    const v = (k: keyof Accent) => `${accentCssVars[k]}:${a[k]};`;
    console.log(`   ${label[name]}:`);
    console.log(`     ${v('accent')} ${v('accentHover')}`);
    console.log(`     ${v('accentBtn')} ${v('accentBtnHover')} ${v('accentFg')}`);
    console.log(`     ${v('accentSubtle')} ${v('accentMuted')} ${v('accentText')} ${accentCssVars.ring}:${a.ring};`);
  }
}

if (failed) {
  console.error(`\n✗ ${failed} accent(s) below AA ${AA}:1`);
  process.exit(1);
}
console.log(`\n✓ all accents clear AA ${AA}:1 on both button states + text-on-canvas`);
