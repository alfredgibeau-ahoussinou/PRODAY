import type { UserRole } from '../models/User';
import { yearlyPriceFromMonthly } from '../utils/subscriptionPricing';
import { PLAYER_PASS_PREMIUM_EUR } from './clubOffers';

/** Identifiant produit store (IAP App Store / Play — build EAS requis). */
export type SubscriptionPlanId =
  | 'player_plus'
  | 'recruiter_pro'
  | 'coach_pro'
  | 'club_amateur'
  | 'club_pro'
  | 'club_premium'
  | 'agent_elite'
  | 'physio_pro'
  | 'organizer_pro'
  | 'sponsor_pro';

export type SubscriptionTier = 'free' | 'pro';

export type SubscriptionFeatureId =
  | 'mercato_apply'
  | 'recruitment_message'
  | 'sponsor_club_message'
  | 'sponsor_active_offer'
  | 'club_active_post'
  | 'club_team'
  | 'smart_tactics'
  | 'ai_training'
  | 'video_analysis'
  | 'form_analysis';

export interface PlanPricing {
  monthlyEur: number;
  yearlyEur: number;
  /** IAP App Store / Play — build EAS requis (pas Expo Go). */
  storeAvailable: boolean;
  /** Offre Club Tout inclus : pas de prix fixe, devis personnalisé. */
  quoteOnly?: boolean;
  priceHint?: string;
}

export interface PlanLimits {
  mercato_apply_per_month?: number;
  recruitment_messages_per_month?: number;
  sponsor_club_messages_per_month?: number;
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
  /** Commission sur prestations réservées via l'app (ex. rôle santé). */
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
    label: 'Pass Joueur Premium',
    tagline: 'Entraînements IA, stats avancées et passeport recruteur',
    pricing: planPricing(PLAYER_PASS_PREMIUM_EUR, true),
    limits: { mercato_apply_per_month: 1 },
    freeIncludes: [
      'Profil & réseau',
      'Statistiques de base',
      'Événements & messagerie',
      'Convocations & covoiturage',
    ],
    proIncludes: [
      'Entraînements personnalisés IA',
      'Statistiques avancées & heatmaps',
      'Analyse vidéo',
      'Passeport recruteur',
      'Objectifs personnalisés & historique',
      'Comparaison avec d’autres joueurs',
    ],
  },
  recruiter_pro: {
    id: 'recruiter_pro',
    role: 'recruiter',
    label: 'Recruteur Pro',
    tagline: 'Rôle retiré — plus proposé à la vente',
    pricing: planPricing(7.99, false),
    limits: { recruitment_messages_per_month: 5 },
    freeIncludes: [
      'Profil recruteur vérifié',
      'Territoire & spécialité',
      'Mercato en lecture',
      '5 messages recrutement / mois',
    ],
    proIncludes: [
      'Annonces Mercato Pro actives',
      'Suivi des candidatures',
      'Messages recrutement illimités',
      'Statistiques scouting & candidatures',
    ],
  },
  coach_pro: {
    id: 'coach_pro',
    role: 'coach',
    label: 'Coach Premium',
    tagline: 'Tactique IA, IA, vidéo et préparation match',
    pricing: planPricing(7.99, true),
    limits: {
      club_teams: 1,
      recruitment_messages_per_month: 5,
    },
    freeIncludes: [
      'Profil coach (parcours, diplômes, philosophie)',
      '1 équipe liée',
      'Calendrier & communication de base',
    ],
    proIncludes: [
      'Tactique IA (tableau, formations, banc)',
      'Assistant IA & rapports automatiques',
      'Analyse vidéo & adversaires',
      'Préparation des matchs',
      'Entraînements IA (collectifs & individuels)',
      'Convocations, présences, multi-équipes',
    ],
  },
  club_amateur: {
    id: 'club_amateur',
    role: 'club',
    label: 'Club Amateur',
    tagline: 'Gestion essentielle pour petits clubs',
    pricing: planPricing(4.99, true),
    limits: { club_teams: 2, club_active_posts: 1 },
    freeIncludes: [
      'Profil club',
      '1 équipe',
      'Covoiturage lecture',
    ],
    proIncludes: [
      'Gestion des licenciés',
      'Convocations & présences',
      'Calendrier & communication',
      'Covoiturage',
      'Résultats & classements automatiques',
    ],
  },
  club_pro: {
    id: 'club_pro',
    role: 'club',
    label: 'Club Essentiel',
    tagline: 'Gestion club ; coachs en abonnement individuel',
    pricing: planPricing(11.99, true),
    limits: { club_teams: 1, club_active_posts: 2 },
    freeIncludes: [
      'Profil club et vérification',
      '1 équipe',
      '2 annonces Mercato actives',
      'Vitrine publique',
    ],
    proIncludes: [
      'Gestion, convocations, présences',
      'Calendrier, communication, covoiturage',
      'Compétitions & classements',
      'Multi-équipes & suivi des candidatures',
      'Coachs : souscription individuelle Tactique IA',
    ],
  },
  club_premium: {
    id: 'club_premium',
    role: 'club',
    label: 'Tout inclus',
    tagline: 'Votre matériel',
    pricing: {
      monthlyEur: 0,
      yearlyEur: 0,
      storeAvailable: false,
      quoteOnly: true,
      priceHint: 'À partir de 3 € / adhérent — tarif adapté selon la taille du club',
    },
    limits: { club_teams: 99, club_active_posts: 99 },
    freeIncludes: [
      'Profil club',
      'Vitrine publique',
    ],
    proIncludes: [
      'Tous les coachs, staff, dirigeants et joueurs',
      'Tactique IA, IA, analyse vidéo',
      'Statistiques, convocations, présences',
      'Calendrier, communication, covoiturage',
      'Entraînements IA & analyse de forme',
      'Administration complète',
      'Pass Joueur Premium optionnel à 3,99 €/mois',
    ],
  },
  agent_elite: {
    id: 'agent_elite',
    role: 'agent',
    label: 'Agent Elite',
    tagline: 'Rôle retiré — plus proposé à la vente',
    pricing: planPricing(29.99, false),
    limits: { recruitment_messages_per_month: 10 },
    freeIncludes: [
      'Profil agent et vérification',
      '10 contacts recrutement / mois',
      'Mercato en lecture',
      'Demandes de message joueurs (accept / refuse)',
    ],
    proIncludes: [
      'Contacts illimités',
      'Alertes géolocalisées',
      'Suivi des mandats',
      'Exports et rapports',
    ],
  },
  physio_pro: {
    id: 'physio_pro',
    role: 'physio',
    label: 'Santé Pro',
    tagline: 'Rôle retiré — plus proposé à la vente',
    pricing: planPricing(19.99, false),
    limits: {},
    bookingCommissionPercent: 10,
    bookingCommissionNote:
      'Sur chaque consultation réservée via ProDay (nutrition, coach mental, prépa physique…). Pas de commission sur les actes médicaux réglementés. Règlement au cabinet.',
    freeIncludes: [
      'Profil praticien et vérification',
      'Spécialité et zone d\'intervention',
      'Visibilité annuaire (base)',
      'Messagerie limitée',
    ],
    proIncludes: [
      'Téléconsultation visio 15/30 min',
      'Prise de rendez-vous via l\'app',
      'Visibilité prioritaire près des clubs',
      'Messagerie complète après vérif.',
      'Mise en avant annuaire',
      'Commission 10 % uniquement si RDV conclu',
    ],
  },
  organizer_pro: {
    id: 'organizer_pro',
    role: 'organizer',
    label: 'Organisateur Pro',
    tagline: 'Rôle intégré — tournois et détections (pas un pôle)',
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
    limits: { sponsor_club_messages_per_month: 10 },
    freeIncludes: [
      'Profil sponsor vérifié',
      'Présence annuaire Sponsors',
      '1 offre active',
      'Zone géographique',
      '10 messages clubs / mois',
    ],
    proIncludes: [
      'Offres sponsors illimitées',
      'Logo onglet Sponsors',
      'Campagnes locales ciblées',
      'Push géolocalisé local (bêta, sur opt-in)',
    ],
  },
};

const ROLE_TO_PLAN: Partial<Record<UserRole, SubscriptionPlanId>> = {
  player: 'player_plus',
  coach: 'coach_pro',
  club: 'club_pro',
  organizer: 'organizer_pro',
  sponsor: 'sponsor_pro',
};

/** Plans rôles retirés — plus vendus, IDs conservés pour abonnés legacy. */
export const RETIRED_SUBSCRIPTION_PLAN_IDS: readonly SubscriptionPlanId[] = [
  'agent_elite',
  'recruiter_pro',
  'physio_pro',
];

export function isRetiredSubscriptionPlan(planId: SubscriptionPlanId): boolean {
  return (RETIRED_SUBSCRIPTION_PLAN_IDS as readonly string[]).includes(planId);
}

export function listActiveSubscriptionPlans(): SubscriptionPlanDefinition[] {
  return Object.values(SUBSCRIPTION_PLANS).filter((p) => !isRetiredSubscriptionPlan(p.id));
}

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

/** Rôles sans formule store — tribune supporter 100 % gratuite. */
export const ROLES_WITHOUT_STORE_PLAN: UserRole[] = ['supporter', 'parent'];

export const FREE_TIER_LABEL = 'Gratuit';
export const PRO_TIER_LABEL = 'Pro';

/** Commission ProDay sur RDV rôle santé réservés via l'app (profils éligibles). */
export const PHYSIO_BOOKING_COMMISSION_PERCENT = 10;
