import type { UserRole } from '../models/User';

/** Identifiant produit store / Stripe (phase 1 : club_pro actif en IAP). */
export type SubscriptionPlanId =
  | 'player_plus'
  | 'coach_pro'
  | 'club_pro'
  | 'agent_elite';

export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionFeatureId =
  | 'mercato_apply'
  | 'recruitment_message'
  | 'club_active_post'
  | 'club_team';

export interface PlanPricing {
  monthlyEur: number;
  yearlyEur: number;
  /** IAP / Stripe pas encore branché en prod */
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
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlanDefinition> = {
  player_plus: {
    id: 'player_plus',
    role: 'player',
    label: 'Joueur Plus',
    tagline: 'Mercato illimité et visibilité renforcée',
    pricing: { monthlyEur: 4.99, yearlyEur: 39, storeAvailable: false },
    limits: { mercato_apply_per_month: 3 },
    freeIncludes: [
      'Profil, Pulse et galerie',
      'Mercato en lecture',
      '3 candidatures / mois',
      'Calendrier et RSVP équipe',
      'Arena et sponsors en consultation',
    ],
    proIncludes: [
      'Candidatures Mercato illimitées',
      'Mise en avant dans les recherches',
      'Alertes nouvelles annonces',
      'Historique candidatures exportable',
    ],
  },
  coach_pro: {
    id: 'coach_pro',
    role: 'coach',
    label: 'Coach Pro',
    tagline: 'Recrutement et gestion multi-équipes',
    pricing: { monthlyEur: 14.99, yearlyEur: 119, storeAvailable: false },
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
    pricing: { monthlyEur: 19.99, yearlyEur: 169, storeAvailable: true },
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
    tagline: 'CRM joueurs et mandats',
    pricing: { monthlyEur: 79, yearlyEur: 699, storeAvailable: false },
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
};

const ROLE_TO_PLAN: Partial<Record<UserRole, SubscriptionPlanId>> = {
  player: 'player_plus',
  coach: 'coach_pro',
  club: 'club_pro',
  agent: 'agent_elite',
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

/** Rôles sans abonnement store au lancement (accès gratuit large). */
export const ROLES_WITHOUT_STORE_PLAN: UserRole[] = [
  'organizer',
  'sponsor',
  'physio',
];

export const FREE_TIER_LABEL = 'Gratuit';
export const PRO_TIER_LABEL = 'Pro';
