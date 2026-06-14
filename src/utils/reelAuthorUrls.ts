import type { PlaybackReel } from '../content/footballReels';

/** URL profil public de l’auteur (Instagram / TikTok / YouTube). */
export function authorProfileUrl(reel: PlaybackReel): string | null {
  const handle = reel.authorHandle.replace(/^@/, '');
  if (!handle) return null;
  switch (reel.source) {
    case 'instagram':
      return `https://www.instagram.com/${handle}/`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'youtube':
      return `https://www.youtube.com/@${handle}`;
    default:
      return null;
  }
}
