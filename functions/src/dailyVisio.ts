import { configStr } from './runtimeConfig';

export interface DailyConfig {
  apiKey: string | null;
  domain: string;
}

export interface DailyMeetingLinkResult {
  meetingLink: string;
  visioProvider: 'daily';
  roomName: string;
}

export function getDailyConfig(): DailyConfig {
  return {
    apiKey: configStr('visio', 'daily_api_key', ['DAILY_API_KEY', 'VISIO_DAILY_API_KEY']) ?? null,
    domain: configStr('visio', 'daily_domain', ['VISIO_DAILY_DOMAIN', 'DAILY_DOMAIN']) || 'proday',
  };
}

export function dailyRoomName(appointmentId: string): string {
  return `proday-rdv-${appointmentId}`;
}

export function dailyRoomUrl(domain: string, roomName: string): string {
  return `https://${domain}.daily.co/${roomName}`;
}

export function buildDailyJoinUrl(
  baseUrl: string,
  opts: {
    token?: string | null;
    userName?: string;
    userId?: string;
  }
): string {
  try {
    const url = new URL(baseUrl);
    if (opts.token) url.searchParams.set('t', opts.token);
    if (opts.userName) url.searchParams.set('userName', opts.userName);
    if (opts.userId) url.searchParams.set('userId', opts.userId);
    url.searchParams.set('enablePrejoinUI', 'false');
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/** @deprecated Ne plus utiliser pour le join — URL sans création réelle de salle. */
export function buildDailyMeetingLinkFallback(
  appointmentId: string,
  domain?: string
): DailyMeetingLinkResult {
  const { domain: cfgDomain } = getDailyConfig();
  const resolvedDomain = domain ?? cfgDomain;
  const roomName = dailyRoomName(appointmentId);
  return {
    meetingLink: dailyRoomUrl(resolvedDomain, roomName),
    visioProvider: 'daily',
    roomName,
  };
}

async function dailyApiRequest<T>(
  path: string,
  init: RequestInit,
  apiKey: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const response = await fetch(`https://api.daily.co/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const body = await response.text();
  if (!response.ok) {
    console.warn(`[dailyVisio] ${init.method ?? 'GET'} ${path} → ${response.status}: ${body}`);
    return { ok: false, status: response.status, body };
  }

  try {
    return { ok: true, data: JSON.parse(body) as T };
  } catch {
    return { ok: false, status: response.status, body };
  }
}

/**
 * Crée (ou récupère) une vraie salle Daily.
 * Retourne null si la clé API est absente ou si l'API échoue — jamais d'URL fictive.
 */
export async function createDailyRoom(input: {
  appointmentId: string;
  endAt: Date;
}): Promise<DailyMeetingLinkResult | null> {
  const { apiKey, domain } = getDailyConfig();
  const roomName = dailyRoomName(input.appointmentId);

  if (!apiKey) {
    console.warn(
      '[dailyVisio] DAILY_API_KEY absent — impossible de créer une salle réelle (configurer visio.daily_api_key)'
    );
    return null;
  }

  const exp = Math.floor(input.endAt.getTime() / 1000) + 3600;

  const roomProperties = {
    enable_prejoin_ui: false,
    enable_knocking: false,
    enable_chat: true,
    enable_screenshare: true,
    enable_emoji_reactions: false,
    exp,
    max_participants: 4,
    start_video_off: false,
    start_audio_off: false,
  };

  const created = await dailyApiRequest<{ url: string; name: string }>(
    '/rooms',
    {
      method: 'POST',
      body: JSON.stringify({
        name: roomName,
        /** Token meeting requis pour rejoindre (créé côté getVisioJoinUrl). */
        privacy: 'private',
        properties: roomProperties,
      }),
    },
    apiKey
  );

  if (created.ok && created.data.url) {
    return { meetingLink: created.data.url, visioProvider: 'daily', roomName };
  }

  // Salle déjà existante (409) ou autre — tenter GET.
  const existing = await dailyApiRequest<{ url: string; name: string }>(
    `/rooms/${encodeURIComponent(roomName)}`,
    { method: 'GET' },
    apiKey
  );

  if (existing.ok && existing.data.url) {
    // Prolonge l'expiration, force private + chat / screenshare.
    await dailyApiRequest(
      `/rooms/${encodeURIComponent(roomName)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          privacy: 'private',
          properties: roomProperties,
        }),
      },
      apiKey
    );
    return { meetingLink: existing.data.url, visioProvider: 'daily', roomName };
  }

  console.error(
    `[dailyVisio] Impossible de créer/récupérer la salle ${roomName} (domain=${domain})`
  );
  return null;
}

export async function createDailyMeetingToken(input: {
  roomName: string;
  userName: string;
  userId: string;
  isOwner: boolean;
  endAt: Date;
}): Promise<string | null> {
  const { apiKey } = getDailyConfig();
  if (!apiKey) return null;

  const exp = Math.floor(input.endAt.getTime() / 1000) + 3600;

  const result = await dailyApiRequest<{ token: string }>(
    '/meeting-tokens',
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          room_name: input.roomName,
          user_name: input.userName,
          user_id: input.userId,
          is_owner: input.isOwner,
          exp,
          enable_prejoin_ui: false,
        },
      }),
    },
    apiKey
  );

  return result.ok ? result.data.token ?? null : null;
}

export function extractDailyRoomName(meetingLink: string): string | null {
  try {
    const url = new URL(meetingLink);
    if (!/\.daily\.co$/i.test(url.hostname)) return null;
    const name = url.pathname.replace(/^\//, '').split('/')[0];
    return name || null;
  } catch {
    return null;
  }
}

export function isDailyMeetingLink(link: string): boolean {
  try {
    return /\.daily\.co$/i.test(new URL(link).hostname);
  } catch {
    return link.includes('daily.co');
  }
}
