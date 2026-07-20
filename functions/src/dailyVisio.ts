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
): Promise<T | null> {
  const response = await fetch(`https://api.daily.co/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn(`[dailyVisio] ${init.method ?? 'GET'} ${path} → ${response.status}: ${body}`);
    return null;
  }

  return (await response.json()) as T;
}

export async function createDailyRoom(input: {
  appointmentId: string;
  endAt: Date;
}): Promise<DailyMeetingLinkResult> {
  const { apiKey, domain } = getDailyConfig();
  const roomName = dailyRoomName(input.appointmentId);

  if (!apiKey) {
    console.warn(
      '[dailyVisio] DAILY_API_KEY absent — lien déterministe sans création de salle (configurer visio.daily_api_key)'
    );
    return buildDailyMeetingLinkFallback(input.appointmentId, domain);
  }

  const exp = Math.floor(input.endAt.getTime() / 1000) + 3600;

  const created = await dailyApiRequest<{ url: string; name: string }>(
    '/rooms',
    {
      method: 'POST',
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_prejoin_ui: false,
          enable_knocking: false,
          exp,
          max_participants: 4,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    },
    apiKey
  );

  if (created?.url) {
    return { meetingLink: created.url, visioProvider: 'daily', roomName };
  }

  const existing = await dailyApiRequest<{ url: string; name: string }>(
    `/rooms/${encodeURIComponent(roomName)}`,
    { method: 'GET' },
    apiKey
  );

  if (existing?.url) {
    return { meetingLink: existing.url, visioProvider: 'daily', roomName };
  }

  return buildDailyMeetingLinkFallback(input.appointmentId, domain);
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

  return result?.token ?? null;
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
