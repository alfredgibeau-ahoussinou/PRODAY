import { isDailyMeetingLink } from '../../../utils/visioMeetingLink';

/** Extrait roomUrl + token depuis l'URL de join Daily (callable ou Prebuilt). */
export function parseDailyJoinCredentials(joinUrl: string): {
  roomUrl: string;
  token: string | null;
} | null {
  const trimmed = joinUrl.trim();
  if (!trimmed || !isDailyMeetingLink(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    const token = url.searchParams.get('t');
    return {
      roomUrl: `${url.origin}${url.pathname}`,
      token: token?.trim() || null,
    };
  } catch {
    return null;
  }
}
