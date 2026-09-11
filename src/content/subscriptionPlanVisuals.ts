import type { IconName } from '../components/ui/iconNames';
import type { ProductLineId } from '../models/ProductLine';
import type { UserRole } from '../models/User';
import type { PlayerSegment } from '../utils/playerSegment';
import { MEDICAL_THEME } from './medicalExperience';
import { SPONSOR_THEME } from './sponsorExperience';
import { planIdForRole, type SubscriptionPlanId } from './subscriptionPlans';

export type SubscriptionVisualVariant =
  | 'man_player'
  | 'woman_player'
  | 'coach'
  | 'recruiter'
  | 'club'
  | 'agent_premium'
  | 'medical'
  | 'organizer'
  | 'sponsor';

export interface SubscriptionPlanVisual {
  variant: SubscriptionVisualVariant;
  icon: IconName;
  eyebrow: string;
  screenTitle: string;
  heroMode: 'dark' | 'light';
  primary: string;
  primarySoft: string;
  heroBg: string;
  heroBorder?: string;
  heroText: string;
  heroSubtext: string;
  onPrimary: string;
  rootBg: string;
  freeColumnTitle: string;
  compareTitle: string;
  quotaTitle: string;
  ctaVerb: string;
  featureIconFree: IconName;
  featureIconPro: IconName;
  priceStyle: 'standard' | 'premium' | 'medical';
  proHighlight?: string;
  unlockHeadline?: string;
  unlockSubtitle?: string;
}

const VISUALS: Record<SubscriptionVisualVariant, SubscriptionPlanVisual> = {
  man_player: {
    variant: 'man_player',
    icon: 'football',
    eyebrow: 'Pro Day Man',
    screenTitle: 'Pass Joueur Premium',
    heroMode: 'dark',
    primary: '#0A0A0A',
    primarySoft: '#F0F0F0',
    heroBg: '#0A0A0A',
    heroText: '#FFFFFF',
    heroSubtext: '#A3A3A3',
    onPrimary: '#FFFFFF',
    rootBg: '#FAFAFA',
    freeColumnTitle: 'Joueur gratuit',
    compareTitle: 'Comparer Mercato M',
    quotaTitle: 'Quota Mercato M',
    ctaVerb: 'Activer le Pass Premium',
    featureIconFree: 'football-outline',
    featureIconPro: 'star',
    priceStyle: 'standard',
    proHighlight: 'Visibilité clubs M',
  },
  woman_player: {
    variant: 'woman_player',
    icon: 'football',
    eyebrow: 'Univers Woman',
    screenTitle: 'Joueuse Plus',
    heroMode: 'light',
    primary: '#BE185D',
    primarySoft: '#FDF2F8',
    heroBg: '#FDF2F8',
    heroBorder: '#FBCFE8',
    heroText: '#831843',
    heroSubtext: '#9D174D',
    onPrimary: '#FFFFFF',
    rootBg: '#FFFBFE',
    freeColumnTitle: 'Joueuse gratuite',
    compareTitle: 'Comparer Mercato F',
    quotaTitle: 'Quota Mercato F',
    ctaVerb: 'Devenir Joueuse Plus',
    featureIconFree: 'heart-outline',
    featureIconPro: 'star',
    priceStyle: 'standard',
    proHighlight: 'Visibilité clubs F',
  },
  coach: {
    variant: 'coach',
    icon: 'people',
    eyebrow: 'Banc technique',
    screenTitle: 'Coach Pro',
    heroMode: 'dark',
    primary: '#F59E0B',
    primarySoft: 'rgba(245, 158, 11, 0.14)',
    heroBg: '#141417',
    heroBorder: '#27272A',
    heroText: '#FFFFFF',
    heroSubtext: '#A1A1AA',
    onPrimary: '#000000',
    rootBg: '#09090B',
    freeColumnTitle: 'Coach gratuit',
    compareTitle: 'Gratuit vs Coach Pro',
    quotaTitle: 'Messages Mercato Pro',
    ctaVerb: 'Passer Coach Pro',
    featureIconFree: 'people',
    featureIconPro: 'star',
    priceStyle: 'premium',
    proHighlight: 'Tactique IA, Convocations & Banc technique',
    unlockHeadline: 'Ce que vous débloquez',
    unlockSubtitle: 'Outils Pro alignés sur les besoins réels du banc technique',
  },
  recruiter: {
    variant: 'recruiter',
    icon: 'search',
    eyebrow: 'Scouting & détection',
    screenTitle: 'Recruteur Pro',
    heroMode: 'dark',
    primary: '#D97706',
    primarySoft: '#FEF3C7',
    heroBg: '#422006',
    heroText: '#FFFBEB',
    heroSubtext: '#FCD34D',
    onPrimary: '#422006',
    rootBg: '#FFFBEB',
    freeColumnTitle: 'Recruteur gratuit',
    compareTitle: 'Comparer le suivi scouting',
    quotaTitle: 'Messages scouting',
    ctaVerb: 'Activer Recruteur Pro',
    featureIconFree: 'search',
    featureIconPro: 'star-four-points',
    priceStyle: 'standard',
    proHighlight: 'Suivi des candidatures',
  },
  club: {
    variant: 'club',
    icon: 'business',
    eyebrow: 'Structure club',
    screenTitle: 'Offres Club',
    heroMode: 'dark',
    primary: '#334155',
    primarySoft: '#E2E8F0',
    heroBg: '#0F172A',
    heroText: '#F8FAFC',
    heroSubtext: '#94A3B8',
    onPrimary: '#FFFFFF',
    rootBg: '#F1F5F9',
    freeColumnTitle: 'Club gratuit',
    compareTitle: 'Comparer Annonces club',
    quotaTitle: 'Annonces actives',
    ctaVerb: 'Souscrire',
    featureIconFree: 'business',
    featureIconPro: 'star',
    priceStyle: 'standard',
    proHighlight: 'Mercato Pro illimité',
  },
  agent_premium: {
    variant: 'agent_premium',
    icon: 'star',
    eyebrow: 'Formule premium',
    screenTitle: 'Agent Elite',
    heroMode: 'dark',
    primary: '#C5A059',
    primarySoft: 'rgba(197, 160, 89, 0.14)',
    heroBg: '#09090B',
    heroBorder: '#C5A059',
    heroText: '#FAFAFA',
    heroSubtext: '#A3A3A3',
    onPrimary: '#09090B',
    rootBg: '#09090B',
    freeColumnTitle: 'Agent gratuit',
    compareTitle: 'Comparer CRM mandats',
    quotaTitle: 'Contacts Mercato Pro',
    ctaVerb: 'Passer Agent Elite',
    featureIconFree: 'briefcase',
    featureIconPro: 'star',
    priceStyle: 'premium',
    proHighlight: 'Réseau premium',
  },
  medical: {
    variant: 'medical',
    icon: 'heart',
    eyebrow: 'Pôle santé ProDay',
    screenTitle: 'Cabinet Pro',
    heroMode: 'light',
    primary: MEDICAL_THEME.primary,
    primarySoft: MEDICAL_THEME.primarySoft,
    heroBg: MEDICAL_THEME.primaryBg,
    heroBorder: MEDICAL_THEME.primaryBorder,
    heroText: '#134E4A',
    heroSubtext: '#0F766E',
    onPrimary: '#FFFFFF',
    rootBg: '#F0FDFA',
    freeColumnTitle: 'Cabinet gratuit',
    compareTitle: 'Comparer Prise en charge',
    quotaTitle: 'Activité cabinet',
    ctaVerb: 'Activer Cabinet Pro',
    featureIconFree: 'heart-outline',
    featureIconPro: 'calendar',
    priceStyle: 'medical',
    proHighlight: 'RDV en ligne',
  },
  organizer: {
    variant: 'organizer',
    icon: 'calendar',
    eyebrow: 'Événements & détections',
    screenTitle: 'Organisateur Pro',
    heroMode: 'dark',
    primary: '#7C3AED',
    primarySoft: '#EDE9FE',
    heroBg: '#4C1D95',
    heroText: '#FAF5FF',
    heroSubtext: '#C4B5FD',
    onPrimary: '#FFFFFF',
    rootBg: '#FAF5FF',
    freeColumnTitle: 'Orga gratuit',
    compareTitle: 'Comparer Événements',
    quotaTitle: 'Événements actifs',
    ctaVerb: 'Activer Organisateur Pro',
    featureIconFree: 'calendar',
    featureIconPro: 'star',
    priceStyle: 'standard',
    proHighlight: 'Événements illimités',
  },
  sponsor: {
    variant: 'sponsor',
    icon: 'briefcase',
    eyebrow: 'Sponsors & marques',
    screenTitle: 'Sponsor Pro',
    heroMode: 'dark',
    primary: SPONSOR_THEME.primary,
    primarySoft: SPONSOR_THEME.primarySoft,
    heroBg: SPONSOR_THEME.heroBg,
    heroBorder: SPONSOR_THEME.primary,
    heroText: SPONSOR_THEME.heroText,
    heroSubtext: SPONSOR_THEME.heroSubtext,
    onPrimary: SPONSOR_THEME.onPrimary,
    rootBg: SPONSOR_THEME.background,
    freeColumnTitle: 'Sponsor gratuit',
    compareTitle: 'Comparer Visibilité marque',
    quotaTitle: 'Offres actives',
    ctaVerb: 'Activer Sponsor Pro',
    featureIconFree: 'briefcase',
    featureIconPro: 'star-four-points',
    priceStyle: 'standard',
    proHighlight: 'Campagnes locales',
  },
};

export function isDarkSubscriptionVisual(visual: SubscriptionPlanVisual): boolean {
  return visual.heroMode === 'dark';
}

const PLAN_VARIANT: Record<SubscriptionPlanId, SubscriptionVisualVariant> = {
  player_plus: 'man_player',
  recruiter_pro: 'recruiter',
  coach_pro: 'coach',
  club_amateur: 'club',
  club_pro: 'club',
  club_premium: 'club',
  agent_elite: 'agent_premium',
  physio_pro: 'medical',
  organizer_pro: 'organizer',
  sponsor_pro: 'sponsor',
};

export function getSubscriptionPlanVisual(
  role: UserRole,
  line: ProductLineId,
  segment?: PlayerSegment | null,
): SubscriptionPlanVisual | null {
  const planId = planIdForRole(role);
  if (!planId) return null;

  let variant = PLAN_VARIANT[planId];
  if (
    planId === 'player_plus' &&
    (line === 'woman' || (line === 'amateur' && segment === 'female'))
  ) {
    variant = 'woman_player';
  }

  return VISUALS[variant];
}
