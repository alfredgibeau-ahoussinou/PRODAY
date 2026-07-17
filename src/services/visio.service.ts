import { callFunction } from '../lib/firebaseFunctions';
import type { VisioProvider } from '../models/MedicalAppointment';
import {
  buildCalVideoJoinUrl,
  buildDailyJoinUrl,
  isCalVideoMeetingLink,
  isDailyMeetingLink,
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

/** Résout l'URL de join direct (Cal Video ou Daily secours) via callable. */
export async function resolveVisioJoinUrl(input: ResolveVisioJoinInput): Promise<string> {
  try {
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
    return result.joinUrl;
  } catch {
    if (input.visioProvider === 'daily' || isDailyMeetingLink(input.meetingLink)) {
      return buildDailyJoinUrl(input.meetingLink, {
        userName: input.userName,
        userId: input.userId,
      });
    }

    return buildCalVideoJoinUrl(input.meetingLink, {
      userName: input.userName,
      email: input.userEmail,
    });
  }
}

export { isCalVideoMeetingLink };
