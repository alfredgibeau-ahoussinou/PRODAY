import { callFunction } from '../lib/firebaseFunctions';
import type { VisioProvider } from '../models/MedicalAppointment';
import { buildDailyJoinUrl, isDailyMeetingLink } from '../utils/visioMeetingLink';

export interface ResolveVisioJoinInput {
  appointmentId: string;
  meetingLink: string;
  visioProvider?: VisioProvider;
  userName: string;
  userId: string;
  isHost: boolean;
}

export interface VisioJoinResult {
  joinUrl: string;
  provider: VisioProvider | 'cal';
}

/** Résout l'URL de join direct (Daily token + nom auto, ou Cal.com secours). */
export async function resolveVisioJoinUrl(input: ResolveVisioJoinInput): Promise<string> {
  const isDaily =
    input.visioProvider === 'daily' || isDailyMeetingLink(input.meetingLink);

  if (isDaily) {
    try {
      const result = await callFunction<
        { appointmentId: string; isHost?: boolean },
        VisioJoinResult
      >('getVisioJoinUrl', {
        appointmentId: input.appointmentId,
        isHost: input.isHost,
      }, 'europe-west1');
      return result.joinUrl;
    } catch {
      return buildDailyJoinUrl(input.meetingLink, {
        userName: input.userName,
        userId: input.userId,
      });
    }
  }

  return input.meetingLink;
}
