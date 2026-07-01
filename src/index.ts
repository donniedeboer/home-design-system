// ── Identity ────────────────────────────────────────────────────────────────
export { default as Logo, glyphs, type AppGlyphName } from './components/Logo';
export { default as ProfileAvatar } from './components/ProfileAvatar';
export { default as ProfileProvider, useProfiles, type Profile } from './components/ProfileProvider';
export { default as ProfileSwitcher } from './components/ProfileSwitcher';

// ── Router adapter (the one decoupling surface) ──────────────────────────────
export {
  RouterProvider,
  RouterContext,
  useRouter,
  isActivePath,
  defaultRouterAdapter,
  type RouterAdapter,
  type LinkAdapter,
} from './router/RouterProvider';

// ── Shell & nav ──────────────────────────────────────────────────────────────
export { default as AppShell } from './components/AppShell';
export { default as TopNav, IdentityChip, type NavLink } from './components/TopNav';
export { default as SideNav, type NavSection } from './components/SideNav';

// ── Chrome primitives ────────────────────────────────────────────────────────
export { default as Modal } from './components/Modal';
export { default as Button } from './components/Button';
export { Input, Select } from './components/Field';
export { Chip, StatChip, StatGrid, DataGrid, ListRow, Card, CardList } from './components/data';
export { default as FeedbackWidget } from './components/FeedbackWidget';

// ── Chat surface ─────────────────────────────────────────────────────────────
export {
  default as AgentChat,
  type AgentChatProps,
  type ChatMessage,
  type ChatRole,
  type ChatStreamEvent,
} from './chat/AgentChat';
export { parseWidgetProtocol, type ChatSegment } from './chat/parseWidgetProtocol';
export { default as Markdown, type MarkdownProps } from './chat/Markdown';

// ── Widgets ──────────────────────────────────────────────────────────────────
export { default as MovieCard } from './widgets/MovieCard';
export { default as ListingCard } from './widgets/ListingCard';
export { default as Checklist } from './widgets/Checklist';
export { default as Gallery } from './widgets/Gallery';
export { default as SongCard } from './widgets/SongCard';
export { default as Aesthetic } from './widgets/Aesthetic';
export { default as MultiChoice } from './widgets/MultiChoice';
export { default as Diff } from './widgets/Diff';
export { Widget, widgetRegistry } from './widgets/registry';
export {
  type WidgetVariant,
  type WidgetType,
  type WidgetDescriptor,
  type WidgetProps,
  type WidgetAction,
  type MovieData,
  type ListingData,
  type ChecklistData,
  type ChecklistItem,
  type GalleryData,
  type GalleryImage,
  type SongData,
  type AestheticData,
  type MultiChoiceData,
  type DiffData,
} from './widgets/types';

// ── Accent registry ──────────────────────────────────────────────────────────
export {
  accents,
  accentCssVars,
  accentThemeBlock,
  type Accent,
  type AccentName,
} from './tokens/accents';
