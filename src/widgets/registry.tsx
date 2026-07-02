'use client';
import { Component, type ComponentType, type ReactNode } from 'react';
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

/** A thrown widget must never take down the chat surface — catch it and fail soft to
 *  the descriptor's text `fallback`, same as an unknown type. */
class WidgetErrorBoundary extends Component<{ fallback?: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return this.props.fallback ? (
        <div className="rounded-md border border-border bg-surface-0 p-2 text-[13px] text-fg-muted">{this.props.fallback}</div>
      ) : null;
    }
    return this.props.children;
  }
}

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
    <WidgetErrorBoundary fallback={descriptor.fallback}>
      <Comp
        data={descriptor.data}
        variant={variant ?? descriptor.variant ?? 'compact'}
        onAction={onAction}
      />
    </WidgetErrorBoundary>
  );
}
