import type { IconName } from '../components/ui/iconNames';
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
import type { TranslateFn } from '../i18n/types';
import type { PlayerSegment } from '../utils/playerSegment';
import { isFemalePlayerPresentation } from '../utils/playerSegment';

const tr = (t: TranslateFn | undefined, key: string, fallback: string) => {
  if (!t) return fallback;
  const value = t(key);
  return value === key ? fallback : value;
};

export type MercatoQuickTileId =
  | 'players'
  | 'clubs'
  | 'detections'
  | 'stages'
  | 'talent_radar'
  | 'compare';

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

function getQuickTiles(
  line: ProductLineId,
  t?: TranslateFn,
  playerSegment?: PlayerSegment | null,
): MercatoQuickTile[] {
  const playersTitle =
    isFemalePlayerPresentation(playerSegment, line)
      ? tr(t, 'mercato.tile.players.woman', 'Joueuses')
      : tr(t, 'mercato.tile.players', 'Joueurs');
  return [
    {
      id: 'players',
      icon: 'people',
      title: playersTitle,
      hint: tr(t, 'mercato.tile.playersHint', 'Profils & CV'),
    },
    {
      id: 'clubs',
      icon: 'business',
      title: tr(t, 'mercato.tile.clubs', 'Clubs'),
      hint: tr(t, 'mercato.tile.clubsHint', 'Structures'),
    },
    {
      id: 'detections',
      icon: 'football',
      title: tr(t, 'mercato.tile.detections', 'Détections'),
      hint: tr(t, 'mercato.tile.detectionsHint', 'Essais & scouting'),
    },
    {
      id: 'stages',
      icon: 'calendar',
      title: tr(t, 'mercato.tile.stages', 'Stages'),
      hint: tr(t, 'mercato.tile.stagesHint', 'Camps & stages'),
    },
    {
      id: 'talent_radar',
      icon: 'star-four-points',
      title: tr(t, 'mercato.tile.radar', 'Radar'),
      hint: tr(t, 'mercato.tile.radarHint', 'Talents émergents'),
    },
    {
      id: 'compare',
      icon: 'tune',
      title: tr(t, 'mercato.tile.compare', 'Comparer'),
      hint: tr(t, 'mercato.tile.compareHint', '2 profils côte à côte'),
    },
  ];
}

function getSpaceSubtitle(appSpace: AppSpaceId): string {
  if (isUnderU13AppSpace(appSpace)) {
    return 'U7, U9, U11. École de foot et détections poussins.';
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
  appSpace: AppSpaceId,
  playerSegment?: PlayerSegment | null,
): string {
  const r = role ?? 'player';

  if (r === 'player') {
    if (isFemalePlayerPresentation(playerSegment, line)) {
      return 'Parcourez les annonces foot féminin et candidatez en un tap.';
    }
    if (line === 'pro' || line === 'pro_player') {
      return 'Opportunités pro vérifiées. Candidatez depuis votre profil.';
    }
    return 'Parcourez les annonces et candidatez. La publication est réservée aux clubs.';
  }

  if (r === 'recruiter') {
    return 'Scouting, suivi des candidatures et annonces Mercato Pro.';
  }

  if (r === 'coach' || r === 'agent') {
    return 'Publiez vos offres, suivez les candidatures et développez votre réseau.';
  }

  if (r === 'club') {
    return 'Recrutez, publiez vos besoins et gérez vos annonces actives.';
  }

  if (line === 'pro' || line === 'pro_club' || line === 'pro_staff') {
    return 'Mercato Pro. Recrutement vérifié et réseau clubs.';
  }

  return getSpaceSubtitle(appSpace);
}

function getHeroCopy(
  line: ProductLineId,
  role: UserRole | undefined,
  playerSegment?: PlayerSegment | null,
): { title: string; subtitle: string; icon: IconName } {
  const r = role ?? 'player';
  const identity = getUniverseIdentity(line);
  const tabLabel = getMercatoTabLabel(line, r, playerSegment);
  const isFemale = isFemalePlayerPresentation(playerSegment, line);

  if (r === 'player' && (line === 'pro_player' || line === 'pro' || line === 'homme')) {
    return {
      title: 'Opportunités pro',
      subtitle: isFemale
        ? 'Essais, détections et mandats. Offres vérifiées pour joueuses.'
        : 'Essais, détections et mandats. Offres vérifiées niveau R1 à N1.',
      icon: 'briefcase',
    };
  }

  if (r === 'player' && (line === 'amateur' || line === 'woman')) {
    return {
      title: isFemale ? 'Mercato F' : 'Mercato amateur',
      subtitle: isFemale
        ? 'Annonces clubs locaux et stages. Trouvez votre prochain club.'
        : 'Annonces clubs locaux et stages. Votre saison commence ici.',
      icon: isFemale ? 'people' : 'search',
    };
  }

  if (line === 'pro' || line === 'pro_club' || line === 'pro_staff') {
    return {
      title: tabLabel,
      subtitle:
        'Recrutement pro, mandats staff et scouting. Le Mercato de Pro Day Pro.',
      icon: 'briefcase',
    };
  }

  return {
    title: identity.mercatoLabel,
    subtitle:
      'Annonces ciblées, profils vérifiés et candidatures en un tap. Votre saison commence ici.',
    icon: 'search',
  };
}

export function getMercatoExperienceConfig(
  line: ProductLineId,
  role: UserRole | undefined,
  appSpace: AppSpaceId,
  t?: TranslateFn,
  playerSegment?: PlayerSegment | null,
): MercatoExperienceConfig {
  const r = role ?? 'player';
  const identity = getUniverseIdentity(line);
  const tabLabel = getMercatoTabLabel(line, r, playerSegment);
  const hero = getHeroCopy(line, r, playerSegment);
  const isFemale = isFemalePlayerPresentation(playerSegment, line);
  const playersTitle = isFemale
    ? tr(t, 'mercato.tile.players.woman', 'Joueuses')
    : tr(t, 'mercato.tile.players', 'Joueurs');
  const isPlayer = r === 'player';
  const staffRoles = new Set(['coach', 'agent', 'recruiter', 'club', 'organizer']);
  const tiles = getQuickTiles(line, t, playerSegment).filter((tile) => {
    if (tile.id === 'talent_radar' || tile.id === 'compare') {
      return staffRoles.has(r);
    }
    return true;
  });

  return {
    eyebrow: `${identity.accentLabel} · ${tabLabel}`,
    screenTitle: tabLabel,
    screenSubtitle: isPlayer
      ? getRoleSubtitle(line, role, appSpace, playerSegment)
      : `${APP_SPACE_LABELS[appSpace]}. ${getRoleSubtitle(line, role, appSpace, playerSegment)}`,
    heroTitle: hero.title,
    heroSubtitle: hero.subtitle,
    heroIcon: hero.icon,
    playersStatLabel: playersTitle,
    searchPlaceholder: tr(t, 'mercato.search.placeholder', 'Poste, ville, club…'),
    postsSectionTitle: tr(t, 'mercato.posts.section', 'Recrutements populaires'),
    postsEmptyAll: tr(t, 'mercato.posts.empty.all', 'Aucune annonce ouverte pour le moment.'),
    postsEmptySpace: `Aucune annonce ouverte pour ${APP_SPACE_LABELS[appSpace]} pour le moment.`,
    postsEmptyFiltered: tr(t, 'mercato.posts.empty.title', 'Aucune annonce'),
    fabLabel: tr(t, 'mercato.fab.publish', 'Publier une annonce'),
    quickTiles: tiles,
    showFavoritesHeader: isPlayer,
    showDetectionsHeader: !isPlayer,
    showFavoritesRow: !!role && !isPlayer,
    staffRowLabel: isFemale ? 'Coachs & agents F' : 'Coachs & agents',
    playersSearchHint: `Voir les ${playersTitle.toLowerCase()} correspondant à`,
  };
}

