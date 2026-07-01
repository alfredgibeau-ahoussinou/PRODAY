/**
 * ADN de marque partagé + identités ProDay Homme / Woman / Pro.
 */

import type { ProductLineId } from '../models/ProductLine';
import {
  PRODAY_HOMME_BRAND,
  PRODAY_AMATEUR_BRAND,
  PRODAY_SUPPORTER_BRAND,
  PRODAY_PRO_BRAND,
  PRODAY_SANTE_BRAND,
  PRODAY_WOMAN_BRAND,
  brandForProductLine,
} from '../models/ProductLine';

export const PRODAY_BRAND_DNA = {
  name: 'ProDay',
  promise: 'Connecter • Progresser • Réussir',
  pillars: ['Pulse', 'CV vivant', 'Mercato', 'Saison', 'Sponsors'],
} as const;

export interface UniverseIdentity {
  id: ProductLineId;
  productName: string;
  tagline: string;
  heroLine: string;
  mission: string;
  accentLabel: string;
  mercatoLabel: string;
  playerLabel: string;
  cvLabel: string;
  entrySub: string;
}

export const HOMME_IDENTITY: UniverseIdentity = {
  id: 'homme',
  productName: PRODAY_HOMME_BRAND.name,
  tagline: PRODAY_HOMME_BRAND.tagline,
  heroLine: 'Le foot masculin,\namateur pro.',
  mission:
    'CV en ligne, Mercato M, matchs, covoiturage équipe et saison amateur.',
  accentLabel: 'Pro Day Man',
  mercatoLabel: 'Mercato',
  playerLabel: 'Joueur',
  cvLabel: 'CV foot en ligne',
  entrySub: 'Football masculin & jeunes — joueurs, clubs, sponsors',
};

export const WOMAN_IDENTITY: UniverseIdentity = {
  id: 'woman',
  productName: PRODAY_WOMAN_BRAND.name,
  tagline: PRODAY_WOMAN_BRAND.tagline,
  heroLine: 'Le foot féminin,\nconnecté.',
  mission:
    'CV en ligne, Mercato F, matchs et covoiturage dédiés au foot au féminin.',
  accentLabel: 'Univers Woman',
  mercatoLabel: 'Mercato F',
  playerLabel: 'Joueuse',
  cvLabel: 'CV joueuse en ligne',
  entrySub: 'Foot au féminin — joueuses, clubs F, sponsors',
};

export const AMATEUR_IDENTITY: UniverseIdentity = {
  id: 'amateur',
  productName: PRODAY_AMATEUR_BRAND.name,
  tagline: PRODAY_AMATEUR_BRAND.tagline,
  heroLine: 'Le foot amateur,\nconnecté.',
  mission:
    'Joueurs et coachs amateur — Mercato local, matchs, effectif et convocations au même endroit.',
  accentLabel: 'Univers Amateur',
  mercatoLabel: 'Mercato Amateur',
  playerLabel: 'Joueur amateur',
  cvLabel: 'CV foot en ligne',
  entrySub: 'Joueur ou coach amateur — district, régional et club local',
};

export const SUPPORTER_IDENTITY: UniverseIdentity = {
  id: 'supporter',
  productName: PRODAY_SUPPORTER_BRAND.name,
  tagline: PRODAY_SUPPORTER_BRAND.tagline,
  heroLine: 'Le foot,\nensemble.',
  mission:
    'Fans et communauté — matchs, réels et fil en direct, sans Mercato ni covoiturage.',
  accentLabel: 'Univers Supporter',
  mercatoLabel: 'Communauté',
  playerLabel: 'Supporter',
  cvLabel: 'Profil supporter',
  entrySub: 'Fans de foot — tribune numérique et fil communautaire',
};

export const PRO_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_BRAND.name,
  tagline: PRODAY_PRO_BRAND.tagline,
  heroLine: 'Les pros\ndu foot.',
  mission:
    'Coach, club et staff — Mercato Pro, convocations, covoiturage et réseau vérifié.',
  accentLabel: 'Univers Pro',
  mercatoLabel: 'Mercato Pro',
  playerLabel: 'Professionnel',
  cvLabel: 'Profil professionnel',
  entrySub: 'Coach · Agent · Recruteur · Club',
};

export const SANTE_IDENTITY: UniverseIdentity = {
  id: 'sante',
  productName: PRODAY_SANTE_BRAND.name,
  tagline: PRODAY_SANTE_BRAND.tagline,
  heroLine: 'La santé\nau service du jeu.',
  mission:
    'Agenda, messagerie patients et visibilité auprès des clubs et joueurs.',
  accentLabel: 'Univers Santé',
  mercatoLabel: 'Annuaire santé',
  playerLabel: 'Praticien',
  cvLabel: 'Profil cabinet',
  entrySub: 'Kiné · Médecin · Prépa · Nutrition · Coach mental',
};

export function getUniverseIdentity(line: ProductLineId): UniverseIdentity {
  switch (line) {
    case 'woman':
      return WOMAN_IDENTITY;
    case 'amateur':
      return AMATEUR_IDENTITY;
    case 'supporter':
      return SUPPORTER_IDENTITY;
    case 'pro':
      return PRO_IDENTITY;
    case 'sante':
      return SANTE_IDENTITY;
    default:
      return HOMME_IDENTITY;
  }
}

/** @deprecated Préférer getUniverseIdentity(line) */
export function getBrandIdentity(isWoman: boolean): UniverseIdentity {
  return getUniverseIdentity(isWoman ? 'woman' : 'homme');
}

export function getDiscoverHomeCopy(line: ProductLineId) {
  const brand = getUniverseIdentity(line);
  const isWoman = line === 'woman';
  const isAmateur = line === 'amateur';
  const isPro = line === 'pro';
  const isSante = line === 'sante';

  if (isSante) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Praticiens vérifiés — diplômes contrôlés avant la messagerie complète.',
      ctaText: 'Créer un compte Santé',
      sectionExplore: 'Espace Pro Day Santé',
      secondaryMercato: 'Annuaire santé',
      playersStatLabel: 'Praticiens',
    };
  }

  if (isPro) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour coachs et agents pro — messagerie sécurisée après validation.',
      ctaText: 'Créer un compte Pro',
      sectionExplore: 'Espace Pro Day Pro',
      secondaryMercato: 'Mercato Pro',
      playersStatLabel: 'Pros',
    };
  }

  if (isAmateur) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour le foot amateur — joueurs et coachs, messagerie sécurisée après validation.',
      ctaText: 'Créer un compte Amateur',
      sectionExplore: 'Espace Pro Day Amateur',
      secondaryMercato: 'Mercato Amateur',
      playersStatLabel: 'Amateurs',
    };
  }

  if (line === 'supporter') {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils supporters — messagerie communautaire sécurisée.',
      ctaText: 'Créer un compte Supporter',
      sectionExplore: 'Espace Pro Day Supporter',
      secondaryMercato: 'Communauté',
      playersStatLabel: 'Supporters',
    };
  }

  if (isWoman) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour le foot au féminin — messagerie sécurisée après validation.',
      ctaText: 'Créer un compte Woman',
      sectionExplore: 'Explorer Woman',
      secondaryMercato: 'Mercato F',
      playersStatLabel: 'Joueuses',
    };
  }

  return {
    heroTitle: brand.heroLine,
    heroSub: brand.mission,
    trustText:
      'Profils vérifiés pour le foot amateur — messagerie sécurisée après validation.',
    ctaText: 'Créer un compte Man',
    sectionExplore: 'Explorer Man',
    secondaryMercato: 'Mercato',
    playersStatLabel: 'Joueurs',
  };
}

export const ACCOUNT_TYPES_BY_LINE = {
  homme: [
    { role: 'player' as const, label: 'Joueur', description: 'CV en ligne, stats, Mercato M' },
  ],
  woman: [
    { role: 'player' as const, label: 'Joueuse', description: 'CV en ligne, stats, Mercato F' },
  ],
  amateur: [
    { role: 'player' as const, label: 'Joueur amateur', description: 'CV, Mercato Amateur, matchs' },
    { role: 'coach' as const, label: 'Coach amateur', description: 'Effectif, convocations, Mercato local' },
  ],
  supporter: [
    { role: 'supporter' as const, label: 'Supporter', description: 'Matchs, réels et fil communautaire' },
  ],
  pro: [
    { role: 'coach' as const, label: 'Coach', description: 'Effectif, convocations, recrutement' },
    { role: 'agent' as const, label: 'Agent', description: 'Mandats, repérage, réseau clubs' },
    { role: 'recruiter' as const, label: 'Recruteur', description: 'Scouting, Mercato Pro, candidatures' },
    { role: 'club' as const, label: 'Club', description: 'Annonces, équipes, candidatures' },
    { role: 'organizer' as const, label: 'Organisateur', description: 'Événements & détections' },
    { role: 'sponsor' as const, label: 'Sponsor', description: 'Visibilité marque & clubs pro' },
  ],
  sante: [
    { role: 'physio' as const, label: 'Praticien', description: 'Kiné, médecin, prépa, nutrition…' },
  ],
} as const;

export { brandForProductLine };
