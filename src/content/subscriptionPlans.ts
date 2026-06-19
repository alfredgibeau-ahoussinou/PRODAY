import type { UserRole } from '../models/User';
import { yearlyPriceFromMonthly } from '../utils/subscriptionPricing';

/** Identifiant produit store (IAP App Store / Play — build EAS requis). */
export type SubscriptionPlanId =
  | 'player_plus'
  | 'recruiter_pro'
  | 'coach_pro'
  | 'club_pro'
  | 'agent_elite'
  | 'physio_pro'
  | 'organizer_pro'
  | 'sponsor_pro';

export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionFeatureId =
  | 'mercato_apply'
  | 'recruitment_message'
  | 'club_active_post'
  | 'club_team';

export interface PlanPricing {
  monthlyEur: number;
  yearlyEur: number;
  /** IAP App Store / Play — build EAS requis (pas Expo Go). */
  storeAvailable: boolean;
}

export interface PlanLimits {
  mercato_apply_per_month?: number;
  recruitment_messages_per_month?: number;
  club_active_posts?: number;
  club_teams?: number;
}

export interface SubscriptionPlanDefinition {
  id: SubscriptionPlanId;
  role: UserRole;
  label: string;
  tagline: string;
  pricing: PlanPricing;
  limits: PlanLimits;
  freeIncludes: string[];
  proIncludes: string[];
  /** Commission sur prestations réservées via l'app (ex. pôle santé). */
  bookingCommissionPercent?: number;
  bookingCommissionNote?: string;
}

function planPricing(monthlyEur: number, storeAvailable: boolean): PlanPricing {
  return {
    monthlyEur,
    yearlyEur: yearlyPriceFromMonthly(monthlyEur),
    storeAvailable,
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanDefinition> = {
  player_plus: {
    id: 'player_plus',
    role: 'player',
    label: 'Joueur Plus',
    tagline: 'CV en ligne, visibilité et Mercato',
    pricing: planPricing(2.99, true),
    limits: { mercato_apply_per_month: 1 },
    freeIncludes: [
      'Profil, Pulse et CV en ligne',
      'Galerie et stats saison',
      'Mercato en lecture',
      '1 candidature / mois',
      'Calendrier et RSVP équipe',
    ],
    proIncludes: [
      'Candidatures Mercato illimitées',
      'Mise en avant dans les recherches',
      'Alertes nouvelles annonces',
      'Export PDF optionnel',
    ],
  },
  recruiter_pro: {
    id: 'recruiter_pro',
    role: 'recruiter',
    label: 'Recruteur Pro',
    tagline: 'Scouting, Mercato Pro et pipeline candidatures',
    pricing: planPricing(7.99, true),
    limits: { recruitment_messages_per_month: 5 },
    freeIncludes: [
      'Profil recruteur vérifié',
      'Territoire & spécialité',
      'Mercato en lecture',
      '5 messages recrutement / mois',
    ],
    proIncludes: [
      'Annonces Mercato Pro actives',
      'Pipeline candidatures',
      'Messages recrutement illimités',
      'Statistiques scouting & candidatures',
    ],
  },
  coach_pro: {
    id: 'coach_pro',
    role: 'coach',
    label: 'Coach Pro',
    tagline: 'Recrutement et gestion multi-équipes',
    pricing: planPricing(7.99, true),
    limits: {
      club_teams: 1,
      recruitment_messages_per_month: 5,
    },
    freeIncludes: [
      'Profil staff et vérification',
      '1 équipe liée',
      '5 messages recrutement / mois',
      'Annonces Mercato en lecture',
    ],
    proIncludes: [
      'Équipes illimitées',
      'Messages recrutement illimités',
      'Annonces Mercato actives',
      'Statistiques candidatures',
    ],
  },
  club_pro: {
    id: 'club_pro',
    role: 'club',
    label: 'Club Pro',
    tagline: 'Annonces et structure club',
    pricing: planPricing(11.99, true),
    limits: { club_teams: 1, club_active_posts: 2 },
    freeIncludes: [
      'Profil club et vérification',
      '1 équipe',
      '2 annonces Mercato actives',
      'Gestion convocations (base)',
    ],
    proIncludes: [
      'Annonces actives illimitées',
      'Multi-équipes',
      'Priorité dans le fil Mercato',
      'Exports candidatures',
    ],
  },
  agent_elite: {
    id: 'agent_elite',
    role: 'agent',
    label: 'Agent Elite',
    tagline: 'CRM joueurs, mandats et pipeline — formule premium',
    pricing: planPricing(99.99, true),
    limits: { recruitment_messages_per_month: 10 },
    freeIncludes: [
      'Profil agent et vérification',
      '10 contacts recrutement / mois',
      'Mercato en lecture',
    ],
    proIncludes: [
      'Contacts illimités',
      'Alertes géolocalisées',
      'Pipeline mandats',
      'Exports et rapports',
    ],
  },
  physio_pro: {
    id: 'physio_pro',
    role: 'physio',
    label: 'Pôle santé Pro',
    tagline: 'Abonnement léger + visibilité clubs — commission sur les RDV',
    pricing: planPricing(19.99, true),
    limits: {},
    bookingCommissionPercent: 10,
    bookingCommissionNote:
      'Sur chaque consultation réservée via ProDay (nutrition, coach mental, prépa physique…). Pas de commission sur les actes médicaux réglementés — règlement au cabinet.',
    freeIncludes: [
      'Profil praticien et vérification',
      'Spécialité et zone d\'intervention',
      'Visibilité annuaire (base)',
      'Messagerie limitée',
    ],
    proIncludes: [
      'Visibilité prioritaire près des clubs',
      'Messagerie complète après vérif.',
      'Prise de rendez-vous via l\'app',
      'Commission 10 % uniquement si RDV conclu',
    ],
  },
  organizer_pro: {
    id: 'organizer_pro',
    role: 'organizer',
    label: 'Organisateur Pro',
    tagline: 'Événements, détections et visibilité locale',
    pricing: planPricing(14.99, true),
    limits: {},
    freeIncludes: [
      'Profil organisateur vérifié',
      'Profil événements visible',
      'Détections publiées',
      'Calendrier local',
    ],
    proIncludes: [
      'Événements illimités',
      'Visibilité sponsors intégrée',
      'Relances participants',
      'Priorité fil événements',
    ],
  },
  sponsor_pro: {
    id: 'sponsor_pro',
    role: 'sponsor',
    label: 'Sponsor Pro',
    tagline: 'Visibilité marque & clubs locaux',
    pricing: planPricing(99, true),
    limits: {},
    freeIncludes: [
      'Profil sponsor vérifié',
      'Présence annuaire Sponsors',
      '1 offre active',
      'Zone géographique',
    ],
    proIncludes: [
      'Offres sponsors illimitées',
      'Logo onglet Sponsors',
      'Campagnes locales ciblées',
      'Push géolocalisé local (bêta — opt-in)',
    ],
  },
};

const ROLE_TO_PLAN: Partial<Record<UserRole, SubscriptionPlanId>> = {
  player: 'player_plus',
  coach: 'coach_pro',
  club: 'club_pro',
  agent: 'agent_elite',
  recruiter: 'recruiter_pro',
  physio: 'physio_pro',
  organizer: 'organizer_pro',
  sponsor: 'sponsor_pro',
};

export function planIdForRole(role: UserRole): SubscriptionPlanId | null {
  return ROLE_TO_PLAN[role] ?? null;
}

export function getPlanDefinition(planId: SubscriptionPlanId): SubscriptionPlanDefinition {
  return SUBSCRIPTION_PLANS[planId];
}

export function getPlanForRole(role: UserRole): SubscriptionPlanDefinition | null {
  const id = planIdForRole(role);
  return id ? SUBSCRIPTION_PLANS[id] : null;
}

export { getPlanForRoleAndLine, plansForProductLine } from './subscriptionPlansByLine';

/** Rôles sans formule store dédiée (aucun au lancement tarifaire actuel). */
export const ROLES_WITHOUT_STORE_PLAN: UserRole[] = [];

export const FREE_TIER_LABEL = 'Gratuit';
export const PRO_TIER_LABEL = 'Pro';

/** Commission ProDay sur RDV pôle santé réservés via l'app (profils éligibles). */
export const PHYSIO_BOOKING_COMMISSION_PERCENT = 10;
