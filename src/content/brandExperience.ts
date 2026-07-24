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
  PRODAY_SPONSOR_BRAND,
  PRODAY_WOMAN_BRAND,
  brandForProductLine,
} from '../models/ProductLine';

export const PRODAY_BRAND_DNA = {
  name: 'ProDay',
  promise: 'Connecter • Progresser • Réussir',
  pillars: ['Visibilité', 'CV vivant', 'Mercato', 'Saison', 'Sponsors'],
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
  entrySub: 'Football masculin & jeunes. Joueurs, clubs, sponsors',
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
  entrySub: 'Foot au féminin. Joueuses, clubs F, sponsors',
};

export const AMATEUR_IDENTITY: UniverseIdentity = {
  id: 'amateur',
  productName: PRODAY_AMATEUR_BRAND.name,
  tagline: PRODAY_AMATEUR_BRAND.tagline,
  heroLine: 'Le foot amateur,\nconnecté.',
  mission:
    'Joueurs et coachs amateur. Mercato local, matchs, effectif et convocations au même endroit.',
  accentLabel: 'Pro Day Amateur',
  mercatoLabel: 'Mercato Amateur',
  playerLabel: 'Joueur amateur',
  cvLabel: 'CV foot en ligne',
  entrySub: 'Joueur ou coach amateur. District, régional et club local',
};

export const SUPPORTER_IDENTITY: UniverseIdentity = {
  id: 'supporter',
  productName: PRODAY_SUPPORTER_BRAND.name,
  tagline: PRODAY_SUPPORTER_BRAND.tagline,
  heroLine: 'Le foot,\nensemble.',
  mission:
    'Fans et communauté. Matchs, réels et fil en direct, sans Mercato ni covoiturage.',
  accentLabel: 'Pro Day Supporter',
  mercatoLabel: 'Communauté',
  playerLabel: 'Supporter',
  cvLabel: 'Profil supporter',
  entrySub: 'Fans de foot. Tribune numérique et fil communautaire',
};

export const PRO_IDENTITY: UniverseIdentity = {
  id: 'pro',
  productName: PRODAY_PRO_BRAND.name,
  tagline: PRODAY_PRO_BRAND.tagline,
  heroLine: 'Les pros\ndu foot.',
  mission:
    'Coach, club et staff. Mercato Pro, convocations, covoiturage et réseau vérifié.',
  accentLabel: 'Pro Day Pro',
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
  accentLabel: 'Pro Day Santé',
  mercatoLabel: 'Annuaire santé',
  playerLabel: 'Praticien',
  cvLabel: 'Profil cabinet',
  entrySub: 'Kiné · Ostéo · Médecin · Prépa · Mental · Nutrition · Podologue',
};

export const SPONSOR_IDENTITY: UniverseIdentity = {
  id: 'sponsor',
  productName: PRODAY_SPONSOR_BRAND.name,
  tagline: PRODAY_SPONSOR_BRAND.tagline,
  heroLine: 'Votre marque\nsur le terrain.',
  mission:
    'Campagnes géolocalisées, tableau de bord ROI et vitrine vérifiée. Pour les équipes marketing.',
  accentLabel: 'Sponsor',
  mercatoLabel: 'Campagnes',
  playerLabel: 'Marque',
  cvLabel: 'Offres & ROI',
  entrySub: 'Visibilité mesurée · clubs · financement local',
};

export function getUniverseIdentity(line: ProductLineId): UniverseIdentity {
  switch (line) {
    case 'woman':
      return WOMAN_IDENTITY;
    case 'homme':
      return HOMME_IDENTITY;
    case 'amateur':
      return AMATEUR_IDENTITY;
    case 'supporter':
      return SUPPORTER_IDENTITY;
    case 'pro':
    case 'pro_player':
    case 'pro_club':
    case 'pro_staff':
      return PRO_IDENTITY;
    case 'sante':
      return SANTE_IDENTITY;
    case 'sponsor':
      return SPONSOR_IDENTITY;
    default:
      return AMATEUR_IDENTITY;
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
        'Praticiens vérifiés. Diplômes contrôlés avant la messagerie complète.',
      ctaText: 'Créer un compte Santé',
      sectionExplore: 'Vos pôles Santé',
      secondaryMercato: 'Annuaire santé',
      playersStatLabel: 'Praticiens',
    };
  }

  if (isPro) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour coachs et agents pro. Messagerie sécurisée après validation.',
      ctaText: 'Créer un compte Pro',
      sectionExplore: 'Vos pôles Pro',
      secondaryMercato: 'Mercato Pro',
      playersStatLabel: 'Pros',
    };
  }

  if (isAmateur) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour le foot amateur. Joueurs et coachs, messagerie sécurisée après validation.',
      ctaText: 'Créer mon compte Pro Day Amateur',
      sectionExplore: 'Découvrir Pro Day Amateur',
      secondaryMercato: 'Mercato Amateur',
      playersStatLabel: 'Joueurs & coachs',
    };
  }

  if (line === 'supporter') {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils supporters. Messagerie communautaire sécurisée.',
      ctaText: 'Créer un compte Supporter',
      sectionExplore: 'Votre tribune',
      secondaryMercato: 'Communauté',
      playersStatLabel: 'Supporters',
    };
  }

  if (isWoman) {
    return {
      heroTitle: brand.heroLine,
      heroSub: brand.mission,
      trustText:
        'Profils vérifiés pour le foot au féminin. Messagerie sécurisée après validation.',
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
      'Profils vérifiés pour le foot amateur. Messagerie sécurisée après validation.',
    ctaText: 'Créer mon compte Pro Day',
    sectionExplore: 'Découvrir Pro Day',
    secondaryMercato: brand.mercatoLabel,
    playersStatLabel: brand.playerLabel === 'Joueuse' ? 'Joueuses' : 'Joueurs',
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
