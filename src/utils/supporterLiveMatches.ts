import type { ExternalFixture } from '../services/externalScores.service';
import type { TeamEvent } from '../models/TeamEvent';
import { isInMatchWindow, resolveLiveState } from './matchLive';

const LIVE_MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const LIVE_PRE_KICKOFF_MS = 15 * 60 * 1000;
const LIVE_POST_END_MS = 30 * 60 * 1000;

/** Match PRODAY réellement en cours (live ou mi-temps). */
export function isProdayEventLiveNow(event: TeamEvent): boolean {
  if (!isInMatchWindow(event)) return false;
  const status = resolveLiveState(event).status;
  return status === 'live' || status === 'halftime';
}

/** Fixture monde marquée live et dans une fenêtre horaire crédible. */
export function isExternalFixtureLiveNow(fixture: ExternalFixture): boolean {
  if (fixture.status !== 'live') return false;
  const now = Date.now();
  const start = fixture.starts_at.getTime();
  const end = start + LIVE_MATCH_DURATION_MS;
  return now >= start - LIVE_PRE_KICKOFF_MS && now <= end + LIVE_POST_END_MS;
}
