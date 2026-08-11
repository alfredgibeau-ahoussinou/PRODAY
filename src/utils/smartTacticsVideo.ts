import type {
  LiveMatchTag,
  LiveTagKind,
  MatchAnalyticsSnapshot,
  VideoAnalysisJob,
} from '../models/SmartTactics';
import type { LiveMatchAction, PlayerMatchSheetStat, TeamEvent } from '../models/TeamEvent';

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Create a live tag + clip stub for the VO pipeline. */
export function createLiveMatchTag(input: {
  event_id: string;
  kind: LiveTagKind;
  minute: number;
  created_by: string;
  player_uid?: string;
  player_name?: string;
  note?: string;
}): LiveMatchTag {
  const clip_id = uid('clip');
  return {
    id: uid('tag'),
    event_id: input.event_id,
    kind: input.kind,
    minute: input.minute,
    player_uid: input.player_uid,
    player_name: input.player_name,
    note: input.note,
    clip_id,
    created_at: new Date(),
    created_by: input.created_by,
  };
}

/** Map Smart Tactics tags onto existing live action types when possible. */
export function liveTagToAction(tag: LiveMatchTag): LiveMatchAction | null {
  const map: Partial<Record<LiveTagKind, LiveMatchAction['type']>> = {
    goal: 'goal',
    card: 'yellow_card',
    substitution: 'sub_in',
  };
  const type = map[tag.kind];
  if (!type || !tag.player_uid) return null;
  return {
    id: tag.id,
    type,
    player_uid: tag.player_uid,
    player_name: tag.player_name ?? 'Joueur',
    minute: tag.minute,
    created_at: tag.created_at,
  };
}

export function createVideoAnalysisJob(input: {
  uploader_uid: string;
  club_id?: string;
  event_id?: string;
  source: VideoAnalysisJob['source'];
  local_uri?: string;
}): VideoAnalysisJob {
  const now = new Date();
  return {
    id: uid('vo'),
    club_id: input.club_id,
    event_id: input.event_id,
    uploader_uid: input.uploader_uid,
    source: input.source,
    local_uri: input.local_uri,
    status: 'queued',
    cv_ready: true,
    highlight_clip_ids: [],
    created_at: now,
    updated_at: now,
  };
}

export function buildMatchAnalyticsFromEvent(event: TeamEvent): MatchAnalyticsSnapshot {
  const stats = Object.values(event.player_match_stats ?? {}) as PlayerMatchSheetStat[];
  const actions = event.live_actions ?? [];
  const goals = actions.filter((a) => a.type === 'goal').length || stats.reduce((a, s) => a + (s.goals ?? 0), 0);
  const assists =
    actions.filter((a) => a.type === 'assist').length || stats.reduce((a, s) => a + (s.assists ?? 0), 0);
  const minutes = stats.reduce((a, s) => a + (s.minutes_played ?? 0), 0);
  const player_ratings: Record<string, number> = {};
  for (const s of stats) {
    if (typeof s.rating === 'number') player_ratings[s.uid] = s.rating;
  }

  return {
    event_id: event.id,
    goals,
    assists,
    minutes,
    distance_km: undefined,
    passes: undefined,
    duels: undefined,
    recoveries: undefined,
    interceptions: undefined,
    shots: actions.filter((a) => a.type === 'goal').length,
    expected_progress: stats.length ? Math.min(100, Math.round((goals + assists) * 12 + minutes / 10)) : undefined,
    player_ratings,
    heatmap_ready: false,
  };
}
