import type { LiveMatchAction } from '../models/TeamEvent';
import { LIVE_ACTION_LABELS } from '../models/TeamEvent';
import type { SupporterReplayChapter } from '../models/SupporterVideo';

const CHAPTER_TYPES = new Set<LiveMatchAction['type']>([
  'goal',
  'yellow_card',
  'red_card',
  'sub_in',
  'sub_out',
]);

/**
 * Heuristique offset vidéo ← minute de match.
 * Hypothèses : vidéo démarre au coup d'envoi ; pause mi-temps +15 min après la 45e ;
 * pas de temps additionnel modélisé (approximation conservative).
 */
export function minuteToOffsetMs(minute: number, durationSec?: number): number {
  let ms = Math.max(0, minute) * 60_000;
  if (minute > 45) ms += 15 * 60_000;
  if (durationSec != null && durationSec > 0) {
    const maxMs = durationSec * 1000;
    if (ms > maxMs) ms = Math.max(0, maxMs - 3000);
  }
  return ms;
}

export function buildReplayChaptersFromEvents(
  events: LiveMatchAction[],
  durationSec?: number,
): SupporterReplayChapter[] {
  return events
    .filter((e) => CHAPTER_TYPES.has(e.type))
    .sort((a, b) => a.minute - b.minute)
    .map((e) => ({
      id: e.id,
      label: `${LIVE_ACTION_LABELS[e.type]} — ${e.player_name}`,
      minute: e.minute,
      offsetMs: minuteToOffsetMs(e.minute, durationSec),
      type: e.type,
    }));
}
