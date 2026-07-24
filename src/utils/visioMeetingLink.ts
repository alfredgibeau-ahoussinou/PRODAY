import type { User } from '../models/User';
import type { MedicalAppointment, VisioProvider } from '../models/MedicalAppointment';
import { getPhysioCalComBookingUrl } from './calComBooking';

export type ConsultationType = 'cabinet' | 'visio' | 'both';

export interface MeetingLinkResult {
  meetingLink: string;
  visioProvider: VisioProvider;
}

const DEFAULT_DAILY_DOMAIN = 'proday';

/** Indique si la consultation prévoit une visio (ou les deux modes). */
export function isVisioConsultation(consultationType?: ConsultationType): boolean {
  return consultationType === 'visio' || consultationType === 'both' || !consultationType;
}

/** Affiche le bouton « Rejoindre la visio » pour un RDV confirmé avec lien. */
export function canJoinVisioSession(
  appointment: MedicalAppointment,
  options?: { platformEnabled?: boolean },
): boolean {
  if (options?.platformEnabled === false) return false;
  return (
    appointment.status === 'confirmed' &&
    Boolean(appointment.meeting_link?.trim() || appointment.cal_booking_uid?.trim()) &&
    isVisioConsultation(appointment.consultation_type)
  );
}

/** Seuls les RDV cabinet (ou visio bloquée en pending) nécessitent une action praticien. */
export function requiresPhysioConfirmation(appointment: MedicalAppointment): boolean {
  if (appointment.status !== 'pending') return false;
  // Cabinet : confirmation manuelle classique.
  if (appointment.consultation_type === 'cabinet') return true;
  // Visio/both stuck (Cal/Daily KO) : le praticien peut valider pour relancer la salle.
  return isVisioConsultation(appointment.consultation_type);
}

/** RDV visio synchronisé avec Cal.com (booking API créé à la réservation). */
export function isCalComSynced(appointment: MedicalAppointment): boolean {
  return (
    isVisioConsultation(appointment.consultation_type) &&
    (appointment.visio_provider === 'cal' || Boolean(appointment.cal_booking_uid?.trim()))
  );
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

export function dailyRoomName(appointmentId: string): string {
  return `proday-rdv-${appointmentId}`;
}

export function dailyRoomUrl(domain: string, roomName: string): string {
  return `https://${domain}.daily.co/${roomName}`;
}

/** Lien Daily déterministe — secours si Cal.com indisponible. */
export function buildDailyMeetingLink(
  appointmentId: string,
  domain = DEFAULT_DAILY_DOMAIN
): MeetingLinkResult {
  const roomName = dailyRoomName(appointmentId);
  return {
    meetingLink: dailyRoomUrl(domain, roomName),
    visioProvider: 'daily',
  };
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

export function isDailyMeetingLink(link: string): boolean {
  try {
    return /\.daily\.co$/i.test(new URL(link).hostname);
  } catch {
    return link.includes('daily.co');
  }
}

/** Lien réellement joinable (salle vidéo) — pas une page de réservation Cal.com. */
export function isJoinableVisioMeetingLink(link: string): boolean {
  return isCalVideoMeetingLink(link) || isDailyMeetingLink(link);
}

/**
 * Construit l'URL Cal.com avec Cal Video pré-sélectionné + créneau.
 * Utilisé en secours côté client si la Cloud Function n'a pas encore créé le booking.
 */
export function buildCalComMeetingLink(
  bookingUrl: string,
  startAt?: Date,
  prefill?: { name?: string; email?: string }
): string | null {
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

    if (prefill?.name) url.searchParams.set('name', prefill.name);
    if (prefill?.email) url.searchParams.set('email', prefill.email);

    const location = JSON.stringify({ value: 'integrations:daily', optionValue: '' });
    url.searchParams.set('location', location);
    return url.toString();
  } catch {
    return trimmed;
  }
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

/** Cal.com — flux principal (lien secours sans API). */
export function buildCalComMeetingLinkForPhysio(
  physio: Pick<User, 'profile'>,
  startAt?: Date,
  prefill?: { name?: string; email?: string }
): MeetingLinkResult | null {
  const bookingUrl = getPhysioCalComBookingUrl(physio as User);
  if (!bookingUrl) return null;

  const meetingLink = buildCalComMeetingLink(bookingUrl, startAt, prefill);
  if (!meetingLink) return null;

  return { meetingLink, visioProvider: 'cal' };
}

/** Cal.com en priorité — le lien Cal Video est créé par la Cloud Function à la réservation visio. */
export function buildMeetingLinkForAppointment(
  physio: Pick<User, 'profile'>,
  appointment: Pick<MedicalAppointment, 'start_at' | 'consultation_type'>,
  _appointmentId: string
): MeetingLinkResult | null {
  if (!isVisioConsultation(appointment.consultation_type)) return null;
  return buildCalComMeetingLinkForPhysio(physio, appointment.start_at);
}

export function buildMeetingLinkForPhysio(
  physio: Pick<User, 'profile'>,
  startAt?: Date
): MeetingLinkResult | null {
  return buildCalComMeetingLinkForPhysio(physio, startAt);
}
