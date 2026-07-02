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
export { default as SideNav, SideNavItem, SideNavLabel, type NavSection } from './components/SideNav';

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
export {
  default as AgentChatModal,
  type AgentChatModalProps,
  type Dock,
  type SeedLine,
} from './chat/AgentChatModal';
export { parseWidgetProtocol, type ChatSegment } from './chat/parseWidgetProtocol';
export { default as Markdown, type MarkdownProps } from './chat/Markdown';
export { consumeSse, parseFrame, type SseFrame, type ConsumeStatus } from './chat/consumeSse';
export {
  useAgentSession,
  type UseAgentSession,
  type AgentSessionOptions,
  type OutgoingImage,
  type Entry,
  type UserEntry,
  type AssistantEntry,
  type ToolLine,
  type QuestionCard,
  type ErrLine,
  type RetryLine,
  type ChatState,
  type LoadRecord,
} from './chat/useAgentSession';

// ── Widgets ──────────────────────────────────────────────────────────────────
export { default as MovieCard } from './widgets/MovieCard';
export { default as ListingCard } from './widgets/ListingCard';
export { default as Checklist } from './widgets/Checklist';
export { default as Gallery } from './widgets/Gallery';
export { default as SongCard } from './widgets/SongCard';
export { default as Aesthetic } from './widgets/Aesthetic';
export { default as MultiChoice } from './widgets/MultiChoice';
export { default as Diff } from './widgets/Diff';
export { default as DynamicCard } from './widgets/DynamicCard';
export { Widget, widgetRegistry } from './widgets/registry';
export {
  FitChip,
  WhyLine,
  ReasoningBlock,
  ResearchChip,
  ResearchRow,
  researchDims,
  fitTone,
  MAX_RESEARCH_DIMS,
} from './widgets/Reasoning';
export {
  validateLayout,
  evalPredicate,
  formatValue,
  FIELD_FORMATS,
  BADGE_HUES,
  ACTION_VERBS,
  MAX_STATS,
  MAX_CHIPS,
  type LayoutValidation,
  type ItemBag,
  type FieldValue,
} from './widgets/dynamicLayout';
export {
  type WidgetVariant,
  type WidgetType,
  type WidgetDescriptor,
  type WidgetProps,
  type WidgetAction,
  type Reaction,
  type FitVerdict,
  type ResearchDim,
  type ResearchTier,
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
  type DynamicData,
  type DynamicLayout,
  type DynamicChip,
  type DynamicBadge,
  type FieldRef,
  type DynamicFieldFormat,
} from './widgets/types';

// ── Accent registry ──────────────────────────────────────────────────────────
export {
  accents,
  accentCssVars,
  accentThemeBlock,
  type Accent,
  type AccentName,
} from './tokens/accents';
