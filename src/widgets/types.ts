/**
 * One `data` contract per widget, two footprints (compact | full). The agent emits
 * DATA, never markup — the same JSON renders as a React component in-app and (in
 * Omni's vanilla chat) as a hand-built card. Both renderers share THIS file.
 *
 * "Fail soft": every descriptor carries an optional text `fallback`; an unknown
 * `type` or bad JSON degrades to that text.
 */

export type WidgetVariant = 'compact' | 'full';

export interface MovieData {
  id?: string;
  title: string;
  year?: number;
  poster_url?: string;
  status?: 'watched' | 'watchlist';
  rating?: number; // 0..5 (data hue, never the accent)
  who?: string;
  notes?: string;
  watched_at?: string;
  url?: string;
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
  actions?: Array<'love' | 'pass' | 'rate' | 'open'>;
}

/** The `data` payload for a `dynamic` widget: a layout + the item's normalized field bag. */
export interface DynamicData {
  id?: string;
  /** stable id used to round-trip love/pass/rate commands (e.g. the candidate id). */
  itemId: string;
  layout: DynamicLayout;
  item: Record<string, string | number | boolean | null | undefined>;
  /** external link for the `open` action. */
  url?: string;
  /** in-platform link for the `open` action (preferred over `url`). */
  scoutUrl?: string;
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

/** Interaction callback: widgets round-trip a compact command string as the next chat message. */
export type WidgetAction = (message: string) => void;

/** Common prop shape every widget component accepts. */
export interface WidgetProps<D> {
  data: D;
  variant?: WidgetVariant;
  onAction?: WidgetAction;
}
