import type { ProductLineId } from '../models/ProductLine';
import { withProFamilyRecord } from '../models/ProductLine';

export type ReelSource = 'instagram' | 'tiktok' | 'youtube' | 'pexels' | 'proday';

export type PlaybackReel = {
  id: string;
  /** Clé stable pour les favoris (indépendante de l’id de session). */
  bookmarkKey: string;
  shortCode: string;
  universe: ProductLineId;
  source: ReelSource;
  videoUrl: string;
  posterUrl?: string;
  sourceUrl: string;
  authorHandle: string;
  authorName: string;
  caption: string;
  tags: string[];
  width?: number;
  height?: number;
  loading?: boolean;
  failed?: boolean;
};

export const REEL_UNIVERSE_LABEL: Record<ProductLineId, string> = withProFamilyRecord({
  homme: 'Foot masculin',
  woman: 'Foot féminin',
  amateur: 'Coach amateur',
  supporter: 'Tribune supporter',
  pro: 'Foot pro & staff',
  sante: 'Santé & performance',
});

export const REEL_SOURCE_LABEL: Record<ReelSource, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'Shorts',
  pexels: 'Pexels',
  proday: 'ProDay',
};

export function instagramUrlForShortCode(shortCode: string, authorHandle?: string): string {
  if (authorHandle) {
    return `https://www.instagram.com/${authorHandle}/reel/${shortCode}/`;
  }
  return `https://www.instagram.com/reel/${shortCode}/`;
}

export function tiktokUrlForVideo(authorHandle: string, videoId: string): string {
  return `https://www.tiktok.com/@${authorHandle}/video/${videoId}`;
}

export function youtubeShortsUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${videoId}`;
}

/** Lecteur embed intégré — repli fiable quand le MP4 direct ne démarre pas. */
export function embedUrlForReel(reel: PlaybackReel): string | null {
  switch (reel.source) {
    case 'instagram':
      return `https://www.instagram.com/reel/${reel.shortCode}/embed/?autoplay=1`;
    case 'tiktok':
      return `https://www.tiktok.com/embed/v2/${reel.shortCode}?autoplay=1`;
    case 'youtube':
      return (
        `https://www.youtube.com/embed/${reel.shortCode}` +
        '?autoplay=1&playsinline=1&loop=1&controls=0&modestbranding=1' +
        `&playlist=${reel.shortCode}`
      );
    case 'pexels':
    case 'proday':
      return null;
  }
}

const PLAYBACK_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

/** Source vidéo native (expo-video) avec en-têtes requis par Instagram / TikTok CDN. */
export function playbackSourceForReel(
  reel: PlaybackReel,
): { uri: string; headers?: Record<string, string> } | null {
  if (!reel.videoUrl) return null;
  switch (reel.source) {
    case 'instagram':
      return {
        uri: reel.videoUrl,
        headers: {
          Referer: 'https://www.instagram.com/',
          'User-Agent': PLAYBACK_UA,
        },
      };
    case 'tiktok':
      return {
        uri: reel.videoUrl,
        headers: {
          Referer: 'https://www.tiktok.com/',
          'User-Agent': PLAYBACK_UA,
        },
      };
    case 'youtube':
      return {
        uri: reel.videoUrl,
        headers: {
          Referer: 'https://www.youtube.com/',
          'User-Agent': PLAYBACK_UA,
        },
      };
    case 'pexels':
    case 'proday':
      return { uri: reel.videoUrl };
    default:
      return { uri: reel.videoUrl };
  }
}
