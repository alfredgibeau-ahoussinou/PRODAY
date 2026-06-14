/** Résolution des MP4 Instagram (côté client — réseau mobile). */

const IG_APP_ID = '936619743392459';
const DOC_ID = '8845758582119845';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

export type ResolvedInstagramReel = {
  videoUrl: string;
  width: number;
  height: number;
  posterUrl?: string;
  caption?: string;
  authorHandle?: string;
  authorName?: string;
};

const cache = new Map<string, ResolvedInstagramReel | null>();
const RESOLVE_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESOLVE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

type IgSession = {
  lsd: string;
  csrf?: string;
};

function pickVideoUrl(
  versions: { url: string; width?: number; height?: number }[],
): { url: string; width: number; height: number } | null {
  if (!versions.length) return null;
  const sorted = [...versions].sort(
    (a, b) => (b.height ?? 0) * (b.width ?? 0) - (a.height ?? 0) * (a.width ?? 0),
  );
  const portrait = sorted.find((v) => (v.height ?? 0) > (v.width ?? 0));
  const pick = portrait ?? sorted[0];
  return {
    url: pick.url,
    width: pick.width ?? 720,
    height: pick.height ?? 1280,
  };
}

function parseMediaPayload(data: Record<string, unknown>): ResolvedInstagramReel | null {
  const root = data.data as Record<string, unknown> | undefined;
  if (!root) return null;

  const media =
    (root.xdt_shortcode_media as Record<string, unknown> | undefined) ??
    (root.shortcode_media as Record<string, unknown> | undefined);

  if (!media) return null;

  const directUrl = media.video_url as string | undefined;
  const versions =
    (media.video_versions as { url: string; width?: number; height?: number }[]) ?? [];
  const picked = directUrl
    ? { url: directUrl, width: (media.width as number) ?? 720, height: (media.height as number) ?? 1280 }
    : pickVideoUrl(versions);
  if (!picked) return null;

  const owner = media.owner as { username?: string; full_name?: string } | undefined;
  const user = media.user as { username?: string; full_name?: string } | undefined;
  const edgeCaption = media.edge_media_to_caption as
    | { edges?: { node?: { text?: string } }[] }
    | undefined;
  const caption = media.caption as { text?: string } | undefined;
  const posterUrl =
    (media.thumbnail_src as string | undefined) ??
    (media.display_url as string | undefined);

  return {
    videoUrl: picked.url,
    width: picked.width,
    height: picked.height,
    posterUrl,
    caption: edgeCaption?.edges?.[0]?.node?.text ?? caption?.text,
    authorHandle: owner?.username ?? user?.username,
    authorName: owner?.full_name ?? user?.full_name,
  };
}

async function fetchIgSession(shortCode: string): Promise<IgSession | null> {
  try {
    const res = await fetch(`https://www.instagram.com/reel/${shortCode}/`, {
      headers: { 'User-Agent': MOBILE_UA },
    });
    const html = await res.text();
    const lsd =
      html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] ??
      html.match(/name="lsd" value="([^"]+)"/)?.[1];
    if (!lsd) return null;
    const csrf = html.match(/"csrf_token":"([^"]+)"/)?.[1];
    return { lsd, csrf };
  } catch {
    return null;
  }
}

async function resolveViaGraphql(
  shortCode: string,
  session: IgSession,
): Promise<ResolvedInstagramReel | null> {
  try {
    const variables = JSON.stringify({
      shortcode: shortCode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
    });
    const body = `variables=${encodeURIComponent(variables)}&server_timestamps=true&doc_id=${DOC_ID}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-IG-App-ID': IG_APP_ID,
      'X-FB-Friendly-Name': 'PolarisPostActionLoadPostQueryQuery',
      'X-FB-LSD': session.lsd,
      'User-Agent': MOBILE_UA,
      Referer: `https://www.instagram.com/reel/${shortCode}/`,
      Origin: 'https://www.instagram.com',
    };
    if (session.csrf) headers['X-CSRFToken'] = session.csrf;

    const res = await fetchWithTimeout('https://www.instagram.com/graphql/query/', {
      method: 'POST',
      headers,
      body,
    });
    const text = await res.text();
    if (!text.startsWith('{')) return null;
    return parseMediaPayload(JSON.parse(text) as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function resolveViaEmbedPage(shortCode: string): Promise<ResolvedInstagramReel | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.instagram.com/reel/${shortCode}/embed/captioned/`,
      { headers: { 'User-Agent': MOBILE_UA } },
    );
    const html = await res.text();
    const match =
      html.match(/"video_url":"([^"]+)"/) ??
      html.match(/property="og:video" content="([^"]+)"/);
    if (!match?.[1]) return null;
    const videoUrl = match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    return { videoUrl, width: 720, height: 1280 };
  } catch {
    return null;
  }
}

/** Résout l’URL MP4 d’un reel public Instagram (cache mémoire). */
export async function resolveInstagramReelVideo(
  shortCode: string,
  force = false,
): Promise<ResolvedInstagramReel | null> {
  if (force) cache.delete(shortCode);
  if (cache.has(shortCode)) return cache.get(shortCode) ?? null;

  const session = await fetchIgSession(shortCode);
  if (session) {
    const viaGraphql = await resolveViaGraphql(shortCode, session);
    if (viaGraphql) {
      cache.set(shortCode, viaGraphql);
      return viaGraphql;
    }
  }

  const viaEmbed = await resolveViaEmbedPage(shortCode);
  cache.set(shortCode, viaEmbed);
  return viaEmbed;
}

export function clearInstagramReelCache(): void {
  cache.clear();
}
