import type { CarouselPoleId } from '../../../models/CarouselPole';
import type { IconName } from '../../ui/iconNames';
import { universePoleDisplayName, universePoleIcon } from './universePoleBrand';

/** Pôles proposés par le guide — grand public uniquement (pas Admin). */
export const UNIVERSE_GUIDE_PUBLIC_POLES: CarouselPoleId[] = [
  'joueur',
  'coach',
  'pro_club',
  'president',
  'parent',
  'supporter',
  'sponsor',
];

export type UniverseGuideRootId =
  | 'play'
  | 'lead'
  | 'family'
  | 'fans'
  | 'brand';

export type UniverseGuideRootChoice = {
  id: UniverseGuideRootId;
  label: string;
  hint: string;
  /** Si défini : résultat immédiat. Sinon branche. */
  pole?: CarouselPoleId;
  branch?: 'lead';
};

export type UniverseGuideBranchChoice = {
  pole: CarouselPoleId;
  label: string;
  hint: string;
};

/** Question 1 — place dans le football (pas une liste de tous les pôles). */
export const UNIVERSE_GUIDE_ROOT: UniverseGuideRootChoice[] = [
  {
    id: 'play',
    label: 'Je joue',
    hint: 'Sur le terrain, en club ou en ambition',
    pole: 'joueur',
  },
  {
    id: 'lead',
    label: 'J’encadre',
    hint: 'Coach, club ou direction',
    branch: 'lead',
  },
  {
    id: 'family',
    label: 'Je suis parent',
    hint: 'Accompagner mon enfant',
    pole: 'parent',
  },
  {
    id: 'fans',
    label: 'Je suis fan',
    hint: 'Suivre mon équipe et la communauté',
    pole: 'supporter',
  },
  {
    id: 'brand',
    label: 'Je représente une marque',
    hint: 'Sponsoring et partenariats locaux',
    pole: 'sponsor',
  },
];

/** Question 2 — uniquement si « J’encadre ». */
export const UNIVERSE_GUIDE_LEAD_BRANCH: UniverseGuideBranchChoice[] = [
  {
    pole: 'coach',
    label: 'Coach ou staff',
    hint: 'Séances, effectif, matchs',
  },
  {
    pole: 'pro_club',
    label: 'Club',
    hint: 'Structure, équipes, licences',
  },
  {
    pole: 'president',
    label: 'Président',
    hint: 'Pilotage et décisions',
  },
];

export function universeGuideResultCopy(pole: CarouselPoleId): {
  title: string;
  line: string;
  cta: string;
  icon: IconName;
} {
  const name = universePoleDisplayName(pole);
  const lines: Partial<Record<CarouselPoleId, string>> = {
    joueur: 'Perf, vidéos et progression — votre espace joueur.',
    coach: 'Séances IA, tactique et suivi de groupe.',
    pro_club: 'Effectifs, calendrier et vie du club.',
    president: 'Vue dirigeants pour piloter la structure.',
    parent: 'Convocations, covoiturage et suivi serein.',
    supporter: 'Matchs, ambiances et communauté locale.',
    sponsor: 'Visibilité et partenariats sur le territoire.',
  };
  return {
    title: name,
    line: lines[pole] ?? `L’univers ${name} vous correspond.`,
    cta: `Voir l’univers ${name}`,
    icon: universePoleIcon(pole),
  };
}

/** Garde le pôle dans la liste carousel visible ; sinon null. */
export function resolveGuidePoleInLines(
  pole: CarouselPoleId,
  lines: CarouselPoleId[],
): CarouselPoleId | null {
  if (lines.includes(pole)) return pole;
  // Fallbacks legacy / alias
  if (pole === 'joueur') {
    const alt = lines.find((l) => l === 'amateur' || l === 'pro_player');
    return alt ?? null;
  }
  if (pole === 'coach') {
    const alt = lines.find((l) => l === 'pro_staff');
    return alt ?? null;
  }
  return null;
}

export function filterGuideRootForLines(
  lines: CarouselPoleId[],
): UniverseGuideRootChoice[] {
  return UNIVERSE_GUIDE_ROOT.filter((choice) => {
    if (choice.pole) {
      return resolveGuidePoleInLines(choice.pole, lines) != null;
    }
    if (choice.branch === 'lead') {
      return UNIVERSE_GUIDE_LEAD_BRANCH.some(
        (b) => resolveGuidePoleInLines(b.pole, lines) != null,
      );
    }
    return false;
  });
}

export function filterGuideLeadBranchForLines(
  lines: CarouselPoleId[],
): UniverseGuideBranchChoice[] {
  return UNIVERSE_GUIDE_LEAD_BRANCH.filter(
    (b) => resolveGuidePoleInLines(b.pole, lines) != null,
  );
}
