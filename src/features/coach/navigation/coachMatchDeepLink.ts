import type { MatchChapterId } from '../../../content/matchChapters';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import type { MainTabId } from '../../../navigation/mainTabConfig';
import type { MatchsDeepLink } from '../../../utils/navigationDeepLink';
import { canonicalizeCoachNav, type CoachNavItemId } from './coachNavConfig';

export type CoachEventHubOverlay = {
  eventId: string;
  hubChapter?: MatchHubChapterId;
};

/** @deprecated Utiliser CoachEventHubOverlay */
export type CoachMatchHubOverlay = CoachEventHubOverlay & {
  hubChapter: MatchHubChapterId;
};

/** Mappe un deep link Matchs vers le chapitre pager du Centre Match. */
export function matchChapterFromHomeTab(
  homeTab?: MatchsDeepLink['homeTab'],
): MatchChapterId {
  switch (homeTab) {
    case 'matches':
      return 'amicaux';
    case 'convocations':
      return 'convocations';
    case 'centre':
      return 'centre';
    case 'stats':
      return 'stats';
    case 'tournois':
      return 'tournois';
    case 'competitions':
      return 'competitions';
    default:
      return 'calendrier';
  }
}

/** Ouvre le hub événement coach quand openMatchs fournit un eventId. */
export function resolveCoachEventHubOverlay(
  link: MatchsDeepLink | null | undefined,
): CoachEventHubOverlay | null {
  if (!link?.eventId) return null;
  return {
    eventId: link.eventId,
    hubChapter: link.hubChapter,
  };
}

/** @deprecated Utiliser resolveCoachEventHubOverlay */
export function resolveCoachMatchHubOverlay(
  link: MatchsDeepLink | null | undefined,
): CoachMatchHubOverlay | null {
  const overlay = resolveCoachEventHubOverlay(link);
  if (!overlay) return null;
  return {
    eventId: overlay.eventId,
    hubChapter: overlay.hubChapter ?? 'apercu',
  };
}

const EVENT_HUB_NAV_IDS: CoachNavItemId[] = ['match_center', 'entrainements', 'planning', 'today'];

/** Conserve l’overlay hub sur Matchs ou depuis le planning / cockpit coach. */
export function shouldKeepCoachEventHubOverlay(
  activeTab: MainTabId,
  navId?: CoachNavItemId,
): boolean {
  if (activeTab === 'matchs') return true;
  if (!navId) return false;
  return EVENT_HUB_NAV_IDS.includes(canonicalizeCoachNav(navId));
}

/** @deprecated Utiliser shouldKeepCoachEventHubOverlay */
export function shouldKeepCoachMatchHubOverlay(activeTab: MainTabId): boolean {
  return shouldKeepCoachEventHubOverlay(activeTab);
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
