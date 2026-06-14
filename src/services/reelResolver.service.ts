import { Platform } from 'react-native';
import type { PlaybackReel } from '../content/footballReels';
import { resolveInstagramReelVideo } from './instagramReel.service';
import { resolveTikTokReelVideo } from './tiktokReel.service';
import { resolveYoutubeShortVideo } from './youtubeShorts.service';

export type ResolvedReelPlayback = {
  videoUrl: string;
  posterUrl?: string;
  width?: number;
  height?: number;
  caption?: string;
  authorHandle?: string;
  authorName?: string;
};

/** Web : fetch bloqué par CORS — lecture via embed WebView. */
export function shouldUseEmbedPlayback(): boolean {
  return Platform.OS === 'web';
}

export async function resolveReelPlayback(
  reel: PlaybackReel,
  force = false,
): Promise<ResolvedReelPlayback | null> {
  if (shouldUseEmbedPlayback()) {
    return { videoUrl: '', caption: reel.caption };
  }

  switch (reel.source) {
    case 'instagram':
      return resolveInstagramReelVideo(reel.shortCode, force);
    case 'tiktok':
      return resolveTikTokReelVideo(reel.authorHandle, reel.shortCode);
    case 'youtube':
      return resolveYoutubeShortVideo(reel.shortCode);
    default:
      return null;
  }
}
