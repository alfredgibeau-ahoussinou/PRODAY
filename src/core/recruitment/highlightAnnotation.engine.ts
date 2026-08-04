/**
 * Highlight video annotations — timestamp notes on ProDay player highlights.
 * Not a Wyscout clip library: annotations live on the player's own media URLs.
 */

export type HighlightAnnotationKind =
  | 'strength'
  | 'weakness'
  | 'tactical'
  | 'physical'
  | 'note';

export interface HighlightAnnotation {
  id: string;
  media_url: string;
  /** Seconds from start. */
  timestamp_sec: number;
  kind: HighlightAnnotationKind;
  label: string;
  note?: string;
  author_uid: string;
  created_at: Date;
}

export interface HighlightAnnotationDraftInput {
  mediaUrl: string;
  timestampSec: number;
  kind: HighlightAnnotationKind;
  label: string;
  note?: string;
  authorUid: string;
}

export const HIGHLIGHT_ANNOTATION_KIND_LABELS: Record<HighlightAnnotationKind, string> = {
  strength: 'Point fort',
  weakness: 'Point faible',
  tactical: 'Tactique',
  physical: 'Physique',
  note: 'Note',
};

export function buildHighlightAnnotation(
  input: HighlightAnnotationDraftInput
): HighlightAnnotation {
  const ts = Math.max(0, Math.round(input.timestampSec));
  return {
    id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    media_url: input.mediaUrl.trim(),
    timestamp_sec: ts,
    kind: input.kind,
    label: input.label.trim() || HIGHLIGHT_ANNOTATION_KIND_LABELS[input.kind],
    note: input.note?.trim() || undefined,
    author_uid: input.authorUid,
    created_at: new Date(),
  };
}

export function formatAnnotationTimestamp(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function sortAnnotations(list: HighlightAnnotation[]): HighlightAnnotation[] {
  return [...list].sort((a, b) => a.timestamp_sec - b.timestamp_sec);
}

export function annotationsForMedia(
  list: HighlightAnnotation[],
  mediaUrl: string
): HighlightAnnotation[] {
  return sortAnnotations(list.filter((a) => a.media_url === mediaUrl));
}
