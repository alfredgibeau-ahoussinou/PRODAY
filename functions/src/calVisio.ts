import { configStr, resolveCalDefaultUsername } from './runtimeConfig';

const CAL_COM_HOME_URL = 'https://cal.com';
const CAL_API_BASE = 'https://api.cal.com/v2';
const CAL_API_VERSION = '2026-02-25';
const CAL_USERNAME_RE = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/i;
const DEFAULT_EVENT_TYPE_SLUG = 'teleconsultation';

export interface CalConfig {
  apiKey: string | null;
  eventTypeSlug: string;
  /** Username Cal.com org ProDay — secours si le praticien n'a pas cal_com_username */
  defaultUsername: string | null;
}

export interface CalComEventProfile {
  username: string;
  eventTypeSlug: string;
  bookingUrl: string;
}

export interface CalVideoMeetingLinkResult {
  meetingLink: string;
  visioProvider: 'cal';
  calBookingUid?: string;
}

export interface PhysioProfileFields {
  cal_com_username?: string;
  booking_url?: string;
  cal_event_type_slug?: string;
}

export function getCalConfig(): CalConfig {
  return {
    apiKey: configStr('cal', 'api_key', ['CAL_API_KEY']) ?? null,
    eventTypeSlug:
      configStr('cal', 'event_type_slug', ['CAL_EVENT_TYPE_SLUG']) || DEFAULT_EVENT_TYPE_SLUG,
    defaultUsername:
      configStr('cal', 'default_username', ['CAL_DEFAULT_USERNAME', 'CAL_ORG_USERNAME']) ?? null,
  };
}

function normalizeCalComBookingInput(raw: string): { username: string; bookingUrl: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let username = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const u = new URL(trimmed);
      if (!/(^|\.)cal\.com$/i.test(u.hostname)) return null;
      const parts = u.pathname.split('/').filter(Boolean);
      username = parts[0] ?? '';
    } else {
      username = trimmed.replace(/^@/, '').replace(/^cal\.com\//i, '');
      username = username.split('/')[0] ?? '';
    }
  } catch {
    return null;
  }

  username = username.trim().toLowerCase();
  if (!CAL_USERNAME_RE.test(username)) return null;
  return { username, bookingUrl: `${CAL_COM_HOME_URL}/${username}` };
}

/** Extrait username + slug d'événement depuis le profil praticien. */
export function parseCalComEventProfile(
  profile: PhysioProfileFields,
  defaultEventTypeSlug?: string
): CalComEventProfile | null {
  const fallbackSlug =
    profile.cal_event_type_slug?.trim() ||
    defaultEventTypeSlug ||
    getCalConfig().eventTypeSlug;

  const fromUrl = profile.booking_url?.trim();
  if (fromUrl) {
    try {
      const u = new URL(fromUrl.startsWith('http') ? fromUrl : `${CAL_COM_HOME_URL}/${fromUrl}`);
      if (/(^|\.)cal\.com$/i.test(u.hostname)) {
        const parts = u.pathname.split('/').filter(Boolean);
        const username = parts[0]?.toLowerCase();
        if (username && CAL_USERNAME_RE.test(username)) {
          const eventTypeSlug = parts[1]?.toLowerCase() || fallbackSlug;
          return {
            username,
            eventTypeSlug,
            bookingUrl: `${CAL_COM_HOME_URL}/${username}${parts[1] ? `/${parts[1]}` : ''}`,
          };
        }
      }
    } catch {
      // continue
    }
    const normalized = normalizeCalComBookingInput(fromUrl);
    if (normalized) {
      return {
        username: normalized.username,
        eventTypeSlug: fallbackSlug,
        bookingUrl: normalized.bookingUrl,
      };
    }
  }

  const fromUsername = profile.cal_com_username?.trim();
  if (fromUsername) {
    const normalized = normalizeCalComBookingInput(fromUsername);
    if (normalized) {
      return {
        username: normalized.username,
        eventTypeSlug: fallbackSlug,
        bookingUrl: normalized.bookingUrl,
      };
    }
  }

  return null;
}

/** Profil praticien ou compte Cal.com org ProDay (config cal.default_username). */
export async function resolveCalComEventProfile(
  profile: PhysioProfileFields,
  defaultEventTypeSlug?: string
): Promise<CalComEventProfile | null> {
  const fromProfile = parseCalComEventProfile(profile, defaultEventTypeSlug);
  if (fromProfile) return fromProfile;

  const { eventTypeSlug } = getCalConfig();
  const defaultUsername =
    getCalConfig().defaultUsername ?? (await resolveCalDefaultUsername());
  if (!defaultUsername) return null;

  const normalized = normalizeCalComBookingInput(defaultUsername);
  if (!normalized) return null;

  const slug =
    profile.cal_event_type_slug?.trim() ||
    defaultEventTypeSlug ||
    eventTypeSlug;

  return {
    username: normalized.username,
    eventTypeSlug: slug,
    bookingUrl: `${CAL_COM_HOME_URL}/${normalized.username}/${slug}`,
  };
}

export function isCalVideoMeetingLink(link: string): boolean {
  try {
    const url = new URL(link);
    if (/\/video\//i.test(url.pathname)) return true;
    return /(^|\.)cal\.(com|app)$/i.test(url.hostname) && url.pathname.includes('/video');
  } catch {
    return /cal\.(com|app)\/video/i.test(link) || link.includes('/video/');
  }
}

export function extractCalVideoUrlFromBooking(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const nested = record.data as Record<string, unknown> | undefined;
  const booking = (nested?.booking ?? nested ?? record) as Record<string, unknown>;

  const metadata = booking.metadata as Record<string, unknown> | undefined;
  const videoFromMeta = metadata?.videoCallUrl;
  if (typeof videoFromMeta === 'string' && videoFromMeta.startsWith('http')) {
    return videoFromMeta;
  }

  const location = booking.location;
  if (typeof location === 'string') {
    if (location.startsWith('http') && isCalVideoMeetingLink(location)) return location;
    if (location.startsWith('integrations:')) {
      // URL Cal Video pas encore propagée — polling requis
      return null;
    }
  }

  const uid = booking.uid;
  if (typeof uid === 'string' && uid.trim()) {
    return `https://app.cal.com/video/${uid.trim()}`;
  }

  return null;
}

export function buildCalVideoJoinUrl(
  baseUrl: string,
  opts: { userName?: string; email?: string }
): string {
  try {
    const url = new URL(baseUrl);
    if (opts.userName) url.searchParams.set('name', opts.userName);
    if (opts.email) url.searchParams.set('email', opts.email);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function buildCalComMeetingLink(bookingUrl: string, startAt?: Date): string | null {
  const trimmed = bookingUrl.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);
    if (!/(^|\.)cal\.com$/i.test(url.hostname)) return trimmed;

    if (startAt) {
      const y = startAt.getFullYear();
      const m = String(startAt.getMonth() + 1).padStart(2, '0');
      const d = String(startAt.getDate()).padStart(2, '0');
      url.searchParams.set('date', `${y}-${m}-${d}`);
      url.searchParams.set('slot', startAt.toISOString());
    }

    const location = JSON.stringify({ value: 'integrations:daily', optionValue: '' });
    url.searchParams.set('location', location);
    return url.toString();
  } catch {
    return trimmed;
  }
}

/** Lien Cal.com de secours (sans API) — pré-sélectionne Cal Video + créneau. */
export function buildCalComMeetingLinkFallback(
  profile: PhysioProfileFields,
  startAt?: Date
): CalVideoMeetingLinkResult | null {
  const eventProfile = parseCalComEventProfile(profile);
  if (!eventProfile) return null;

  const meetingLink = buildCalComMeetingLink(eventProfile.bookingUrl, startAt);
  if (!meetingLink) return null;

  return { meetingLink, visioProvider: 'cal' };
}

async function calApiRequest<T>(
  path: string,
  init: RequestInit,
  apiKey: string
): Promise<T | null> {
  const response = await fetch(`${CAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'cal-api-version': CAL_API_VERSION,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn(`[calVisio] ${init.method ?? 'GET'} ${path} → ${response.status}: ${body}`);
    return null;
  }

  return (await response.json()) as T;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCalVideoUrlForBooking(
  bookingUid: string,
  apiKey: string
): Promise<string | null> {
  for (const delayMs of [0, 2000, 4000]) {
    if (delayMs > 0) await sleep(delayMs);

    const sessions = await calApiRequest<{ data?: unknown }>(
      `/bookings/${encodeURIComponent(bookingUid)}/conferencing-sessions`,
      { method: 'GET' },
      apiKey
    );

    const sessionsData = sessions?.data;
    if (Array.isArray(sessionsData)) {
      for (const session of sessionsData) {
        if (session && typeof session === 'object') {
          const url = (session as Record<string, unknown>).url;
          if (typeof url === 'string' && url.startsWith('http')) return url;
        }
      }
    }

    const booking = await calApiRequest<{ data?: unknown }>(
      `/bookings/${encodeURIComponent(bookingUid)}`,
      { method: 'GET' },
      apiKey
    );

    const videoUrl = extractCalVideoUrlFromBooking(booking);
    if (videoUrl && isCalVideoMeetingLink(videoUrl)) return videoUrl;
  }

  return `https://app.cal.com/video/${bookingUid}`;
}

/** Crée un booking Cal.com avec Cal Video via l'API v2. */
export async function createCalVideoBooking(input: {
  eventProfile: CalComEventProfile;
  startAt: Date;
  attendeeName: string;
  attendeeEmail: string;
  timeZone?: string;
  metadata?: Record<string, string>;
}): Promise<CalVideoMeetingLinkResult | null> {
  const { apiKey } = getCalConfig();
  if (!apiKey) {
    console.warn('[calVisio] CAL_API_KEY absent — configurer cal.api_key');
    return null;
  }

  const payload = {
    start: input.startAt.toISOString(),
    eventTypeSlug: input.eventProfile.eventTypeSlug,
    username: input.eventProfile.username,
    attendee: {
      name: input.attendeeName,
      email: input.attendeeEmail,
      timeZone: input.timeZone ?? 'Europe/Paris',
    },
    location: {
      type: 'integration',
      integration: 'cal-video',
    },
    metadata: {
      proday: 'true',
      ...(input.metadata ?? {}),
    },
  };

  const created = await calApiRequest<{ data?: unknown }>(
    '/bookings',
    { method: 'POST', body: JSON.stringify(payload) },
    apiKey
  );

  if (!created) return null;

  const bookingUid =
    (created.data as Record<string, unknown> | undefined)?.uid ??
    extractCalVideoUrlFromBooking(created)?.split('/video/').pop();

  let meetingLink = extractCalVideoUrlFromBooking(created);

  if (!meetingLink && typeof bookingUid === 'string') {
    meetingLink = await fetchCalVideoUrlForBooking(bookingUid, apiKey);
  }

  if (!meetingLink) return null;

  return {
    meetingLink,
    visioProvider: 'cal',
    calBookingUid: typeof bookingUid === 'string' ? bookingUid : undefined,
  };
}

/** Point d'entrée — Cal Video via API, lien Cal.com en secours. */
export async function resolveCalVideoMeetingLink(input: {
  profile: PhysioProfileFields;
  startAt: Date;
  attendeeName: string;
  attendeeEmail: string;
  appointmentId: string;
}): Promise<CalVideoMeetingLinkResult | null> {
  const eventProfile = await resolveCalComEventProfile(input.profile);
  if (!eventProfile) return null;

  const fromApi = await createCalVideoBooking({
    eventProfile,
    startAt: input.startAt,
    attendeeName: input.attendeeName,
    attendeeEmail: input.attendeeEmail,
    metadata: { prodayAppointmentId: input.appointmentId },
  });

  if (fromApi) return fromApi;

  return buildCalComMeetingLinkFallback(input.profile, input.startAt);
}
