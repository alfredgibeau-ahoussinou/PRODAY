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
    created_by: authorUid,
    updated_at: new Date(),
  };
}
