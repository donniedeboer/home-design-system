'use client';
import type { ComponentType } from 'react';
import type { WidgetDescriptor, WidgetProps, WidgetType, WidgetAction } from './types';
import MovieCard from './MovieCard';
import ListingCard from './ListingCard';
import Checklist from './Checklist';
import Gallery from './Gallery';
import SongCard from './SongCard';
import Aesthetic from './Aesthetic';
import MultiChoice from './MultiChoice';
import Diff from './Diff';
import DynamicCard from './DynamicCard';

/**
 * type → component registry. The AgentChat parser looks a descriptor's `type` up
 * here; an unknown type falls back to safe text (see Widget).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const widgetRegistry: Record<WidgetType, ComponentType<WidgetProps<any>>> = {
  movie: MovieCard,
  listing: ListingCard,
  checklist: Checklist,
  gallery: Gallery,
  song: SongCard,
  aesthetic: Aesthetic,
  multichoice: MultiChoice,
  diff: Diff,
  dynamic: DynamicCard,
};

/**
 * Widget dispatcher — renders the registered component for `descriptor.type`, or
 * the text `fallback` for an unknown type / missing component ("fail soft").
 */
export function Widget({
  descriptor,
  variant,
  onAction,
}: {
  descriptor: WidgetDescriptor;
  variant?: WidgetDescriptor['variant'];
  onAction?: WidgetAction;
}) {
  const Comp = widgetRegistry[descriptor.type as WidgetType];
  if (!Comp) {
    return descriptor.fallback ? (
      <div className="rounded-md border border-border bg-surface-0 p-2 text-[13px] text-fg-muted">
        {descriptor.fallback}
      </div>
    ) : null;
  }
  return (
    <Comp
      data={descriptor.data}
      variant={variant ?? descriptor.variant ?? 'compact'}
      onAction={onAction}
    />
  );
}
