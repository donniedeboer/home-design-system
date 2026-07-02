/**
 * Safe layout DSL for the `dynamic` widget — the ONE place agent-authored display
 * specs are validated and interpreted. No `eval`, no code, no markup: field refs over
 * a CLOSED format enum + a tiny `field op value` predicate grammar for conditional
 * badges. Shared by an app's commit-time validation (`validateLayout`) and by
 * DynamicCard's render (`evalPredicate` + `formatValue`), so there is one implementation.
 */
import type { DynamicLayout, FieldRef, DynamicFieldFormat } from './types';

export const FIELD_FORMATS: readonly DynamicFieldFormat[] = ['usd', 'number', 'date', 'percent', 'text'];
export const BADGE_HUES = ['success', 'warning', 'danger'] as const;
export const ACTION_VERBS = ['love', 'pass', 'rate', 'open'] as const;
export const MAX_STATS = 6;
export const MAX_CHIPS = 4;

export type FieldValue = string | number | boolean | null | undefined;
export type ItemBag = Record<string, FieldValue>;

// `field op value` — op ∈ == != <= >= < > ; field is a bare identifier (dots allowed).
const PRED_RE = /^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*(==|!=|<=|>=|<|>)\s*(.+?)\s*$/;

function parseLiteral(raw: string): FieldValue {
  const s = raw.trim();
  if (s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  const quoted = s.match(/^(['"])(.*)\1$/);
  if (quoted) return quoted[2];
  return s; // bareword string
}

function looseEq(a: FieldValue, b: FieldValue): boolean {
  if (a == null || b == null) return (a ?? null) === (b ?? null);
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
  return String(a) === String(b);
}

/**
 * Evaluate a `field op value` predicate against an item bag. Pure, total, side-effect
 * free. Any parse error or unknown op → false (so a malformed badge simply doesn't show).
 */
export function evalPredicate(expr: string, item: ItemBag): boolean {
  if (!expr || typeof expr !== 'string') return false;
  const m = PRED_RE.exec(expr);
  if (!m) return false;
  const [, field, op, rhsRaw] = m;
  const lhs = item[field] ?? null;
  const rhs = parseLiteral(rhsRaw);
  switch (op) {
    case '==':
      return looseEq(lhs, rhs);
    case '!=':
      return !looseEq(lhs, rhs);
    case '<':
    case '<=':
    case '>':
    case '>=': {
      const a = Number(lhs);
      const b = Number(rhs);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
    }
    default:
      return false;
  }
}

/** Format one field value for display through the fixed format enum. Empty → em dash. */
export function formatValue(v: FieldValue, format?: DynamicFieldFormat): string {
  if (v == null || v === '') return '—';
  switch (format) {
    case 'usd': {
      const n = Number(v);
      return Number.isNaN(n) ? String(v) : `$${n.toLocaleString('en-US')}`;
    }
    case 'number': {
      const n = Number(v);
      return Number.isNaN(n) ? String(v) : n.toLocaleString('en-US');
    }
    case 'percent': {
      const n = Number(v);
      return Number.isNaN(n) ? String(v) : `${Math.round(n)}%`;
    }
    case 'date': {
      const d = new Date(String(v));
      return Number.isNaN(d.getTime())
        ? String(v)
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    default:
      return String(v);
  }
}

export interface LayoutValidation {
  ok: boolean;
  errors: string[];
  /** a clamped, invalid-slots-dropped copy safe to render/store. */
  layout: DynamicLayout;
}

/**
 * Validate + sanitize an agent-authored layout against the search's extract schema.
 * `extractKeys` is the list of allowed field keys; pass [] to skip field-existence
 * checks (render path). Returns collected errors AND a clamped, cleaned layout.
 */
export function validateLayout(layout: DynamicLayout, extractKeys: string[] = []): LayoutValidation {
  const errors: string[] = [];
  const known = new Set(extractKeys);
  const knownField = (f?: string): boolean => (!f ? false : known.size === 0 || known.has(f));

  if (!layout || typeof layout !== 'object') {
    return { ok: false, errors: ['layout is not an object'], layout: { title: { field: '' } } };
  }

  const out: DynamicLayout = { title: layout.title ?? { field: '' } };

  if (!layout.title?.field) errors.push('title: required field ref missing');
  else if (!knownField(layout.title.field)) errors.push(`title: unknown field "${layout.title.field}"`);
  if (layout.title?.format && !FIELD_FORMATS.includes(layout.title.format))
    errors.push(`title: bad format "${layout.title.format}"`);

  const cleanRef = (r: FieldRef, where: string): FieldRef | null => {
    if (!r?.field) {
      errors.push(`${where}: missing field`);
      return null;
    }
    if (!knownField(r.field)) {
      errors.push(`${where}: unknown field "${r.field}"`);
      return null;
    }
    if (r.format && !FIELD_FORMATS.includes(r.format)) {
      errors.push(`${where}: bad format "${r.format}"`);
      return { field: r.field, label: r.label };
    }
    return r;
  };

  if (layout.media) {
    if (!knownField(layout.media.field)) errors.push(`media: unknown field "${layout.media.field}"`);
    else if (!['poster', 'thumb', 'wide'].includes(layout.media.shape)) errors.push('media: bad shape');
    else out.media = layout.media;
  }

  if (layout.subtitle) {
    out.subtitle = layout.subtitle
      .map((r, i) => cleanRef(r, `subtitle[${i}]`))
      .filter((r): r is FieldRef => r != null);
  }

  if (layout.stats) {
    const stats = layout.stats
      .map((r, i) => cleanRef(r, `stats[${i}]`))
      .filter((r): r is FieldRef => r != null);
    if (stats.length > MAX_STATS) errors.push(`stats: ${stats.length} > ${MAX_STATS}, clamped`);
    out.stats = stats.slice(0, MAX_STATS);
  }

  if (layout.chips) {
    const chips = layout.chips.filter((ch, i) => {
      if (!knownField(ch.field)) {
        errors.push(`chips[${i}]: unknown field "${ch.field}"`);
        return false;
      }
      if (ch.tone && !BADGE_HUES.includes(ch.tone)) errors.push(`chips[${i}]: bad tone "${ch.tone}"`);
      return true;
    });
    if (chips.length > MAX_CHIPS) errors.push(`chips: ${chips.length} > ${MAX_CHIPS}, clamped`);
    out.chips = chips.slice(0, MAX_CHIPS).map((ch) => (ch.tone && BADGE_HUES.includes(ch.tone) ? ch : { field: ch.field }));
  }

  if (layout.badges) {
    out.badges = layout.badges.filter((b, i) => {
      if (!b.when || !b.text) {
        errors.push(`badges[${i}]: needs when+text`);
        return false;
      }
      if (!BADGE_HUES.includes(b.hue)) {
        errors.push(`badges[${i}]: bad hue "${b.hue}"`);
        return false;
      }
      if (!PRED_RE.test(b.when)) {
        errors.push(`badges[${i}]: unparseable predicate "${b.when}"`);
        return false;
      }
      return true;
    });
  }

  if (layout.body) {
    const r = cleanRef(layout.body, 'body');
    if (r) out.body = r;
  }

  if (layout.actions) out.actions = layout.actions.filter((a) => ACTION_VERBS.includes(a));

  return { ok: errors.length === 0, errors, layout: out };
}
