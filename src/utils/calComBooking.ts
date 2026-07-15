import type { User } from '../models/User';
import { Linking } from 'react-native';

export const CAL_COM_SIGNUP_URL = 'https://cal.com/signup';
export const CAL_COM_HOME_URL = 'https://cal.com';

const CAL_USERNAME_RE = /^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$/i;

/** Nettoie username ou URL Cal.com → username + booking_url. */
export function normalizeCalComBookingInput(raw: string): {
  username: string;
  bookingUrl: string;
} | null {
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
  return {
    username,
    bookingUrl: `${CAL_COM_HOME_URL}/${username}`,
  };
}

export function validateCalComBookingInput(raw: string): string | null {
  if (!raw.trim()) {
    return 'Indiquez votre username Cal.com (ex. cabinet-martin-kine)';
  }
  if (!normalizeCalComBookingInput(raw)) {
    return 'Username ou lien Cal.com invalide (ex. mon-cabinet ou https://cal.com/mon-cabinet)';
  }
  return null;
}

export function getPhysioCalComBookingUrl(physio: User): string | null {
  const fromUrl = physio.profile.booking_url?.trim();
  if (fromUrl && /^https?:\/\//i.test(fromUrl)) return fromUrl;
  const fromUsername = physio.profile.cal_com_username?.trim();
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

/** URL Cal.com optimisée pour iframe / WebView (param embed). */
export function getPhysioCalComEmbedUrl(physio: User): string | null {
  const booking = getPhysioCalComBookingUrl(physio);
  if (!booking) return null;
  try {
    const u = new URL(booking);
    u.searchParams.set('embed', 'true');
    u.searchParams.set('theme', 'light');
    return u.toString();
  } catch {
    return booking;
  }
}

export function hasPhysioCalComBooking(physio: User): boolean {
  return Boolean(getPhysioCalComBookingUrl(physio));
}

export async function openExternalUrl(url: string): Promise<void> {
  const can = await Linking.canOpenURL(url);
  if (!can) throw new Error('Impossible d’ouvrir ce lien.');
  await Linking.openURL(url);
}

export async function openCalComSignup(): Promise<void> {
  await openExternalUrl(CAL_COM_SIGNUP_URL);
}
