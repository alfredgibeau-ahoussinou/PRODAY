import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import type { MatchsDeepLink } from '../../../utils/navigationDeepLink';

export type CoachMatchHubOverlay = {
  eventId: string;
  hubChapter: MatchHubChapterId;
};

/** Ouvre le hub événement coach quand openMatchs fournit un eventId. */
export function resolveCoachMatchHubOverlay(
  link: MatchsDeepLink | null | undefined,
): CoachMatchHubOverlay | null {
  if (!link?.eventId) return null;
  return {
    eventId: link.eventId,
    hubChapter: link.hubChapter ?? 'apercu',
  };
}

/** Parcours guidé Matchs & parcours — Convoc → pointage effectif. */
export const COACH_MATCH_FLOW_STEPS: readonly {
  hub: MatchHubChapterId;
  labelKey: string;
}[] = [
  { hub: 'effectif', labelKey: 'coach.portal.matchs.stepConvoc' },
  { hub: 'composition', labelKey: 'coach.portal.matchs.stepLineup' },
  { hub: 'live', labelKey: 'coach.portal.matchs.stepLive' },
  { hub: 'stats', labelKey: 'coach.portal.matchs.stepReport' },
];
