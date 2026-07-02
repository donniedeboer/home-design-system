/**
 * Safe layout DSL for the `dynamic` widget — the ONE place agent-authored display
 * specs are validated and interpreted. No `eval`, no code, no markup: field refs over
 * a CLOSED format enum + a tiny `field op value` predicate grammar for conditional
 * badges. Shared by an app's commit-time validation (`validateLayout`) and by
 * DynamicCard's render (`evalPredicate` + `formatValue` + `getField`), so there is one
 * implementation. Every exported function is TOTAL — hostile/malformed input yields a
 * safe value, never a throw (a thrown widget would take down the whole chat surface).
 */
import type { DynamicLayout, FieldRef, DynamicFieldFormat } from './types';

export const FIELD_FORMATS: readonly DynamicFieldFormat[] = ['usd', 'number', 'date', 'percent', 'text'];
export const BADGE_HUES = ['success', 'warning', 'danger'] as const;
export const ACTION_VERBS = ['love', 'pass', 'rate', 'open'] as const;
export const MAX_STATS = 6;
export const MAX_CHIPS = 4;
export const MAX_BADGES = 4;
const MAX_TEXT_LEN = 300; // guard against an agent flooding the DOM with a giant string
const MAX_BADGE_TEXT = 60;

export type FieldValue = string | number | boolean | null | undefined;
export type ItemBag = Record<string, FieldValue>;

// `field op value` — op ∈ == != <= >= < > ; field is a bare identifier (dots allowed).
const PRED_RE = /^\s*([A-Za-z_][A-Za-z0-9_.]*)\s*(==|!=|<=|>=|<|>)\s*(.+?)\s*$/;

function clampLen(s: string): string {
  return s.length > MAX_TEXT_LEN ? s.slice(0, MAX_TEXT_LEN) + '…' : s;
}

/**
 * Own-property field read — never walks the prototype chain, so agent-chosen field names
 * like "constructor" / "toString" / "__proto__" resolve to null rather than to inherited
 * members (which would make predicates always-true and could render function source).
 */
export function getField(item: ItemBag, field: string): FieldValue {
  return item != null && Object.hasOwn(item, field) ? item[field] ?? null : null;
}

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
 * A missing field is null: ordered comparisons (`< <= > >=`) against null are false (never
 * coerced to 0), so `price <= 500000` does NOT fire on an item that has no price.
 */
export function evalPredicate(expr: string, item: ItemBag): boolean {
  if (!expr || typeof expr !== 'string') return false;
  const m = PRED_RE.exec(expr);
  if (!m) return false;
  const [, field, op, rhsRaw] = m;
  const lhs = getField(item, field);
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
      if (lhs == null) return false; // missing field never satisfies an ordered comparison
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
  const raw = String(v);
  switch (format) {
    case 'usd': {
      const n = Number(v);
      return Number.isNaN(n) ? clampLen(raw) : `$${n.toLocaleString('en-US')}`;
    }
    case 'number': {
      const n = Number(v);
      return Number.isNaN(n) ? clampLen(raw) : n.toLocaleString('en-US');
    }
    case 'percent': {
      const n = Number(v);
      return Number.isNaN(n) ? clampLen(raw) : `${Math.round(n)}%`;
    }
    case 'date': {
      const d = new Date(raw);
      return Number.isNaN(d.getTime())
        ? clampLen(raw)
        : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    default:
      return clampLen(raw);
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
 * checks (render path). TOTAL: non-array slots / non-object refs are recorded as errors
 * and dropped, never thrown. Returns collected errors AND a clamped, cleaned layout.
 */
export function validateLayout(layout: DynamicLayout, extractKeys: string[] = []): LayoutValidation {
  const errors: string[] = [];
  const known = new Set(extractKeys);
  const knownField = (f?: string): boolean => (!f ? false : known.size === 0 || known.has(f));

  if (!layout || typeof layout !== 'object') {
    return { ok: false, errors: ['layout is not an object'], layout: { title: { field: '' } } };
  }

  const titleRef = layout.title && typeof layout.title === 'object' ? layout.title : null;
  const out: DynamicLayout = { title: titleRef ?? { field: '' } };

  if (!titleRef?.field) errors.push('title: required object field ref missing');
  else if (!knownField(titleRef.field)) errors.push(`title: unknown field "${titleRef.field}"`);
  if (titleRef?.format && !FIELD_FORMATS.includes(titleRef.format))
    errors.push(`title: bad format "${titleRef.format}"`);

  const cleanRef = (r: FieldRef, where: string): FieldRef | null => {
    if (!r || typeof r !== 'object' || !r.field) {
      errors.push(`${where}: missing/invalid field ref`);
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

  if (layout.media != null) {
    if (typeof layout.media !== 'object') errors.push('media: not an object');
    else if (!knownField(layout.media.field)) errors.push(`media: unknown field "${layout.media.field}"`);
    else if (!['poster', 'thumb', 'wide'].includes(layout.media.shape)) errors.push('media: bad shape');
    else out.media = layout.media;
  }

  if (layout.subtitle != null) {
    if (!Array.isArray(layout.subtitle)) errors.push('subtitle: not an array');
    else
      out.subtitle = layout.subtitle
        .map((r, i) => cleanRef(r, `subtitle[${i}]`))
        .filter((r): r is FieldRef => r != null);
  }

  if (layout.stats != null) {
    if (!Array.isArray(layout.stats)) errors.push('stats: not an array');
    else {
      const stats = layout.stats
        .map((r, i) => cleanRef(r, `stats[${i}]`))
        .filter((r): r is FieldRef => r != null);
      if (stats.length > MAX_STATS) errors.push(`stats: ${stats.length} > ${MAX_STATS}, clamped`);
      out.stats = stats.slice(0, MAX_STATS);
    }
  }

  if (layout.chips != null) {
    if (!Array.isArray(layout.chips)) errors.push('chips: not an array');
    else {
      const chips = layout.chips.filter((ch, i) => {
        if (!ch || typeof ch !== 'object' || !knownField(ch.field)) {
          errors.push(`chips[${i}]: unknown/invalid field`);
          return false;
        }
        if (ch.tone && !BADGE_HUES.includes(ch.tone)) errors.push(`chips[${i}]: bad tone "${ch.tone}"`);
        return true;
      });
      if (chips.length > MAX_CHIPS) errors.push(`chips: ${chips.length} > ${MAX_CHIPS}, clamped`);
      out.chips = chips.slice(0, MAX_CHIPS).map((ch) => (ch.tone && BADGE_HUES.includes(ch.tone) ? ch : { field: ch.field }));
    }
  }

  if (layout.badges != null) {
    if (!Array.isArray(layout.badges)) errors.push('badges: not an array');
    else {
      const badges = layout.badges.filter((b, i) => {
        if (!b || typeof b !== 'object' || !b.when || !b.text) {
          errors.push(`badges[${i}]: needs when+text`);
          return false;
        }
        if (!BADGE_HUES.includes(b.hue)) {
          errors.push(`badges[${i}]: bad hue "${b.hue}"`);
          return false;
        }
        if (typeof b.when !== 'string' || !PRED_RE.test(b.when)) {
          errors.push(`badges[${i}]: unparseable predicate`);
          return false;
        }
        return true;
      });
      if (badges.length > MAX_BADGES) errors.push(`badges: ${badges.length} > ${MAX_BADGES}, clamped`);
      out.badges = badges.slice(0, MAX_BADGES).map((b) => ({
        ...b,
        text: b.text.length > MAX_BADGE_TEXT ? b.text.slice(0, MAX_BADGE_TEXT) : b.text,
      }));
    }
  }

  if (layout.body != null) {
    const r = cleanRef(layout.body, 'body');
    if (r) out.body = r;
  }

  if (layout.actions != null) {
    if (!Array.isArray(layout.actions)) errors.push('actions: not an array');
    else out.actions = layout.actions.filter((a) => ACTION_VERBS.includes(a));
  }

  return { ok: errors.length === 0, errors, layout: out };
}
