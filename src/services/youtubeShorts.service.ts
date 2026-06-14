/** Résolution YouTube Shorts via ytInitialPlayerResponse (URL directe uniquement). */

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

export type ResolvedYoutubeShort = {
  videoUrl: string;
  width: number;
  height: number;
  posterUrl?: string;
  caption?: string;
  authorHandle?: string;
  authorName?: string;
};

const cache = new Map<string, ResolvedYoutubeShort | null>();

type StreamFormat = {
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
};

function pickMp4Url(formats: StreamFormat[]): { url: string; width: number; height: number } | null {
  const mp4s = formats.filter((f) => f.mimeType?.includes('video/mp4') && f.url);
  if (!mp4s.length) return null;
  const pick = mp4s.sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];
  return {
    url: pick.url!,
    width: pick.width ?? 720,
    height: pick.height ?? 1280,
  };
}

export async function resolveYoutubeShortVideo(
  videoId: string,
): Promise<ResolvedYoutubeShort | null> {
  if (cache.has(videoId)) return cache.get(videoId) ?? null;

  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      headers: { 'User-Agent': MOBILE_UA },
    });
    if (!res.ok) {
      cache.set(videoId, null);
      return null;
    }
    const html = await res.text();
    const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
    if (!match?.[1]) {
      cache.set(videoId, null);
      return null;
    }
    const player = JSON.parse(match[1]) as {
      streamingData?: { formats?: StreamFormat[]; adaptiveFormats?: StreamFormat[] };
      videoDetails?: { title?: string; author?: string; thumbnail?: { thumbnails?: { url: string }[] } };
    };
    const formats = [
      ...(player.streamingData?.formats ?? []),
      ...(player.streamingData?.adaptiveFormats ?? []),
    ];
    const picked = pickMp4Url(formats);
    if (!picked) {
      cache.set(videoId, null);
      return null;
    }
    const thumbs = player.videoDetails?.thumbnail?.thumbnails ?? [];
    const resolved: ResolvedYoutubeShort = {
      videoUrl: picked.url,
      width: picked.width,
      height: picked.height,
      posterUrl: thumbs[thumbs.length - 1]?.url,
      caption: player.videoDetails?.title,
      authorName: player.videoDetails?.author,
      authorHandle: 'youtube',
    };
    cache.set(videoId, resolved);
    return resolved;
  } catch {
    cache.set(videoId, null);
    return null;
  }
}
