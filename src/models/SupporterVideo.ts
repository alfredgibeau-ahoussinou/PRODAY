export type SupporterVideoRights =
  | 'AVAILABLE'
  | 'RESTRICTED'
  | 'PRIVATE'
  | 'PROCESSING'
  | 'UNAVAILABLE';

export type SupporterVideoKind =
  | 'proday_full'
  | 'proday_highlights'
  | 'external_legal'
  | 'community_clip';

export interface SupporterReplayChapter {
  id: string;
  label: string;
  minute: number;
  /** Offset ms dans la vidéo — heuristique minute → ms (voir supporterReplayChapters). */
  offsetMs: number;
  type: string;
}

export interface SupporterVideo {
  id: string;
  kind: SupporterVideoKind;
  rights: SupporterVideoRights;
  title: string;
  thumbnailUrl?: string;
  watchUrl?: string;
  matchId?: string;
  teamLabel?: string;
  competitionLabel?: string;
  publishedAt?: Date;
  durationSec?: number;
  chapters?: SupporterReplayChapter[];
}

/** Player autorisé uniquement si droits explicites AVAILABLE + URL légale. */
export function canPlaySupporterVideo(video: SupporterVideo): boolean {
  return video.rights === 'AVAILABLE' && Boolean(video.watchUrl?.trim());
}
