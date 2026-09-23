/**
 * Dérivation honnête des clips « Clips & Buts IA » du Hub Vidéo club.
 * Source unique : les captations réellement persistées (club_match_videos).
 * Aucune catégorie inventée : un clip persisté sans typage reste « other ».
 */

import type { ClubMatchVideo, MatchVideoClip } from '../models/ClubCameras';
import type { SmartClipItem } from '../features/club/ui/ClubVideoHub';

const CLIP_TYPE_LABELS: Record<NonNullable<MatchVideoClip['type']>, string> = {
  goal: 'But',
  save: 'Arrêt / Parade',
  transition: 'Transition',
  set_piece: 'Coup de pied arrêté',
  other: 'Clip',
};

export function buildClipsFromVideos(videos: ClubMatchVideo[]): SmartClipItem[] {
  const out: SmartClipItem[] = [];
  for (const video of videos) {
    for (const clip of video.clips ?? []) {
      const durationSec =
        clip.starts_at_sec != null && clip.ends_at_sec != null
          ? Math.max(0, Math.round(clip.ends_at_sec - clip.starts_at_sec))
          : 0;
      const clipType = clip.type || 'other';
      out.push({
        id: `${video.id}__${clip.id}`,
        title: clip.label || 'Clip',
        matchTitle: video.event_title || video.title,
        minute:
          clip.starts_at_sec != null
            ? `${Math.floor(clip.starts_at_sec / 60)}’`
            : '—',
        type: clipType,
        typeLabel: CLIP_TYPE_LABELS[clipType] || 'Clip',
        authorName: video.team_label || 'Captation club',
        durationSec,
        storageUrl: clip.url || video.storage_url,
      });
    }
  }
  return out;
}
