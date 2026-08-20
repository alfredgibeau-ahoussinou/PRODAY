import type { TeamEvent } from '../models/TeamEvent';
import type { SupporterVideo, SupporterVideoKind } from '../models/SupporterVideo';
import { canPlaySupporterVideo } from '../models/SupporterVideo';
import { communityReelsService } from './communityReels.service';
import { extractProdayOfficialWatchUrl } from '../utils/supporterBroadcast';

function videoFromProdayEvent(event: TeamEvent, kind: SupporterVideoKind): SupporterVideo | null {
  const watchUrl = extractProdayOfficialWatchUrl({
    public_watch_url: event.public_watch_url,
    description: event.description,
  });
  const rights = watchUrl ? 'AVAILABLE' : event.public_watch_url ? 'PROCESSING' : 'UNAVAILABLE';
  return {
    id: `proday:${event.id}:${kind}`,
    kind,
    rights,
    title: `${event.club_name ?? 'ProDay'} vs ${event.live_state?.opponent_name ?? event.title}`,
    watchUrl: watchUrl ?? undefined,
    matchId: `proday-event-${event.id}`,
    teamLabel: event.club_name,
    competitionLabel: event.club_name,
    publishedAt: event.starts_at ? new Date(event.starts_at) : undefined,
  };
}

/** Agrège vidéos disponibles — jamais de streams illégaux. */
export const supporterVideoService = {
  canPlay: canPlaySupporterVideo,

  async listAvailable(options?: {
    prodayEvents?: TeamEvent[];
    max?: number;
  }): Promise<SupporterVideo[]> {
    const max = options?.max ?? 24;
    const videos: SupporterVideo[] = [];

    for (const event of options?.prodayEvents ?? []) {
      const full = videoFromProdayEvent(event, 'proday_full');
      if (full && canPlaySupporterVideo(full)) videos.push(full);
    }

    try {
      const reels = await communityReelsService.listApproved(Math.min(max, 12));
      for (const reel of reels) {
        if (!reel.video_url?.trim()) continue;
        videos.push({
          id: `community:${reel.id}`,
          kind: 'community_clip',
          rights: 'AVAILABLE',
          title: reel.caption?.trim() || 'Clip communauté',
          watchUrl: reel.video_url,
          thumbnailUrl: reel.poster_url,
          publishedAt: reel.created_at ? new Date(reel.created_at) : undefined,
        });
      }
    } catch {
      // reels optionnels
    }

    return videos.filter(canPlaySupporterVideo).slice(0, max);
  },

  listByKind(videos: SupporterVideo[], kind: SupporterVideoKind): SupporterVideo[] {
    return videos.filter((v) => v.kind === kind && canPlaySupporterVideo(v));
  },

  listForMatch(videos: SupporterVideo[], matchId: string): SupporterVideo[] {
    return videos.filter((v) => v.matchId === matchId && canPlaySupporterVideo(v));
  },
};
