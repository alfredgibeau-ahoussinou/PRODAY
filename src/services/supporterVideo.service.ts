import type { TeamEvent } from '../models/TeamEvent';
import type { LiveMatchAction } from '../models/TeamEvent';
import type { SupporterVideo, SupporterVideoKind } from '../models/SupporterVideo';
import { canPlaySupporterVideo } from '../models/SupporterVideo';
import { communityReelsService } from './communityReels.service';
import { extractProdayOfficialWatchUrl } from '../utils/supporterBroadcast';
import { supporterVideoRightsService } from './supporterVideoRights.service';
import { buildReplayChaptersFromEvents } from '../utils/supporterReplayChapters';

async function resolveRights(
  videoId: string,
  defaultRights: SupporterVideo['rights'],
): Promise<SupporterVideo['rights']> {
  const override = await supporterVideoRightsService.getOverride(videoId);
  return override ?? defaultRights;
}

async function videoFromProdayEvent(
  event: TeamEvent,
  kind: SupporterVideoKind,
  events?: LiveMatchAction[],
): Promise<SupporterVideo | null> {
  const watchUrl = extractProdayOfficialWatchUrl({
    public_watch_url: event.public_watch_url,
    description: event.description,
  });
  const id = `proday:${event.id}:${kind}`;
  const defaultRights: SupporterVideo['rights'] = watchUrl
    ? 'AVAILABLE'
    : event.public_watch_url
      ? 'PROCESSING'
      : 'UNAVAILABLE';
  const rights = await resolveRights(id, defaultRights);
  const actionEvents = events ?? event.live_actions ?? [];
  return {
    id,
    kind,
    rights,
    title: `${event.club_name ?? 'ProDay'} vs ${event.live_state?.opponent_name ?? event.title}`,
    watchUrl: watchUrl ?? undefined,
    matchId: `proday-event-${event.id}`,
    teamLabel: event.club_name,
    competitionLabel: event.club_name,
    publishedAt: event.starts_at ? new Date(event.starts_at) : undefined,
    chapters: buildReplayChaptersFromEvents(actionEvents),
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
      const full = await videoFromProdayEvent(event, 'proday_full');
      if (full && canPlaySupporterVideo(full)) videos.push(full);
    }

    try {
      const reels = await communityReelsService.listApproved(Math.min(max, 12));
      for (const reel of reels) {
        if (!reel.video_url?.trim()) continue;
        const id = `community:${reel.id}`;
        const rights = await resolveRights(id, 'AVAILABLE');
        videos.push({
          id,
          kind: 'community_clip',
          rights,
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

  async videoForMatch(
    prodayEvent: TeamEvent | null | undefined,
    events: LiveMatchAction[],
    fallbackWatchUrl?: string,
  ): Promise<SupporterVideo | null> {
    if (prodayEvent) {
      return videoFromProdayEvent(prodayEvent, 'proday_full', events);
    }
    if (!fallbackWatchUrl?.trim()) return null;
    const id = `external:${fallbackWatchUrl.slice(0, 40)}`;
    const rights = await resolveRights(id, 'AVAILABLE');
    return {
      id,
      kind: 'external_legal',
      rights,
      title: 'Diffusion officielle',
      watchUrl: fallbackWatchUrl,
      chapters: buildReplayChaptersFromEvents(events),
    };
  },

  listByKind(videos: SupporterVideo[], kind: SupporterVideoKind): SupporterVideo[] {
    return videos.filter((v) => v.kind === kind && canPlaySupporterVideo(v));
  },

  listForMatch(videos: SupporterVideo[], matchId: string): SupporterVideo[] {
    return videos.filter((v) => v.matchId === matchId && canPlaySupporterVideo(v));
  },
};
