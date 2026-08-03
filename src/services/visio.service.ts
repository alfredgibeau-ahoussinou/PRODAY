import { callFunction } from '../lib/firebaseFunctions';
import type { VisioProvider } from '../models/MedicalAppointment';
import {
  buildCalVideoJoinUrl,
  isCalVideoMeetingLink,
} from '../utils/visioMeetingLink';
import { parseDailyJoinCredentials } from '../components/medical/visio/parseDailyJoinCredentials';

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
  roomUrl?: string | null;
  token?: string | null;
}

/**
 * Résout la session visio via Cloud Function (crée la salle privée + token si besoin).
 */
export async function resolveVisioJoinSession(
  input: ResolveVisioJoinInput
): Promise<VisioJoinResult> {
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

  const provider = result.provider === 'daily' ? 'daily' : 'cal';
  let roomUrl = result.roomUrl?.trim() || null;
  let token = result.token?.trim() || null;

  if (provider === 'daily' && (!roomUrl || roomUrl === result.joinUrl)) {
    const parsed = parseDailyJoinCredentials(result.joinUrl);
    if (parsed) {
      roomUrl = parsed.roomUrl;
      token = token || parsed.token;
    }
  }

  return {
    joinUrl: result.joinUrl,
    provider,
    roomUrl,
    token,
  };
}

/** @deprecated Prefer resolveVisioJoinSession — conserve l’URL seule. */
export async function resolveVisioJoinUrl(input: ResolveVisioJoinInput): Promise<string> {
  const session = await resolveVisioJoinSession(input);
  return session.joinUrl;
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
