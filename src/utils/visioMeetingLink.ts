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
export function canJoinVisioSession(appointment: MedicalAppointment): boolean {
  return (
    appointment.status === 'confirmed' &&
    Boolean(appointment.meeting_link?.trim()) &&
    isVisioConsultation(appointment.consultation_type)
  );
}

export function dailyRoomName(appointmentId: string): string {
  return `proday-rdv-${appointmentId}`;
}

export function dailyRoomUrl(domain: string, roomName: string): string {
  return `https://${domain}.daily.co/${roomName}`;
}

/** Lien Daily déterministe — utilisé côté client si la Cloud Function n'a pas encore créé la salle. */
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

/**
 * Construit l'URL Cal.com — secours uniquement.
 * MVP : page publique du praticien + paramètres date/créneau si disponibles.
 */
export function buildCalComMeetingLink(
  bookingUrl: string,
  startAt?: Date
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
    return url.toString();
  } catch {
    return trimmed;
  }
}

/** Cal.com — secours si Daily indisponible. */
export function buildCalComMeetingLinkForPhysio(
  physio: Pick<User, 'profile'>,
  startAt?: Date
): MeetingLinkResult | null {
  const bookingUrl = getPhysioCalComBookingUrl(physio as User);
  if (!bookingUrl) return null;

  const meetingLink = buildCalComMeetingLink(bookingUrl, startAt);
  if (!meetingLink) return null;

  return { meetingLink, visioProvider: 'cal' };
}

/** Daily en priorité, Cal.com en secours. */
export function buildMeetingLinkForAppointment(
  physio: Pick<User, 'profile'>,
  appointment: Pick<MedicalAppointment, 'start_at' | 'consultation_type'>,
  appointmentId: string
): MeetingLinkResult | null {
  if (!isVisioConsultation(appointment.consultation_type)) return null;
  return buildDailyMeetingLink(appointmentId);
}

/** @deprecated Utiliser buildCalComMeetingLinkForPhysio — Cal.com est un secours. */
export function buildMeetingLinkForPhysio(
  physio: Pick<User, 'profile'>,
  startAt?: Date
): MeetingLinkResult | null {
  return buildCalComMeetingLinkForPhysio(physio, startAt);
}
