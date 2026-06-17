import type { CommunityReel } from '../models/CommunityReel';
import type { ProductLineId } from '../models/ProductLine';
import type { PlaybackReel } from '../content/footballReels';
import type { ReelSeed } from '../content/reelSeedCatalog';
import { seedKey } from '../content/reelSeedCatalog';

export function communityReelToSeed(reel: CommunityReel): ReelSeed {
  return {
    source: 'proday',
    externalId: reel.id,
    authorHandle: reel.author_uid.slice(0, 10),
    authorName: reel.author_name,
    tags: [`#${reel.theme}`, '#proday', '#football', '#highlight'],
    themes: [reel.theme],
    directVideoUrl: reel.video_url,
    posterUrl: reel.poster_url,
    sourceUrl: reel.video_url,
    caption: reel.caption,
    actorUid: reel.author_uid,
    clubId: reel.club_id,
  };
}

export function communityReelToPlayback(
  reel: CommunityReel,
  universe: ProductLineId,
): PlaybackReel {
  return {
    id: `proday-${reel.id}`,
    bookmarkKey: `proday-${reel.id}`,
    shortCode: reel.id,
    universe,
    source: 'proday',
    videoUrl: reel.video_url,
    posterUrl: reel.poster_url,
    sourceUrl: reel.video_url,
    authorHandle: reel.author_uid.slice(0, 8),
    authorName: reel.author_name,
    caption: reel.caption,
    tags: [`#${reel.theme}`, '#proday'],
    loading: false,
  };
}

export function seedWithDirectPlayback(
  seed: ReelSeed | undefined,
  universe: ProductLineId,
  reelId: string,
): PlaybackReel | null {
  if (!seed?.directVideoUrl) return null;
  return {
    id: reelId,
    bookmarkKey: seedKey(seed),
    shortCode: seed.externalId,
    universe,
    source: seed.source,
    videoUrl: seed.directVideoUrl,
    posterUrl: seed.posterUrl,
    sourceUrl: seed.sourceUrl ?? seed.directVideoUrl,
    authorHandle: seed.authorHandle,
    authorName: seed.authorName,
    caption: seed.caption ?? '',
    tags: seed.tags,
    loading: false,
  };
}
