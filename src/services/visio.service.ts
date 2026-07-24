import { callFunction } from '../lib/firebaseFunctions';
import type { VisioProvider } from '../models/MedicalAppointment';
import {
  buildCalVideoJoinUrl,
  isCalVideoMeetingLink,
} from '../utils/visioMeetingLink';

export interface ResolveVisioJoinInput {
  appointmentId: string;
  meetingLink: string;
  visioProvider?: VisioProvider;
  userName: string;
  userId: string;
  userEmail?: string;
  isHost: boolean;
}

export interface VisioJoinResult {
  joinUrl: string;
  provider: VisioProvider | 'cal';
}

/**
 * Résout l'URL de join direct via Cloud Function (crée la salle si besoin).
 * Pas de fallback Daily local — les URLs déterministes n'existent pas sans API.
 */
export async function resolveVisioJoinUrl(input: ResolveVisioJoinInput): Promise<string> {
  const result = await callFunction<
    { appointmentId: string; isHost?: boolean },
    VisioJoinResult
  >(
    'getVisioJoinUrl',
    {
      appointmentId: input.appointmentId,
      isHost: input.isHost,
    },
    'europe-west1'
  );

  if (!result?.joinUrl?.trim()) {
    throw new Error('Lien visio vide. Réessayez dans un instant.');
  }

  return result.joinUrl;
}

/** Fallback UI uniquement si le callable a déjà renvoyé une Cal Video. */
export function enrichLocalCalJoinUrl(
  meetingLink: string,
  opts: { userName?: string; email?: string }
): string | null {
  if (!isCalVideoMeetingLink(meetingLink)) return null;
  return buildCalVideoJoinUrl(meetingLink, opts);
}

export { isCalVideoMeetingLink };
