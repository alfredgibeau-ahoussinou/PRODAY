/**
 * Offres Club — modèle économique flexible.
 *
 * Mensuel : Amateur · Essentiel · Tout inclus (sur devis)
 * Option caméra : ProDay Pro + Veo (clé en main, sur devis)
 *
 * Santé / Agent / Recruteur / Organisateur restent des add-ons, pas des pôles.
 */

export type ClubOfferId =
  | 'club_amateur'
  | 'club_essentiel'
  | 'club_premium'
  | 'club_video_pro';

export type ClubOfferFeatureId =
  | 'licensed_management'
  | 'convocations'
  | 'attendance'
  | 'calendar'
  | 'communication'
  | 'carpool'
  | 'results'
  | 'standings'
  | 'competitions'
  | 'smart_tactics'
  | 'ai_assistant'
  | 'video_analysis'
  | 'ai_training'
  | 'form_analysis'
  | 'full_admin'
  | 'all_coaches_included'
  | 'all_players_included'
  | 'all_staff_included'
  | 'byo_video'
  | 'hardware_kit'
  | 'video_cloud'
  | 'auto_clipping';

export type ClubBillingCadence = 'monthly' | 'annual' | 'quote';

export interface ClubOfferDefinition {
  id: ClubOfferId;
  /** Plan store legacy / Stripe (mapping commercial). Null = pas de SKU store encore. */
  storePlanId: 'club_amateur' | 'club_pro' | 'club_premium' | null;
  label: string;
  shortLabel: string;
  tagline: string;
  /** Ligne sous le prix (ex. tarif adhérents). */
  priceHint?: string;
  billing: ClubBillingCadence;
  /** Prix mensuel catalogue (null si devis / annuel fixe seul). */
  monthlyEur: number | null;
  /** Prix annuel catalogue (packs vidéo). Surchargeable admin. */
  annualEur: number | null;
  /** Clé admin Remote Config / Firestore. */
  adminPricingKey?: string;
  audience: string;
  includes: string[];
  coachesIncluded: boolean;
  playersIncluded: boolean;
  /** Matériel caméra fourni / géré par ProDay. */
  hardwareIncluded: boolean;
  /** Caméra jamais obligatoire. */
  cameraRequired: false;
  features: ClubOfferFeatureId[];
  /** CTA principal (défaut : S'abonner / Demander un devis si quote). */
  ctaLabel?: string;
}

export const PLAYER_PASS_PREMIUM_EUR = 3.99;

export const CLUB_OFFERS: Record<ClubOfferId, ClubOfferDefinition> = {
  club_amateur: {
    id: 'club_amateur',
    storePlanId: 'club_amateur',
    label: 'Club Amateur',
    shortLabel: 'Amateur',
    tagline: 'Essentiel pour les petits clubs',
    billing: 'monthly',
    monthlyEur: 4.99,
    annualEur: null,
    audience: 'Petits clubs et structures locales',
    includes: [
      'Gestion des licenciés',
      'Convocations & présences',
      'Calendrier & communication',
      'Covoiturage',
      'Résultats & classements automatiques',
      'Bourse interne (équipe B, réserve, vivier)',
      'Suivi des recrutements Observé puis Intégré',
      'Analyse de forme (indicateurs de charge)',
    ],
    coachesIncluded: false,
    playersIncluded: false,
    hardwareIncluded: false,
    cameraRequired: false,
    features: [
      'licensed_management',
      'convocations',
      'attendance',
      'calendar',
      'communication',
      'carpool',
      'results',
      'standings',
      'form_analysis',
    ],
  },
  club_essentiel: {
    id: 'club_essentiel',
    storePlanId: 'club_pro',
    label: 'Club Essentiel',
    shortLabel: 'Essentiel',
    tagline: 'Le club gère ; les coachs choisissent leur offre',
    billing: 'monthly',
    monthlyEur: 11.99,
    annualEur: null,
    audience: 'Clubs qui veulent la gestion sans tout bundler',
    includes: [
      'Gestion club complète',
      'Convocations, présences, calendrier',
      'Communication & covoiturage',
      'Compétitions & classements',
      'Bourse interne (équipe B, réserve, vivier)',
      'Analyse de forme de l’effectif',
      'Coachs : abonnement individuel pour Tactique IA / IA / vidéo',
    ],
    coachesIncluded: false,
    playersIncluded: false,
    hardwareIncluded: false,
    cameraRequired: false,
    features: [
      'licensed_management',
      'convocations',
      'attendance',
      'calendar',
      'communication',
      'carpool',
      'results',
      'standings',
      'competitions',
      'full_admin',
      'form_analysis',
    ],
  },
  club_premium: {
    id: 'club_premium',
    storePlanId: 'club_premium',
    label: 'Tout inclus',
    shortLabel: 'Tout inclus',
    tagline: 'Votre matériel',
    priceHint: 'À partir de 3 € / adhérent · sur devis',
    billing: 'quote',
    monthlyEur: null,
    annualEur: null,
    audience: 'Clubs qui offrent ProDay à tout le staff et aux licenciés',
    includes: [
      'Tous les coachs, staff, dirigeants et joueurs',
      'Tactique IA, IA, analyse vidéo',
      'Statistiques, convocations, présences',
      'Calendrier, communication, covoiturage',
      'Bourse interne (équipe B, réserve, vivier)',
      'Analyse de forme & entraînements IA',
      'Suivi de charge & récupération déclarée',
      'Administration complète',
      'Pass Joueur optionnel à 3,99 €/mois',
    ],
    coachesIncluded: true,
    playersIncluded: true,
    hardwareIncluded: false,
    cameraRequired: false,
    ctaLabel: 'Demander un devis',
    features: [
      'licensed_management',
      'convocations',
      'attendance',
      'calendar',
      'communication',
      'carpool',
      'results',
      'standings',
      'competitions',
      'smart_tactics',
      'ai_assistant',
      'video_analysis',
      'ai_training',
      'form_analysis',
      'full_admin',
      'all_coaches_included',
      'all_players_included',
      'all_staff_included',
      'byo_video',
    ],
  },
  club_video_pro: {
    id: 'club_video_pro',
    storePlanId: null,
    label: 'ProDay Pro + Veo',
    shortLabel: 'Pro + Veo',
    tagline: 'Caméra Veo optionnelle, jamais obligatoire',
    priceHint: 'À partir de 3 € / adhérent · sur devis (+ option caméra)',
    billing: 'quote',
    monthlyEur: null,
    annualEur: null,
    adminPricingKey: 'video.pro_camera.display_price',
    audience:
      'Add-on Tout inclus : caméra Veo (achat / location / déjà possédée), cloud et découpage auto. Matériel jamais obligatoire — BYO vidéo reste possible.',
    includes: [
      'Toutes les fonctions Tout inclus (vidéo BYO incluse)',
      'Caméra Veo optionnelle (achat, location ou connexion existante)',
      'Trépied, installation, configuration, formation',
      'Synchronisation automatique & stockage cloud',
      'Traitement vidéo, analyse IA, découpage automatique',
      'Bibliothèque vidéo & export des séquences',
    ],
    coachesIncluded: true,
    playersIncluded: true,
    hardwareIncluded: true,
    cameraRequired: false,
    ctaLabel: 'Demander un devis',
    features: [
      'licensed_management',
      'convocations',
      'attendance',
      'calendar',
      'communication',
      'carpool',
      'results',
      'standings',
      'competitions',
      'smart_tactics',
      'ai_assistant',
      'video_analysis',
      'ai_training',
      'form_analysis',
      'full_admin',
      'all_coaches_included',
      'all_players_included',
      'all_staff_included',
      'byo_video',
      'hardware_kit',
      'video_cloud',
      'auto_clipping',
    ],
  },
};

/** Ordre d’affichage tarifs Club (mensuel + option caméra). */
export const CLUB_OFFER_ORDER: ClubOfferId[] = [
  'club_amateur',
  'club_essentiel',
  'club_premium',
  'club_video_pro',
];

/** Souscriptions mensuelles store uniquement (hors devis). */
export const CLUB_MONTHLY_OFFER_ORDER: ClubOfferId[] = [
  'club_amateur',
  'club_essentiel',
];

export function getClubOffer(id: ClubOfferId): ClubOfferDefinition {
  return CLUB_OFFERS[id];
}

export function clubOfferHasFeature(
  offerId: ClubOfferId,
  feature: ClubOfferFeatureId,
): boolean {
  return CLUB_OFFERS[offerId].features.includes(feature);
}

/** Mappe un plan store club vers l’offre commerciale. */
export function clubOfferFromStorePlanId(
  planId: string | null | undefined,
): ClubOfferId | null {
  if (planId === 'club_amateur') return 'club_amateur';
  if (planId === 'club_premium') return 'club_premium';
  if (planId === 'club_pro') return 'club_essentiel';
  if (planId === 'club_video_pro' || planId === 'proday_pro_camera') {
    return 'club_video_pro';
  }
  return null;
}

export function formatClubOfferPrice(offer: ClubOfferDefinition): string {
  if (offer.billing === 'quote' || (offer.annualEur == null && offer.monthlyEur == null)) {
    return 'Sur devis · À partir de 3 € / adhérent';
  }
  if (offer.billing === 'annual' && offer.annualEur != null) {
    return `${offer.annualEur.toLocaleString('fr-FR')} €/an`;
  }
  if (offer.monthlyEur != null) {
    return `${offer.monthlyEur.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} €/mois`;
  }
  return 'Sur devis · À partir de 3 € / adhérent';
}

export function clubOfferCtaLabel(offer: ClubOfferDefinition): string {
  if (offer.ctaLabel) return offer.ctaLabel;
  if (offer.billing === 'quote') return 'Demander un devis';
  return "S'abonner";
}
