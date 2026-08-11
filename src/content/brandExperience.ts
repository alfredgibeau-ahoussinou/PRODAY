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
  PRODAY_PARENT_BRAND,
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
  heroLine: 'Le foot masculin,\namateur & club.',
  mission:
    'CV en ligne, Mercato, matchs, covoiturage équipe et saison de club.',
  accentLabel: 'Pro Day Man',
  mercatoLabel: 'Mercato',
  playerLabel: 'Joueur',
  cvLabel: 'CV foot en ligne',
  entrySub: 'Football masculin & jeunes. Joueurs, clubs, coachs',
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
    'Joueurs uniquement. Mercato local, matchs, CV et progression en club.',
  accentLabel: 'Pro Day Joueur',
  mercatoLabel: 'Mercato',
  playerLabel: 'Joueur',
  cvLabel: 'CV foot en ligne',
  entrySub: 'Joueur Homme ou Femme — football amateur et club',
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
  heroLine: 'Le club\net le banc.',
  mission:
    'Club, coach et staff. Matchs, convocations, covoiturage et outils sportifs — pour le foot amateur et semi-pro.',
  accentLabel: 'Pro Day Club',
  mercatoLabel: 'Recrutement',
  playerLabel: 'Structure',
  cvLabel: 'Profil club',
  entrySub: 'Club · Coach · Dirigeants',
};

export const SANTE_IDENTITY: UniverseIdentity = {
  id: 'sante',
  productName: PRODAY_SANTE_BRAND.name,
  tagline: 'SUR INVITATION',
  heroLine: 'La santé\nau service du jeu.',
  mission:
    'Pôle conservé en architecture. Hors vitrine GTM : conformité et stabilité d’abord, pas de push marketing.',
  accentLabel: 'Pro Day Santé',
  mercatoLabel: 'Annuaire santé',
  playerLabel: 'Praticien',
  cvLabel: 'Profil cabinet',
  entrySub: 'Sur invitation · annuaire · agenda',
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
    case 'parent':
      return {
        id: 'parent',
        productName: PRODAY_PARENT_BRAND.name,
        tagline: PRODAY_PARENT_BRAND.tagline,
        heroLine: 'Accompagner\nsans étouffer.',
        mission:
          'Superviser le parcours de votre enfant : messages, agenda, retards coach, temps d’écran et trajets.',
        accentLabel: 'Parent',
        mercatoLabel: 'Famille',
        playerLabel: 'Enfant',
        cvLabel: 'Contrôle parental',
        entrySub: 'Pôle dédié — lié au compte joueur mineur',
      };
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
        'Profils joueurs vérifiés. Messagerie sécurisée après validation. Coach ? Direction Pôle Coach.',
      ctaText: 'Créer mon compte Joueur',
      sectionExplore: 'Découvrir le Pôle Joueur',
      secondaryMercato: 'Mercato Amateur',
      playersStatLabel: 'Joueurs',
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
    { role: 'player' as const, label: 'Joueur', description: 'Profil, matchs, stats et vie d’équipe' },
  ],
  supporter: [
    { role: 'supporter' as const, label: 'Supporter', description: 'Matchs, réels et fil communautaire' },
  ],
  pro: [
    { role: 'club' as const, label: 'Club / Dirigeant', description: 'Équipes, licenciés, matchs, recrutement' },
    { role: 'coach' as const, label: 'Coach', description: 'Effectif, convocations, tactique' },
    { role: 'player' as const, label: 'Joueur', description: 'Profil, stats, matchs' },
    { role: 'agent' as const, label: 'Agent (intégré)', description: 'Mandats — intégré au club' },
    { role: 'recruiter' as const, label: 'Recruteur (intégré)', description: 'Scouting — intégré au club' },
    { role: 'organizer' as const, label: 'Événements (intégré)', description: 'Tournois — depuis l’espace Club' },
    { role: 'sponsor' as const, label: 'Sponsor', description: 'Visibilité marque & clubs' },
  ],
  sante: [
    { role: 'physio' as const, label: 'Praticien', description: 'Kiné, médecin, prépa, nutrition…' },
  ],
} as const;

export { brandForProductLine };
