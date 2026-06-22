import { storageService } from '../services/storage.service';

/** Chargement paresseux — évite le crash au démarrage si le module natif n'est pas dans le build. */
async function getThumbnailAsync(videoUrl: string, timeMs: number): Promise<string | null> {
  try {
    const VideoThumbnails = await import('expo-video-thumbnails');
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: timeMs });
    return uri;
  } catch (error) {
    console.warn('[activityVideoThumbnail] native module unavailable or extraction failed:', error);
    return null;
  }
}

export function activityThumbnailStoragePath(uid: string, activityId: string): string {
  return `player_activity_thumbnails/${uid}/${activityId}.jpg`;
}

export function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(lower);
}

export function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.startsWith('data:image/')) return true;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower);
}

/** Poster profil aligné sur l'index highlight (gallery_urls). */
export function posterUrlForHighlightVideo(
  videoUrl: string,
  highlightVideoUrls?: string[],
  galleryUrls?: string[]
): string | null {
  const videos = highlightVideoUrls?.filter(Boolean) ?? [];
  const gallery = galleryUrls?.filter(Boolean) ?? [];
  const idx = videos.findIndex((u) => u === videoUrl);
  if (idx >= 0 && gallery[idx] && isImageUrl(gallery[idx])) {
    return gallery[idx];
  }
  return null;
}

export type ActivityThumbnailContext = {
  galleryUrls?: string[];
  highlightVideoUrls?: string[];
};

/** Résout une miniature : poster profil ou frame générée + upload Storage. */
export async function resolveActivityThumbnail(input: {
  uid: string;
  activityId: string;
  videoUrl: string;
  galleryUrls?: string[];
  highlightVideoUrls?: string[];
}): Promise<string | null> {
  const poster = posterUrlForHighlightVideo(
    input.videoUrl,
    input.highlightVideoUrls,
    input.galleryUrls
  );
  if (poster) return poster;

  if (!isVideoUrl(input.videoUrl)) return null;

  const frameUri = await getThumbnailAsync(input.videoUrl, 1000);
  if (!frameUri) return null;

  try {
    return await storageService.uploadActivityThumbnail(input.uid, input.activityId, frameUri);
  } catch (error) {
    console.warn('[activityVideoThumbnail] thumbnail upload failed:', error);
    return null;
  }
}
