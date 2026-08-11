import type { TeamEvent } from '../models/TeamEvent';
import type { IconName } from '../components/ui/iconNames';

export type SmartTacticsChapterId =
  | 'dashboard'
  | 'board'
  | 'cards'
  | 'prep'
  | 'training'
  | 'development'
  | 'video'
  | 'live'
  | 'history'
  | 'inbox'
  | 'me';

/** Parcours coach principal — Terrain → Effectif → Match. */
export const SMART_TACTICS_PRIMARY_CHAPTERS: {
  id: SmartTacticsChapterId;
  label: string;
  labelKey: string;
  shortLabelKey: string;
  step: number;
  icon: IconName;
}[] = [
  {
    id: 'board',
    label: 'Terrain',
    labelKey: 'smartTactics.chapter.board',
    shortLabelKey: 'smartTactics.chapter.boardShort',
    step: 1,
    icon: 'football',
  },
  {
    id: 'cards',
    label: 'Effectif',
    labelKey: 'smartTactics.chapter.cards',
    shortLabelKey: 'smartTactics.chapter.cardsShort',
    step: 2,
    icon: 'people',
  },
  {
    id: 'dashboard',
    label: 'Match',
    labelKey: 'smartTactics.chapter.dashboard',
    shortLabelKey: 'smartTactics.chapter.dashboardShort',
    step: 3,
    icon: 'trophy',
  },
];

/** Outils secondaires — rangés sous « Outils ». */
export const SMART_TACTICS_MORE_CHAPTERS: {
  id: SmartTacticsChapterId;
  label: string;
  labelKey: string;
  shortLabelKey: string;
  icon: IconName;
}[] = [
  {
    id: 'prep',
    label: 'IA adversaire',
    labelKey: 'smartTactics.chapter.prep',
    shortLabelKey: 'smartTactics.chapter.prepShort',
    icon: 'tune',
  },
  {
    id: 'live',
    label: 'Direct',
    labelKey: 'smartTactics.chapter.live',
    shortLabelKey: 'smartTactics.chapter.liveShort',
    icon: 'play',
  },
  {
    id: 'training',
    label: 'Séance',
    labelKey: 'smartTactics.chapter.training',
    shortLabelKey: 'smartTactics.chapter.trainingShort',
    icon: 'walk',
  },
  {
    id: 'video',
    label: 'Vidéo',
    labelKey: 'smartTactics.chapter.video',
    shortLabelKey: 'smartTactics.chapter.videoShort',
    icon: 'videocam',
  },
  {
    id: 'history',
    label: 'Plans',
    labelKey: 'smartTactics.chapter.history',
    shortLabelKey: 'smartTactics.chapter.historyShort',
    icon: 'document',
  },
  {
    id: 'development',
    label: 'Progrès',
    labelKey: 'smartTactics.chapter.development',
    shortLabelKey: 'smartTactics.chapter.developmentShort',
    icon: 'star',
  },
];

/**
 * Parcours joueur — hub jeu (pas de composition coach).
 * QUEST → PITCH → HERO → MATCH.
 */
export const SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS: {
  id: SmartTacticsChapterId;
  label: string;
  gameLabel: string;
  blurb: string;
  step: number;
  icon: IconName;
}[] = [
  {
    id: 'inbox',
    label: 'Quête',
    gameLabel: 'QUÊTE',
    blurb: 'Missions coach',
    step: 1,
    icon: 'star',
  },
  {
    id: 'board',
    label: 'Terrain',
    gameLabel: 'TERRAIN',
    blurb: 'XI publié',
    step: 2,
    icon: 'football',
  },
  {
    id: 'me',
    label: 'Héros',
    gameLabel: 'HÉROS',
    blurb: 'Ta carte',
    step: 3,
    icon: 'person',
  },
  {
    id: 'dashboard',
    label: 'Match',
    gameLabel: 'MATCH',
    blurb: 'Prochain niveau',
    step: 4,
    icon: 'trophy',
  },
];

/** @deprecated Préférer PRIMARY + MORE — conservé pour compat tests / imports. */
export const SMART_TACTICS_CHAPTERS = [
  ...SMART_TACTICS_PRIMARY_CHAPTERS,
  ...SMART_TACTICS_MORE_CHAPTERS,
];

export function isSmartTacticsPrimaryChapter(id: SmartTacticsChapterId): boolean {
  return SMART_TACTICS_PRIMARY_CHAPTERS.some((c) => c.id === id);
}

export function isSmartTacticsPlayerChapter(id: SmartTacticsChapterId): boolean {
  return SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS.some((c) => c.id === id);
}

/**
 * Coach : Pas de XI → Terrain. Sinon Match.
 * Joueur : toujours Consignes en premier.
 */
export function resolveSmartTacticsDefaultChapter(
  events: TeamEvent[],
  mode: 'coach' | 'player' = 'coach',
): SmartTacticsChapterId {
  if (mode === 'player') return 'inbox';
  const upcoming = [...events]
    .filter(
      (e) =>
        (e.event_type === 'friendly' ||
          e.event_type === 'competition' ||
          e.event_type === 'tournament') &&
        e.starts_at.getTime() >= Date.now() - 2 * 60 * 60 * 1000,
    )
    .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  const next = upcoming[0];
  if (next && (!next.lineup || next.lineup.slots.length === 0)) return 'board';
  return 'dashboard';
}
