/**
 * Clips vidéo avancés — découpage, tagging, annotations SVG.
 * Sous-collection de `club_match_videos/{videoId}/video_clips`.
 */

export type VideoClipTag =
  | 'goal'
  | 'shot'
  | 'chance'
  | 'foul'
  | 'card'
  | 'substitution'
  | 'tactical'
  | 'other';

export const VIDEO_CLIP_TAG_LABELS: Record<VideoClipTag, string> = {
  goal: 'BUT',
  shot: 'TIR',
  chance: 'OCCASION',
  foul: 'FAUTE',
  card: 'CARTON',
  substitution: 'REMPLACEMENT',
  tactical: 'TACTIQUE',
  other: 'AUTRE',
};

export interface VideoClip {
  id: string;
  video_id: string;
  match_id?: string;
  start_sec: number;
  end_sec: number;
  tag: VideoClipTag;
  player_uids: string[];
  note?: string;
  created_by: string;
  created_at: Date;
}

export interface CreateVideoClipInput {
  video_id: string;
  match_id?: string;
  start_sec: number;
  end_sec: number;
  tag: VideoClipTag;
  player_uids?: string[];
  note?: string;
  created_by: string;
}

export function buildVideoClip(input: CreateVideoClipInput): VideoClip {
  const start = Math.max(0, Math.round(input.start_sec));
  const end = Math.max(start + 1, Math.round(input.end_sec));
  return {
    id: `vclip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    video_id: input.video_id,
    match_id: input.match_id,
    start_sec: start,
    end_sec: end,
    tag: input.tag,
    player_uids: input.player_uids ?? [],
    note: input.note?.trim() || undefined,
    created_by: input.created_by,
    created_at: new Date(),
  };
}

export function clipDurationSec(clip: VideoClip): number {
  return Math.max(0, clip.end_sec - clip.start_sec);
}

export function formatClipRange(clip: VideoClip): string {
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  };
  return `${fmt(clip.start_sec)} → ${fmt(clip.end_sec)}`;
}

export function sortClipsByTime(clips: VideoClip[]): VideoClip[] {
  return [...clips].sort((a, b) => a.start_sec - b.start_sec);
}

export function clipsForPlayer(clips: VideoClip[], uid: string): VideoClip[] {
  return clips.filter((c) => c.player_uids.includes(uid));
}
