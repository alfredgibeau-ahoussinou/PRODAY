export type CoachPortalChapterId =
  | 'cockpit'
  | 'planning'
  | 'effectif'
  | 'matchs'
  | 'performance'
  | 'communication';

export const COACH_PORTAL_CHAPTERS: {
  id: CoachPortalChapterId;
  labelKey: string;
  shortLabelKey: string;
}[] = [
  { id: 'cockpit', labelKey: 'coach.portal.chapter.cockpit', shortLabelKey: 'coach.portal.chapter.cockpitShort' },
  { id: 'planning', labelKey: 'coach.portal.chapter.planning', shortLabelKey: 'coach.portal.chapter.planningShort' },
  { id: 'effectif', labelKey: 'coach.portal.chapter.effectif', shortLabelKey: 'coach.portal.chapter.effectifShort' },
  { id: 'matchs', labelKey: 'coach.portal.chapter.matchs', shortLabelKey: 'coach.portal.chapter.matchsShort' },
  { id: 'performance', labelKey: 'coach.portal.chapter.performance', shortLabelKey: 'coach.portal.chapter.performanceShort' },
  {
    id: 'communication',
    labelKey: 'coach.portal.chapter.communication',
    shortLabelKey: 'coach.portal.chapter.communicationShort',
  },
];
