/**
 * One `data` contract per widget, two footprints (compact | full). The agent emits
 * DATA, never markup — the same JSON renders as a React component in-app and (in
 * Omni's vanilla chat) as a hand-built card. Both renderers share THIS file.
 *
 * "Fail soft": every descriptor carries an optional text `fallback`; an unknown
 * `type` or bad JSON degrades to that text.
 */

export type WidgetVariant = 'compact' | 'full';

/** A thumb reaction — the persisted state behind the up/down pair on item cards. */
export type Reaction = 'up' | 'down';

/** Synthesized fit verdict — strong/good render success, mixed warning, weak danger (DATA hues). */
export type FitVerdict = 'strong' | 'good' | 'mixed' | 'weak';

/**
 * One research dimension's status — the label is spec-authored and domain-generic
 * ("Aesthetics (photos)" for houses, "Ratings" for movies); `done` means the deep-dive
 * for that dimension has actually run for THIS item.
 */
export interface ResearchDim {
  label: string;
  done: boolean;
}

/**
 * Research tier — 'vetted' = fully researched/deep-scored; 'triage' = provisional
 * listing-native rank only (scores render muted with a "~" prefix).
 */
export type ResearchTier = 'vetted' | 'triage';

export interface MovieData {
  id?: string;
  title: string;
  year?: number;
  poster_url?: string;
  status?: 'watched' | 'watchlist';
  rating?: number; // 0..5 (data hue, never the accent) — a DISPLAY, not a reaction control
  who?: string;
  notes?: string;
  watched_at?: string;
  url?: string;
  /** one-line synthesized fit summary (compact: truncated italic line). */
  why?: string;
  /** overall fit verdict (renders as a data-hue chip). */
  fit?: FitVerdict;
  pros?: string[];
  cons?: string[];
  /** one-line recommendation (full variant: final emphasized line). */
  advice?: string;
  /** persisted thumb reaction (drives the reaction bar's selected state). */
  reaction?: Reaction;
  /** per-dimension research status (compact: "n/m researched" chip; full: ✓/○ chip row). */
  research?: ResearchDim[];
  /** 'vetted' = deep-researched score; 'triage' = provisional (score/fit render muted "~"). */
  tier?: ResearchTier;
}

export interface ListingData {
  propertyId: string;
  candidateId?: number;
  address: string;
  city?: string;
  region?: string;
  zip?: string;
  price?: number;
  lastPrice?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSize?: string;
  status?: string;
  score?: number;
  url?: string; // the ORIGINAL source listing (Redfin/Compass/Zillow)
  scoutUrl?: string; // the candidate's page in Scout's own UI (the "Open in Scout" target)
  photo_url?: string; // CDN hero (representative preview; safe off-tailnet)
  photos?: string[]; // full gallery (tailnet-only Scout route)
  summary?: string;
  /** one-line synthesized fit summary (compact: truncated italic line). */
  why?: string;
  /** overall fit verdict (renders as a data-hue chip). */
  fit?: FitVerdict;
  pros?: string[];
  cons?: string[];
  /** one-line recommendation (full variant: final emphasized line). */
  advice?: string;
  /** persisted thumb reaction (drives the reaction bar's selected state). */
  reaction?: Reaction;
  /** per-dimension research status (compact: "n/m researched" chip; full: ✓/○ chip row). */
  research?: ResearchDim[];
  /** 'vetted' = deep-researched score; 'triage' = provisional (score/fit render muted "~"). */
  tier?: ResearchTier;
}

export interface ChecklistItem {
  id?: string;
  label: string;
  checked?: boolean;
  note?: string;
}
export interface ChecklistData {
  id: string;
  title: string;
  items: ChecklistItem[];
  updatable?: boolean; // agent-updatable (stable id → replace-in-place)
}

export interface GalleryImage {
  url: string;
  alt?: string;
}
export interface GalleryData {
  title?: string;
  images: GalleryImage[];
  cover_url?: string;
}

export interface SongData {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  art_url?: string;
  url?: string;
}

export interface AestheticData {
  id?: string;
  label: string;
  image_url?: string; // RESOLVED ref (Persona /ref route); degrades to text off-tailnet
  why: string;
  tags?: string;
}

export interface MultiChoiceData {
  question: string;
  options: string[];
  multi?: boolean;
}

export interface DiffData {
  entity?: string;
  key?: string;
  /** previous value (omit/empty for an add). */
  old?: string | number | null;
  /** proposed value (omit/empty for a remove). */
  new?: string | number | null;
  visibility?: string;
  /** the change kind — 'edit' (default) | 'add' | 'remove'. */
  op?: 'edit' | 'add' | 'remove' | string;
  /** proposal id when queued for review; drives the Accept/Dismiss buttons. */
  proposalId?: string;
  /** 'committed' (auto-applied, nothing to accept) | 'queued'. */
  status?: 'committed' | 'queued' | string;
}

export type DynamicFieldFormat = 'usd' | 'number' | 'date' | 'percent' | 'text';

/** A reference to one extracted field, with an optional human label and display format. */
export interface FieldRef {
  field: string;
  label?: string;
  format?: DynamicFieldFormat;
}

/** A conditional badge — shown when `when` (a safe `field op value` predicate) is true. */
export interface DynamicBadge {
  when: string;
  text: string;
  hue: 'success' | 'warning' | 'danger';
}

/** A value chip keyed off one field (data hues only). */
export interface DynamicChip {
  field: string;
  tone?: 'success' | 'warning' | 'danger';
}

/**
 * A declarative, agent-authored layout over a CLOSED vocabulary — never code, never
 * markup. Interpreted by DynamicCard into design-system primitives. Hard clamps
 * (≤6 stats, ≤4 chips), the format enum, and the badge predicate DSL keep it safe.
 */
export interface DynamicLayout {
  media?: { field: string; shape: 'poster' | 'thumb' | 'wide' };
  title: FieldRef;
  subtitle?: FieldRef[];
  stats?: FieldRef[]; // clamped to 6
  chips?: DynamicChip[]; // clamped to 4
  badges?: DynamicBadge[];
  body?: FieldRef;
  /** 'love'/'pass' are LEGACY aliases for 'up'/'down' — both render the thumbs pair (+ note). */
  actions?: Array<'up' | 'down' | 'love' | 'pass' | 'rate' | 'open'>;
}

/** The `data` payload for a `dynamic` widget: a layout + the item's normalized field bag. */
export interface DynamicData {
  id?: string;
  /** stable id used to round-trip up/down/rate commands (e.g. the candidate id). */
  itemId: string;
  layout: DynamicLayout;
  item: Record<string, string | number | boolean | null | undefined>;
  /** external link for the `open` action. */
  url?: string;
  /** in-platform link for the `open` action (preferred over `url`). */
  scoutUrl?: string;
  /** one-line synthesized fit summary (compact: truncated italic line). */
  why?: string;
  /** overall fit verdict (renders as a data-hue chip). */
  fit?: FitVerdict;
  pros?: string[];
  cons?: string[];
  /** one-line recommendation (full variant: final emphasized line). */
  advice?: string;
  /** persisted thumb reaction (drives the reaction bar's selected state). */
  reaction?: Reaction;
  /** per-dimension research status (compact: "n/m researched" chip; full: ✓/○ chip row). */
  research?: ResearchDim[];
  /** 'vetted' = deep-researched score; 'triage' = provisional (score/fit render muted "~"). */
  tier?: ResearchTier;
}

export type WidgetDescriptor =
  | { type: 'movie'; variant?: WidgetVariant; data: MovieData; fallback?: string }
  | { type: 'listing'; variant?: WidgetVariant; data: ListingData; fallback?: string }
  | { type: 'checklist'; variant?: WidgetVariant; data: ChecklistData; fallback?: string }
  | { type: 'gallery'; variant?: WidgetVariant; data: GalleryData; fallback?: string }
  | { type: 'song'; variant?: WidgetVariant; data: SongData; fallback?: string }
  | { type: 'aesthetic'; variant?: WidgetVariant; data: AestheticData; fallback?: string }
  | { type: 'multichoice'; variant?: WidgetVariant; data: MultiChoiceData; fallback?: string }
  | { type: 'diff'; variant?: WidgetVariant; data: DiffData; fallback?: string }
  | { type: 'dynamic'; variant?: WidgetVariant; data: DynamicData; fallback?: string };

export type WidgetType = WidgetDescriptor['type'];

/**
 * Interaction callback: widgets round-trip a compact command string as the next chat message.
 *
 * Reaction command grammar (every interactive item card):
 *   `up <kind> <id>` / `down <kind> <id>`     — a thumb alone
 *   `up <kind> <id> | <note>`                 — a thumb WITH a free-text note (pipe-separated)
 * kind = 'listing' (ListingCard, id = propertyId) | 'movie' (MovieCard, id = id ?? title)
 *      | 'item' (DynamicCard, id = itemId). `love`/`pass` are LEGACY aliases for up/down —
 * still accepted in DynamicLayout.actions, but cards only EMIT up/down.
 * Ratings: DynamicCard's `rate` verb still emits `rate item <id> <n>`; MovieCard's rating is
 * now a display only (no `rate movie …` emission).
 */
export type WidgetAction = (message: string) => void;

/** Common prop shape every widget component accepts. */
export interface WidgetProps<D> {
  data: D;
  variant?: WidgetVariant;
  onAction?: WidgetAction;
}
