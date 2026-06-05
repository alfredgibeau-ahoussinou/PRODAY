/**
 * ADN de marque partagé + identités ProDay Homme / Woman / Pro.
 */

import type { ProductLineId } from '../models/ProductLine';
import {
  PRODAY_HOMME_BRAND,
  PRODAY_PRO_BRAND,
  PRODAY_WOMAN_BRAND,
  brandForProductLine,
} from '../models/ProductLine';

export const PRODAY_BRAND_DNA = {
  name: 'ProDay',
  promise: 'Connecter • Progresser • Réussir',
  pillars: ['Pulse', 'CV vivant', 'Mercato', 'Saison', 'Arena'],
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
    'CV en ligne, Mercato F, matchs, covoiturage et Arena dédiés au foot au féminin.',
  accentLabel: 'Univers Woman',
  mercatoLabel: 'Mercato F',
  playerLabel: 'Joueuse',
  cvLabel: 'CV joueuse en ligne',
  entrySub: 'Foot au féminin — joueuses, clubs F, sponsors',
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
  entrySub: 'Coach · Agent · Recruteur · Kiné & santé',
};

export function getUniverseIdentity(line: ProductLineId): UniverseIdentity {
  switch (line) {
    case 'woman':
      return WOMAN_IDENTITY;
    case 'pro':
      return PRO_IDENTITY;
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
  const isPro = line === 'pro';

  if (isPro) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour coachs, agents et praticiens — messagerie sécurisée après validation.',
      ctaText: 'Créer un compte Pro',
      sectionExplore: 'Espace Pro Day Pro',
      secondaryMercato: 'Mercato Pro',
      playersStatLabel: 'Pros',
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
  pro: [
    { role: 'coach' as const, label: 'Coach', description: 'Effectif, convocations, recrutement' },
    { role: 'agent' as const, label: 'Agent', description: 'Mandats, repérage, réseau clubs' },
    { role: 'recruiter' as const, label: 'Recruteur', description: 'Scouting, Mercato Pro, candidatures' },
    { role: 'club' as const, label: 'Club', description: 'Annonces, équipes, candidatures' },
    { role: 'organizer' as const, label: 'Organisateur', description: 'Tournois Arena' },
    { role: 'physio' as const, label: 'Pôle santé', description: 'Kiné, médecin, coach mental…' },
    { role: 'sponsor' as const, label: 'Partenaire', description: 'Visibilité marque & clubs pro' },
  ],
} as const;

export { brandForProductLine };
