/** Résolution MP4 TikTok via la page publique (playAddr). */

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

export type ResolvedTikTokReel = {
  videoUrl: string;
  width: number;
  height: number;
  posterUrl?: string;
  caption?: string;
  authorHandle?: string;
  authorName?: string;
};

const cache = new Map<string, ResolvedTikTokReel | null>();

function decodeEscapedUrl(raw: string): string {
  return JSON.parse(`"${raw}"`) as string;
}

function extractPlayUrl(html: string): string | null {
  const match =
    html.match(/"playAddr":"([^"]+)"/) ?? html.match(/"downloadAddr":"([^"]+)"/);
  if (!match?.[1]) return null;
  return decodeEscapedUrl(match[1]);
}

function extractMeta(html: string): {
  caption?: string;
  authorHandle?: string;
  authorName?: string;
  posterUrl?: string;
} {
  const caption = html.match(/"desc":"([^"]*)"/)?.[1];
  const authorHandle = html.match(/"uniqueId":"([^"]+)"/)?.[1];
  const authorName = html.match(/"nickname":"([^"]+)"/)?.[1];
  const posterUrl = html.match(/"cover":"([^"]+)"/)?.[1];
  return {
    caption: caption ? decodeEscapedUrl(caption) : undefined,
    authorHandle: authorHandle ? decodeEscapedUrl(authorHandle) : undefined,
    authorName: authorName ? decodeEscapedUrl(authorName) : undefined,
    posterUrl: posterUrl ? decodeEscapedUrl(posterUrl) : undefined,
  };
}

export async function resolveTikTokReelVideo(
  authorHandle: string,
  videoId: string,
): Promise<ResolvedTikTokReel | null> {
  const cacheKey = `${authorHandle}:${videoId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  try {
    const res = await fetch(`https://www.tiktok.com/@${authorHandle}/video/${videoId}`, {
      headers: { 'User-Agent': MOBILE_UA },
    });
    if (!res.ok) {
      cache.set(cacheKey, null);
      return null;
    }
    const html = await res.text();
    const videoUrl = extractPlayUrl(html);
    if (!videoUrl) {
      cache.set(cacheKey, null);
      return null;
    }
    const meta = extractMeta(html);
    const resolved: ResolvedTikTokReel = {
      videoUrl,
      width: 720,
      height: 1280,
      ...meta,
    };
    cache.set(cacheKey, resolved);
    return resolved;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}
