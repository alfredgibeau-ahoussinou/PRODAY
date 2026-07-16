import type { User } from '../models/User';
import type { MedicalAppointment, VisioProvider } from '../models/MedicalAppointment';
import { getPhysioCalComBookingUrl } from './calComBooking';

export type ConsultationType = 'cabinet' | 'visio' | 'both';

export interface MeetingLinkResult {
  meetingLink: string;
  visioProvider: VisioProvider;
}

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

/**
 * Construit l’URL Cal.com pour rejoindre la téléconsultation.
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

/** Génère le lien visio à partir du profil praticien Cal.com. */
export function buildMeetingLinkForPhysio(
  physio: Pick<User, 'profile'>,
  startAt?: Date
): MeetingLinkResult | null {
  const bookingUrl = getPhysioCalComBookingUrl(physio as User);
  if (!bookingUrl) return null;

  const meetingLink = buildCalComMeetingLink(bookingUrl, startAt);
  if (!meetingLink) return null;

  return { meetingLink, visioProvider: 'cal' };
}

/** Génère le lien visio pour un rendez-vous existant (côté praticien ou Cloud Function). */
export function buildMeetingLinkForAppointment(
  physio: Pick<User, 'profile'>,
  appointment: Pick<MedicalAppointment, 'start_at' | 'consultation_type'>
): MeetingLinkResult | null {
  if (!isVisioConsultation(appointment.consultation_type)) return null;
  return buildMeetingLinkForPhysio(physio, appointment.start_at);
}
