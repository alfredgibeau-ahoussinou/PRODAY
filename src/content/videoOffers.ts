/**
 * Module vidéo & offre matérielle optionnelle — jamais obligatoire.
 *
 * BYO (smartphone / tablette / caméra existante) : inclus dans Tout inclus
 * (et via abo Coach). Aucun pack « Essentiel 990 € » séparé.
 *
 * Seule offre matérielle tarifée : ProDay Pro + Veo (clé en main, prix admin).
 */

export type VideoOfferId = 'proday_pro_camera';

/** Capteurs / sources de capture supportés (extensible). */
export type VideoCameraVendor =
  | 'smartphone'
  | 'tablet'
  | 'veo'
  | 'xbotgo'
  | 'trace'
  | 'pixellot'
  | 'spiideo'
  | 'generic';

export type VideoHardwareAcquisition =
  | 'own_camera'
  | 'lease'
  | 'purchase';

export type VideoAnalysisCapability =
  | 'auto_clip'
  | 'highlights'
  | 'goals'
  | 'saves'
  | 'cards'
  | 'substitutions'
  | 'heatmaps'
  | 'stats'
  | 'ai_reports';

export interface VideoVendorDefinition {
  id: VideoCameraVendor;
  label: string;
  integration: 'native' | 'connector' | 'device_capture';
  offeredAsHardware?: boolean;
}

export interface VideoOfferPricing {
  annualEur: number | null;
  adminPricingKey: string;
  adminConfigurable: true;
  displayFallback?: string;
}

export interface VideoOfferDefinition {
  id: VideoOfferId;
  label: string;
  tagline: string;
  audience: string;
  cameraRequired: false;
  hardwareIncluded: boolean;
  clubOfferId: 'club_video_pro';
  pricing: VideoOfferPricing;
  includes: string[];
  supportedInputs: VideoCameraVendor[];
  hardwareAcquisition?: VideoHardwareAcquisition[];
  analysis: VideoAnalysisCapability[];
}

export const VIDEO_VENDORS: VideoVendorDefinition[] = [
  { id: 'smartphone', label: 'Smartphone', integration: 'device_capture' },
  { id: 'tablet', label: 'Tablette', integration: 'device_capture' },
  { id: 'veo', label: 'Veo', integration: 'native', offeredAsHardware: true },
  { id: 'xbotgo', label: 'XbotGo', integration: 'connector' },
  { id: 'trace', label: 'Trace', integration: 'connector' },
  { id: 'pixellot', label: 'Pixellot', integration: 'connector' },
  { id: 'spiideo', label: 'Spiideo', integration: 'connector' },
  { id: 'generic', label: 'Autre caméra / import', integration: 'connector' },
];

export const VIDEO_ANALYSIS_CAPABILITIES: {
  id: VideoAnalysisCapability;
  label: string;
}[] = [
  { id: 'auto_clip', label: 'Découpage automatique' },
  { id: 'highlights', label: 'Temps forts' },
  { id: 'goals', label: 'Buts' },
  { id: 'saves', label: 'Arrêts' },
  { id: 'cards', label: 'Cartons' },
  { id: 'substitutions', label: 'Remplacements' },
  { id: 'heatmaps', label: 'Heatmaps' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'ai_reports', label: 'Rapports IA' },
];

const ALL_ANALYSIS: VideoAnalysisCapability[] = VIDEO_ANALYSIS_CAPABILITIES.map(
  (c) => c.id,
);

const ALL_INPUTS: VideoCameraVendor[] = [
  'smartphone',
  'tablet',
  'veo',
  'xbotgo',
  'trace',
  'pixellot',
  'spiideo',
  'generic',
];

export const VIDEO_OFFERS: Record<VideoOfferId, VideoOfferDefinition> = {
  proday_pro_camera: {
    id: 'proday_pro_camera',
    label: 'ProDay Pro + Veo',
    tagline: 'Formule Premium clé en main',
    audience:
      'Tout inclus + caméra (achat, location ou déjà possédée), cloud et découpage auto.',
    cameraRequired: false,
    hardwareIncluded: true,
    clubOfferId: 'club_video_pro',
    pricing: {
      annualEur: null,
      adminPricingKey: 'video.pro_camera.display_price',
      adminConfigurable: true,
      displayFallback: 'Achat ou location — prix admin',
    },
    includes: [
      'Toutes les fonctions Tout inclus',
      'Analyse vidéo BYO (smartphone / tablette / caméra existante)',
      'Caméra Veo (achat ou location selon le choix du club)',
      'Trépied professionnel',
      'Installation, configuration, formation des éducateurs',
      'Synchronisation automatique & stockage cloud',
      'Traitement vidéo, analyse IA, découpage automatique',
      'Bibliothèque vidéo & export des séquences',
    ],
    supportedInputs: ALL_INPUTS,
    hardwareAcquisition: ['own_camera', 'lease', 'purchase'],
    analysis: ALL_ANALYSIS,
  },
};

export const VIDEO_OFFER_ORDER: VideoOfferId[] = ['proday_pro_camera'];

export const VIDEO_HARDWARE_ACQUISITION_LABELS: Record<
  VideoHardwareAcquisition,
  { title: string; body: string }
> = {
  own_camera: {
    title: 'Caméra déjà possédée',
    body: 'Le club a déjà une Veo, XbotGo ou autre caméra compatible. ProDay se connecte — pas d’achat forcé.',
  },
  lease: {
    title: 'Location via ProDay',
    body: 'Offre clé en main : caméra, trépied, installation, formation, cloud. Loyer mensuel configurable en admin.',
  },
  purchase: {
    title: 'Achat via ProDay',
    body: 'Achat caméra + pack installation / configuration / formation. Prix catalogue modifiable en admin.',
  },
};

export function getVideoOffer(id: VideoOfferId): VideoOfferDefinition {
  return VIDEO_OFFERS[id];
}

export function resolveVideoOfferAnnualPrice(
  offerId: VideoOfferId,
  adminOverrides?: Partial<Record<string, number | string | null>>,
): { label: string; annualEur: number | null } {
  const offer = VIDEO_OFFERS[offerId];
  const key = offer.pricing.adminPricingKey;
  const override = adminOverrides?.[key];

  if (typeof override === 'number' && Number.isFinite(override)) {
    return { label: `${formatEur(override)} €/an`, annualEur: override };
  }
  if (typeof override === 'string' && override.trim()) {
    return { label: override.trim(), annualEur: null };
  }
  if (offer.pricing.annualEur != null) {
    return {
      label: `${formatEur(offer.pricing.annualEur)} €/an`,
      annualEur: offer.pricing.annualEur,
    };
  }
  return {
    label: offer.pricing.displayFallback ?? 'Sur devis',
    annualEur: null,
  };
}

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', {
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

export const VIDEO_MODULE_PRINCIPLE =
  'Vous avez une caméra ? Connectez-la à ProDay. Veo, XbotGo, Spiideo, Pixellot, Trace, smartphone — jamais limité à une marque. Matériel jamais obligatoire.';
