import type { IconName } from '../components/ui/Icon';
import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { AppSpaceId } from '../models/AppSpace';
import {
  APP_SPACE_LABELS,
  isFeminineAppSpace,
  isMasculineAppSpace,
  isUnderU13AppSpace,
} from '../models/AppSpace';
import { getUniverseIdentity } from './brandExperience';
import { getMercatoTabLabel } from './poleExperience';

export type MercatoQuickTileId = 'players' | 'clubs' | 'detections' | 'stages';

export interface MercatoQuickTile {
  id: MercatoQuickTileId;
  icon: IconName;
  title: string;
  hint: string;
}

export interface MercatoExperienceConfig {
  eyebrow: string;
  screenTitle: string;
  screenSubtitle: string;
  heroTitle: string;
  heroSubtitle: string;
  heroIcon: IconName;
  playersStatLabel: string;
  searchPlaceholder: string;
  postsSectionTitle: string;
  postsEmptyAll: string;
  postsEmptySpace: string;
  postsEmptyFiltered: string;
  fabLabel: string;
  quickTiles: MercatoQuickTile[];
  showFavoritesHeader: boolean;
  showDetectionsHeader: boolean;
  showFavoritesRow: boolean;
  staffRowLabel: string;
  playersSearchHint: string;
}

function getPlayersTileTitle(line: ProductLineId): string {
  return line === 'woman' ? 'Joueuses' : 'Joueurs';
}

function getPlayersStatLabel(line: ProductLineId): string {
  return line === 'woman' ? 'Joueuses' : 'Joueurs';
}

function getQuickTiles(line: ProductLineId): MercatoQuickTile[] {
  const playersTitle = getPlayersTileTitle(line);
  return [
    { id: 'players', icon: 'people', title: playersTitle, hint: 'Profils & CV' },
    { id: 'clubs', icon: 'business', title: 'Clubs', hint: 'Structures' },
    { id: 'detections', icon: 'football', title: 'Détections', hint: 'Essais & scouting' },
    { id: 'stages', icon: 'calendar', title: 'Stages', hint: 'Camps & stages' },
  ];
}

function getSpaceSubtitle(appSpace: AppSpaceId): string {
  if (isUnderU13AppSpace(appSpace)) {
    return 'U7, U9, U11 — école de foot et détections poussins.';
  }
  if (isFeminineAppSpace(appSpace)) {
    return 'Annonces et profils filtrés pour le football féminin.';
  }
  if (isMasculineAppSpace(appSpace)) {
    return 'Annonces et profils filtrés pour le football masculin.';
  }
  return 'Espace dédié.';
}

function getRoleSubtitle(
  line: ProductLineId,
  role: UserRole | undefined,
  appSpace: AppSpaceId
): string {
  const r = role ?? 'player';

  if (r === 'player') {
    if (line === 'woman') {
      return 'Parcourez les annonces foot féminin et candidatez en un tap.';
    }
    if (line === 'pro') {
      return 'Opportunités pro vérifiées — candidatez depuis votre profil.';
    }
    return 'Parcourez les annonces et candidatez — la publication est réservée aux clubs.';
  }

  if (r === 'recruiter') {
    return 'Scouting, pipeline candidatures et annonces Mercato Pro.';
  }

  if (r === 'coach' || r === 'agent') {
    return 'Publiez vos offres, suivez les candidatures et développez votre réseau.';
  }

  if (r === 'club') {
    return 'Recrutez, publiez vos besoins et gérez vos annonces actives.';
  }

  if (line === 'pro') {
    return 'Mercato Pro — recrutement vérifié et réseau clubs.';
  }

  return getSpaceSubtitle(appSpace);
}

function getHeroCopy(
  line: ProductLineId,
  role: UserRole | undefined
): { title: string; subtitle: string; icon: IconName } {
  const r = role ?? 'player';
  const identity = getUniverseIdentity(line);
  const tabLabel = getMercatoTabLabel(line, r);

  if (r === 'player' && line === 'homme') {
    return {
      title: 'Candidater sur Pro Day',
      subtitle:
        'Annonces ciblées, profils vérifiés et candidatures en un tap — votre saison commence ici.',
      icon: 'search',
    };
  }

  if (r === 'player' && line === 'woman') {
    return {
      title: 'Mercato F',
      subtitle:
        'Offres clubs, détections et stages dédiés au foot au féminin — trouvez votre prochain club.',
      icon: 'people',
    };
  }

  if (line === 'pro') {
    return {
      title: tabLabel,
      subtitle:
        'Recrutement pro, mandats staff et scouting — l’écosystème Mercato de Pro Day Pro.',
      icon: 'briefcase',
    };
  }

  return {
    title: identity.mercatoLabel,
    subtitle:
      'Annonces ciblées, profils vérifiés et candidatures en un tap — votre saison commence ici.',
    icon: 'search',
  };
}

export function getMercatoExperienceConfig(
  line: ProductLineId,
  role: UserRole | undefined,
  appSpace: AppSpaceId
): MercatoExperienceConfig {
  const r = role ?? 'player';
  const identity = getUniverseIdentity(line);
  const tabLabel = getMercatoTabLabel(line, r);
  const hero = getHeroCopy(line, r);
  const playersTitle = getPlayersTileTitle(line);
  const isPlayer = r === 'player';

  return {
    eyebrow: `${identity.accentLabel} · ${tabLabel}`,
    screenTitle: tabLabel,
    screenSubtitle: `${APP_SPACE_LABELS[appSpace]} — ${getRoleSubtitle(line, role, appSpace)}`,
    heroTitle: hero.title,
    heroSubtitle: hero.subtitle,
    heroIcon: hero.icon,
    playersStatLabel: getPlayersStatLabel(line),
    searchPlaceholder: isPlayer
      ? line === 'woman'
        ? 'Rechercher un club F, un poste…'
        : 'Rechercher un club, un poste…'
      : line === 'woman'
        ? `Rechercher une joueuse, un poste…`
        : 'Rechercher un joueur, un poste…',
    postsSectionTitle: 'Recrutements populaires',
    postsEmptyAll:
      line === 'pro'
        ? 'Aucune annonce ouverte pour le moment. Publiez la première offre Mercato Pro.'
        : 'Aucune annonce ouverte pour le moment. Soyez le premier à publier une offre Mercato.',
    postsEmptySpace: `Aucune annonce ouverte pour ${APP_SPACE_LABELS[appSpace]} pour le moment.`,
    postsEmptyFiltered: 'Aucune annonce ne correspond à votre recherche.',
    fabLabel: 'Publier une annonce',
    quickTiles: getQuickTiles(line),
    showFavoritesHeader: isPlayer,
    showDetectionsHeader: !isPlayer,
    showFavoritesRow: !!role && !isPlayer,
    staffRowLabel: line === 'woman' ? 'Coachs & agents F' : 'Coachs & agents',
    playersSearchHint: `Voir les ${playersTitle.toLowerCase()} correspondant à`,
  };
}
