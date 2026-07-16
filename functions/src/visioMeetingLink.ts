const CAL_COM_HOME_URL = 'https://cal.com';
const CAL_USERNAME_RE = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/i;

type ConsultationType = 'cabinet' | 'visio' | 'both';
type VisioProvider = 'cal' | 'whereby' | 'manual';

export interface PhysioProfileFields {
  cal_com_username?: string;
  booking_url?: string;
}

function normalizeCalComBookingInput(raw: string): { bookingUrl: string } | null {
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
  return { bookingUrl: `${CAL_COM_HOME_URL}/${username}` };
}

export function getPhysioCalComBookingUrl(profile: PhysioProfileFields): string | null {
  const fromUrl = profile.booking_url?.trim();
  if (fromUrl && /^https?:\/\//i.test(fromUrl)) return fromUrl;
  const fromUsername = profile.cal_com_username?.trim();
  if (fromUsername) {
    const n = normalizeCalComBookingInput(fromUsername);
    return n?.bookingUrl ?? null;
  }
  if (fromUrl) {
    const n = normalizeCalComBookingInput(fromUrl);
    return n?.bookingUrl ?? null;
  }
  return null;
}

export function isVisioConsultation(consultationType?: ConsultationType): boolean {
  return consultationType === 'visio' || consultationType === 'both' || !consultationType;
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
    return url.toString();
  } catch {
    return trimmed;
  }
}

export function buildMeetingLinkForPhysio(
  profile: PhysioProfileFields,
  startAt?: Date
): { meetingLink: string; visioProvider: VisioProvider } | null {
  const bookingUrl = getPhysioCalComBookingUrl(profile);
  if (!bookingUrl) return null;
  const meetingLink = buildCalComMeetingLink(bookingUrl, startAt);
  if (!meetingLink) return null;
  return { meetingLink, visioProvider: 'cal' };
}

export function buildMeetingLinkForAppointment(
  profile: PhysioProfileFields,
  input: { start_at: Date; consultation_type?: ConsultationType }
): { meetingLink: string; visioProvider: VisioProvider } | null {
  if (!isVisioConsultation(input.consultation_type)) return null;
  return buildMeetingLinkForPhysio(profile, input.start_at);
}
