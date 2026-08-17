import type { ClubMatchVideo } from '../models/ClubCameras';
import { MATCH_VIDEO_STATUS_LABELS } from '../models/ClubCameras';

export interface CoachVideoLink {
  id: string;
  title: string;
  date: Date;
  statusLabel: string;
  aiReady: boolean;
  eventId?: string;
}

export interface CoachEventVideoStatus {
  hasVideos: boolean;
  videos: CoachVideoLink[];
  note: string;
}

function readyVideos(videos: ClubMatchVideo[]): ClubMatchVideo[] {
  return videos.filter((v) => v.status === 'ready');
}

export function videosForEvent(videos: ClubMatchVideo[], eventId: string): ClubMatchVideo[] {
  return readyVideos(videos).filter((v) => v.event_id === eventId);
}

export function videosForPlayer(videos: ClubMatchVideo[], playerUid: string): ClubMatchVideo[] {
  return readyVideos(videos).filter(
    (v) => v.player_uids.includes(playerUid) || v.clips.some((c) => c.player_uids?.includes(playerUid)),
  );
}

function toVideoLink(v: ClubMatchVideo): CoachVideoLink {
  return {
    id: v.id,
    title: v.title,
    date: v.scheduled_at ?? v.created_at,
    statusLabel: MATCH_VIDEO_STATUS_LABELS[v.status],
    aiReady: v.ai_ready === true,
    eventId: v.event_id,
  };
}

/** Message honnête sur la disponibilité vidéo pour un match. */
export function buildEventVideoStatus(
  eventId: string,
  eventTitle: string,
  videos: ClubMatchVideo[],
): CoachEventVideoStatus {
  const linked = videosForEvent(videos, eventId).map(toVideoLink);
  if (linked.length === 0) {
    return {
      hasVideos: false,
      videos: [],
      note: `Aucune vidéo disponible pour « ${eventTitle} ».`,
    };
  }
  const aiCount = linked.filter((v) => v.aiReady).length;
  const titles = linked.map((v) => v.title).join(' · ');
  const aiHint =
    aiCount > 0
      ? `${aiCount} analyse${aiCount > 1 ? 's' : ''} IA prête${aiCount > 1 ? 's' : ''}.`
      : 'Captation disponible — analyse IA en attente.';
  return {
    hasVideos: true,
    videos: linked,
    note: `${linked.length} vidéo${linked.length > 1 ? 's' : ''} : ${titles}. ${aiHint}`,
  };
}

export function listRecentClubVideos(
  videos: ClubMatchVideo[],
  limit = 5,
): CoachVideoLink[] {
  return [...readyVideos(videos)]
    .sort((a, b) => (b.scheduled_at ?? b.created_at).getTime() - (a.scheduled_at ?? a.created_at).getTime())
    .slice(0, limit)
    .map(toVideoLink);
}

export function countReadyClubVideos(videos: ClubMatchVideo[]): number {
  return readyVideos(videos).length;
}
