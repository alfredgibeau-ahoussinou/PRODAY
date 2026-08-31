/**
 * Causerie match (Match Talk) — brief vestiaire, clips validés uniquement.
 */

export interface MatchTalkClipSuggestion {
  id: string;
  label: string;
  /** Minute si connue, sinon null = donnée indisponible. */
  minute: number | null;
  source_event_id?: string;
  /** true seulement si une analyse réelle a produit le clip. */
  analysis_verified: boolean;
  coach_approved: boolean;
  /** Référence vers un VideoClip avancé (Phase 7). */
  video_clip_id?: string;
  /** Ordre dans la causerie (0-indexed). */
  sort_order?: number;
}

/** Consigne texte insérée entre deux clips dans la causerie. */
export interface MatchTalkConsigne {
  id: string;
  /** Position dans le flux (s'intercale avec les clips via sort_order). */
  sort_order: number;
  text: string;
}

export interface MatchTalkBrief {
  id: string;
  event_id: string;
  club_id?: string;
  title: string;
  match_objective?: string;
  key_points: string[];
  formation?: string;
  opponent_notes?: string;
  tactical_phase_ids: string[];
  messages_by_uid: Record<string, string>;
  clips: MatchTalkClipSuggestion[];
  /** Consignes texte intercalées entre les clips (Phase 7). */
  consignes?: MatchTalkConsigne[];
  /** Clips ordonnés pour la présentation (ids dans l'ordre). */
  clip_order?: string[];
  /** true quand la causerie est partagée avec l'équipe. */
  shared?: boolean;
  created_by: string;
  updated_at: Date;
}

export function filterApprovedClips(brief: MatchTalkBrief): MatchTalkClipSuggestion[] {
  return brief.clips.filter((c) => c.coach_approved && c.analysis_verified);
}

export function buildEmptyMatchTalk(
  eventId: string,
  authorUid: string,
  clubId?: string,
): MatchTalkBrief {
  return {
    id: `talk_${eventId}`,
    event_id: eventId,
    club_id: clubId,
    title: 'Causerie match',
    key_points: [],
    tactical_phase_ids: [],
    messages_by_uid: {},
    clips: [],
    consignes: [],
    clip_order: [],
    shared: false,
    created_by: authorUid,
    updated_at: new Date(),
  };
}

/** Trie clips + consignes dans l'ordre de présentation. */
export function sortedTalkItems(
  brief: MatchTalkBrief,
): Array<{ type: 'clip'; item: MatchTalkClipSuggestion } | { type: 'consigne'; item: MatchTalkConsigne }> {
  const items: Array<{ type: 'clip'; item: MatchTalkClipSuggestion; order: number } | { type: 'consigne'; item: MatchTalkConsigne; order: number }> = [];

  const orderMap = new Map((brief.clip_order ?? []).map((id, i) => [id, i]));

  for (const clip of brief.clips) {
    items.push({
      type: 'clip',
      item: clip,
      order: clip.sort_order ?? orderMap.get(clip.id) ?? 999,
    });
  }
  for (const consigne of brief.consignes ?? []) {
    items.push({ type: 'consigne', item: consigne, order: consigne.sort_order });
  }

  items.sort((a, b) => a.order - b.order);
  return items.map(({ type, item }) => ({ type, item } as ReturnType<typeof sortedTalkItems>[number]));
}
