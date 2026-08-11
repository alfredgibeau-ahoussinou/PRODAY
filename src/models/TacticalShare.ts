/**
 * Partage consignes tactiques vers joueurs (Smart Tactics).
 */

export type TacticalShareAudience = 'team' | 'group' | 'player';

export interface TacticalSharePayload {
  id: string;
  board_event_id?: string;
  club_id?: string;
  author_uid: string;
  title: string;
  phase_label?: string;
  note?: string;
  audience: TacticalShareAudience;
  /** Uids destinataires (équipe résolue côté service). */
  recipient_uids: string[];
  created_at: Date;
}

export function recipientsForAudience(input: {
  audience: TacticalShareAudience;
  teamUids: string[];
  groupUids?: string[];
  playerUid?: string;
}): string[] {
  if (input.audience === 'team') return [...new Set(input.teamUids)];
  if (input.audience === 'group') return [...new Set(input.groupUids ?? [])];
  if (input.playerUid) return [input.playerUid];
  return [];
}
